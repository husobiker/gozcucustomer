    -- Joker personel için orijinal vardiya türünü saklamak için kolon ekle
    ALTER TABLE duty_assignments
    ADD COLUMN IF NOT EXISTS original_shift_type VARCHAR(20);

    -- Kolonun eklendiğini kontrol et
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'duty_assignments'
    AND column_name = 'original_shift_type';
