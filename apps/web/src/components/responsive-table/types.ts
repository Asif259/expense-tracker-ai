import { ReactNode } from 'react';

export type ColumnRole = 'identity' | 'value' | 'state' | 'detail' | 'action';

export interface ResponsiveColumn<T> {
  /** Unique column identifier matching data field or purpose */
  id: string;
  /** Header label or ReactNode for desktop table */
  header: ReactNode;
  /**
   * Semantic role in the responsive information hierarchy:
   * - IDENTITY: Who or what is this row? (Priority 1)
   * - VALUE: Most important numeric/currency value (Priority 2, fixed right-aligned slot)
   * - STATE: Current status/condition (Priority 3, compact indicator near identity)
   * - DETAIL: Supporting information (Priority 4-7, Line 2 or expandable details)
   * - ACTION: Row operations (Priority 8, kebab menu or button)
   */
  role: ColumnRole;
  /** Importance rank: 1 is most important. Used to prioritize visible fields on mobile */
  priority: number;
  /** Data extractor function */
  accessor?: (row: T) => unknown;
  /** Custom cell renderer for desktop and details */
  cell?: (row: T, index: number) => ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether the field is numeric/monetary (enforces tabular-nums and right alignment) */
  isNumeric?: boolean;
  /** Column label when rendered in mobile expanded detail view */
  label?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom sort value extractor */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  /** Custom styling classes */
  className?: string;
  headerClassName?: string;
  /** If true, omit this field from mobile expanded details (e.g., duplicate action buttons) */
  hiddenInMobileDetails?: boolean;
}

export interface RowAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  /** If true, remains directly visible on mobile as a primary CTA button instead of hidden in menu */
  isPrimary?: boolean;
  /** Visual variant */
  variant?: 'default' | 'primary' | 'danger';
  /** Disabled state */
  disabled?: boolean | ((row: T) => boolean);
  /** Screen reader accessible label */
  ariaLabel?: (row: T) => string;
}

export interface MobileTableConfig<T> {
  /** Overrides default auto-detection of the identity column */
  identityColumnId?: string;
  /** Custom identity renderer for Line 1 */
  renderIdentity?: (row: T) => ReactNode;

  /** Overrides default auto-detection of the primary value column */
  primaryValueColumnId?: string;
  /** Custom primary value renderer for Line 1 (Right slot) */
  renderPrimaryValue?: (row: T) => ReactNode;

  /** Overrides default auto-detection of the status/state column */
  stateColumnId?: string;
  /** Custom status renderer for Line 2 */
  renderState?: (row: T) => ReactNode;

  /** Explicit list of detail column IDs to display on Line 2 alongside the state */
  secondaryDetailColumnIds?: string[];
  /** Custom secondary detail renderer for Line 2 */
  renderSecondaryDetails?: (row: T) => ReactNode;

  /**
   * Detail presentation mode when tapping a compact row:
   * - 'bottom-sheet': Opens a sleek modal drawer with full record details & actions (Default & Recommended)
   * - 'accordion': Inlines an expandable sub-row underneath the 2 visual lines
   * - 'none': Disables row expansion (actions still reachable via menu)
   */
  detailMode?: 'bottom-sheet' | 'accordion' | 'none';

  /** Custom renderer for expanded details */
  renderCustomDetails?: (row: T, close: () => void) => ReactNode;
}

export type TableBreakpoint = 'sm' | 'md' | 'lg' | 'xl';
export type TableViewMode = 'auto' | 'desktop' | 'mobile';

export interface ResponsiveDataTableProps<T> {
  /** Array of row data */
  data: T[];
  /** Column definitions with classification, priority, and formatters */
  columns: ResponsiveColumn<T>[];
  /** Unique key extractor for each row */
  keyExtractor: (row: T, index: number) => string;

  /** Responsive container breakpoint: sm (600px), md (760px - default), lg (900px), xl (1040px) */
  breakpoint?: TableBreakpoint;
  /** View mode: 'auto' uses CSS container queries; 'desktop' or 'mobile' force a layout */
  viewMode?: TableViewMode;

  /** Mobile presentation configuration */
  mobileConfig?: MobileTableConfig<T>;

  /** Row actions */
  actions?: (row: T) => RowAction<T>[];

  /** Active sort state */
  sortColumnId?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (columnId: string, direction: 'asc' | 'desc') => void;

  /** Loading state */
  loading?: boolean;
  loadingRowCount?: number;

  /** Empty state customization */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;

  /** Error state */
  error?: string | null;
  onRetry?: () => void;

  /** Accessibility label for the table */
  ariaLabel?: string;
  /** Extra container className */
  className?: string;
  /** Title displayed above mobile sort header if needed */
  tableTitle?: string;
}
