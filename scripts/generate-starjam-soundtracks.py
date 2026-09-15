#!/usr/bin/env python3
"""Render STARJAM's original, finite soundtracks without samples or dependencies.

Run on macOS: python3 scripts/generate-starjam-soundtracks.py
Uses the system afconvert AAC encoder. All intermediate PCM is system-temporary.
The composition and PCM are deterministic; AAC bytes can vary by OS codec version.
No API calls, downloaded samples, microphone input, or background silent carrier.
"""

from array import array
from functools import lru_cache
import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import struct
import subprocess
import sys
import tempfile
import wave


RATE = 44100
DURATION = 35.0
BITRATE = 64000
PACES = {"drift": 72, "gentle": 96, "playful": 120}
PHASES = (("opening", 0.0, 8.0), ("lift", 8.0, 17.0),
          ("bloom", 17.0, 25.0), ("celebration", 25.0, DURATION))
WORLDS = {
    "garden": {"root": 60, "title": "Lantern lemonade", "motif": [0, 4, 7, 9, 7, 4, 2, 7]},
    "rush": {"root": 62, "title": "Peach rocket parade", "motif": [7, 12, 9, 7, 4, 7, 2, 4]},
    "shell": {"root": 65, "title": "Shell confetti", "motif": [0, 7, 4, 12, 9, 7, 4, 2]},
    "storm": {"root": 57, "title": "Sunshine thunderclub", "motif": [0, 2, 7, 4, 9, 12, 7, 4]},
}
TAU = 2 * math.pi


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


@lru_cache(maxsize=512)
def tone(kind, midi, duration):
    """Bright, rounded physical-model-ish timbres, synthesized from partials."""
    length = round(duration * RATE)
    values = array("f", [0]) * length
    hz = frequency(midi)
    for index in range(length):
        t = index / RATE
        attack = min(1, t / 0.003)
        tail = min(1, (duration - t) / 0.035)
        phase = TAU * hz * t
        if kind == "bass":
            # The octave and third partial retain a bass pulse on small speakers.
            voice = (math.sin(phase) + 0.6 * math.sin(phase * 2)
                     + 0.22 * math.sin(phase * 3)) / 1.6
            envelope = math.exp(-t / 0.19)
        elif kind == "chord":
            voice = math.sin(phase) + 0.28 * math.sin(phase * 2) + 0.1 * math.sin(phase * 3)
            envelope = math.exp(-t / 0.16)
        elif kind == "bell":
            voice = (math.sin(phase) * math.exp(-t / 0.38)
                     + 0.35 * math.sin(phase * 2) * math.exp(-t / 0.15)
                     + 0.09 * math.sin(phase * 4) * math.exp(-t / 0.07))
            envelope = 1
        else:
            # A woody pluck with a brief inharmonic strike, then a clear pitch.
            voice = (math.sin(phase) * math.exp(-t / 0.20)
                     + 0.4 * math.sin(phase * 2) * math.exp(-t / 0.075)
                     + 0.12 * math.sin(phase * 3.97) * math.exp(-t / 0.035))
            envelope = 1
        values[index] = voice * envelope * attack * tail
    return values


@lru_cache(maxsize=16)
def drum(kind):
    duration = {"kick": 0.23, "clap": 0.16, "hat": 0.075, "rim": 0.095}[kind]
    values = array("f", [0]) * round(duration * RATE)
    rng = random.Random({"kick": 701, "clap": 702, "hat": 703, "rim": 704}[kind])
    previous_noise = 0
    for index in range(len(values)):
        t = index / RATE
        noise = rng.uniform(-1, 1)
        high = noise - previous_noise
        previous_noise = noise
        attack = min(1, t / 0.0007)
        if kind == "kick":
            # Phase integrates a sweep; second harmonic keeps the kick legible.
            phase = TAU * (95 * t + 7 * (1 - math.exp(-t / 0.025)))
            value = (math.sin(phase) + 0.35 * math.sin(2 * phase)) * math.exp(-t / 0.056)
        elif kind == "clap":
            early = sum(math.exp(-(t - onset) / 0.011) if t >= onset else 0
                        for onset in (0, 0.012, 0.025))
            value = high * (early * 0.18 + math.exp(-t / 0.047) * 0.3)
        elif kind == "rim":
            value = (math.sin(TAU * 880 * t) + 0.5 * math.sin(TAU * 1610 * t)) * math.exp(-t / 0.015)
        else:
            value = high * math.exp(-t / 0.017) * 0.48
        values[index] = value * attack * min(1, (duration - t) / 0.01)
    return values


