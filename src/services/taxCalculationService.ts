// Vergi Hesaplama Servisi
// GİB uyumlu vergi hesaplamaları

export interface TaxCalculationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  gtipCode?: string;
}

export interface TaxCalculationResult {
  items: TaxCalculationItemResult[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  taxBreakdown: TaxBreakdown[];
}

export interface TaxCalculationItemResult extends TaxCalculationItem {
  lineTotal: number;
  taxAmount: number;
  totalWithTax: number;
}

export interface TaxBreakdown {
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  itemCount: number;
}

export class TaxCalculationService {
  // Ana vergi hesaplama fonksiyonu
  static calculateTax(items: TaxCalculationItem[]): TaxCalculationResult {
    const itemResults: TaxCalculationItemResult[] = [];
    const taxBreakdownMap = new Map<number, TaxBreakdown>();

    // Her kalem için hesaplama
    items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const taxAmount = this.roundToTwoDecimals(
        (lineTotal * item.taxRate) / 100
      );
      const totalWithTax = this.roundToTwoDecimals(lineTotal + taxAmount);

      const itemResult: TaxCalculationItemResult = {
        ...item,
        lineTotal,
        taxAmount,
        totalWithTax,
      };

      itemResults.push(itemResult);

      // Vergi oranına göre gruplama
      const existingBreakdown = taxBreakdownMap.get(item.taxRate);
      if (existingBreakdown) {
        existingBreakdown.taxableAmount += lineTotal;
        existingBreakdown.taxAmount += taxAmount;
        existingBreakdown.itemCount += 1;
      } else {
        taxBreakdownMap.set(item.taxRate, {
          taxRate: item.taxRate,
          taxableAmount: lineTotal,
          taxAmount: taxAmount,
          itemCount: 1,
        });
      }
    });

    // Toplam hesaplamalar
    const subtotal = this.roundToTwoDecimals(
      itemResults.reduce((sum, item) => sum + item.lineTotal, 0)
    );
    const totalTax = this.roundToTwoDecimals(
      itemResults.reduce((sum, item) => sum + item.taxAmount, 0)
    );
    const totalAmount = this.roundToTwoDecimals(subtotal + totalTax);

    // Vergi dağılımı
    const taxBreakdown = Array.from(taxBreakdownMap.values()).map(
      (breakdown) => ({
        ...breakdown,
        taxableAmount: this.roundToTwoDecimals(breakdown.taxableAmount),
        taxAmount: this.roundToTwoDecimals(breakdown.taxAmount),
      })
    );

