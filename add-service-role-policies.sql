-- Tüm tablolar için service role politikalarını ekle

-- 1. Personnel tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all personnel" ON personnel;
CREATE POLICY "Service role can access all personnel" ON personnel
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Projects tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all projects" ON projects;
CREATE POLICY "Service role can access all projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Leave_types tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all leave_types" ON leave_types;
CREATE POLICY "Service role can access all leave_types" ON leave_types
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Personnel_leaves tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all personnel_leaves" ON personnel_leaves;
CREATE POLICY "Service role can access all personnel_leaves" ON personnel_leaves
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Leave_days tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all leave_days" ON leave_days;
CREATE POLICY "Service role can access all leave_days" ON leave_days
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Joker_personnel tablosu için service role politikası
DROP POLICY IF EXISTS "Service role can access all joker_personnel" ON joker_personnel;
CREATE POLICY "Service role can access all joker_personnel" ON joker_personnel
  FOR ALL USING (auth.role() = 'service_role');

