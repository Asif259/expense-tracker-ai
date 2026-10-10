'use client';

import { useMemo } from 'react';
import { Transaction } from '@/lib/api';
import { aggregateMonthlyCashFlow } from '@/lib/chart-aggregation';
import { IncomeExpenseChart } from '@/components/charts/income-expense-chart';

interface CashFlowChartProps {
  transactions: Transaction[];
  currency: string;
}

export default function CashFlowChart({ transactions, currency }: CashFlowChartProps) {
  const data = useMemo(() => {
    return aggregateMonthlyCashFlow(transactions, currency);
  }, [transactions, currency]);

  return <IncomeExpenseChart data={data} currency={currency} />;
}
