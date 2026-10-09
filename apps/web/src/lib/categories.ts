import { getSupabaseBrowserClient } from './supabase';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
  color?: string | null;
  is_system?: boolean;
}

// Fallback categories matching supabase/seed.sql
export const FALLBACK_CATEGORIES: Category[] = [
  // Income
  { id: '11111111-1111-4111-a111-000000000001', name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981' },
  { id: '11111111-1111-4111-a111-000000000002', name: 'Freelance', type: 'income', icon: 'laptop', color: '#06B6D4' },
  { id: '11111111-1111-4111-a111-000000000003', name: 'Investment', type: 'income', icon: 'trending-up', color: '#8B5CF6' },
  { id: '11111111-1111-4111-a111-000000000004', name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#6B7280' },
  // Expense
  { id: '22222222-2222-4222-a222-000000000001', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#EF4444' },
  { id: '22222222-2222-4222-a222-000000000002', name: 'Transportation', type: 'expense', icon: 'car', color: '#F59E0B' },
  { id: '22222222-2222-4222-a222-000000000003', name: 'Housing & Rent', type: 'expense', icon: 'home', color: '#3B82F6' },
  { id: '22222222-2222-4222-a222-000000000004', name: 'Utilities', type: 'expense', icon: 'zap', color: '#EAB308' },
  { id: '22222222-2222-4222-a222-000000000005', name: 'Entertainment', type: 'expense', icon: 'film', color: '#EC4899' },
  { id: '22222222-2222-4222-a222-000000000006', name: 'Healthcare', type: 'expense', icon: 'activity', color: '#14B8A6' },
  { id: '22222222-2222-4222-a222-000000000007', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#A855F7' },
  { id: '22222222-2222-4222-a222-000000000008', name: 'Education', type: 'expense', icon: 'book', color: '#6366F1' },
  { id: '22222222-2222-4222-a222-000000000009', name: 'Personal Care', type: 'expense', icon: 'smile', color: '#F97316' },
  { id: '22222222-2222-4222-a222-000000000010', name: 'Travel', type: 'expense', icon: 'plane', color: '#0EA5E9' },
  { id: '22222222-2222-4222-a222-000000000011', name: 'Miscellaneous', type: 'expense', icon: 'more-horizontal', color: '#9CA3AF' },
];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, icon, color, is_system')
      .order('name');

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }

    return data as Category[];
  } catch {
    return FALLBACK_CATEGORIES;
  }
}
