import { describe, it, expect } from 'vitest';
import type { MetalRateCache } from '@ledgerly/shared-types';
import { GoldRateService } from './gold-rate.service.js';

const GOLD_TABLE = `
<table class="metal-table">
  <thead><tr><th>Gold Type</th><th>Price</th><th>Resale</th></tr></thead>
  <tbody>
    <tr><td>22 Karat Gold</td><td>৳১৬,৯৮৫<div>$136.64</div></td><td>৳১৪,৪৩৭</td></tr>
    <tr><td>21 Karat Gold</td><td>৳১৬,২২০</td><td>৳১৩,৭৮৭</td></tr>
    <tr><td>18 Karat Gold</td><td>৳১৩,৯৩৫</td><td>৳১১,৮৪৫</td></tr>
    <tr><td>Traditional</td><td>৳১১,৩৫৫</td><td>৳৯,৬৫২</td></tr>
  </tbody>
</table>`;

const SILVER_TABLE = `
<table class="metal-table">
  <thead><tr><th>Silver Type</th><th>Price</th></tr></thead>
  <tbody>
    <tr><td>22 Karat Silver</td><td>৳২৬০<div>$2.09</div></td></tr>
    <tr><td>21 Karat Silver</td><td>৳২৫০</td></tr>
    <tr><td>18 Karat Silver</td><td>৳২১৫</td></tr>
    <tr><td>Traditional</td><td>৳১৬৫</td></tr>
  </tbody>
</table>`;

function parse(html: string): MetalRateCache[] {
  const service = Object.create(GoldRateService.prototype) as unknown as {
    parseGoldrHtml(input: string): MetalRateCache[];
  };
  return service.parseGoldrHtml(html);
}

describe('GoldRateService.parseGoldrHtml', () => {
  const rates = parse(`${GOLD_TABLE}${SILVER_TABLE}`);

  it('parses BDT gram prices without a DOM implementation', () => {
    expect(rates.length).toBe(9);
    const gold22k = rates.find((r) => r.metal_type === 'gold' && r.karat === '22k');
    expect(gold22k?.market_price_per_gram).toBe('16985.00');
    expect(gold22k?.resale_price_per_gram).toBe('14437.00');
    expect(gold22k?.source).toBe('goldr.org');
    expect(gold22k?.currency).toBe('BDT');
  });

  it('derives silver resale price when the table has no resale column', () => {
    const silver22k = rates.find((r) => r.metal_type === 'silver' && r.karat === '22k');
    expect(silver22k?.market_price_per_gram).toBe('260.00');
    expect(silver22k?.resale_price_per_gram).toBe('221.00');
  });

  it('derives 24k gold from the 22k rate', () => {
    const gold24k = rates.find((r) => r.metal_type === 'gold' && r.karat === '24k');
    expect(gold24k?.market_price_per_gram).toBe('18529.09');
  });

  it('returns no rates when the markup has no metal tables', () => {
    expect(parse('<html><body>maintenance</body></html>')).toEqual([]);
  });
});
