import { getSupabaseBrowserClient } from './supabase';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
  color?: string | null;
  is_system?: boolean;
}

/**
 * Fetches verified categories from the Supabase database.
 * Returns an empty array if categories cannot be retrieved.
 * Does not emit dummy or placeholder UUIDs as valid database IDs.
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, icon, color, is_system')
      .order('name');

    if (error || !data || data.length === 0) {
      return [];
    }

    return data as Category[];
  } catch {
    return [];
  }
}
