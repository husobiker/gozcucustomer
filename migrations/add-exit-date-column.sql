-- Personnel tablosuna exit_date kolonu ekle
ALTER TABLE personnel 
ADD COLUMN IF NOT EXISTS exit_date DATE DEFAULT NULL;

-- Kolon açıklaması
COMMENT ON COLUMN personnel.exit_date IS 'Personelin işten çıkış tarihi';
