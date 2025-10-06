// UBL-TR XML Şablon Servisi
// GİB UBL-TR formatında XML oluşturma

export interface UBLInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  invoiceType: string;
  sender: {
    name: string;
    taxNumber: string;
    address: string;
    city: string;
    country: string;
  };
  receiver: {
    name: string;
    taxNumber: string;
    address: string;
    city: string;
    country: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
    gtipCode?: string;
  }[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
}

export class UBLTemplateService {
  // E-Fatura XML oluştur
  static generateEInvoiceXML(data: UBLInvoiceData): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
         xmlns:ubltr="urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  <!-- Fatura Bilgileri -->
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${this.generateUUID()}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${new Date().toISOString().substr(11, 8)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${data.items.length}</cbc:LineCountNumeric>
  
  <!-- Gönderen Bilgileri -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.sender.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.sender.address}</cbc:StreetName>
        <cbc:CityName>${data.sender.city}</cbc:CityName>
        <cbc:CountrySubentity>${data.sender.city}</cbc:CountrySubentity>
        <cac:Country>
          <cbc:Name>${data.sender.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>+90 212 000 00 00</cbc:Telephone>
        <cbc:ElectronicMail>info@safebase.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Alıcı Bilgileri -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.receiver.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.receiver.address}</cbc:StreetName>
        <cbc:CityName>${data.receiver.city}</cbc:CityName>
        <cbc:CountrySubentity>${data.receiver.city}</cbc:CountrySubentity>
        <cac:Country>
          <cbc:Name>${data.receiver.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Fatura Kalemleri -->
  ${data.items
    .map(
      (item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${item.totalPrice.toFixed(
      2
    )}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.description}</cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${index + 1}</cbc:ID>
      </cac:SellersItemIdentification>
      ${
        item.gtipCode
          ? `<cac:CommodityClassification>
        <cbc:ItemClassificationCode>${item.gtipCode}</cbc:ItemClassificationCode>
      </cac:CommodityClassification>`
          : ""
      }
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${item.unitPrice.toFixed(
        2
      )}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="TRY">${item.taxAmount.toFixed(
        2
      )}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="TRY">${item.totalPrice.toFixed(
          2
        )}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="TRY">${item.taxAmount.toFixed(
          2
        )}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>`
    )
    .join("")}
  
  <!-- Toplam Bilgileri -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${data.totalTax.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">${data.subtotal.toFixed(
        2
      )}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">${data.totalTax.toFixed(
        2
      )}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${data.subtotal.toFixed(
      2
    )}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${data.subtotal.toFixed(
      2
    )}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${data.totalAmount.toFixed(
      2
    )}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${data.totalAmount.toFixed(
      2
    )}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
</Invoice>`;

    return this.formatXML(xml);
  }

  // E-Arşiv Fatura XML oluştur
  static generateEArchiveXML(data: UBLInvoiceData): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ubltr="urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents-2">
  
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${this.generateUUID()}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${new Date().toISOString().substr(11, 8)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>EARSIVFATURA</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  
  <!-- E-Arşiv özel alanları -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>EARSIVFATURA</cbc:ID>
    <cbc:DocumentType>E-Arşiv Fatura</cbc:DocumentType>
  </cac:AdditionalDocumentReference>
  
  <!-- Gönderen Bilgileri -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.sender.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.sender.address}</cbc:StreetName>
        <cbc:CityName>${data.sender.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.sender.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Vergi Dairesi</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Alıcı Bilgileri -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.receiver.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.receiver.address}</cbc:StreetName>
        <cbc:CityName>${data.receiver.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.receiver.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Fatura Kalemleri -->
  ${data.items
    .map(
      (item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${item.totalPrice.toFixed(
      2
    )}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.description}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${item.unitPrice.toFixed(
        2
      )}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`
    )
    .join("")}
  
  <!-- Toplam Bilgileri -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${data.subtotal.toFixed(
      2
    )}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${data.subtotal.toFixed(
      2
    )}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${data.totalAmount.toFixed(
      2
    )}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${data.totalAmount.toFixed(
      2
    )}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
</Invoice>`;

    return this.formatXML(xml);
  }

  // E-İrsaliye XML oluştur
  static generateEWaybillXML(data: UBLInvoiceData): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2" 
                xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${this.generateUUID()}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${new Date().toISOString().substr(11, 8)}</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode>SEVK</cbc:DespatchAdviceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  
  <!-- Gönderen Bilgileri -->
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.sender.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.sender.address}</cbc:StreetName>
        <cbc:CityName>${data.sender.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.sender.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:DespatchSupplierParty>
  
  <!-- Alıcı Bilgileri -->
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.receiver.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.receiver.address}</cbc:StreetName>
        <cbc:CityName>${data.receiver.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.receiver.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:DeliveryCustomerParty>
  
  <!-- İrsaliye Kalemleri -->
  ${data.items
    .map(
      (item, index) => `
  <cac:DespatchLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:DeliveredQuantity unitCode="C62">${
      item.quantity
    }</cbc:DeliveredQuantity>
    <cac:Item>
      <cbc:Description>${item.description}</cbc:Description>
    </cac:Item>
  </cac:DespatchLine>`
    )
    .join("")}
  
</DespatchAdvice>`;

    return this.formatXML(xml);
  }

  // E-Müstahsil Makbuzu XML oluştur
  static generateEMusteriXML(data: UBLInvoiceData): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ReceiptAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:ReceiptAdvice-2" 
               xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
               xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${this.generateUUID()}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${new Date().toISOString().substr(11, 8)}</cbc:IssueTime>
  <cbc:ReceiptAdviceTypeCode>MUSTAHIL</cbc:ReceiptAdviceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  
  <!-- Gönderen Bilgileri -->
  <cac:SupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.sender.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.sender.address}</cbc:StreetName>
        <cbc:CityName>${data.sender.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.sender.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:SupplierParty>
  
  <!-- Alıcı Bilgileri -->
  <cac:CustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.receiver.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.receiver.address}</cbc:StreetName>
        <cbc:CityName>${data.receiver.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${data.receiver.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:CustomerParty>
  
  <!-- Makbuz Kalemleri -->
  ${data.items
    .map(
      (item, index) => `
  <cac:ReceiptLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:ReceivedQuantity unitCode="C62">${item.quantity}</cbc:ReceivedQuantity>
    <cac:Item>
      <cbc:Description>${item.description}</cbc:Description>
    </cac:Item>
  </cac:ReceiptLine>`
    )
    .join("")}
  
</ReceiptAdvice>`;

    return this.formatXML(xml);
  }

  // UUID oluştur
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // XML'i formatla
  private static formatXML(xml: string): string {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }

  // XML doğrulama
  static validateXML(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, "text/xml");

      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        errors.push("XML formatı geçersiz");
      }

      // Temel alanları kontrol et
      if (!xml.includes("<cbc:ID>")) {
        errors.push("Fatura numarası eksik");
      }

      if (!xml.includes("<cbc:IssueDate>")) {
        errors.push("Fatura tarihi eksik");
      }

      if (!xml.includes("<cac:AccountingSupplierParty>")) {
        errors.push("Gönderen bilgileri eksik");
      }

      if (!xml.includes("<cac:AccountingCustomerParty>")) {
        errors.push("Alıcı bilgileri eksik");
      }
    } catch (error) {
      errors.push("XML parse hatası: " + error);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}


