import type { ApiRecord } from '@/types/mobile';

export function recordsFrom(data: unknown): ApiRecord[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is ApiRecord => Boolean(item) && typeof item === 'object');
  }
  if (data && typeof data === 'object') {
    return Object.entries(data as ApiRecord).map(([key, value]) => (
      value && typeof value === 'object' && !Array.isArray(value)
        ? { label: key, ...(value as ApiRecord) }
        : { label: key, value }
    ));
  }
  return [];
}
