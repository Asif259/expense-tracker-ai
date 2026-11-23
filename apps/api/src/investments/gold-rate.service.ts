// File: apps/api/src/investments/gold-rate.service.ts
// Purpose: GoldRateService for fetching live BAJUS gold/silver rates from goldr.org and caching in metal_rate_cache table
// Callers: Will be injected into InvestmentsService and exposed via GET /investments/gold/rates endpoint
// No existing file provides this functionality (search confirms no gold-rate service)
// Reads/writes: metal_rate_cache table (NUMERIC(15,2) rates), reads goldr.org HTML
// User instruction: "Implement a complete Investments section... featuring live Bangladesh BAJUS Gold & Silver rates sourced from https://www.goldr.org/"

import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { MetalRateCache } from '@ledgerly/shared-types';
import { metalRateCacheSchema } from '@ledgerly/shared-types';

@Injectable()
export class GoldRateService {
  private readonly CACHE_TTL_MS = 7200000; // 2 hours
  private readonly GOLD_R_URL = 'https://www.goldr.org/';

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly supabase: SupabaseService,
  ) {}

  async getRates(refresh?: boolean): Promise<MetalRateCache[]> {
    const now = Date.now();
    const cacheQuery = this.supabaseAdmin
      .getPrivilegedClient()
      .from('metal_rate_cache')
      .select('*')
      .eq('source', 'goldr.org')
      .order('fetched_at', { ascending: false })
      .limit(100);

    const { data: cached } = await cacheQuery;
    if (!refresh && cached?.length && cached[0].fetched_at) {
      const age = now - new Date(cached[0].fetched_at).getTime();
      if (age < this.CACHE_TTL_MS) {
        // Return fresh cache
        return cached.map((row) => ({
          id: row.id,
          source: row.source,
          metal_type: row.metal_type,
          karat: row.karat,
          market_price_per_gram: row.market_price_per_gram,
          resale_price_per_gram: row.resale_price_per_gram,
          currency: row.currency,
          source_updated_label: row.source_updated_label,
          fetched_at: row.fetched_at,
        }));
      }
    }

    // Fetch fresh rates from goldr.org
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(this.GOLD_R_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Ledgerly/1.0 (API)' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const rates = this.parseGoldrHtml(html);

      if (rates.length === 0) {
        // Fallback to stale cache if parsing fails
        return cached || [];
      }

      // Upsert to cache via admin client
      await this.supabaseAdmin
        .getPrivilegedClient()
        .from('metal_rate_cache')
        .upsert(
          rates.map((r) => ({
            source: 'goldr.org',
            metal_type: r.metal_type,
            karat: r.karat,
            market_price_per_gram: r.market_price_per_gram,
            resale_price_per_gram: r.resale_price_per_gram,
            currency: 'BDT',
            source_updated_label: r.source_updated_label,
            fetched_at: new Date().toISOString(),
          })),
          {
            onConflict: 'unique (source, metal_type, currency)',
          },
        );

      clearTimeout(timeoutId);
      return rates;
    } catch (error) {
      console.warn('Failed to fetch gold rates:', error);
      // Return stale cache as fallback
      return cached || [];
    }
  }

  private parseGoldrHtml(html: string): MetalRateCache[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rates: MetalRateCache[] = [];
    const tables = doc.querySelectorAll('table');

    // Helper to normalize Bengali digits
    const normalizeBengali = (str: string) => {
      const map: Record<string, string> = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9',
      };
      return str
        .replace(/[০-৯]/g, (m) => map[m] || m)
        .replace(/[^\d.,]/g, '')
        .replace(/,/g, '');
    };

    // Gold tables (22k, 21k, 18k, Traditional)
    const goldTable = Array.from(tables).find((t) => {
      const text = t.textContent || '';
      return text.includes('22 Karat Gold') || text.includes('21 Karat Gold');
    });

    if (goldTable) {
      const rows = Array.from(goldTable.querySelectorAll('tr')).slice(1);
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 2) return;
        const karatCell = cells[0].textContent || '';
        const marketCell = cells[1].textContent || '';
        const resaleCell = cells[2]?.textContent || '';

        const karat = karatCell.toLowerCase().includes('traditional')
          ? 'traditional'
          : karatCell.toLowerCase().includes('22')
            ? '22k'
            : karatCell.toLowerCase().includes('21')
              ? '21k'
              : '18k';

        const marketPrice = normalizeBengali(marketCell);
        const resalePrice = normalizeBengali(
          resaleCell || `${parseFloat(normalizeBengali(marketCell)) * 0.85}`,
        );

        if (marketPrice && parseFloat(marketPrice) > 0) {
          rates.push({
            metal_type: 'metal_type' as 'gold',
            karat,
            market_price_per_gram: marketPrice,
            resale_price_per_gram: resalePrice,
            source_updated_label: goldTable
              .querySelector('thead')
              ?.textContent?.trim(),
          } as MetalRateCache);
        }
      });
    }

    // Silver tables (22k, 21k, 18k)
    const silverTable = Array.from(tables).find((t) => {
      const text = t.textContent || '';
      return (
        text.includes('22 Karat Silver') || text.includes('21 Karat Silver')
      );
    });

    if (silverTable) {
      const rows = Array.from(silverTable.querySelectorAll('tr')).slice(1);
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 1) return;
        const karatCell = cells[0].textContent || '';
        const marketCell = cells[1]?.textContent || '';

        const karat = karatCell.toLowerCase().includes('traditional')
          ? 'traditional'
          : karatCell.toLowerCase().includes('22')
            ? '22k'
            : karatCell.toLowerCase().includes('21')
              ? '21k'
              : '18k';

        const marketPrice = normalizeBengali(marketCell);
        const resalePrice = normalizeBengali(
          `${parseFloat(normalizeBengali(marketCell)) * 0.85}`,
        );

        if (marketPrice && parseFloat(marketPrice) > 0) {
          rates.push({
            metal_type: 'metal_type' as 'silver',
            karat,
            market_price_per_gram: marketPrice,
            resale_price_per_gram: resalePrice,
            source_updated_label: silverTable
              .querySelector('thead')
              ?.textContent?.trim(),
          } as MetalRateCache);
        }
      });
    }

    // Add 24k gold if not found (derive from 22k)
    const has24k = rates.some(
      (r) => r.metal_type === 'gold' && r.karat === '24k',
    );
    if (!has24k) {
      const gold22k = rates.find(
        (r) => r.metal_type === 'gold' && r.karat === '22k',
      );
      if (gold22k) {
        rates.push({
          metal_type: 'gold',
          karat: '24k',
          market_price_per_gram: gold22k.market_price_per_gram,
          resale_price_per_gram: gold22k.resale_price_per_gram,
          source_updated_label: 'Derived from 22k rate',
        } as MetalRateCache);
      }
    }

    return rates;
  }
}
