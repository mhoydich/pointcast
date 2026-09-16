import { BEACH_SEATS, POCKET_SEATS } from './beach-commons-v19';

export const SHOPPING_STUDY = 'beach-commons-v19';
export const SHOPPING_ITEMS = [...POCKET_SEATS, ...BEACH_SEATS];
export const POCKET_KEY = 'pointcast:shopping-pocket:v1';
export function readPocket(value: string | null): string[] {
  try {
    const ids: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter((id): id is string =>
      typeof id === 'string' && SHOPPING_ITEMS.some(item => item.id === id)))] : [];
  } catch { return []; }
}
export function shoppingLabel(id: string): string {
  const item = SHOPPING_ITEMS.find(item => item.id === id);
  return item?.priceLabel.includes('out of stock') ? 'Check stock' : 'Shop at ' + (item?.maker ?? 'merchant');
}
