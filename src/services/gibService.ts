// GİB Servis Sınıfları
// SafeBase GİB Özel Entegratör Hazırlık

import { supabase } from "../lib/supabase";

export interface GibConfig {
  tenant_id: string;
  tax_office: string;
  tax_office_code: string;
  tax_identification_number: string;
  gib_identifier: string;
  e_invoice_address: string;
  e_archive_address: string;
  e_waybill_address: string;
  e_musteri_address: string;
  certificate_serial_number: string;
  certificate_password: string;
  certificate_file_path: string;
  is_test_mode: boolean;
  gib_test_environment_url: string;
  gib_production_environment_url: string;
  gib_username: string;
  gib_password: string;
  gib_wsdl_url: string;
  gib_soap_endpoint: string;
}

export interface GibInvoice {
  id: string;
  invoice_id: string;
  gib_invoice_id?: string;
  gib_invoice_type_id: string;
  gib_status_id: string;
  ubl_tr_xml?: string;
  gib_response_xml?: string;
  e_signature?: string;
  gib_error_message?: string;
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GibInvoiceItem {
  id: string;
  gib_invoice_id: string;
  gtip_code_id?: string;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

export interface GibCustomerInfo {
  id: string;
  customer_id: string;
  tax_identification_number?: string;
  gib_identifier?: string;
  e_invoice_address?: string;
  e_archive_address?: string;
  e_waybill_address?: string;
  e_musteri_address?: string;
  is_e_invoice_enabled: boolean;
  is_e_archive_enabled: boolean;
  is_e_waybill_enabled: boolean;
  is_e_musteri_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class GibService {
  private config: GibConfig | null = null;

  // GİB konfigürasyonunu yükle
  async loadConfig(tenantId: string): Promise<GibConfig | null> {
    try {
      const { data, error } = await supabase
        .from("corporate_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .single();

      if (error) {
        console.error("GİB konfigürasyonu yüklenemedi:", error);
        return null;
      }

      this.config = data as GibConfig;
      return this.config;
    } catch (error) {
      console.error("GİB konfigürasyonu yükleme hatası:", error);
      return null;
    }
  }

  // GİB konfigürasyonunu kaydet
  async saveConfig(config: Partial<GibConfig>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("corporate_settings")
        .upsert(config);

      if (error) {
        console.error("GİB konfigürasyonu kaydedilemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB konfigürasyonu kaydetme hatası:", error);
      return false;
    }
  }

  // Müşteri GİB bilgilerini yükle
  async getCustomerGibInfo(
    customerId: string
  ): Promise<GibCustomerInfo | null> {
    try {
      const { data, error } = await supabase
        .from("gib_customer_info")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      if (error) {
        console.error("Müşteri GİB bilgileri yüklenemedi:", error);
        return null;
      }

      return data as GibCustomerInfo;
    } catch (error) {
      console.error("Müşteri GİB bilgileri yükleme hatası:", error);
      return null;
    }
  }

  // Müşteri GİB bilgilerini kaydet
  async saveCustomerGibInfo(
    customerInfo: Partial<GibCustomerInfo>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gib_customer_info")
        .upsert(customerInfo);

      if (error) {
        console.error("Müşteri GİB bilgileri kaydedilemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Müşteri GİB bilgileri kaydetme hatası:", error);
      return false;
    }
  }

  // GİB fatura oluştur
  async createGibInvoice(
    invoiceData: Partial<GibInvoice>
  ): Promise<GibInvoice | null> {
    try {
      const { data, error } = await supabase
        .from("gib_invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (error) {
        console.error("GİB fatura oluşturulamadı:", error);
        return null;
      }

      return data as GibInvoice;
    } catch (error) {
      console.error("GİB fatura oluşturma hatası:", error);
      return null;
    }
  }

  // GİB fatura güncelle
  async updateGibInvoice(
    id: string,
    updates: Partial<GibInvoice>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gib_invoices")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("GİB fatura güncellenemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB fatura güncelleme hatası:", error);
      return false;
    }
  }

  // GİB fatura durumunu güncelle
  async updateGibInvoiceStatus(
    id: string,
    statusId: string,
    additionalData?: any
  ): Promise<boolean> {
    try {
      const updates: any = {
        gib_status_id: statusId,
        updated_at: new Date().toISOString(),
      };

      if (statusId === "SENT") {
        updates.sent_at = new Date().toISOString();
      } else if (statusId === "ACCEPTED") {
        updates.accepted_at = new Date().toISOString();
      } else if (statusId === "REJECTED") {
        updates.rejected_at = new Date().toISOString();
        updates.gib_error_message = additionalData?.error_message;
      }

      const { error } = await supabase
        .from("gib_invoices")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("GİB fatura durumu güncellenemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB fatura durumu güncelleme hatası:", error);
      return false;
    }
  }

  // GİB fatura kalemleri ekle
  async addGibInvoiceItems(items: Partial<GibInvoiceItem>[]): Promise<boolean> {
    try {
      const { error } = await supabase.from("gib_invoice_items").insert(items);

      if (error) {
        console.error("GİB fatura kalemleri eklenemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB fatura kalemleri ekleme hatası:", error);
      return false;
    }
  }

  // GİB API logu kaydet
  async logGibApiCall(logData: {
    invoice_id?: string;
    api_endpoint: string;
    request_xml?: string;
    response_xml?: string;
    status_code?: number;
    error_message?: string;
    processing_time_ms?: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from("gib_api_logs").insert(logData);

      if (error) {
        console.error("GİB API logu kaydedilemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB API logu kaydetme hatası:", error);
      return false;
    }
  }

  // GİB test verilerini kaydet
  async saveTestData(testData: {
    test_type: string;
    test_name: string;
    test_data: any;
    expected_result?: string;
    actual_result?: string;
    is_passed?: boolean;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from("gib_test_data").insert(testData);

      if (error) {
        console.error("GİB test verisi kaydedilemedi:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB test verisi kaydetme hatası:", error);
      return false;
    }
  }

  // GİB fatura tiplerini getir
  async getGibInvoiceTypes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("gib_invoice_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("GİB fatura tipleri yüklenemedi:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("GİB fatura tipleri yükleme hatası:", error);
      return [];
    }
  }

  // GİB fatura durumlarını getir
  async getGibInvoiceStatuses(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("gib_invoice_statuses")
        .select("*")
        .order("name");

      if (error) {
        console.error("GİB fatura durumları yüklenemedi:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("GİB fatura durumları yükleme hatası:", error);
      return [];
    }
  }

  // GTIP kodlarını getir
  async getGtipCodes(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("gtip_codes")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) {
        console.error("GTIP kodları yüklenemedi:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("GTIP kodları yükleme hatası:", error);
      return [];
    }
  }

  // GİB entegrasyon durumunu kontrol et
  async checkGibIntegrationStatus(tenantId: string): Promise<{
    is_configured: boolean;
    missing_fields: string[];
    test_mode: boolean;
  }> {
    try {
      const config = await this.loadConfig(tenantId);

      if (!config) {
        return {
          is_configured: false,
          missing_fields: ["Konfigürasyon bulunamadı"],
          test_mode: true,
        };
      }

      const requiredFields = [
        "tax_office",
        "tax_office_code",
        "tax_identification_number",
        "gib_identifier",
        "e_invoice_address",
        "certificate_serial_number",
        "certificate_password",
      ];

      const missingFields = requiredFields.filter(
        (field) => !config[field as keyof GibConfig]
      );

      return {
        is_configured: missingFields.length === 0,
        missing_fields: missingFields,
        test_mode: config.is_test_mode || true,
      };
    } catch (error) {
      console.error("GİB entegrasyon durumu kontrol hatası:", error);
      return {
        is_configured: false,
        missing_fields: ["Kontrol hatası"],
        test_mode: true,
      };
    }
  }
}

export const gibService = new GibService();


