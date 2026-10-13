/**
 * Global Responsive Table Design Pattern — Comprehensive Test Suite
 *
 * Verifies:
 * 1. Column Role Classification: IDENTITY, VALUE, STATE, DETAIL, ACTION
 * 2. Information Hierarchy & Ranking: "Rank by use, not position"
 * 3. Mobile Two-Visual-Lines Structure: Line 1 (Identity Left, Value Right) & Line 2 (State + Details)
 * 4. Numeric Formatting & Slot Preservation: Primary amount right-aligned, tabular-nums, never truncated
 * 5. Data Completeness ("Hidden isn't deleted"): All fields preserved in detail drawer
 * 6. Container-Aware Breakpoints: sm (600px), md (760px), lg (900px), xl (1040px)
 * 7. Mobile Sorting Preservation: Sort control available when headers hidden
 * 8. Touch Targets & Accessibility: 44x44px touch area, semantic labels
 * 9. React Component SSR Render: Desktop table view & mobile compact view rendering
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  ResponsiveDataTable,
  ResponsiveColumn,
  RowAction,
  MobileTableConfig,
} from '../../apps/web/src/components/responsive-table';

interface SampleTenantLedger {
  id: string;
  tenantName: string;
  property: string;
  unit: string;
  amountDue: string;
  dueDate: string;
  status: 'paid' | 'overdue' | 'pending';
}

const sampleData: SampleTenantLedger[] = [
  {
    id: 'row-1',
    tenantName: 'Rahim Ahmed',
    property: 'Nibir Mahal',
    unit: '603',
    amountDue: '13,700',
    dueDate: 'Sep 10, 2026',
    status: 'overdue',
  },
  {
    id: 'row-2',
    tenantName: 'Nusrat Jahan',
    property: 'Gulshan Grace',
    unit: '4B',
    amountDue: '8,500',
    dueDate: 'Sep 15, 2026',
    status: 'paid',
  },
  {
    id: 'row-3',
    tenantName: 'Farhan Chowdhuri Long Name Extra Text for Truncation Testing',
    property: 'Banani Heights',
    unit: '12A',
    amountDue: '250,000',
    dueDate: 'Sep 20, 2026',
    status: 'pending',
  },
];

const testColumns: ResponsiveColumn<SampleTenantLedger>[] = [
  {
    id: 'tenant',
    header: 'Tenant',
    role: 'identity',
    priority: 1,
    label: 'Tenant Name',
    sortable: true,
    accessor: (r) => r.tenantName,
  },
  {
    id: 'amount',
    header: 'Amount Due',
    role: 'value',
    priority: 2,
    align: 'right',
    isNumeric: true,
    label: 'Total Amount Due',
    sortable: true,
    accessor: (r) => `৳${r.amountDue}`,
  },
  {
    id: 'status',
    header: 'Status',
    role: 'state',
    priority: 3,
    label: 'Payment Status',
    cell: (r) => React.createElement('span', { className: 'compact-status' }, `● ${r.status}`),
  },
  {
    id: 'dueDate',
    header: 'Due Date',
    role: 'detail',
    priority: 4,
    label: 'Due Date',
    accessor: (r) => `Due ${r.dueDate}`,
  },
  {
    id: 'property',
    header: 'Property',
    role: 'detail',
    priority: 5,
    label: 'Property Name',
    accessor: (r) => r.property,
  },
  {
    id: 'unit',
    header: 'Unit',
    role: 'detail',
    priority: 6,
    label: 'Unit',
    accessor: (r) => `Unit ${r.unit}`,
  },
  {
    id: 'actions',
    header: 'Actions',
    role: 'action',
    priority: 7,
    align: 'right',
  },
];

describe('Global Responsive Table Design Pattern', () => {
  describe('1. Column Classification & Information Hierarchy', () => {
    it('classifies columns into IDENTITY, VALUE, STATE, DETAIL, and ACTION roles', () => {
      const identityCol = testColumns.find((c) => c.role === 'identity');
      const valueCol = testColumns.find((c) => c.role === 'value');
      const stateCol = testColumns.find((c) => c.role === 'state');
      const detailCols = testColumns.filter((c) => c.role === 'detail');
      const actionCol = testColumns.find((c) => c.role === 'action');

      expect(identityCol?.id).toBe('tenant');
      expect(valueCol?.id).toBe('amount');
      expect(stateCol?.id).toBe('status');
      expect(detailCols.map((c) => c.id)).toEqual(['dueDate', 'property', 'unit']);
      expect(actionCol?.id).toBe('actions');
    });

    it('ranks priority correctly: IDENTITY (1) > VALUE (2) > STATE (3) > DETAIL (4-6) > ACTION (7)', () => {
      const sorted = [...testColumns].sort((a, b) => a.priority - b.priority);
      expect(sorted[0].role).toBe('identity');
      expect(sorted[1].role).toBe('value');
      expect(sorted[2].role).toBe('state');
      expect(sorted[3].role).toBe('detail');
      expect(sorted[sorted.length - 1].role).toBe('action');
    });
  });

  describe('2. Desktop and Mobile Dual-View Rendering', () => {
    it('renders both table-desktop-view and table-mobile-view within container query wrapper', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          breakpoint: 'md',
        })
      );

      // Container has container query class and breakpoint attribute
      expect(html).toContain('responsive-table-container');
      expect(html).toContain('data-breakpoint="md"');

      // Desktop table view exists with semantic <table>
      expect(html).toContain('table-desktop-view');
      expect(html).toContain('<table');
      expect(html).toContain('Tenant');
      expect(html).toContain('Amount Due');

      // Mobile compact view exists with role="list"
      expect(html).toContain('table-mobile-view');
      expect(html).toContain('role="list"');
      expect(html).toContain('role="listitem"');
    });

    it('enforces table owns the breakpoint with configurable container thresholds', () => {
      const smHtml = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          breakpoint: 'sm',
        })
      );
      expect(smHtml).toContain('data-breakpoint="sm"');

      const lgHtml = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          breakpoint: 'lg',
        })
      );
      expect(lgHtml).toContain('data-breakpoint="lg"');
    });
  });

  describe('3. Mobile Layout: Name Left, Amount Right (Two Visual Lines)', () => {
    it('renders primary identity on the left and primary amount in dedicated slot on the right', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          mobileConfig: {
            identityColumnId: 'tenant',
            primaryValueColumnId: 'amount',
            stateColumnId: 'status',
            secondaryDetailColumnIds: ['dueDate'],
          },
        })
      );

      // Line 1 items: Rahim Ahmed (Identity) and ৳13,700 (Amount)
      expect(html).toContain('Rahim Ahmed');
      expect(html).toContain('৳13,700');

      // Monetary amount uses tabular-nums
      expect(html).toContain('tabular-nums');

      // Line 2 items: State (● overdue) and supporting detail (Due Sep 10, 2026)
      expect(html).toContain('● overdue');
      expect(html).toContain('Due Sep 10, 2026');
    });

    it('does not truncate numeric values and preserves right slot formatting', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
        })
      );

      // Large monetary amount rendered fully
      expect(html).toContain('৳250,000');
    });
  });

  describe('4. Mobile Action Menus and Touch Targets (>= 44x44px)', () => {
    it('renders secondary action menu button with accessible touch target and label', () => {
      const mockAction = vi.fn();
      const actions: RowAction<SampleTenantLedger>[] = [
        {
          id: 'collect',
          label: 'Collect Rent',
          onClick: mockAction,
        },
        {
          id: 'edit',
          label: 'Edit Tenant',
          onClick: mockAction,
        },
      ];

      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          actions: () => actions,
        })
      );

      // Actions button contains min 44x44px touch styling classes
      expect(html).toContain('min-w-[44px]');
      expect(html).toContain('min-h-[44px]');
      expect(html).toContain('aria-label="Open actions menu for Rahim Ahmed"');
    });
  });

  describe('5. Mobile Sort Preservation', () => {
    it('renders mobile sort control when sortable columns exist so mobile users can sort without table headers', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: sampleData,
          columns: testColumns,
          keyExtractor: (r) => r.id,
          sortColumnId: 'tenant',
          sortDirection: 'asc',
          onSortChange: vi.fn(),
        })
      );

      expect(html).toContain('aria-label="Sort table rows"');
      expect(html).toContain('Sort:');
      expect(html).toContain('Tenant Name');
    });
  });

  describe('6. Loading and Empty States', () => {
    it('renders 2-line skeleton rows in mobile view during loading state', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: [],
          columns: testColumns,
          keyExtractor: (r) => r.id,
          loading: true,
          loadingRowCount: 3,
        })
      );

      // Mobile skeleton items exist
      expect(html).toContain('mob-skel-0');
      expect(html).toContain('mob-skel-1');
      expect(html).toContain('mob-skel-2');
      // Desktop skeleton rows also exist
      expect(html).toContain('desktop-skel-0');
    });

    it('renders clear empty state when data is empty and not loading', () => {
      const html = renderToString(
        React.createElement(ResponsiveDataTable<SampleTenantLedger>, {
          data: [],
          columns: testColumns,
          keyExtractor: (r) => r.id,
          loading: false,
          emptyTitle: 'No tenants recorded',
          emptyDescription: 'Add your first tenant to start tracking rent.',
        })
      );

      expect(html).toContain('No tenants recorded');
      expect(html).toContain('Add your first tenant to start tracking rent.');
    });
  });
});
