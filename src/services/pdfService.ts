// pdfService.ts
import pdfMake from "pdfmake";

// Fonts'u yükle - vfs_fonts'u require ile yükle
const pdfFonts = require("pdfmake/build/vfs_fonts");
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
} else {
  // Fallback: boş vfs objesi
  (pdfMake as any).vfs = {};
}

export type QuoteItem = {
  id: string;
  service: string;
  quantity: number | string; // Boş string'e izin ver
  unit: string; // "Adet" vs.
  unit_price: number | string; // Boş string'e izin ver
  tax?: string; // "%20" gibi
  total: number; // satır toplamı (KDV'siz) ya da KDV dahil; biz aşağıda KDV'yi ayrıca hesaplıyoruz
};

export type Quote = {
  id: string;
  name: string;
  customer: string; // Müşteri (kişi/şirket adı)
  customer_description?: string; // Alt açıklama
  preparation_date: string | Date; // teklif tarihi
  due_date?: string | Date; // geçerlilik
  currency: "TRY" | "USD";
  items: QuoteItem[];
  terms?: string; // teklif açıklaması / notlar
  created_at?: string | Date;
  updated_at?: string | Date;
  // Müşteri firma bilgileri (logoyu özellikle buradan almamız istendi)
  customer_company?: {
    logo_url?: string;
    name?: string;
    address?: string;
    tax_office?: string;
    tax_no?: string;
    phone?: string;
    email?: string;
  };
};

export type CompanyInfo = {
  // (Kendi kurum ayarlarınız — gerekirse yedek olarak kullanırız)
  logo_url?: string;
  name?: string;
  address?: string;
  tax_office?: string;
  tax_no?: string;
  phone?: string;
  email?: string;
};

export type QuotePDFData = {
  quote: Quote;
  companyInfo: CompanyInfo; // mevcut yapınızdan geliyor
  customerName: string; // ekranda gösterdiğin
  offerDate: string; // "22 Kasım 2024" gibi (gönderiyorsun)
  validityPeriod?: string; // footer notu
  preparationDate?: string; // alt bilgi cümlesi
  quoteNumber: string; // T-2025-XXXXXX
  terms?: string;
};

const TRY_PER_USD = 36.305; // isterseniz dışarıdan parametreleştirilebilir

function fmt(amount: number, currency: "TRY" | "USD") {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
}

async function urlToDataURL(url?: string): Promise<string | undefined> {
  if (!url) return;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return;
  }
}

/**
 * İSTENEN ŞABLON: Sağ üstte müşteri firmasının logosu ve kurumsal bilgileri.
 * Yanında "TEKLİF" başlığı + Teklif No; altında MÜŞTERİ ve TEKLİF TARİHİ.
 */