    return {
      items: itemResults,
      subtotal,
      totalTax,
      totalAmount,
      taxBreakdown,
    };
  }

  // KDV hesaplama (standart)
  static calculateVAT(
    amount: number,
    vatRate: number = 20
  ): {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  } {
    const netAmount = this.roundToTwoDecimals(amount);
    const vatAmount = this.roundToTwoDecimals((netAmount * vatRate) / 100);
    const grossAmount = this.roundToTwoDecimals(netAmount + vatAmount);

    return {
      netAmount,
      vatAmount,
      grossAmount,
    };
  }

  // Ters KDV hesaplama (gross'tan net'e)
  static calculateVATReverse(
    grossAmount: number,
    vatRate: number = 20
  ): {
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  } {
    const netAmount = this.roundToTwoDecimals(
      grossAmount / (1 + vatRate / 100)
    );
    const vatAmount = this.roundToTwoDecimals(grossAmount - netAmount);

    return {
      netAmount,
      vatAmount,
      grossAmount: this.roundToTwoDecimals(grossAmount),
    };
  }

  // ÖTV hesaplama
  static calculateSpecialConsumptionTax(
    amount: number,
    sctRate: number
  ): {
    netAmount: number;
    sctAmount: number;
    totalAmount: number;
  } {
    const netAmount = this.roundToTwoDecimals(amount);
    const sctAmount = this.roundToTwoDecimals((netAmount * sctRate) / 100);
    const totalAmount = this.roundToTwoDecimals(netAmount + sctAmount);

    return {
      netAmount,
      sctAmount,
      totalAmount,
    };
  }

  // Stopaj hesaplama
  static calculateWithholdingTax(
    amount: number,
    withholdingRate: number
  ): {
    grossAmount: number;
    withholdingAmount: number;
    netAmount: number;
  } {
    const grossAmount = this.roundToTwoDecimals(amount);
    const withholdingAmount = this.roundToTwoDecimals(
      (grossAmount * withholdingRate) / 100
    );
    const netAmount = this.roundToTwoDecimals(grossAmount - withholdingAmount);

    return {
      grossAmount,
      withholdingAmount,
      netAmount,
    };
  }

  // Damga vergisi hesaplama
  static calculateStampTax(amount: number): {
    grossAmount: number;
    stampTaxAmount: number;
    netAmount: number;
  } {
    const grossAmount = this.roundToTwoDecimals(amount);
    let stampTaxRate = 0;

    // Damga vergisi oranları (2024)
    if (grossAmount <= 1000) {
      stampTaxRate = 0.000948; // %0.0948
    } else if (grossAmount <= 2000) {
      stampTaxRate = 0.001896; // %0.1896
    } else if (grossAmount <= 5000) {
      stampTaxRate = 0.002844; // %0.2844
    } else if (grossAmount <= 10000) {
      stampTaxRate = 0.003792; // %0.3792
    } else if (grossAmount <= 20000) {
      stampTaxRate = 0.00474; // %0.474
    } else if (grossAmount <= 50000) {
      stampTaxRate = 0.005688; // %0.5688
    } else if (grossAmount <= 100000) {
      stampTaxRate = 0.006636; // %0.6636
    } else {
      stampTaxRate = 0.007584; // %0.7584
    }

    const stampTaxAmount = this.roundToTwoDecimals(grossAmount * stampTaxRate);
    const netAmount = this.roundToTwoDecimals(grossAmount - stampTaxAmount);

    return {
      grossAmount,
      stampTaxAmount,
      netAmount,
    };
  }

  // GİB uyumlu fatura toplamları
  static calculateInvoiceTotals(items: TaxCalculationItem[]): {
    lineExtensionAmount: number; // Kalem toplamları
    taxExclusiveAmount: number; // Vergi hariç toplam
    taxInclusiveAmount: number; // Vergi dahil toplam
    payableAmount: number; // Ödenecek tutar
    taxBreakdown: TaxBreakdown[];
  } {
    const calculation = this.calculateTax(items);

    return {
      lineExtensionAmount: calculation.subtotal,
      taxExclusiveAmount: calculation.subtotal,
      taxInclusiveAmount: calculation.totalAmount,
      payableAmount: calculation.totalAmount,
      taxBreakdown: calculation.taxBreakdown,
    };
  }

  // Vergi oranı doğrulama
  static validateTaxRate(taxRate: number): boolean {
    const validRates = [0, 1, 8, 18, 20]; // Geçerli KDV oranları
    return validRates.includes(taxRate);
  }

  // Tutar doğrulama
  static validateAmount(amount: number): boolean {
    return amount >= 0 && amount <= 999999999.99; // Maksimum 999 milyon
  }

  // Miktar doğrulama
  static validateQuantity(quantity: number): boolean {
    return quantity > 0 && quantity <= 999999.999; // Maksimum 999 bin
  }

  // GTIP kodu doğrulama
  static validateGTIPCode(gtipCode: string): boolean {
    // GTIP kodu 10 haneli olmalı
    return /^\d{10}$/.test(gtipCode);
  }

  // Vergi hesaplama doğrulama
  static validateTaxCalculation(items: TaxCalculationItem[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push("En az bir kalem olmalıdır");
      return { isValid: false, errors };
    }

    items.forEach((item, index) => {
      if (!item.description || item.description.trim() === "") {
        errors.push(`Kalem ${index + 1}: Açıklama boş olamaz`);
      }

      if (!this.validateQuantity(item.quantity)) {
        errors.push(
          `Kalem ${
            index + 1
          }: Miktar 0'dan büyük ve 999,999.999'dan küçük olmalıdır`
        );
      }

      if (!this.validateAmount(item.unitPrice)) {
        errors.push(
          `Kalem ${
            index + 1
          }: Birim fiyat 0'dan büyük ve 999,999,999.99'dan küçük olmalıdır`
        );
      }

      if (!this.validateTaxRate(item.taxRate)) {
        errors.push(
          `Kalem ${index + 1}: Geçersiz vergi oranı (0, 1, 8, 18, 20 olmalı)`
        );
      }

      if (item.gtipCode && !this.validateGTIPCode(item.gtipCode)) {
        errors.push(`Kalem ${index + 1}: GTIP kodu 10 haneli olmalıdır`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Para birimi formatla
  static formatCurrency(amount: number, currency: string = "TRY"): string {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Yüzde formatla
  static formatPercentage(rate: number): string {
    return `${rate}%`;
  }

  // Sayıyı 2 ondalık basamağa yuvarla
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // Vergi raporu oluştur
  static generateTaxReport(calculation: TaxCalculationResult): {
    summary: {
      totalItems: number;
      subtotal: number;
      totalTax: number;
      totalAmount: number;
    };
    taxBreakdown: TaxBreakdown[];
    items: TaxCalculationItemResult[];
  } {
    return {
      summary: {
        totalItems: calculation.items.length,
        subtotal: calculation.subtotal,
        totalTax: calculation.totalTax,
        totalAmount: calculation.totalAmount,
      },
      taxBreakdown: calculation.taxBreakdown,
      items: calculation.items,
    };
  }
}

export const taxCalculationService = new TaxCalculationService();


