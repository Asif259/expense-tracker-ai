// File: apps/api/src/investments/gold-rate.service.ts
// Purpose: GoldRateService for fetching live BAJUS gold/silver rates from goldr.org and caching in metal_rate_cache table
// Callers: Will be injected into InvestmentsService and exposed via GET /investments/gold/rates endpoint
// No existing file provides this functionality (search confirms no gold-rate service)
// Reads/writes: metal_rate_cache table (NUMERIC(15,2) rates), reads goldr.org HTML
// User instruction: "Implement a complete Investments section... featuring live Bangladesh BAJUS Gold & Silver rates sourced from https://www.goldr.org/"

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../config/env.schema.js';
import { SupabaseAdminService } from '../supabase/supabase-admin.service.js';
import type { MetalRateCache } from '@ledgerly/shared-types';
import { metalRateCacheSchema } from '@ledgerly/shared-types';

@Injectable()
export class GoldRateService {
  private readonly BAJUS_TTL_MS: number;
  private readonly GLOBAL_TTL_MS: number;
  private readonly GOLD_R_URL = 'https://www.goldr.org/';
  private readonly GOLDAPI_IO_URL = 'https://www.goldapi.io/api';

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    const bajusTtlMinutes = this.configService.get<number>(
      'GOLD_RATE_BAJUS_TTL_MINUTES',
      120,
    );
    const globalTtlMinutes = this.configService.get<number>(
      'GOLD_RATE_GLOBAL_TTL_MINUTES',
      360,
    );
    this.BAJUS_TTL_MS = bajusTtlMinutes * 60 * 1000;
    this.GLOBAL_TTL_MS = globalTtlMinutes * 60 * 1000;
  }

  async getRates(
    source?: 'bajus' | 'global',
    currency?: string,
    refresh?: boolean,
  ): Promise<MetalRateCache[]> {
    // Fetch BAJUS rates from goldr.org (Bangladesh-specific)
    const bajusRates =
      source === 'global' ? [] : await this.fetchBajusRates(refresh);

    // Fetch global rates from GoldAPI.io (fallback for missing karats)
    const goldApiKey = this.configService.get<string>('GOLDAPI_IO_KEY');
    const globalRates =
      source === 'bajus' || !goldApiKey
        ? []
        : await this.fetchGlobalRates(goldApiKey, currency, refresh);

    // Merge rates: BAJUS rates take priority, global rates fill gaps
    let mergedRates = this.mergeRates(bajusRates, globalRates);

    // Filter by currency if specified
    if (currency) {
      mergedRates = mergedRates.filter((rate) => rate.currency === currency);
    }

    return mergedRates;
  }

  private async fetchBajusRates(refresh?: boolean): Promise<MetalRateCache[]> {
    const now = Date.now();
    const cacheQuery = this.supabaseAdmin
      .getPrivilegedClient()
      .from('metal_rate_cache')
      .select('*')
      .eq('source', 'goldr.org')
      .order('fetched_at', { ascending: false })
      .limit(100);

    const { data: cached } = await cacheQuery;
    if (cached?.length && cached[0].fetched_at) {
      const age = now - new Date(cached[0].fetched_at).getTime();
      // Quota guard: goldr.org requires 5-minute cooldown (300000ms) between fetches
      // Even with refresh=true, we cannot bypass this hard limit
      const minCooldownMs = 300000; // 5 minutes
      if (age < minCooldownMs) {
        return cached.map((row) => metalRateCacheSchema.parse(row));
      }
      // If refresh is false and within TTL, use cache
      if (!refresh && age < this.BAJUS_TTL_MS) {
        return cached.map((row) => metalRateCacheSchema.parse(row));
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
        return cached || [];
      }

      // Upsert to cache
      const { error: cacheError } = await this.supabaseAdmin
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
            onConflict: 'unique (source, metal_type, karat, currency)',
          },
        );
      if (cacheError) {
        console.warn(
          `Failed to cache BAJUS gold rates [${cacheError.code}]: ${cacheError.message}`,
        );
      }

      clearTimeout(timeoutId);
      return rates;
    } catch (error) {
      console.warn('Failed to fetch BAJUS gold rates:', error);
      return cached || [];
    }
  }

  private async fetchGlobalRates(
    apiKey: string,
    currency?: string,
    refresh?: boolean,
  ): Promise<MetalRateCache[]> {
    const targetCurrency = currency || 'BDT';
    const now = Date.now();
    const cacheQuery = this.supabaseAdmin
      .getPrivilegedClient()
      .from('metal_rate_cache')
      .select('*')
      .eq('source', 'goldapi.io')
      .eq('currency', targetCurrency)
      .order('fetched_at', { ascending: false })
      .limit(100);

    const { data: cached } = await cacheQuery;
    if (!refresh && cached?.length && cached[0].fetched_at) {
      const age = now - new Date(cached[0].fetched_at).getTime();
      if (age < this.GLOBAL_TTL_MS) {
        return cached.map((row) => metalRateCacheSchema.parse(row));
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Fetch gold rates in target currency
      const goldResponse = await fetch(
        `${this.GOLDAPI_IO_URL}/XAU/${targetCurrency}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Ledgerly/1.0 (API)',
            'x-access-key': apiKey,
          },
        },
      );

      // Fetch silver rates in target currency
      const silverResponse = await fetch(
        `${this.GOLDAPI_IO_URL}/XAG/${targetCurrency}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Ledgerly/1.0 (API)',
            'x-access-key': apiKey,
          },
        },
      );

      clearTimeout(timeoutId);

      if (!goldResponse.ok || !silverResponse.ok) {
        throw new Error(
          `GoldAPI: gold=${goldResponse.status}, silver=${silverResponse.status}`,
        );
      }

      const goldData = await goldResponse.json();
      const silverData = await silverResponse.json();

      const rates: MetalRateCache[] = [];

      // Gold: 24k is standard, derive 22k (22/24 = 0.9167 ratio)
      const goldPricePerOunce = parseFloat(goldData.price);
      const goldPricePerGram = (goldPricePerOunce / 31.1035).toFixed(2);

      if (goldPricePerGram && parseFloat(goldPricePerGram) > 0) {
        rates.push({
          source: 'goldapi.io',
          metal_type: 'gold',
          karat: '24k',
          market_price_per_gram: goldPricePerGram,
          resale_price_per_gram: (parseFloat(goldPricePerGram) * 0.95).toFixed(
            2,
          ), // 95% resale
          currency: targetCurrency,
          source_updated_label: `GoldAPI.io - ${new Date().toISOString()}`,
          fetched_at: new Date().toISOString(),
        });

        // Derive 22k from 24k (22/24 = 0.9167)
        const gold22kPrice = (parseFloat(goldPricePerGram) * 0.9167).toFixed(2);
        rates.push({
          source: 'goldapi.io',
          metal_type: 'gold',
          karat: '22k',
          market_price_per_gram: gold22kPrice,
          resale_price_per_gram: (parseFloat(gold22kPrice) * 0.95).toFixed(2),
          currency: targetCurrency,
          source_updated_label: `GoldAPI.io - Derived 22k`,
          fetched_at: new Date().toISOString(),
        });
      }

      // Silver: standard is 999 (24k equivalent)
      const silverPricePerOunce = parseFloat(silverData.price);
      const silverPricePerGram = (silverPricePerOunce / 31.1035).toFixed(2);

      if (silverPricePerGram && parseFloat(silverPricePerGram) > 0) {
        rates.push({
          source: 'goldapi.io',
          metal_type: 'silver',
          karat: '24k',
          market_price_per_gram: silverPricePerGram,
          resale_price_per_gram: (
            parseFloat(silverPricePerGram) * 0.95
          ).toFixed(2),
          currency: targetCurrency,
          source_updated_label: `GoldAPI.io - ${new Date().toISOString()}`,
          fetched_at: new Date().toISOString(),
        });
      }

      if (rates.length === 0) {
        return cached || [];
      }

      // Upsert to cache
      const { error: cacheError } = await this.supabaseAdmin
        .getPrivilegedClient()
        .from('metal_rate_cache')
        .upsert(
          rates.map((r) => ({
            source: r.source,
            metal_type: r.metal_type,
            karat: r.karat,
            market_price_per_gram: r.market_price_per_gram,
            resale_price_per_gram: r.resale_price_per_gram,
            currency: r.currency,
            source_updated_label: r.source_updated_label,
            fetched_at: r.fetched_at,
          })),
          {
            onConflict: 'unique (source, metal_type, karat, currency)',
          },
        );
      if (cacheError) {
        console.warn(
          `Failed to cache GoldAPI.io rates [${cacheError.code}]: ${cacheError.message}`,
        );
      }

      return rates;
    } catch (error) {
      console.warn('Failed to fetch GoldAPI.io rates:', error);
      return cached || [];
    }
  }

  private mergeRates(
    bajusRates: MetalRateCache[],
    globalRates: MetalRateCache[],
  ): MetalRateCache[] {
    const merged = new Map<string, MetalRateCache>();

    // Add BAJUS rates first (priority)
    for (const rate of bajusRates) {
      const key = `${rate.metal_type}-${rate.karat}`;
      merged.set(key, rate);
    }

    // Fill gaps with global rates
    for (const rate of globalRates) {
      const key = `${rate.metal_type}-${rate.karat}`;
      if (!merged.has(key)) {
        merged.set(key, rate);
      }
    }

    return Array.from(merged.values());
  }

  private parseGoldrHtml(html: string): MetalRateCache[] {
    const now = new Date().toISOString();
    const rates: MetalRateCache[] = [];

    const stripTags = (value: string): string =>
      value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

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
      return str.replace(/[০-৯]/g, (m) => map[m] || m);
    };

    /** Extracts the first BDT (৳) amount from a cell, ignoring the USD ( $ ) figure. */
    const extractTaka = (cellHtml: string): string | null => {
      const text = normalizeBengali(stripTags(cellHtml));
      const match = text.match(/৳\s*([0-9][0-9,]*(?:\.[0-9]+)?)/);
      if (!match) return null;
      const value = Number(match[1].replace(/,/g, ''));
      return Number.isFinite(value) && value > 0 ? value.toFixed(2) : null;
    };

    const karatOf = (label: string): string | null => {
      const lower = label.toLowerCase();
      if (lower.includes('traditional')) return 'traditional';
      if (lower.includes('22')) return '22k';
      if (lower.includes('21')) return '21k';
      if (lower.includes('18')) return '18k';
      if (lower.includes('24')) return '24k';
      return null;
    };

    const parseRows = (tableHtml: string, metalType: 'gold' | 'silver') => {
      const rows = tableHtml.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
      for (const row of rows) {
        const cells = row.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) ?? [];
        if (cells.length < 2) continue;

        const karat = karatOf(stripTags(cells[0] ?? ''));
        if (!karat) continue;

        const marketPrice = extractTaka(cells[1] ?? '');
        if (!marketPrice) continue;

        const resalePrice =
          (cells[2] && extractTaka(cells[2])) ??
          (Number(marketPrice) * 0.85).toFixed(2);

        rates.push({
          source: 'goldr.org',
          metal_type: metalType,
          karat,
          market_price_per_gram: marketPrice,
          resale_price_per_gram: resalePrice,
          currency: 'BDT',
          source_updated_label: 'GoldR.org (BAJUS)',
          fetched_at: now,
        });
      }
    };

    // Tables are ordered gram, vori, ana, rati for gold then silver; the first
    // table containing the metal name is the gram table the API prices against.
    const tables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) ?? [];

    const goldTable = tables.find((t) => /Karat Gold/i.test(stripTags(t)));
    if (goldTable) parseRows(goldTable, 'gold');

    const silverTable = tables.find((t) => /Karat Silver/i.test(stripTags(t)));
    if (silverTable) parseRows(silverTable, 'silver');

    // BAJUS does not quote 24k gold; derive it from the 22k price (24/22 purity).
    const gold22k = rates.find(
      (r) => r.metal_type === 'gold' && r.karat === '22k',
    );
    if (gold22k) {
      rates.push({
        source: 'goldr.org',
        metal_type: 'gold',
        karat: '24k',
        market_price_per_gram: (Number(gold22k.market_price_per_gram) * (24 / 22)).toFixed(2),
        resale_price_per_gram: (Number(gold22k.resale_price_per_gram) * (24 / 22)).toFixed(2),
        currency: 'BDT',
        source_updated_label: 'Derived from 22k rate',
        fetched_at: now,
      });
    }

    return rates;
  }
}

