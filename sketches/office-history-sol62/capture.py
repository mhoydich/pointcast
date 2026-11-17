#!/usr/bin/env python3
"""Update the standalone replay from a bounded set of public Loom GETs."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import re
from urllib.parse import quote
from urllib.request import Request, urlopen

SITE = "https://pointcast.xyz"
BOARD = "#officenoun-tasks"
DAY = "2026-11-17"
DAY_END = DAY + "T23:59:59.999Z"
S4_START = DAY + "T17:23:57.256Z"
MAX_BYTES = 2_500_000
ROOMS = [
    BOARD, "@ada", "@sid", "@tess", "@lou", "@shwa", "@loomdesk",
    *(f"@astra-{n}" for n in range(1, 7)),
    *(f"@sol-{n}" for n in range(1, 7)),
    "@sol-rival-desk", "@sol-rival-phone", "@sol-night",
]
ID_PATTERN = re.compile(r"m_[a-z0-9]+")
KEY_PATTERN = re.compile(r"[a-f0-9]{24}")
HANDLE_PATTERN = re.compile(r"@[a-z0-9_.-]{1,64}")


def fetch(room):
    url = f"{SITE}/api/loom?to={quote(room, safe='')}"
    request = Request(url, headers={"User-Agent": "PointCast Office replay/1.0"})
    try:
        with urlopen(request, timeout=15) as response:
            if response.url != url:
                raise ValueError("unexpected redirect")
            payload = response.read(MAX_BYTES + 1)
        if len(payload) > MAX_BYTES:
            raise ValueError("response too large")
        result = json.loads(payload)
        if not result.get("ok") or not isinstance(result.get("messages"), list):
            raise ValueError("invalid Loom history")
        if not result.get("exists"):
            return room, "absent", result
        log = result.get("log") or {}
        if log.get("address") != room or not KEY_PATTERN.fullmatch(log.get("key", "")):
            raise ValueError("unmatched room")
        return room, "read", result
    except Exception as error:
        print(f"{room}: {error}")
        return room, "unavailable", {}


def source_url(room, identifier=None):
    anchor = f"#{identifier}" if identifier else ""
    return f"{SITE}/loom?to={quote(room, safe='')}{anchor}"


def capture(through):
    events = {}
    rooms = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        for room, state, result in executor.map(fetch, ROOMS):
            log = result.get("log") or {}
            rooms.append({"name": room, "state": state, "url": source_url(room),
                          "trimmedBefore": log.get("trimmedBefore")})
            if state != "read":
                continue
            for message in result["messages"]:
                identity = message.get("from") or {}
                handle = identity.get("address") or ""
                identifier = message.get("id") or ""
                at = message.get("at") or ""
                if not at.startswith(DAY + "T") or at > through:
                    continue
                if room != BOARD and (at < S4_START or handle != room):
                    continue
                if (not ID_PATTERN.fullmatch(identifier) or message.get("kind") == "link" or
                        message.get("via") or identity.get("kind") == "robot" or message.get("auto")):
                    continue
                try:
                    at_time = datetime.fromisoformat(at)
                except ValueError:
                    continue
                if at_time.utcoffset() != timezone.utc.utcoffset(at_time):
                    continue
                name = str(identity.get("name") or "Unnamed public author")[:120]
                handle = handle if HANDLE_PATTERN.fullmatch(handle) else ""
                key = f"{log['key']}#{identifier}"
                parent = message.get("parent") or ""
                parent_key = f"{log['key']}#{parent}" if ID_PATTERN.fullmatch(parent) else None
                body = " ".join(str(message.get("body") or "").split())
                events.setdefault(key, {
                    "id": key, "at": at, "minute": at_time.hour * 60 + at_time.minute,
                    "seat": handle or f"label:{name.casefold()}", "name": name, "handle": handle,
                    "body": body[:179] + "…" if len(body) > 180 else body,
                    "parent": parent_key, "url": source_url(room, identifier),
                })
    if not any(room["name"] == BOARD and room["state"] == "read" for room in rooms):
        raise SystemExit("Board read failed. Existing replay preserved.")
    return {"day": DAY, "through": through, "rooms": rooms,
            "events": sorted(events.values(), key=lambda event: (event["at"], event["id"]))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    parser.add_argument("--through", default=min(now, DAY_END),
                        help="UTC cutoff within November 17, with milliseconds and a trailing Z")
    options = parser.parse_args()
    try:
        cutoff = datetime.fromisoformat(options.through)
    except ValueError:
        parser.error("invalid UTC cutoff")
    normalized = cutoff.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    if normalized != options.through or not normalized.startswith(DAY + "T") or normalized > now:
        parser.error("cutoff must be a past November 17 UTC timestamp with milliseconds and trailing Z")
    snapshot = capture(normalized)
    path = Path(__file__).with_name("index.html")
    # Escape every opening angle bracket so public post text cannot end the data script.
    data = json.dumps(snapshot, ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
    html, count = re.subn(r'(<script id="snapshot" type="application/json">).*?(</script>)',
                          lambda match: match.group(1) + data + match.group(2),
                          path.read_text(encoding="utf-8"), flags=re.DOTALL)
    if count != 1:
        raise SystemExit("Expected one replay data element")
    path.write_text(html, encoding="utf-8")
    print(f"{len(snapshot['events'])} events through {snapshot['through']}")


if __name__ == "__main__":
    main()
