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
  categories: string[];
}

export function getChartPalette(theme: 'light' | 'dark'): ChartPalette {
  if (theme === 'dark') {
    return {
      canvasBg: '#0B0B0B',
      cardBg: '#1C1C1F',
      textPrimary: '#F4F4F4', // Neutral financial text
      textMuted: '#9E9EA4',
      borderColor: '#2E2E32',
      gridColor: 'rgba(46, 46, 50, 0.6)',
      income: '#6DD0A1', // Mint Green
      incomeBg: 'rgba(109, 208, 161, 0.25)',
      expense: '#F5C258', // Amber
      expenseBg: 'rgba(245, 194, 88, 0.25)',
      receivable: '#6CB3F9', // Soft Blue
      payable: '#7A78E0', // Indigo/Purple
      categories: [
        '#6DD0A1', // Mint
        '#6CB3F9', // Soft Blue
        '#F5C258', // Amber
        '#7A78E0', // Indigo
        '#00D6C8', // Teal
        '#F43F5E', // Rose
        '#A970F5', // Purple
        '#9CA3AF', // Dim slate
      ],
    };
  }

  return {
    canvasBg: '#F9FBFC',
    cardBg: '#FFFFFF',
    textPrimary: '#111111', // Neutral financial text
    textMuted: '#6E7179',
    borderColor: '#EDEFF3',
    gridColor: 'rgba(237, 239, 243, 0.8)',
    income: '#6DD0A1', // Mint Green
    incomeBg: 'rgba(109, 208, 161, 0.3)',
    expense: '#F5C258', // Amber
    expenseBg: 'rgba(245, 194, 88, 0.3)',
    receivable: '#6CB3F9', // Soft Blue
    payable: '#5452CF', // Indigo
    categories: [
      '#6DD0A1', // Mint
      '#6CB3F9', // Soft Blue
      '#F5C258', // Amber
      '#5452CF', // Indigo
      '#159EAC', // Deep Teal
      '#E11D48', // Crimson
      '#7A78E0', // Violet
      '#6E7179', // Slate
    ],
  };
}

export const CHART_FONT_FAMILY = "var(--font-inter), 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
