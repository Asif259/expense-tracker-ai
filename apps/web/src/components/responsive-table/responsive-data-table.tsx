'use client';

import { useState, useMemo, ReactNode } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Inbox,
} from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/ui';
import { ResponsiveColumn, ResponsiveDataTableProps } from './types';
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
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'There are no items to show.',
  emptyAction,
  emptyIcon,
  error = null,
  onRetry,
  ariaLabel = 'Data table',
  className = '',
  tableTitle,
  footer,
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
  const activeSortLabel =
    activeSortCol?.label ||
    (typeof activeSortCol?.header === 'string' ? activeSortCol.header : 'Default');

  return (
    <>
      <div
        className={`responsive-table-container rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden ${className}`.trim()}
        data-breakpoint={breakpoint}
        data-view-mode={viewMode}
      >
        {/* =========================================================================
            ERROR STATE
            ========================================================================= */}
        {error && !loading && (
          <div className="px-4 py-2 sm:px-6">
            <ErrorState title="Couldn't load this data" description={error} onRetry={onRetry} />
          </div>
        )}

        {/* =========================================================================
            EMPTY STATE
            ========================================================================= */}
        {!error && !loading && data.length === 0 && (
          <EmptyState
            icon={emptyIcon || <Inbox aria-hidden="true" />}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
            className="px-4 py-6 sm:px-6"
          />
        )}

        {/* =========================================================================
            VIEW 1: DESKTOP TABLE (Shown when container has sufficient breadth)
            ========================================================================= */}
        <div
          className="table-desktop-view"
          style={!loading && data.length === 0 ? { display: 'none' } : undefined}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]" aria-label={ariaLabel}>
              <thead className="select-none border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
                <tr>
                  {columns.map((col) => {
                    const isSorted = sortColumnId === col.id;
                    const isRight = col.align === 'right' || col.isNumeric;
                    const isCenter = col.align === 'center';

                    return (
                      <th
                        key={col.id}
                        scope="col"
                        aria-sort={
                          isSorted
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : col.sortable
                              ? 'none'
                              : undefined
                        }
                        className={`px-4 py-2.5 text-[12px] font-medium text-[var(--color-text-muted)] ${
                          isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                        } ${col.headerClassName || ''}`}
                      >
                        {col.sortable && onSortChange ? (
                          <button
                            type="button"
                            onClick={() => handleSortToggle(col.id)}
                            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)] ${
                              isRight ? 'w-full justify-end' : isCenter ? 'w-full justify-center' : ''
                            }`}
                          >
                            <span>{col.header}</span>
                            <span className="shrink-0" aria-hidden="true">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 text-[var(--color-primary-text)]" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5 text-[var(--color-primary-text)]" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-[var(--color-text-subtle)]" />
                              )}
                            </span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              isRight ? 'w-full justify-end' : isCenter ? 'w-full justify-center' : ''
                            }`}
                          >
                            {col.header}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {loading ? (
                  Array.from({ length: loadingRowCount }).map((_, rIdx) => (
                    <tr key={`desktop-skel-${rIdx}`} data-testid={`desktop-skel-${rIdx}`}>
                      {columns.map((col, cIdx) => (
                        <td key={`desktop-skel-cell-${cIdx}`} className="px-4 py-3.5">
                          <div
                            className={`skeleton h-4 ${
                              col.isNumeric || col.align === 'right' ? 'ml-auto w-16' : 'w-24'
                            }`}
                            aria-hidden="true"
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
                        className="transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)]"
                      >
                        {columns.map((col) => {
                          const isRight = col.align === 'right' || col.isNumeric;
                          const isCenter = col.align === 'center';

                          return (
                            <td
                              key={col.id}
                              className={`px-4 py-3 align-middle ${
                                col.isNumeric ? 'tabular-nums' : ''
                              } ${isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'} ${
                                col.className || ''
                              }`}
                            >
                              {col.role === 'action' && actions ? (
                                <div className="inline-flex items-center justify-end gap-1">
                                  {rowActionList.map((act) => {
                                    const isDanger = act.variant === 'danger';

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
                                        className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-1.5 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                                          isDanger
                                            ? 'text-[var(--color-text-subtle)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)]'
                                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                                        }`}
                                      >
                                        {act.icon ? (
                                          <span className="shrink-0" aria-hidden="true">
                                            {act.icon}
                                          </span>
                                        ) : (
                                          <span>{act.label}</span>
                                        )}
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
        <div
          className="table-mobile-view"
          style={!loading && data.length === 0 ? { display: 'none' } : undefined}
        >
          {/* Mobile header bar keeps sorting reachable when table headers are hidden */}
          {(sortableColumns.length > 0 || tableTitle) && !loading && data.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2">
              <span className="text-caption truncate">
                {tableTitle ||
                  `${data.length} ${data.length === 1 ? 'record' : 'records'}`}
              </span>

              {/* Mobile sort control (only when sorting is wired up) */}
              {onSortChange && sortableColumns.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileSortOpen(!mobileSortOpen)}
                  aria-expanded={mobileSortOpen}
                  aria-label="Sort table rows"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <span>
                    Sort: {activeSortLabel}{' '}
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="inline h-3 w-3" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="inline h-3 w-3" aria-hidden="true" />
                    )}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                </button>

                {mobileSortOpen && (
                  <div className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-md)] animate-fade-in">
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
                          className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2.5 text-left text-[13px] font-medium transition-colors duration-[var(--duration-fast)] ${
                            isSelected
                              ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          <span>{colLabel}</span>
                          {isSelected && (
                            <span className="text-caption" aria-hidden="true">
                              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* Mobile skeleton loading: exact two visual lines per row */}
          {loading ? (
            <div className="divide-y divide-[var(--color-border)]">
              {Array.from({ length: loadingRowCount }).map((_, idx) => (
                <div
                  key={`mob-skel-${idx}`}
                  data-testid={`mob-skel-${idx}`}
                  className="px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="skeleton h-4 w-32" aria-hidden="true" />
                    <div className="skeleton h-4 w-20" aria-hidden="true" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="skeleton h-3 w-40" aria-hidden="true" />
                    <div className="skeleton h-4 w-8" aria-hidden="true" />
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
                          {cIdx > 0 && (
                            <span
                              className="mx-1.5 inline-block h-3 w-px bg-[var(--color-border-strong)]"
                              aria-hidden="true"
                            />
                          )}
                          {col.label && (
                            <span className="mr-1 text-[var(--color-text-subtle)]">
                              {col.label}:
                            </span>
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
                  <div key={key} role="listitem">
                    <div
                      onClick={() => handleRowClick(row, key)}
                      className="flex min-h-[56px] w-full cursor-pointer select-none flex-col justify-center gap-1 px-4 py-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-hover)]"
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
                      {/* LINE 1: primary identity (left) — primary value (right) */}
                      <div className="flex min-w-0 items-baseline justify-between gap-3">
                        <div className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-[var(--color-text)]">
                          {identityContent}
                        </div>

                        {primaryValueContent && (
                          <div className="shrink-0 text-right text-[14px] font-semibold tabular-nums leading-5 text-[var(--color-text)]">
                            {primaryValueContent}
                          </div>
                        )}
                      </div>

                      {/* LINE 2: state + supporting detail (left) — actions (right) */}
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5 truncate text-[12px] text-[var(--color-text-muted)]">
                          {stateContent && <span className="shrink-0">{stateContent}</span>}
                          {stateContent && secondaryContent && (
                            <span
                              className="inline-block h-3 w-px shrink-0 bg-[var(--color-border-strong)]"
                              aria-hidden="true"
                            />
                          )}
                          {secondaryContent && (
                            <span className="truncate">{secondaryContent}</span>
                          )}
                        </div>

                        <div
                          className="-mr-2 flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {primaryAction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                primaryAction.onClick(row);
                              }}
                              className="inline-flex min-h-[40px] items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-[12px] font-medium text-[var(--color-primary-contrast)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-primary-hover)]"
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
                              aria-expanded={isAccordionExpanded}
                              className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-text)]"
                            >
                              {isAccordionExpanded ? (
                                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accordion inline detail expansion */}
                    {mobileConfig?.detailMode === 'accordion' && isAccordionExpanded && (
                      <div className="animate-slide-down border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-4 py-3 text-[13px]">
                        {getDetailFieldsForRow(row, index).map((field, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border)] py-1.5 last:border-0"
                          >
                            <span className="text-[var(--color-text-muted)]">{field.label}</span>
                            <span className="text-right font-medium text-[var(--color-text)]">
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
            FOOTER (pagination, counts) — inside the same surface as the table
            ========================================================================= */}
        {footer && (loading || data.length > 0) && (
          <div className="border-t border-[var(--color-border)]">{footer}</div>
        )}
      </div>

      {/* =========================================================================
          MOBILE BOTTOM SHEET (Full row details reveal on tap)
          Rendered outside the bordered container so it is not clipped.
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
                : 'Record details'
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
              <div className="flex w-full items-center justify-end gap-2">
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
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] px-4 text-[13px] font-medium transition-colors duration-[var(--duration-fast)] ${
                        isDanger
                          ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]'
                          : isPrimary
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] hover:bg-[var(--color-primary-hover)]'
                            : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      {act.icon && (
                        <span className="shrink-0" aria-hidden="true">
                          {act.icon}
                        </span>
                      )}
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
    </>
  );
}