export const PDFService = {
  async getCompanyInfo(tenantId: string): Promise<CompanyInfo> {
    // Mevcut implementasyonunuz neyse onu koruyun; burada sadece tipin yeri.
    // Örn: return await api.get(`/tenants/${tenantId}/company-info`);
    return {} as any;
  },

  async printQuotePDF(data: QuotePDFData) {
    const {
      quote,
      companyInfo,
      customerName,
      offerDate,
      validityPeriod,
      preparationDate,
      quoteNumber,
    } = data;
    const currency = quote.currency;

    // LOGO kaynağı öncelik: müşteri firma bilgileri → yoksa companyInfo
    const logo =
      (await urlToDataURL(quote.customer_company?.logo_url)) ||
      (await urlToDataURL(companyInfo.logo_url));

    // Sağ sütunda yer alacak kurumsal metinler: müşteri firmasından al
    const firm = {
      name: quote.customer_company?.name || companyInfo.name || "",
      address: quote.customer_company?.address || companyInfo.address || "",
      tax_office:
        quote.customer_company?.tax_office || companyInfo.tax_office || "",
      tax_no: quote.customer_company?.tax_no || companyInfo.tax_no || "",
      phone: quote.customer_company?.phone || companyInfo.phone || "",
      email: quote.customer_company?.email || companyInfo.email || "",
    };

    // Hesaplamalar
    const subtotal = (quote.items || []).reduce((s, it) => {
      const qty =
        typeof it.quantity === "string"
          ? parseFloat(it.quantity) || 0
          : it.quantity;
      const price =
        typeof it.unit_price === "string"
          ? parseFloat(it.unit_price) || 0
          : it.unit_price;
      return s + qty * price;
    }, 0);
    const totalTax = (quote.items || []).reduce((s, it) => {
      const qty =
        typeof it.quantity === "string"
          ? parseFloat(it.quantity) || 0
          : it.quantity;
      const price =
        typeof it.unit_price === "string"
          ? parseFloat(it.unit_price) || 0
          : it.unit_price;
      const rate = parseFloat((it.tax || "").replace(/[^\d.]/g, "")) / 100 || 0;
      return s + qty * price * rate;
    }, 0);
    const grandTotal = subtotal + totalTax;
    const tlEquivalent =
      currency === "USD" ? grandTotal * TRY_PER_USD : undefined;

    // Ürün/Hizmet satırları
    const itemsTableBody: any[] = [
      [
        { text: "HİZMET / ÜRÜN", style: "th" },
        { text: "MİKTAR", style: "th", alignment: "right" },
        { text: "BR. FİYAT", style: "th", alignment: "right" },
        { text: "KDV", style: "th", alignment: "right" },
        { text: "TOPLAM", style: "th", alignment: "right" },
      ],
      ...(quote.items || []).map((it) => [
        { text: it.service, style: "td" },
        {
          text: `${
            typeof it.quantity === "string" ? it.quantity : it.quantity
          } ${it.unit || ""}`,
          alignment: "right",
          style: "td",
        },
        {
          text: fmt(
            typeof it.unit_price === "string"
              ? parseFloat(it.unit_price) || 0
              : it.unit_price,
            currency
          ),
          alignment: "right",
          style: "td",
        },
        { text: it.tax || "-", alignment: "right", style: "td" },
        {
          text: fmt(
            (typeof it.quantity === "string"
              ? parseFloat(it.quantity) || 0
              : it.quantity) *
              (typeof it.unit_price === "string"
                ? parseFloat(it.unit_price) || 0
                : it.unit_price),
            currency
          ),
          alignment: "right",
          style: "td",
        },
      ]),
    ];

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 48],
      defaultStyle: { fontSize: 10, lineHeight: 1.25 },
      styles: {
        h1: { fontSize: 24, bold: true },
        h2: { fontSize: 12, bold: true, color: "#444" },
        th: { bold: true, fillColor: "#f5f5f5" },
        td: {},
        small: { fontSize: 9, color: "#666" },
        totalKey: { bold: true, color: "#666" },
        totalVal: { bold: true },
      },
      content: [
        // ÜST BÖLÜM: İki kolonlu grid
        {
          columns: [
            // SOL BLOK: Başlık + müşteri + tarih
            {
              width: "*",
              stack: [
                {
                  columns: [
                    { text: "TEKLİF", style: "h1" },
                    {
                      text: `No: ${quoteNumber}`,
                      alignment: "right",
                      margin: [0, 8, 0, 0],
                    },
                  ],
                },
                {
                  text: [{ text: "MÜŞTERİ: ", bold: true }, customerName],
                  margin: [0, 6, 0, 0],
                },
                {
                  text: [{ text: "TEKLİF TARİHİ: ", bold: true }, offerDate],
                  margin: [0, 2, 0, 0],
                },
                // İstenirse geçerlilik tarihi de göster
                quote.due_date
                  ? {
                      text: [
                        { text: "GEÇERLİLİK: ", bold: true },
                        data.offerDate ? "" : "",
                      ],
                      margin: [0, 2, 0, 0],
                    }
                  : {},
              ],
            },

            // SAĞ BLOK: Logo + firma bilgileri (müşteri firmasından)
            {
              width: "45%",
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      columns: [
                        logo
                          ? { image: logo, width: 120, alignment: "left" }
                          : { text: "", width: 120 },
                      ],
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      stack: [
                        {
                          text: firm.name || "",
                          bold: true,
                          alignment: "left",
                          margin: [0, 8, 0, 0],
                        },
                        {
                          text: firm.address || "",
                          style: "small",
                          alignment: "left",
                        },
                        {
                          text: `VD: ${firm.tax_office || "-"}  •  VKN: ${
                            firm.tax_no || "-"
                          }`,
                          style: "small",
                          alignment: "left",
                        },
                        {
                          text: [
                            firm.phone ? `Tel: ${firm.phone}` : "",
                            firm.email ? ` • E-posta: ${firm.email}` : "",
                          ]
                            .filter(Boolean)
                            .join(""),
                          style: "small",
                          alignment: "left",
                        },
                      ],
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              layout: "noBorders",
            },
          ],
        },

        { text: " ", margin: [0, 10] },

        // TEKLİF AÇIKLAMASI (kurumsal bir blok)
        data.terms
          ? {
              table: {
                widths: ["*"],
                body: [[{ text: data.terms, margin: [8, 6, 8, 6] }]],
              },
              layout: {
                fillColor: () => "#fafafa",
                hLineWidth: () => 0,
                vLineWidth: () => 0,
              },
              margin: [0, 0, 0, 10],
            }
          : {},

        // HİZMET/ÜRÜN TABLOSU
        {
          table: {
            headerRows: 1,
            widths: ["*", 70, 80, 50, 90],
            body: itemsTableBody,
          },
          layout: "lightHorizontalLines",
        },

        // TOPLAM ALANI
        {
          columns: [
            { width: "*", text: "" },
            {
              width: 220,
              table: {
                body: [
                  [
                    { text: "ARA TOPLAM", style: "totalKey" },
                    {
                      text: fmt(subtotal, currency),
                      style: "totalVal",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "TOPLAM KDV", style: "totalKey" },
                    {
                      text: fmt(totalTax, currency),
                      style: "totalVal",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "GENEL TOPLAM", style: "totalKey" },
                    {
                      text: fmt(grandTotal, currency),
                      style: "totalVal",
                      alignment: "right",
                    },
                  ],
                  ...(tlEquivalent
                    ? [
                        [
                          { text: "TL KARŞILIĞI", style: "totalKey" },
                          {
                            text: fmt(tlEquivalent, "TRY"),
                            style: "totalVal",
                            alignment: "right",
                          },
                        ],
                      ]
                    : []),
                ],
              },
              layout: "noBorders",
              margin: [0, 10, 0, 0],
            },
          ],
        },

        // Footer notları
        validityPeriod
          ? { text: validityPeriod, style: "small", margin: [0, 18, 0, 0] }
          : {},
        preparationDate
          ? { text: preparationDate, style: "small", margin: [0, 2, 0, 0] }
          : {},
      ],
    };

    const fileNameSafe = `${quote.name || "Teklif"}-${quoteNumber}.pdf`.replace(
      /[^\w.\-ĞÜŞİÖÇğüşiöç ]/g,
      "_"
    );
    (pdfMake as any).createPdf(docDefinition).open();
  },
};
