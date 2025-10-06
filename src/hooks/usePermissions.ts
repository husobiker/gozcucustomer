import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface Permission {
  read: boolean;
  add: boolean;
  update: boolean;
  delete: boolean;
}

interface UserPermissions {
  [key: string]: Permission;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("permissions")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user permissions:", error);
          setPermissions({});
        } else {
          // Convert old keys to new keys
          const keyMapping: { [key: string]: string } = {
            projects: "Projeler",
            users: "Sistem Kullanıcıları",
            personnel: "Personel Listesi",
            payroll: "Puantaj İşlemleri",
            dutySchedules: "Nöbet Çizelgeleri",
            auditRecords: "Denetim Kayıtları",
            projectVisits: "Proje Ziyaretleri",
            checkpoints: "Kontrol Noktaları",
            patrols: "Devriye Çizelgeleri",
            incidents: "Olay Kayıtları",
            forms: "Formlar",
            formTemplates: "Form Şablonları",
            scoreSettings: "Puan Ayarları",
            reports: "Raporlar",
            settings: "Ayarlar",
            dashboard: "Ana Sayfa",
            // Yeni modüller
            "Görev Sonlandırma": "Görev Sonlandırma",
            "Görev Ekle": "Görev Ekle",
            "Vardiya Formu": "Vardiya Formu",
            "Mail Gönder": "Mail Gönder",
            "Vardiya Planla": "Vardiya Planla",
            "Personel Sertifika Bitiş Bildirimi":
              "Personel Sertifika Bitiş Bildirimi",
            "Proje Sözleşme Bitiş Bildirimi": "Proje Sözleşme Bitiş Bildirimi",
            "Proje Koruma Planı Bildirimi": "Proje Koruma Planı Bildirimi",
            "Proje ve personellerin denetimi":
              "Proje ve personellerin denetimi",
            "Günlük Rapor": "Günlük Rapor",
            "Toplu Mail Gönderimi": "Toplu Mail Gönderimi",
            "Doküman yönetimi": "Doküman yönetimi",
            "Maaş Hakediş Raporu": "Maaş Hakediş Raporu",
            "Eksik Çalışma Gün Raporu": "Eksik Çalışma Gün Raporu",
            "Hafta Tatili Raporu": "Hafta Tatili Raporu",
            "AGİ Raporu": "AGİ Raporu",
            Maaş: "Maaş",
            "Görevi Olmayanlar": "Görevi Olmayanlar",
            "Kıyafet Sipariş Raporu": "Kıyafet Sipariş Raporu",
            "Ek Görev Yapanlar": "Ek Görev Yapanlar",
            Demografi: "Demografi",
            "Maliyet Analizi": "Maliyet Analizi",
            "Personel Filtre (BES)": "Personel Filtre (BES)",
            "Form Rapor": "Form Rapor",
            "Kan Grubu": "Kan Grubu",
            "Personel Kimlik": "Personel Kimlik",
            "Personel BES Kesinti": "Personel BES Kesinti",
            "Devriye Raporu": "Devriye Raporu",
            "Kıyafet Teslimat": "Kıyafet Teslimat",
            "Proje İletişim Bilgileri": "Proje İletişim Bilgileri",
            "Personel Listesi": "Personel Listesi",
            "Vardiya Raporu": "Vardiya Raporu",
            "Form Aylık Rapor": "Form Aylık Rapor",
            "Yapılmayan Kontroller": "Yapılmayan Kontroller",
            "Personel Geçiş Takip Sistemi": "Personel Geçiş Takip Sistemi",
            "Proje Segment Raporu": "Proje Segment Raporu",
            "Kıyafet Depo Stok Raporu": "Kıyafet Depo Stok Raporu",
            "İşe Giriş/Çıkış Raporu": "İşe Giriş/Çıkış Raporu",
            "Konsolide Rapor": "Konsolide Rapor",
            "Personel İletişim Bilgileri": "Personel İletişim Bilgileri",
            "Demirbaş Malzeme Raporu": "Demirbaş Malzeme Raporu",
            "Devriye Tanımlı Projeler": "Devriye Tanımlı Projeler",
            "5188 Kimlik Raporu": "5188 Kimlik Raporu",
            "Resmi Tatil Çalışma Raporu": "Resmi Tatil Çalışma Raporu",
            "Planlanan / Gerçekleşen Gün Raporu":
              "Planlanan / Gerçekleşen Gün Raporu",
            "Personel Kart Bilgileri": "Personel Kart Bilgileri",
            "Personel Banka Hesap Bilgileri": "Personel Banka Hesap Bilgileri",
            "Personel Özlük Hakları Raporu": "Personel Özlük Hakları Raporu",
            "Detaylı Devriye Raporu": "Detaylı Devriye Raporu",
            "Yıllık İzin Raporu": "Yıllık İzin Raporu",
            "Proje Sözleşme Raporu": "Proje Sözleşme Raporu",
            "GSM Hat Raporu": "GSM Hat Raporu",
            "Personel Eksik Veri Takibi": "Personel Eksik Veri Takibi",
            "Personel Eğitim Katılım Raporu": "Personel Eğitim Katılım Raporu",
            "Yetkili Portal": "Yetkili Portal",
            "Personel Portal": "Personel Portal",
            Genel: "Genel",
            "Vardiya Tipleri": "Vardiya Tipleri",
            Ceza: "Ceza",
            "Kıyafet Türleri": "Kıyafet Türleri",
            "Kıyafet Depo": "Kıyafet Depo",
            Rol: "Rol",
            "Bildirim Tipleri": "Bildirim Tipleri",
            "Doküman Türleri": "Doküman Türleri",
            "Maaş Parametreleri": "Maaş Parametreleri",
            "Şablon Yönetimi": "Şablon Yönetimi",
            "Yetkili Bilgileri": "Yetkili Bilgileri",
            Duyuru: "Duyuru",
            "İşlem Kayıtları": "İşlem Kayıtları",
            Unvan: "Unvan",
            Firma: "Firma",
            Eğitimler: "Eğitimler",
            Depolar: "Depolar",
            "Resmi Tatiller": "Resmi Tatiller",
            "Demirbaş Depo Yönetimi": "Demirbaş Depo Yönetimi",
            "Demirbaş Türleri": "Demirbaş Türleri",
            "Gelir/Gider Tipleri": "Gelir/Gider Tipleri",
            Proje: "Proje",
            Personel: "Personel",
            "Rehberlik ve kullanım desteği": "Rehberlik ve kullanım desteği",
            "Demirbaş yönetimi": "Demirbaş yönetimi",
            "Personel izinleri": "Personel izinleri",
            "Olay kayıtları": "Olay kayıtları",
            "Potansiyel müşteri ve satış takibi":
              "Potansiyel müşteri ve satış takibi",
            "Gelir-gider ve karlılık takibi": "Gelir-gider ve karlılık takibi",
            "Türler ve beden yönetimi": "Türler ve beden yönetimi",
            "Risk raporları": "Risk raporları",
            "İşe alım süreci yönetimi": "İşe alım süreci yönetimi",
            "Operasyon formları": "Operasyon formları",
            "Personel eğitim süreçleri": "Personel eğitim süreçleri",
            "Aile Bilgisi": "Aile Bilgisi",
            "Hesap Bilgisi": "Hesap Bilgisi",
            "Özlük Hakları": "Özlük Hakları",
            "Kıyafet (ölçüler)": "Kıyafet (ölçüler)",
            "İletişim Bilgileri": "İletişim Bilgileri",
            "İş Deneyimleri": "İş Deneyimleri",
            Sertifika: "Sertifika",
            İzin: "İzin",
            Form: "Form",
            Dokümanlar: "Dokümanlar",
            "Zaman Tüneli": "Zaman Tüneli",
            "İşten Çıkış İşlemleri": "İşten Çıkış İşlemleri",
            "Görevlendirme Formu": "Görevlendirme Formu",
            "Emniyet Bildirim Bilgileri": "Emniyet Bildirim Bilgileri",
            "Kıyafet Teslim": "Kıyafet Teslim",
            "Olay Raporu": "Olay Raporu",
            "Kart Bilgisi": "Kart Bilgisi",
            Eğitim: "Eğitim",
            Vardiya: "Vardiya",
            "RLS Test": "RLS Test",
          };

          const convertedPermissions: UserPermissions = {};
          if (data.permissions) {
            Object.entries(data.permissions).forEach(([oldKey, value]) => {
              const newKey = keyMapping[oldKey] || oldKey;
              convertedPermissions[newKey] = value as Permission;
            });
          }

          setPermissions(convertedPermissions);
        }
      } catch (err) {
        console.error("Error in fetchUserPermissions:", err);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [user]);

  const hasPermission = (
    module: string,
    action: "read" | "add" | "update" | "delete"
  ): boolean => {
    if (!permissions[module]) return false;
    return permissions[module][action] || false;
  };

  const canRead = (module: string): boolean => hasPermission(module, "read");
  const canAdd = (module: string): boolean => hasPermission(module, "add");
  const canUpdate = (module: string): boolean =>
    hasPermission(module, "update");
  const canDelete = (module: string): boolean =>
    hasPermission(module, "delete");

  return {
    permissions,
    loading,
    hasPermission,
    canRead,
    canAdd,
    canUpdate,
    canDelete,
  };
};
