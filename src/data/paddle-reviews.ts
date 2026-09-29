import type { PaddleTake } from '../lib/paddle-takes';

// Real paddle takes only, filed by their own reviewer. Stage 1 ships this
// empty on purpose: the first review comes from Mike's bag, not from this
// file being seeded to make the page look occupied. See
// src/pages/reviews/paddles/index.astro for the empty-state copy.
export const PADDLE_REVIEWS: PaddleTake[] = [];
