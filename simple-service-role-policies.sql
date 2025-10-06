-- Basit service role politikaları (sadece joker_personnel için)

-- Mevcut politikaları sil
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON joker_personnel;
DROP POLICY IF EXISTS "Super admin can manage all joker_personnel" ON joker_personnel;

-- Service role için basit politika
CREATE POLICY "Service role can access all joker_personnel" ON joker_personnel
  FOR ALL USING (auth.role() = 'service_role');

