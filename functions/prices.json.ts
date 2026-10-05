/**
 * /prices.json — machine twin of the local price wire.
 * Read-only. File a report at POST /api/prices.
 */
export { onRequestGet, onRequestOptions } from './api/prices';