def add(buffer, samples, at, level):
    start = round(at * RATE)
    count = min(len(samples), len(buffer) - start)
    if start < 0 or count <= 0:
        return
    for index in range(count):
        buffer[start + index] += samples[index] * level


def finish(buffer, peak_target=0.82, rms_target=0.175):
    # Gentle bus saturation adds density without sharply clipped transients.
    for index in range(len(buffer)):
        buffer[index] = math.tanh(buffer[index] * 1.3)
    mean = sum(buffer) / len(buffer)
    for index in range(len(buffer)):
        buffer[index] -= mean
    peak = max(abs(sample) for sample in buffer)
    rms = math.sqrt(sum(sample * sample for sample in buffer) / len(buffer))
    # One gain for the whole composition: development comes from the score.
    gain = min(peak_target / peak, rms_target / rms)
    for index in range(len(buffer)):
        # First note starts at 0; tiny safety attack avoids a discontinuity.
        buffer[index] *= gain * min(1, index / 44, (len(buffer) - index) / (0.18 * RATE))
    return buffer


def score(world, pace):
    """An inspectable event score; musical layers enter across four chapters."""
    spec = WORLDS[world]
    bpm = PACES[pace]
    beat = 60 / bpm
    root = spec["root"]
    motif = spec["motif"]
    events = []

    def melodic(layer, kind, midi, at, duration, level):
        events.append({"layer": layer, "instrument": kind, "midi": midi,
                       "at": round(at, 6), "duration": duration, "level": level})

    def percussion(layer, kind, at, level):
        events.append({"layer": layer, "instrument": kind,
                       "at": round(at, 6), "level": level})

    beat_count = math.ceil(DURATION / beat)
    for step in range(beat_count):
        at = step * beat
        if at >= DURATION - 0.8:
            continue
        bar, position = divmod(step, 4)
        phase = sum(at >= start for _, start, _ in PHASES) - 1
        # I, vi, IV, V; each world carries its own original eight-note melody.
        chord_root, third = ((0, 4), (9, 3), (5, 4), (7, 4))[bar % 4]
        bass = root - 12 + chord_root
        if position in (0, 2) or (phase >= 1 and pace != "drift"):
            melodic("bass", "bass", bass if position != 2 else bass + 7, at, 0.36, 0.25)
        # The opening leaves room around the melody. First rhythm, then harmony,
        # then a high answering line join; individual parts do not get louder.
        if phase >= 1:
            if position in (0, 2):
                percussion("kick", "kick", at, 0.28)
            if position in (1, 3):
                percussion("backbeat", "rim" if pace == "drift" else "clap", at, 0.19)
        if phase >= 2:
            percussion("hat", "hat", at, 0.042)
            if pace != "drift":
                percussion("hat", "hat", at + beat / 2, 0.030)
        if phase >= 2 and position in (1, 3):
            for interval in (0, third, 7):
                melodic("chord", "chord", root + chord_root + interval,
                        at + beat / 2, 0.32, 0.061)
        phrase_step = (step + (bar // 4) * 2) % len(motif)
        lead = root + 12 + motif[phrase_step]
        if position in (0, 2) or phase >= (2 if pace == "drift" else 1):
            melodic("pluck", "pluck", lead, at, 0.48, 0.25)
        answer_here = phase >= 2 and ((pace == "playful" and position in (1, 3))
                                     or (pace == "gentle" and position == 3))
        if phase == 3:
            answer_here = pace == "playful" or (pace == "gentle" and position in (1, 3)) or position == 3
        if answer_here:
            answer = root + 12 + motif[(phrase_step + 1) % len(motif)]
            melodic("answer", "pluck", answer, at + beat / 2, 0.35, 0.17)
        if phase == 3:
            if position in (0, 2):
                # A rising chord-tone countermelody makes the final chapter sing.
                interval = (0, third, 7, 12)[(step // 2) % 4]
                melodic("bell", "bell", root + 12 + chord_root + interval,
                        at + beat / 4, 0.70, 0.105)
            if position == 3 and pace != "drift":
                percussion("hat", "hat", at + beat * 0.75, 0.025)
    # A finite root flourish: no endless backing loop and no abrupt crop.
    for index, interval in enumerate((0, 4, 7, 12)):
        melodic("cadence", "bell", root + 12 + interval,
                DURATION - 0.76 + index * 0.10, 0.65, 0.17)
    return sorted(events, key=lambda event: event["at"])


def arrangement(events):
    phases = []
    for name, start, end in PHASES:
        section = [event for event in events if start <= event["at"] < end]
        layers = {layer: sum(event["layer"] == layer for event in section)
                  for layer in sorted({event["layer"] for event in section})}
        phases.append({"name": name, "startSeconds": start, "endSeconds": end,
                       "events": len(section), "eventsPerSecond": round(len(section) / (end - start), 3),
                       "layers": layers})
    return {"gainAutomation": "none", "phases": phases,
            "scoreSha256": hashlib.sha256(json.dumps(events, sort_keys=True).encode()).hexdigest()}


def soundtrack(events):
    buffer = array("f", [0]) * round(DURATION * RATE)
    for event in events:
        samples = (tone(event["instrument"], event["midi"], event["duration"])
                   if "midi" in event else drum(event["instrument"]))
        add(buffer, samples, event["at"], event["level"])
    # Layered transients need AAC reconstruction headroom as well as PCM room.
    return finish(buffer, peak_target=0.65)


def welcome():
    buffer = array("f", [0]) * (3 * RATE)
    for index, midi in enumerate((72, 76, 79, 84, 81, 79, 84)):
        add(buffer, tone("pluck", midi, 0.53), index * 0.28, 0.34)
    for at in (0, 0.56, 1.12, 1.68):
        add(buffer, drum("kick"), at, 0.25)
        add(buffer, tone("bass", 60 if at < 1 else 67, 0.32), at, 0.22)
    for at in (0.28, 0.84, 1.4):
        add(buffer, drum("clap"), at, 0.20)
    for interval in (0, 4, 7, 12):
        add(buffer, tone("bell", 72 + interval, 0.8), 2.02, 0.18)
    return finish(buffer)


def hit(lane):
    buffer = array("f", [0]) * round(0.28 * RATE)
    add(buffer, tone("pluck", (72, 76, 79)[lane], 0.28), 0, 0.4)
    return finish(buffer)


def level_clear():
    """A small rising celebration, mixed softly enough to overlay the backing."""
    buffer = array("f", [0]) * round(1.5 * RATE)
    for index, interval in enumerate((0, 4, 7, 12)):
        add(buffer, tone("pluck", 72 + interval, 0.45), index * 0.15, 0.20)
    for interval in (0, 4, 7, 12):
        add(buffer, tone("bell", 72 + interval, 0.86), 0.58, 0.095)
    add(buffer, tone("bass", 60, 0.36), 0, 0.13)
    add(buffer, tone("bass", 72, 0.36), 0.58, 0.11)
    return finish(buffer, peak_target=0.34, rms_target=0.077)


def stats(samples):
    peak = max(abs(sample) for sample in samples)
    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
    onset = next((i for i, sample in enumerate(samples) if abs(sample) > 0.001), None)
    return {
        "peakDbfs": round(20 * math.log10(max(peak, 1e-12)), 3),
        "rmsDbfs": round(20 * math.log10(max(rms, 1e-12)), 3),
        "firstSignalSeconds": round(onset / RATE, 6) if onset is not None else None,
    }


def encode(samples, name, output, temp, orchestration=None):
    pcm = array("h", (round(max(-1, min(1, value)) * 32767) for value in samples))
    if sys.byteorder != "little":
        pcm.byteswap()
    wav_path = temp / (name + ".wav")
    decoded_path = temp / (name + "-decoded.wav")
    encoded_path = output / (name + ".m4a")
    with wave.open(str(wav_path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    subprocess.run(["/usr/bin/afconvert", "-f", "m4af", "-d", "aac", "-b", str(BITRATE),
                    "-q", "127", "-s", "0", str(wav_path), str(encoded_path)], check=True)
    # Decode the actual delivered AAC to verify duration, channel count and level.
    subprocess.run(["/usr/bin/afconvert", "-f", "WAVE", "-d", "LEI16", str(encoded_path),
                    str(decoded_path)], check=True)
    # Apple's decoder emits WAVE_FORMAT_EXTENSIBLE, unsupported by Python 3.9's
    # wave reader. Read its standard RIFF chunks and validate the PCM subformat.
    decoded = decoded_path.read_bytes()
    assert decoded[:4] == b"RIFF" and decoded[8:12] == b"WAVE"
    chunks = {}
    offset = 12
    while offset + 8 <= len(decoded):
        key, length = struct.unpack_from("<4sI", decoded, offset)
        chunks[key] = decoded[offset + 8:offset + 8 + length]
        offset += 8 + length + (length % 2)
    tag, channels, rate, _, _, bits = struct.unpack_from("<HHIIHH", chunks[b"fmt "])
    assert channels == 1 and rate == RATE and bits == 16
    assert tag == 1 or (tag == 65534 and chunks[b"fmt "][24:26] == b"\x01\x00")
    decoded_samples = array("h", chunks[b"data"])
    if sys.byteorder != "little":
        decoded_samples.byteswap()
    decoded_float = array("f", (sample / 32768 for sample in decoded_samples))
    duration = len(decoded_float) / RATE
    assert abs(duration - len(samples) / RATE) < 0.025, (name, duration)
    levels = stats(decoded_float)
    assert -26 < levels["rmsDbfs"] < -11, (name, levels)
    assert levels["peakDbfs"] < -0.5, (name, levels)
    assert levels["firstSignalSeconds"] < 0.025, (name, levels)
    if name == "level-clear":
        assert levels["peakDbfs"] <= -6 and -23.5 < levels["rmsDbfs"] < -20, levels
    entry = {
        "file": name + ".m4a",
        "durationSeconds": round(duration, 6),
        "channels": 1,
        "sampleRate": RATE,
        "codec": "AAC-LC",
        "bitrate": BITRATE,
        "bytes": encoded_path.stat().st_size,
        "sha256": hashlib.sha256(encoded_path.read_bytes()).hexdigest(),
        "sourcePcm": stats(samples),
        "decodedPcm": levels,
    }
    assert entry["bytes"] < 512 * 1024, (name, entry["bytes"])
    if orchestration:
        for phase in orchestration["phases"]:
            start, end = round(phase["startSeconds"] * RATE), round(phase["endSeconds"] * RATE)
            phase["sourcePcm"] = stats(samples[start:end])
            phase["decodedPcm"] = stats(decoded_float[start:end])
        opening, final = orchestration["phases"][0], orchestration["phases"][-1]
        rise = final["decodedPcm"]["rmsDbfs"] - opening["decodedPcm"]["rmsDbfs"]
        assert 2 < rise < 10, (name, "section RMS rise", rise)
        entry["arrangement"] = orchestration
    wav_path.unlink()
    decoded_path.unlink()
    print(f"{entry['file']}: {duration:.3f}s, {entry['bytes']} bytes, "
          f"peak {levels['peakDbfs']:.1f} / RMS {levels['rmsDbfs']:.1f} dBFS", flush=True)
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path,
                        default=Path(__file__).resolve().parent.parent / "public/audio/starjam")
    parser.add_argument("--score-json", action="store_true", help="Print deterministic event scores without rendering audio.")
    args = parser.parse_args()
    if args.score_json:
        print(json.dumps({f"{world}-{pace}": score(world, pace) for world in WORLDS for pace in PACES}))
        return
    args.output.mkdir(parents=True, exist_ok=True)
    entries = []
    with tempfile.TemporaryDirectory(prefix="starjam-pcm-") as temporary:
        temp = Path(temporary)
        for world, spec in WORLDS.items():
            for pace, bpm in PACES.items():
                events = score(world, pace)
                entry = encode(soundtrack(events), f"{world}-{pace}", args.output, temp, arrangement(events))
                entries.append({"world": world, "pace": pace, "bpm": bpm,
                                "title": spec["title"], **entry})
        entries.append({"title": "Hello, little universe", "kind": "welcome",
                        **encode(welcome(), "welcome", args.output, temp)})
        for lane in range(3):
            entries.append({"title": f"Lane {lane + 1} pluck", "kind": "hit", "lane": lane,
                            **encode(hit(lane), f"hit-{lane}", args.output, temp)})
        entries.append({"title": "A little victory", "kind": "level-clear",
                        **encode(level_clear(), "level-clear", args.output, temp)})
    total = sum(entry["bytes"] for entry in entries)
    assert total < 4_000_000, total
    manifest = {
        "version": 2,
        "description": "Original finite STARJAM music. All instruments synthesized locally; no samples or paid APIs.",
        "generator": "scripts/generate-starjam-soundtracks.py",
        "beatOffsetSeconds": 0,
        "loop": False,
        "totalBytes": total,
        "tracks": entries,
    }
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Verified {len(entries)} files, {total:,} bytes total. Temporary PCM removed.")


if __name__ == "__main__":
    main()
