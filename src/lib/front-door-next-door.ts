export type FrontDoorNextDoor = {
  href: string;
  label: string;
  reason: string;
};

/** One gentle continuation after the daily claim. */
export function chooseFrontDoorNextDoor(input: {
  claimedDays?: unknown;
  hasHandle?: boolean;
  streak?: unknown;
}): FrontDoorNextDoor {
  const claimed = Array.isArray(input.claimedDays) ? input.claimedDays.length : 0;
  if (claimed <= 1) return { href: '/bench', label: 'Sit at the bench', reason: 'First visit' };
  if (input.hasHandle) return { href: '/collect', label: 'See your collection', reason: 'Your dogs' };
  if (Number(input.streak) >= 3) return { href: '/drum', label: 'Play the drum', reason: 'Keep the streak moving' };
  return { href: '/me', label: 'Make your handle', reason: 'One small next step' };
}
