export type MoodId = 'chill' | 'hype' | 'focus' | 'flow' | 'curious' | 'quiet';

export interface Soundtrack {
  label: string;
  url: string;
  source: 'youtube' | 'spotify';
  description: string;
}

export const MOOD_SOUNDTRACKS: Record<MoodId, Soundtrack> = {
  chill: {
    label: 'lofi hip hop radio',
    url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    source: 'youtube',
    description: 'Warm, familiar lo-fi for easing into a softer pace without going flat.',
  },
  hype: {
    label: 'Beast Mode',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP',
    source: 'spotify',
    description: 'High-energy rap and workout staples that push the room forward fast.',
  },
  focus: {
    label: 'Deep Focus',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ',
    source: 'spotify',
    description: 'Low-distraction instrumental ambience built for sustained concentration.',
  },
  flow: {
    label: 'Coding Mode',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6',
    source: 'spotify',
    description: 'Steady electronic momentum that helps work click into an unbroken rhythm.',
  },
  curious: {
    label: 'Brain Food',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWXLeA8Omikj7',
    source: 'spotify',
    description: 'Bright, off-center indie and electronic picks that keep the mind open.',
  },
  quiet: {
    label: 'Peaceful Piano',
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO',
    source: 'spotify',
    description: 'Sparse piano pieces that lower the noise floor without feeling empty.',
  },
};

export function getSoundtrack(id: MoodId): Soundtrack | null {
  return MOOD_SOUNDTRACKS[id] ?? null;
}
