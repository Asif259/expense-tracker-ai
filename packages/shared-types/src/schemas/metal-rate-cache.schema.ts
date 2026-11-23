import { z } from 'zod';

export type MetalRateCache = {
  id: string;
  source: string;
  metal_type: 'gold' | 'silver';
  karat: string;
  market_price_per_gram: string;
  resale_price_per_gram: string;
  currency: string;
  source_updated_label?: string;
  fetched_at?: string;
};

export const metalRateCacheSchema = z.object({
  id: z.string(),
  source: z.string(),
  metal_type: z.enum(['gold', 'silver']),
  karat: z.string(),
  market_price_per_gram: z.string(),
  resale_price_per_gram: z.string(),
  currency: z.string(),
  source_updated_label: z.string().optional(),
  fetched_at: z.string().optional(),
});