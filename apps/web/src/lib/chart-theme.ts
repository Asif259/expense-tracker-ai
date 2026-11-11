import { formatMoney } from './format';

export interface ChartPalette {
  canvasBg: string;
  cardBg: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  gridColor: string;
  income: string;
  incomeBg: string;
  expense: string;
  expenseBg: string;
  receivable: string;
  payable: string;
  primary: string;
  amber: string;
  categories: string[];
}

export function getChartPalette(theme: 'light' | 'dark'): ChartPalette {
  if (theme === 'dark') {
    return {
      canvasBg: '#090F1C',
      cardBg: '#0F172A',
      textPrimary: '#F8FAFC',
      textMuted: '#94A3B8',
      borderColor: '#1E293B',
      gridColor: 'rgba(30, 41, 59, 0.6)',
      income: '#34D399',
      incomeBg: 'rgba(52, 211, 153, 0.2)',
      expense: '#FB7185',
      expenseBg: 'rgba(251, 113, 133, 0.18)',
      receivable: '#60A5FA',
      payable: '#FBBF24',
      primary: '#38BDF8',
      amber: '#FBBF24',
      categories: [
        '#38BDF8',
        '#60A5FA',
        '#FBBF24',
        '#7DD3FC',
        '#3B82F6',
        '#34D399',
        '#FB7185',
        '#94A3B8',
      ],
    };
  }

  return {
    canvasBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    borderColor: '#E2E8F0',
    gridColor: 'rgba(226, 232, 240, 0.9)',
    income: '#059669',
    incomeBg: 'rgba(5, 150, 105, 0.18)',
    expense: '#E11D48',
    expenseBg: 'rgba(225, 29, 72, 0.14)',
    receivable: '#3B82F6',
    payable: '#F59E0B',
    primary: '#1E3A5F',
    amber: '#F59E0B',
    categories: [
      '#1E3A5F',
      '#3B82F6',
      '#F59E0B',
      '#93C5FD',
      '#2B75B6',
      '#059669',
      '#E11D48',
      '#64748B',
    ],
  };
}

export const CHART_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Bengali", sans-serif';

export function getBaseChartOptions(
  theme: 'light' | 'dark',
  currency: string = 'BDT',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customOptions: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const palette = getChartPalette(theme);

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        right: 12,
        bottom: 8,
        left: 8,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: palette.textMuted,
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          useBorderRadius: true,
          font: {
            family: CHART_FONT_FAMILY,
            size: 11,
            weight: 500,
          },
          padding: 12,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: palette.cardBg,
        titleColor: palette.textPrimary,
        bodyColor: palette.textPrimary, // Strict neutral text styling
        borderColor: palette.borderColor,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: {
          family: CHART_FONT_FAMILY,
          size: 12,
          weight: 600,
        },
        bodyFont: {
          family: CHART_FONT_FAMILY,
          size: 12,
          weight: 600,
        },
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            const label = context.dataset?.label || '';
            const val = context.parsed?.y !== undefined ? context.parsed.y : context.parsed;
            if (val === null || val === undefined || isNaN(Number(val))) return ` ${label}: —`;
            return ` ${label ? `${label}: ` : ''}${formatMoney(Number(val), currency)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: palette.textMuted,
          font: {
            family: CHART_FONT_FAMILY,
            size: 11,
            weight: 500,
          },
          maxRotation: 0,
        },
        border: {
          color: palette.borderColor,
        },
      },
      y: {
        grid: {
          color: palette.gridColor,
          drawTicks: false,
        },
        ticks: {
          color: palette.textMuted,
          font: {
            family: CHART_FONT_FAMILY,
            size: 10,
            weight: 500,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (value: any) => {
            const num = Number(value);
            if (Math.abs(num) >= 1000000) {
              return `${(num / 1000000).toFixed(1)}M`;
            }
            if (Math.abs(num) >= 1000) {
              return `${(num / 1000).toFixed(0)}k`;
            }
            return num.toLocaleString();
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return {
    ...baseOptions,
    ...customOptions,
    plugins: {
      ...baseOptions.plugins,
      ...(customOptions.plugins || {}),
    },
    scales: {
      ...baseOptions.scales,
      ...(customOptions.scales || {}),
    },
  };
}
