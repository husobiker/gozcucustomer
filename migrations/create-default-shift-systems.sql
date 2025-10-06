-- Create default shift systems for tenants
-- Run this in Supabase SQL Editor

-- Bu fonksiyon tenant için varsayılan vardiya sistemlerini oluşturur (tekrarlayanları kontrol eder)
CREATE OR REPLACE FUNCTION create_default_shift_systems_for_tenant(
    tenant_id_param UUID
)
RETURNS VOID AS $$
DECLARE
    system_id_8h UUID;
    system_id_12h UUID;
    system_id_12_36 UUID;
    existing_8h BOOLEAN := FALSE;
    existing_12h BOOLEAN := FALSE;
    existing_12_36 BOOLEAN := FALSE;
BEGIN
    -- Mevcut sistemleri kontrol et
    SELECT EXISTS(
        SELECT 1 FROM shift_systems 
        WHERE tenant_id = tenant_id_param 
        AND system_name = '8 Saatlik 3''lü Vardiya Sistemi'
        AND is_active = true
    ) INTO existing_8h;
    
    SELECT EXISTS(
        SELECT 1 FROM shift_systems 
        WHERE tenant_id = tenant_id_param 
        AND system_name = '12 Saatlik 2''li Vardiya Sistemi (2+2+2)'
        AND is_active = true
    ) INTO existing_12h;
    
    SELECT EXISTS(
        SELECT 1 FROM shift_systems 
        WHERE tenant_id = tenant_id_param 
        AND system_name = '12/36 Saatlik Vardiya Sistemi'
        AND is_active = true
    ) INTO existing_12_36;
    
    -- Sadece mevcut olmayan sistemleri oluştur
    IF NOT existing_8h THEN
        SELECT create_8_hour_3_shift_system(
            tenant_id_param,
            NULL, -- project_id = NULL (tenant bazında)
            '8 Saatlik 3''lü Vardiya Sistemi'
        ) INTO system_id_8h;
        
        -- Bu sistemi varsayılan yap
        UPDATE shift_systems 
        SET is_default = true 
        WHERE id = system_id_8h;
        
        RAISE NOTICE '8 saatlik 3''lü vardiya sistemi oluşturuldu: %', system_id_8h;
    ELSE
        RAISE NOTICE '8 saatlik 3''lü vardiya sistemi zaten mevcut, atlandı';
    END IF;
    
    IF NOT existing_12h THEN
        SELECT create_12_hour_2_shift_system(
            tenant_id_param,
            NULL, -- project_id = NULL (tenant bazında)
            '12 Saatlik 2''li Vardiya Sistemi (2+2+2)'
        ) INTO system_id_12h;
        
        RAISE NOTICE '12 saatlik 2''li vardiya sistemi oluşturuldu: %', system_id_12h;
    ELSE
        RAISE NOTICE '12 saatlik 2''li vardiya sistemi zaten mevcut, atlandı';
    END IF;
    
    IF NOT existing_12_36 THEN
        SELECT create_12_36_shift_system(
            tenant_id_param,
            NULL, -- project_id = NULL (tenant bazında)
            '12/36 Saatlik Vardiya Sistemi'
        ) INTO system_id_12_36;
        
        RAISE NOTICE '12/36 saatlik vardiya sistemi oluşturuldu: %', system_id_12_36;
    ELSE
        RAISE NOTICE '12/36 saatlik vardiya sistemi zaten mevcut, atlandı';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Mevcut tenant'lar için varsayılan sistemleri oluştur
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN SELECT id FROM tenants LOOP
        -- Sadece henüz vardiya sistemi olmayan tenant'lar için oluştur
        IF NOT EXISTS (
            SELECT 1 FROM shift_systems 
            WHERE tenant_id = tenant_record.id 
            AND is_active = true
        ) THEN
            PERFORM create_default_shift_systems_for_tenant(tenant_record.id);
            RAISE NOTICE 'Tenant % için varsayılan vardiya sistemleri oluşturuldu', tenant_record.id;
        END IF;
    END LOOP;
END $$;
