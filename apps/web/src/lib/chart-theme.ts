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
      canvasBg: '#0B0F17',
      cardBg: '#151D30',
      textPrimary: '#EDF2F7',
      textMuted: '#A3B1C2',
      borderColor: '#263449',
      gridColor: 'rgba(38, 52, 73, 0.55)',
      income: '#4CC79F',
      incomeBg: 'rgba(76, 199, 159, 0.22)',
      expense: '#FF7A93',
      expenseBg: 'rgba(255, 122, 147, 0.2)',
      receivable: '#7DB8F0',
      payable: '#F5C258',
      categories: [
        '#45B8A3',
        '#7DB8F0',
        '#F5C258',
        '#FF7A93',
        '#A3B1C2',
        '#C9AE8B',
        '#7FD6C4',
        '#9CC4E8',
      ],
    };
  }

  return {
    canvasBg: '#F7F9F8',
    cardBg: '#FFFFFF',
    textPrimary: '#16201D',
    textMuted: '#5A6560',
    borderColor: '#E1E7E4',
    gridColor: 'rgba(225, 231, 228, 0.9)',
    income: '#0F7A5C',
    incomeBg: 'rgba(15, 122, 92, 0.18)',
    expense: '#C81E4B',
    expenseBg: 'rgba(200, 30, 75, 0.14)',
    receivable: '#2C6BA8',
    payable: '#8A5A00',
    categories: [
      '#1F7F6E',
      '#2C6BA8',
      '#B7791F',
      '#C81E4B',
      '#626D68',
      '#A98B6B',
      '#14695B',
      '#5E8FC7',
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
