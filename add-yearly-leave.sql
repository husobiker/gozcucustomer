-- Yıllık İzin (Yİ) ekle
INSERT INTO leave_types (code, name, description, is_paid, color, tenant_id) VALUES
('Yİ', 'Yıllık İzin', 'Yıllık izin hakkı', true, '#4caf50', '95ba933f-6647-4181-bf57-e50119b13050')
ON CONFLICT (code, tenant_id) DO NOTHING;

-- Kontrol et
SELECT * FROM leave_types WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' ORDER BY name;

