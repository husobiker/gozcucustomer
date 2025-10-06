// GİB Fatura Numaralandırma Servisi
// SafeBase GİB Özel Entegratör Hazırlık

import { supabase } from "../lib/supabase";

export interface InvoiceNumberingConfig {
  tenant_id: string;
  invoice_type: string;
  prefix: string;
  year: number;
  sequence: number;
  last_used_date: string;
}

export interface InvoiceNumber {
  full_number: string;
  prefix: string;
  year: number;
  sequence: number;
  formatted_number: string;
}

export class GibInvoiceNumberingService {
  // GİB fatura numaralandırma konfigürasyonunu yükle
  async loadNumberingConfig(
    tenantId: string,
    invoiceType: string
  ): Promise<InvoiceNumberingConfig | null> {
    try {
      const { data, error } = await supabase
        .from("gib_invoice_numbering")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("invoice_type", invoiceType)
        .single();

      if (error) {
        console.error("GİB numaralandırma konfigürasyonu yüklenemedi:", error);
        return null;
      }

      return data as InvoiceNumberingConfig;
    } catch (error) {
      console.error("GİB numaralandırma konfigürasyonu yükleme hatası:", error);
      return null;
    }
  }

  // GİB fatura numaralandırma konfigürasyonunu kaydet
  async saveNumberingConfig(
    config: Partial<InvoiceNumberingConfig>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gib_invoice_numbering")
        .upsert(config);

      if (error) {
        console.error(
          "GİB numaralandırma konfigürasyonu kaydedilemedi:",
          error
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "GİB numaralandırma konfigürasyonu kaydetme hatası:",
        error
      );
      return false;
    }
  }

  // GİB fatura numarası oluştur
  async generateInvoiceNumber(
    tenantId: string,
    invoiceType: string
  ): Promise<InvoiceNumber | null> {
    try {
      // Mevcut konfigürasyonu yükle
      let config = await this.loadNumberingConfig(tenantId, invoiceType);

      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toISOString().split("T")[0];

      // Eğer konfigürasyon yoksa veya yıl değişmişse yeni oluştur
      if (!config || config.year !== currentYear) {
        config = {
          tenant_id: tenantId,
          invoice_type: invoiceType,
          prefix: this.getPrefixForInvoiceType(invoiceType),
          year: currentYear,
          sequence: 0,
          last_used_date: currentDate,
        };
      }

      // Sıra numarasını artır
      config.sequence += 1;
      config.last_used_date = currentDate;

      // Konfigürasyonu kaydet
      await this.saveNumberingConfig(config);

      // Fatura numarasını oluştur
      const invoiceNumber = this.formatInvoiceNumber(config);

      return invoiceNumber;
    } catch (error) {
      console.error("GİB fatura numarası oluşturma hatası:", error);
      return null;
    }
  }

  // Fatura tipine göre prefix belirle
  private getPrefixForInvoiceType(invoiceType: string): string {
    const prefixes: { [key: string]: string } = {
      "E-Fatura": "EF",
      "E-Arşiv Fatura": "EA",
      "E-İrsaliye": "EI",
      "E-Müstahsil Makbuzu": "EM",
      "Ticari e-Fatura": "TF",
      "Satış Faturası": "SF",
      Proforma: "PF",
    };

    return prefixes[invoiceType] || "INV";
  }

  // Fatura numarasını formatla
  private formatInvoiceNumber(config: InvoiceNumberingConfig): InvoiceNumber {
    const sequenceStr = config.sequence.toString().padStart(6, "0");
    const fullNumber = `${config.prefix}${config.year}${sequenceStr}`;

    return {
      full_number: fullNumber,
      prefix: config.prefix,
      year: config.year,
      sequence: config.sequence,
      formatted_number: `${config.prefix}-${config.year}-${sequenceStr}`,
    };
  }

  // GİB fatura numarası doğrula
  validateInvoiceNumber(invoiceNumber: string, invoiceType: string): boolean {
    const prefix = this.getPrefixForInvoiceType(invoiceType);
    const pattern = new RegExp(`^${prefix}\\d{4}\\d{6}$`);
    return pattern.test(invoiceNumber);
  }

  // Fatura numarasından bilgi çıkar
  parseInvoiceNumber(invoiceNumber: string): {
    prefix: string;
    year: number;
    sequence: number;
    invoiceType: string;
  } | null {
    const match = invoiceNumber.match(/^([A-Z]{2})(\d{4})(\d{6})$/);
    if (!match) return null;

    const [, prefix, yearStr, sequenceStr] = match;
    const year = parseInt(yearStr);
    const sequence = parseInt(sequenceStr);

    // Prefix'ten fatura tipini bul
    const invoiceType = this.getInvoiceTypeFromPrefix(prefix);

    return {
      prefix,
      year,
      sequence,
      invoiceType,
    };
  }

  // Prefix'ten fatura tipini bul
  private getInvoiceTypeFromPrefix(prefix: string): string {
    const prefixMap: { [key: string]: string } = {
      EF: "E-Fatura",
      EA: "E-Arşiv Fatura",
      EI: "E-İrsaliye",
      EM: "E-Müstahsil Makbuzu",
      TF: "Ticari e-Fatura",
      SF: "Satış Faturası",
      PF: "Proforma",
    };

    return prefixMap[prefix] || "Bilinmeyen";
  }

  // GİB fatura numaralandırma istatistikleri
  async getNumberingStats(tenantId: string): Promise<{
    total_invoices: number;
    invoices_by_type: { [key: string]: number };
    current_year_sequence: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from("gib_invoice_numbering")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) {
        console.error("GİB numaralandırma istatistikleri yüklenemedi:", error);
        return null;
      }

      const currentYear = new Date().getFullYear();
      let totalInvoices = 0;
      const invoicesByType: { [key: string]: number } = {};
      let currentYearSequence = 0;

      data?.forEach((config: InvoiceNumberingConfig) => {
        totalInvoices += config.sequence;
        invoicesByType[config.invoice_type] = config.sequence;

        if (config.year === currentYear) {
          currentYearSequence = Math.max(currentYearSequence, config.sequence);
        }
      });

      return {
        total_invoices: totalInvoices,
        invoices_by_type: invoicesByType,
        current_year_sequence: currentYearSequence,
      };
    } catch (error) {
      console.error("GİB numaralandırma istatistikleri yükleme hatası:", error);
      return null;
    }
  }

  // GİB fatura numaralandırma sıfırla (sadece test için)
  async resetNumbering(
    tenantId: string,
    invoiceType: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gib_invoice_numbering")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("invoice_type", invoiceType);

      if (error) {
        console.error("GİB numaralandırma sıfırlanamadı:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("GİB numaralandırma sıfırlama hatası:", error);
      return false;
    }
  }
}

export const gibInvoiceNumberingService = new GibInvoiceNumberingService();


