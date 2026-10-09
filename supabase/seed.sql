-- seed.sql
-- Default system categories (is_system = true, user_id = NULL)

INSERT INTO public.categories (name, type, icon, color, is_system, user_id)
VALUES
  -- Income categories
  ('Salary', 'income', 'briefcase', '#10B981', true, NULL),
  ('Freelance', 'income', 'laptop', '#06B6D4', true, NULL),
  ('Investment', 'income', 'trending-up', '#8B5CF6', true, NULL),
  ('Other Income', 'income', 'plus-circle', '#6B7280', true, NULL),

  -- Expense categories
  ('Food & Dining', 'expense', 'utensils', '#EF4444', true, NULL),
  ('Transportation', 'expense', 'car', '#F59E0B', true, NULL),
  ('Housing & Rent', 'expense', 'home', '#3B82F6', true, NULL),
  ('Utilities', 'expense', 'zap', '#EAB308', true, NULL),
  ('Entertainment', 'expense', 'film', '#EC4899', true, NULL),
  ('Healthcare', 'expense', 'activity', '#14B8A6', true, NULL),
  ('Shopping', 'expense', 'shopping-bag', '#A855F7', true, NULL),
  ('Education', 'expense', 'book', '#6366F1', true, NULL),
  ('Personal Care', 'expense', 'smile', '#F97316', true, NULL),
  ('Travel', 'expense', 'plane', '#0EA5E9', true, NULL),
  ('Miscellaneous', 'expense', 'more-horizontal', '#9CA3AF', true, NULL)
ON CONFLICT (name, type) WHERE is_system = true DO NOTHING;
