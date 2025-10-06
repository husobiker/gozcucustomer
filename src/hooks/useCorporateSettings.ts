import { useState, useEffect } from "react";
import { supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";

export interface CorporateSettings {
  id?: string;
  tenant_id: string;
  software_name: string;
  software_version: string;
  logo_url: string;
  logo_alt_text: string;
  favicon_url: string;
  company_name: string;
  company_full_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  tax_number: string;
  tax_office: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  footer_text: string;
  footer_links: any[];
  timezone: string;
  date_format: string;
  time_format: string;
  currency: string;
  language: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  // GİB Alanları
  tax_office_code?: string;
  tax_identification_number?: string;
  gib_identifier?: string;
  e_invoice_address?: string;
  e_archive_address?: string;
  e_waybill_address?: string;
  e_musteri_address?: string;
  certificate_serial_number?: string;
  certificate_password?: string;
  certificate_file_path?: string;
  is_gib_test_mode?: boolean;
  gib_test_environment_url?: string;
  gib_production_environment_url?: string;
  gib_username?: string;
  gib_password?: string;
  gib_wsdl_url?: string;
  gib_soap_endpoint?: string;
}

export const useCorporateSettings = () => {
  const { tenant } = useTenant();
  const [settings, setSettings] = useState<CorporateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!tenant) {
      console.log("No tenant found in loadSettings");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Loading corporate settings for tenant:", tenant.id);

      const { data, error } = await supabaseAdmin
        .from("corporate_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading corporate settings:", error);
        throw error;
      }

      if (data) {
        console.log("Corporate settings loaded:", data);
        console.log("Logo URL from database:", data.logo_url);
        console.log("Logo URL type:", typeof data.logo_url);
        console.log("Logo URL null check:", data.logo_url === null);
        console.log("Logo URL undefined check:", data.logo_url === undefined);
        setSettings(data);
      } else {
        // Varsayılan ayarları kullan
        setSettings({
          tenant_id: tenant.id,
          software_name: "Gözcü360°",
          software_version: "1.0.0",
          logo_url: "",
          logo_alt_text: "Gözcü360° Logo",
          favicon_url: "",
          company_name: "",
          company_full_name: "",
          company_address: "",
          company_phone: "",
          company_email: "",
          company_website: "",
          tax_number: "",
          tax_office: "",
          primary_color: "#1976d2",
          secondary_color: "#42a5f5",
          accent_color: "#ff9800",
          footer_text: "© 2024 Gözcü360°. Tüm hakları saklıdır.",
          footer_links: [],
          timezone: "Europe/Istanbul",
          date_format: "DD/MM/YYYY",
          time_format: "24",
          currency: "TRY",
          language: "tr",
          meta_title: "Gözcü360° - Tesis Yönetim Sistemi",
          meta_description:
            "Gözcü360° ile tesis yönetiminizi dijitalleştirin. Güvenlik, nöbet çizelgeleri ve daha fazlası.",
          meta_keywords:
            "tesis yönetimi, güvenlik, nöbet çizelgesi, dijital yönetim",
        });
      }
    } catch (err) {
      console.error("Error loading corporate settings:", err);
      setError("Ayarlar yüklenirken hata oluştu: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [tenant]);

  return {
    settings,
    loading,
    error,
    refetch: loadSettings,
  };
};
