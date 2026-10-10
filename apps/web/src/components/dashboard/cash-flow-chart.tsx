'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Transaction } from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CashFlowChartProps {
  transactions: Transaction[];
  currency: string;
}

export default function CashFlowChart({ transactions, currency }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    // Group transactions by date
    const dateMap = new Map<string, { income: number; expense: number }>();
    
    // Sort transactions by date (oldest first)
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Keep only the last 7 days of transactions for simplicity
    const recentTx = sortedTx.filter(tx => tx.currency === currency || (!tx.currency && currency === 'BDT'));

    recentTx.forEach(tx => {
      const date = new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const amt = parseFloat(tx.amount) || 0;
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { income: 0, expense: 0 });
      }
      
      const current = dateMap.get(date)!;
      if (tx.type === 'income') {
        current.income += amt;
      } else {
        current.expense += amt;
      }
    });

    // If there's no data, add some placeholders or return empty
    if (dateMap.size === 0) {
      return null;
    }

    const labels = Array.from(dateMap.keys());
    const incomes = Array.from(dateMap.values()).map(d => d.income);
    const expenses = Array.from(dateMap.values()).map(d => d.expense);

    return {
      labels,
      datasets: [
        {
          label: 'Inflow',
          data: incomes,
          backgroundColor: '#6DD0A1', // DESIGN.md light primary/income
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
        {
          label: 'Outflow',
          data: expenses,
          backgroundColor: '#F5C258', // DESIGN.md light accent-amber/expense/warning
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
      ],
    };
  }, [transactions, currency]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide default legend to match custom UI
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 17, 17, 0.9)',
        titleColor: '#F4F4F4',
        bodyColor: '#F4F4F4',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6E7179', // var(--color-text-muted)
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#EDEFF3', // var(--color-border)
          borderDash: [5, 5],
          drawBorder: false,
        },
        ticks: {
          color: '#6E7179', // var(--color-text-muted)
          font: {
            family: "'Inter', sans-serif",
            size: 11,
          },
          maxTicksLimit: 5,
          callback: function(value: any) {
            if (value === 0) return '0';
            return new Intl.NumberFormat('en-US', { 
              notation: 'compact', 
              compactDisplay: 'short',
              maximumFractionDigits: 1 
            }).format(value);
          }
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
        Not enough transaction data to generate chart.
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}
