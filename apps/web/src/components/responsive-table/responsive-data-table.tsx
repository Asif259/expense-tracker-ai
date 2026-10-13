'use client';

import { useState, useMemo, ReactNode } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveColumn,
  ResponsiveDataTableProps,
} from './types';
import { TableActionsMenu } from './table-actions-menu';
import { TableBottomSheet, DetailField } from './table-bottom-sheet';

export function ResponsiveDataTable<T>({
  data,
  columns,
  keyExtractor,
  breakpoint = 'md',
  viewMode = 'auto',
  mobileConfig,
  actions,
  sortColumnId,
  sortDirection = 'asc',
  onSortChange,
  loading = false,
  loadingRowCount = 5,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyAction,
  emptyIcon,
  error = null,
  onRetry,
  ariaLabel = 'Data table',
  className = '',
  tableTitle,
}: ResponsiveDataTableProps<T>) {
  // Mobile active detail sheet state
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  // Accordion expanded rows state (if accordion mode is chosen)
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(new Set());
  // Mobile sort dropdown open state
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Classify and rank columns
  const {
    identityColumn,
    primaryValueColumn,
    stateColumn,
    secondaryDetailColumns,
    sortableColumns,
  } = useMemo(() => {
    const sorted = [...columns].sort((a, b) => a.priority - b.priority);

    const identity =
      columns.find((c) => c.id === mobileConfig?.identityColumnId) ||
      sorted.find((c) => c.role === 'identity') ||
      sorted[0];

    const value =
      columns.find((c) => c.id === mobileConfig?.primaryValueColumnId) ||
      sorted.find((c) => c.role === 'value');

    const state =
      columns.find((c) => c.id === mobileConfig?.stateColumnId) ||
      sorted.find((c) => c.role === 'state');

    const action = sorted.find((c) => c.role === 'action');

    const secondary = sorted.filter((c) => {
      if (c.id === identity?.id || c.id === value?.id || c.id === state?.id || c.id === action?.id) {
        return false;
      }
      if (mobileConfig?.secondaryDetailColumnIds) {
        return mobileConfig.secondaryDetailColumnIds.includes(c.id);
      }
      return c.role === 'detail';
    });

    const sortables = columns.filter((c) => c.sortable);

    return {
      identityColumn: identity,
      primaryValueColumn: value,
      stateColumn: state,
      secondaryDetailColumns: secondary,
      sortableColumns: sortables,
    };
  }, [columns, mobileConfig]);

  // Helper to extract or render cell content
  const renderCellContent = (col: ResponsiveColumn<T>, row: T, index: number): ReactNode => {
    if (col.cell) {
      return col.cell(row, index);
    }
    if (col.accessor) {
      const val = col.accessor(row);
      return val != null ? String(val) : '—';
    }
    return '—';
  };

  // Helper to format identity text for ARIA and labels
  const getIdentityText = (row: T, index: number): string => {
    if (!identityColumn) return `Row ${index + 1}`;
    if (identityColumn.accessor) {
      const val = identityColumn.accessor(row);
      if (val != null) return String(val);
    }
    return `Record ${index + 1}`;
  };

  const handleRowClick = (row: T, key: string) => {
    const mode = mobileConfig?.detailMode || 'bottom-sheet';
    if (mode === 'bottom-sheet') {
      setSelectedRow(row);
    } else if (mode === 'accordion') {
      setExpandedRowKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }
  };

  const handleSortToggle = (colId: string) => {
    if (!onSortChange) return;
    if (sortColumnId === colId) {
      onSortChange(colId, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(colId, 'asc');
    }
  };

  // Build field list for the mobile detail bottom sheet
  const getDetailFieldsForRow = (row: T, index: number): DetailField[] => {
    return columns
      .filter((col) => {
        if (col.hiddenInMobileDetails) return false;
        if (col.role === 'action') return false;
        if (col.id === identityColumn?.id) return false;
        if (col.id === primaryValueColumn?.id) return false;
        return true;
      })
      .map((col) => ({
        label: col.label || (typeof col.header === 'string' ? col.header : col.id),
        value: renderCellContent(col, row, index),
      }));
  };

  // Active sort column header label
  const activeSortCol = sortableColumns.find((c) => c.id === sortColumnId);

  return (
    <div
      className={`responsive-table-container rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden ${className}`}
      data-breakpoint={breakpoint}
      data-view-mode={viewMode}
    >
      {/* =========================================================================
          ERROR STATE
          ========================================================================= */}
      {error && !loading && (
        <div className="p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[var(--color-danger)] mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-[var(--color-text)]">Unable to load data</h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          EMPTY STATE
          ========================================================================= */}
      {!error && !loading && data.length === 0 && (
        <div className="text-center py-14 px-4">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-text-muted)] mx-auto mb-3">
            {emptyIcon || <Inbox className="w-5 h-5 opacity-70" />}
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">{emptyTitle}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4 max-w-sm mx-auto">
            {emptyDescription}
          </p>
          {emptyAction && <div>{emptyAction}</div>}
        </div>
      )}

      {/* =========================================================================
          VIEW 1: DESKTOP TABLE (Shown when container has sufficient breadth)
          ========================================================================= */}
      <div className="table-desktop-view">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label={ariaLabel}>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] uppercase tracking-wider select-none">
              <tr>
                {columns.map((col) => {
                  const isSorted = sortColumnId === col.id;
                  const isRight = col.align === 'right' || col.isNumeric;
                  const isCenter = col.align === 'center';

                  return (
                    <th
                      key={col.id}
                      scope="col"
                      onClick={() => col.sortable && handleSortToggle(col.id)}
                      className={`py-3 px-4 font-semibold text-[11px] ${
                        isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                      } ${col.sortable ? 'cursor-pointer hover:text-[var(--color-text)] transition-colors' : ''} ${
                        col.headerClassName || ''
                      }`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          isRight ? 'justify-end w-full' : isCenter ? 'justify-center w-full' : ''
                        }`}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="shrink-0 text-[var(--color-text-muted)]">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                Array.from({ length: loadingRowCount }).map((_, rIdx) => (
                  <tr
                    key={`desktop-skel-${rIdx}`}
                    data-testid={`desktop-skel-${rIdx}`}
                    className="animate-pulse"
                  >
                    {columns.map((col, cIdx) => (
                      <td key={`desktop-skel-cell-${cIdx}`} className="py-3.5 px-4">
                        <div
                          className={`h-4 bg-[var(--color-border)]/40 rounded ${
                            col.isNumeric || col.align === 'right' ? 'ml-auto w-16' : 'w-24'
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data.map((row, index) => {
                  const key = keyExtractor(row, index);
                  const rowActionList = actions ? actions(row) : [];

                  return (
                    <tr
                      key={key}
                      className="hover:bg-[var(--color-surface-hover)] transition-colors group"
                    >
                      {columns.map((col) => {
                        const isRight = col.align === 'right' || col.isNumeric;
                        const isCenter = col.align === 'center';

                        return (
                          <td
                            key={col.id}
                            className={`py-3.5 px-4 ${
                              col.isNumeric ? 'tabular-nums' : ''
                            } ${isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'} ${
                              col.className || ''
                            }`}
                          >
                            {col.role === 'action' && actions ? (
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {rowActionList.map((act) => {
                                  const isDanger = act.variant === 'danger';
                                  const isPrimary = act.variant === 'primary';

                                  return (
                                    <button
                                      key={act.id}
                                      type="button"
                                      onClick={() => act.onClick(row)}
                                      aria-label={
                                        act.ariaLabel
                                          ? act.ariaLabel(row)
                                          : `${act.label} for ${getIdentityText(row, index)}`
                                      }
                                      title={act.label}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        isDanger
                                          ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10'
                                          : isPrimary
                                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)]'
                                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                                      }`}
                                    >
                                      {act.icon && <span className="w-3.5 h-3.5">{act.icon}</span>}
                                      <span>{act.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              renderCellContent(col, row, index)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          VIEW 2: MOBILE COMPACT TABLE (Two visual lines per row, rank by use)
          ========================================================================= */}
      <div className="table-mobile-view">
        {/* Mobile Header Bar (Preserves Sort functionality even when headers are hidden) */}
        {sortableColumns.length > 0 && !loading && data.length > 0 && (
          <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60 flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-dim)] font-medium text-[11px] uppercase tracking-wider">
              {tableTitle || `${data.length} records`}
            </span>

            {/* Mobile Sort Control */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMobileSortOpen(!mobileSortOpen)}
                aria-expanded={mobileSortOpen}
                aria-label="Sort table rows"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-semibold text-xs hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              >
                <span>
                  Sort: {activeSortCol?.label || (typeof activeSortCol?.header === 'string' ? activeSortCol.header : 'Default')}{' '}
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {mobileSortOpen && (
                <div
                  className="absolute right-0 mt-1 z-30 min-w-[160px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sortableColumns.map((col) => {
                    const isSelected = sortColumnId === col.id;
                    const colLabel =
                      col.label || (typeof col.header === 'string' ? col.header : col.id);

                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setMobileSortOpen(false);
                          handleSortToggle(col.id);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                      >
                        <span>{colLabel}</span>
                        {isSelected && (
                          <span className="text-xs">
                            {sortDirection === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Skeleton Loading: Exact two visual lines per row */}
        {loading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {Array.from({ length: loadingRowCount }).map((_, idx) => (
              <div
                key={`mob-skel-${idx}`}
                data-testid={`mob-skel-${idx}`}
                className="p-4 space-y-2.5 animate-pulse"
              >
                {/* Line 1 Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-[var(--color-border)]/50 rounded" />
                  <div className="h-4 w-20 bg-[var(--color-border)]/50 rounded" />
                </div>
                {/* Line 2 Skeleton */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="h-3 w-40 bg-[var(--color-border)]/30 rounded" />
                  <div className="h-6 w-6 bg-[var(--color-border)]/30 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {data.map((row, index) => {
              const key = keyExtractor(row, index);
              const identityContent = mobileConfig?.renderIdentity
                ? mobileConfig.renderIdentity(row)
                : identityColumn
                ? renderCellContent(identityColumn, row, index)
                : `Record ${index + 1}`;

              const primaryValueContent = mobileConfig?.renderPrimaryValue
                ? mobileConfig.renderPrimaryValue(row)
                : primaryValueColumn
                ? renderCellContent(primaryValueColumn, row, index)
                : null;

              const stateContent = mobileConfig?.renderState
                ? mobileConfig.renderState(row)
                : stateColumn
                ? renderCellContent(stateColumn, row, index)
                : null;

              const secondaryContent = mobileConfig?.renderSecondaryDetails
                ? mobileConfig.renderSecondaryDetails(row)
                : secondaryDetailColumns.length > 0
                ? secondaryDetailColumns.map((col, cIdx) => (
                    <span key={col.id} className="inline-flex items-center">
                      {cIdx > 0 && <span className="mx-1 text-[var(--color-text-dim)]">·</span>}
                      {col.label && (
                        <span className="text-[var(--color-text-dim)] mr-1">{col.label}:</span>
                      )}
                      <span>{renderCellContent(col, row, index)}</span>
                    </span>
                  ))
                : null;

              const rowActions = actions ? actions(row) : [];
              const primaryAction = rowActions.find((a) => a.isPrimary);
              const secondaryActions = rowActions.filter((a) => !a.isPrimary);
              const isAccordionExpanded = expandedRowKeys.has(key);

              return (
                <div key={key} className="group" role="listitem">
                  <div
                    onClick={() => handleRowClick(row, key)}
                    className="w-full text-left py-3.5 px-4 flex flex-col gap-1.5 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(row, key);
                      }
                    }}
                    aria-label={`View details for ${getIdentityText(row, index)}`}
                  >
                    {/* =========================================================================
                        LINE 1: Primary Identity (LEFT) ---------- Primary Value (RIGHT)
                        ========================================================================= */}
                    <div className="flex items-baseline justify-between gap-3 min-w-0">
                      {/* Primary Identity on LEFT (single line ellipsis if long) */}
                      <div className="font-bold text-xs sm:text-sm text-[var(--color-text)] truncate flex-1 min-w-0">
                        {identityContent}
                      </div>

                      {/* Primary Value on RIGHT (tabular nums, right-aligned, NEVER truncated) */}
                      {primaryValueContent && (
                        <div className="text-xs sm:text-sm font-extrabold tabular-nums text-[var(--color-text)] text-right shrink-0">
                          {primaryValueContent}
                        </div>
                      )}
                    </div>

                    {/* =========================================================================
                        LINE 2: State + Supporting Detail (LEFT) ---- Secondary Actions (RIGHT)
                        ========================================================================= */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      {/* State indicator & Supporting detail on LEFT */}
                      <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-[var(--color-text-muted)] truncate min-w-0">
                        {stateContent && (
                          <span className="shrink-0 inline-flex items-center">
                            {stateContent}
                          </span>
                        )}
                        {stateContent && secondaryContent && (
                          <span className="text-[var(--color-text-dim)] shrink-0">·</span>
                        )}
                        {secondaryContent && (
                          <span className="truncate">{secondaryContent}</span>
                        )}
                      </div>

                      {/* Right side slot: Primary CTA or ⋮ Menu */}
                      <div
                        className="shrink-0 flex items-center gap-1 -mr-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {primaryAction && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              primaryAction.onClick(row);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
                          >
                            {primaryAction.label}
                          </button>
                        )}

                        {secondaryActions.length > 0 && (
                          <TableActionsMenu
                            row={row}
                            actions={secondaryActions}
                            identityText={getIdentityText(row, index)}
                          />
                        )}

                        {mobileConfig?.detailMode === 'accordion' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(row, key);
                            }}
                            aria-label={`${isAccordionExpanded ? 'Collapse' : 'Expand'} row details`}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                          >
                            {isAccordionExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordion inline detail expansion if enabled */}
                  {mobileConfig?.detailMode === 'accordion' && isAccordionExpanded && (
                    <div className="px-4 py-3 bg-[var(--color-bg)]/80 border-t border-[var(--color-border)] text-xs space-y-2 animate-in slide-in-from-top-2 duration-150">
                      {getDetailFieldsForRow(row, index).map((field, fIdx) => (
                        <div key={fIdx} className="flex justify-between py-1 border-b border-[var(--color-border)]/40 last:border-0">
                          <span className="text-[var(--color-text-muted)] font-medium">
                            {field.label}:
                          </span>
                          <span className="text-[var(--color-text)] font-semibold text-right">
                            {field.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE BOTTOM SHEET (Full row details reveal on tap)
          ========================================================================= */}
      {selectedRow && (
        <TableBottomSheet
          isOpen={true}
          onClose={() => setSelectedRow(null)}
          title={
            mobileConfig?.renderIdentity
              ? mobileConfig.renderIdentity(selectedRow)
              : identityColumn
              ? renderCellContent(identityColumn, selectedRow, 0)
              : 'Record Details'
          }
          subtitle={
            mobileConfig?.renderState
              ? mobileConfig.renderState(selectedRow)
              : stateColumn
              ? renderCellContent(stateColumn, selectedRow, 0)
              : undefined
          }
          primaryValue={
            mobileConfig?.renderPrimaryValue
              ? mobileConfig.renderPrimaryValue(selectedRow)
              : primaryValueColumn
              ? renderCellContent(primaryValueColumn, selectedRow, 0)
              : undefined
          }
          primaryValueLabel={
            primaryValueColumn?.label ||
            (typeof primaryValueColumn?.header === 'string'
              ? primaryValueColumn.header
              : 'Amount')
          }
          fields={getDetailFieldsForRow(selectedRow, 0)}
          actions={
            actions && (
              <div className="flex items-center gap-2 w-full justify-end">
                {actions(selectedRow).map((act) => {
                  const isDanger = act.variant === 'danger';
                  const isPrimary = act.variant === 'primary';

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedRow(null);
                        act.onClick(selectedRow);
                      }}
                      className={`min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
                        isDanger
                          ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20'
                          : isPrimary
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)]'
                          : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      {act.icon && <span className="w-3.5 h-3.5">{act.icon}</span>}
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            )
          }
        >
          {mobileConfig?.renderCustomDetails &&
            mobileConfig.renderCustomDetails(selectedRow, () => setSelectedRow(null))}
        </TableBottomSheet>
      )}
    </div>
  );
}
