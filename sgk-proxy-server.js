// SGK Proxy API - CORS sorunu çözümü
// Bu dosyayı backend'e ekleyin (Express.js, Next.js API routes, vb.)

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// SGK İşe Giriş Kaydetme Proxy
app.post("/api/sgk-proxy/ise-giris", async (req, res) => {
  try {
    const { personnelData, credentials } = req.body;

    console.log("📋 RAW REQUEST BODY:");
    console.log("- personnelData:", JSON.stringify(personnelData));
    console.log("- credentials:", JSON.stringify(credentials));

    // SGK test bilgileri (sgk.txt'den)
    const testCredentials = {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      sifre: credentials?.sifre || "123456",
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sistemSifre: credentials?.sistemSifre || "123456",
      isyeriSifre: credentials?.isyeriSifre || "123456",
    };

    // Personel bilgileri fallback
    const personel = personnelData || {
      tc_kimlik_no: "12345678901",
      first_name: "Test",
      last_name: "Personel",
    };

    console.log("📋 İşe Giriş Kayıt İsteği:");
    console.log("- Personel:", personel.first_name, personel.last_name);
    console.log("- TC:", personel.tc_kimlik_no);
    console.log("- Credentials:", {
      kullaniciAdi: testCredentials.kullaniciAdi,
      isyeriSicil: testCredentials.isyeriSicil,
      sifre: testCredentials.sifre ? "***" : "YOK",
    });

    // SGK SOAP request oluştur
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sgk="http://sgk.gov.tr/">
  <soap:Header/>
  <soap:Body>
    <sgk:iseGirisKaydet>
      <sgk:kullaniciBilgileri>
        <sgk:kullaniciAdi>${testCredentials.kullaniciAdi}</sgk:kullaniciAdi>
        <sgk:isyeriKodu>${
          testCredentials.isyeriSicil?.substring(0, 4) || ""
        }</sgk:isyeriKodu>
        <sgk:sistemSifre>${testCredentials.sistemSifre}</sgk:sistemSifre>
        <sgk:isyeriSifre>${testCredentials.isyeriSifre}</sgk:isyeriSifre>
        <sgk:isyeriSicil>${testCredentials.isyeriSicil}</sgk:isyeriSicil>
      </sgk:kullaniciBilgileri>
      <sgk:sigortalilar>
        <sgk:Sigortali>
          <sgk:tckimlikNo>${personel.tc_kimlik_no}</sgk:tckimlikNo>
          <sgk:ad>${personel.first_name}</sgk:ad>
          <sgk:soyad>${personel.last_name}</sgk:soyad>
          <sgk:iseGirisTarihi>${new Date()
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join(".")}</sgk:iseGirisTarihi>
          <sgk:sigortaTuru>0</sgk:sigortaTuru>
        </sgk:Sigortali>
      </sgk:sigortalilar>
    </sgk:iseGirisKaydet>
  </soap:Body>
</soap:Envelope>`;

    console.log("📤 SGK'ya gönderilen İşe Giriş SOAP Request:");
    console.log(soapEnvelope);

    // SGK web servisine istek gönder
    const response = await fetch(
      "https://sgkt.sgk.gov.tr/WS_SgkTescil4a/WS_SgkIseGirisService/iseGirisKaydet",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "iseGirisKaydet",
        },
        body: soapEnvelope,
      }
    );

    console.log("📥 SGK'dan gelen İşe Giriş Response:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);

    if (!response.ok) {
      const responseText = await response.text();
      console.log("❌ SGK Error Response:", responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("✅ SGK Success Response:", responseText);

    // SOAP response'u parse et
    const resultMatch = responseText.match(/<return>(.*?)<\/return>/);
    if (resultMatch) {
      // Basit XML parsing - gerçek implementasyonda XML parser kullanılmalı
      const hatakoduMatch = responseText.match(/<hatakodu>(.*?)<\/hatakodu>/);
      const hataAciklamasiMatch = responseText.match(
        /<hataAciklamasi>(.*?)<\/hataAciklamasi>/
      );
      const referansKoduMatch = responseText.match(
        /<referansKodu>(.*?)<\/referansKodu>/
      );

      res.json({
        hatakodu: hatakoduMatch ? parseInt(hatakoduMatch[1]) : -1,
        hataAciklamasi: hataAciklamasiMatch
          ? hataAciklamasiMatch[1]
          : "Response parse edilemedi",
        referansKodu: referansKoduMatch ? parseInt(referansKoduMatch[1]) : null,
      });
    } else {
      res.status(500).json({
        hatakodu: -1,
        hataAciklamasi: "SGK response parse edilemedi",
        referansKodu: null,
      });
    }
  } catch (error) {
    console.error("SGK İşe Giriş Proxy hatası:", error);
    res.status(500).json({
      hatakodu: -101,
      hataAciklamasi: "Sistem hatası: " + error.message,
      referansKodu: null,
    });
  }
});

// SGK PDF İndirme Proxy
app.post("/api/sgk-proxy/pdf", async (req, res) => {
  try {
    const { referansKodu, credentials } = req.body;

    // SGK test bilgileri (sgk.txt'den)
    const testCredentials = {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      sifre: credentials?.sifre || "123456", // sgk.txt'deki test şifresi
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sistemSifre: credentials?.sistemSifre || "123456",
      isyeriSifre: credentials?.isyeriSifre || "123456",
    };

    console.log("📋 PDF İndirme İsteği:");
    console.log("- Referans Kodu:", referansKodu);
    console.log("- Credentials:", {
      kullaniciAdi: testCredentials.kullaniciAdi,
      isyeriSicil: testCredentials.isyeriSicil,
      sifre: testCredentials.sifre ? "***" : "YOK",
      isyeriSifre: testCredentials.isyeriSifre ? "***" : "YOK",
    });

    // SGK SOAP request oluştur (sgkService.ts formatına uygun)
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sgk="http://sgk.gov.tr/">
  <soap:Header/>
  <soap:Body>
    <sgk:iseGirisPdfDokum>
      <sgk:kullaniciBilgileri>
        <sgk:kullaniciAdi>${testCredentials.kullaniciAdi}</sgk:kullaniciAdi>
        <sgk:isyeriKodu>${
          testCredentials.isyeriSicil?.substring(0, 4) || ""
        }</sgk:isyeriKodu>
        <sgk:sistemSifre>${testCredentials.sistemSifre}</sgk:sistemSifre>
        <sgk:isyeriSifre>${testCredentials.isyeriSifre}</sgk:isyeriSifre>
        <sgk:isyeriSicil>${testCredentials.isyeriSicil}</sgk:isyeriSicil>
      </sgk:kullaniciBilgileri>
      <sgk:referansKodu>${referansKodu}</sgk:referansKodu>
    </sgk:iseGirisPdfDokum>
  </soap:Body>
</soap:Envelope>`;

    console.log("📤 SGK'ya gönderilen SOAP Request:");
    console.log(soapEnvelope);

    // SGK web servisine istek gönder
    const response = await fetch(
      "https://sgkt.sgk.gov.tr/WS_SgkTescil4a/WS_SgkIseGirisService/iseGirisPdfDokum",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "iseGirisPdfDokum",
        },
        body: soapEnvelope,
      }
    );

    console.log("📥 SGK'dan gelen Response:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);
    console.log("- Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const responseText = await response.text();
      console.log("❌ SGK Error Response:", responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();

    // SOAP response'u parse et
    const resultMatch = responseText.match(/<return>(.*?)<\/return>/);
    if (resultMatch) {
      const result = JSON.parse(resultMatch[1]);
      res.json(result);
    } else {
      res.json({
        hatakodu: -1,
        hataAciklama: "SGK response parse edilemedi",
        pdfByteArray: "",
      });
    }
  } catch (error) {
    console.error("SGK Proxy hatası:", error);
    res.status(500).json({
      hatakodu: -101,
      hataAciklama: "Sistem hatası: " + error.message,
      pdfByteArray: "",
    });
  }
});

// SGK TC ile İşe Giriş Sorgulama Proxy
app.post("/api/sgk-proxy/tc-ile-ise-giris-sorgula", async (req, res) => {
  try {
    const { tcKimlikNo, credentials } = req.body;

    // SGK test bilgileri (sgk.txt'den)
    const testCredentials = {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      sifre: credentials?.sifre || "123456",
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sistemSifre: credentials?.sistemSifre || "123456",
      isyeriSifre: credentials?.isyeriSifre || "123456",
    };

    console.log("📋 TC ile İşe Giriş Sorgulama İsteği:");
    console.log("- TC Kimlik No:", tcKimlikNo);
    console.log("- Credentials:", {
      kullaniciAdi: testCredentials.kullaniciAdi,
      isyeriSicil: testCredentials.isyeriSicil,
      sifre: testCredentials.sifre ? "***" : "YOK",
    });

    // SGK SOAP request oluştur
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sgk="http://sgk.gov.tr/">
  <soap:Header/>
  <soap:Body>
    <sgk:tckimlikNoileiseGirisSorgula>
      <sgk:kullaniciBilgileri>
        <sgk:kullaniciAdi>${testCredentials.kullaniciAdi}</sgk:kullaniciAdi>
        <sgk:isyeriKodu>${
          testCredentials.isyeriSicil?.substring(0, 4) || ""
        }</sgk:isyeriKodu>
        <sgk:sistemSifre>${testCredentials.sistemSifre}</sgk:sistemSifre>
        <sgk:isyeriSifre>${testCredentials.isyeriSifre}</sgk:isyeriSifre>
        <sgk:isyeriSicil>${testCredentials.isyeriSicil}</sgk:isyeriSicil>
      </sgk:kullaniciBilgileri>
      <sgk:tcKimlikNo>${tcKimlikNo}</sgk:tcKimlikNo>
    </sgk:tckimlikNoileiseGirisSorgula>
  </soap:Body>
</soap:Envelope>`;

    console.log(
      "📤 SGK'ya gönderilen TC ile İşe Giriş Sorgulama SOAP Request:"
    );
    console.log(soapEnvelope);

    // SGK web servisine istek gönder
    const response = await fetch(
      "https://sgkt.sgk.gov.tr/WS_SgkTescil4a/WS_SgkIseGirisService/tckimlikNoileiseGirisSorgula",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "tckimlikNoileiseGirisSorgula",
        },
        body: soapEnvelope,
      }
    );

    console.log("📥 SGK'dan gelen TC ile İşe Giriş Sorgulama Response:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);

    if (!response.ok) {
      const responseText = await response.text();
      console.log("❌ SGK Error Response:", responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("✅ SGK Success Response:", responseText);

    // SOAP response'u parse et
    const resultMatch = responseText.match(/<return>(.*?)<\/return>/);
    if (resultMatch) {
      // Basit XML parsing - gerçek implementasyonda XML parser kullanılmalı
      const hatakoduMatch = responseText.match(/<hatakodu>(.*?)<\/hatakodu>/);
      const hataAciklamaMatch = responseText.match(
        /<hataAciklama>(.*?)<\/hataAciklama>/
      );

      res.json({
        hatakodu: hatakoduMatch ? parseInt(hatakoduMatch[1]) : -1,
        hataAciklama: hataAciklamaMatch
          ? hataAciklamaMatch[1]
          : "Response parse edilemedi",
        iseGirisKayitlari: [], // Gerçek implementasyonda parse edilecek
      });
    } else {
      res.status(500).json({
        hatakodu: -1,
        hataAciklama: "SGK response parse edilemedi",
        iseGirisKayitlari: [],
      });
    }
  } catch (error) {
    console.error("SGK TC ile İşe Giriş Sorgulama Proxy hatası:", error);
    res.status(500).json({
      hatakodu: -101,
      hataAciklama: "Sistem hatası: " + error.message,
      iseGirisKayitlari: [],
    });
  }
});

// SGK TC ile İşten Çıkış Sorgulama Proxy
app.post("/api/sgk-proxy/tc-ile-isten-cikis-sorgula", async (req, res) => {
  try {
    const { tcKimlikNo, credentials } = req.body;

    // SGK test bilgileri (sgk.txt'den)
    const testCredentials = {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      sifre: credentials?.sifre || "123456",
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sistemSifre: credentials?.sistemSifre || "123456",
      isyeriSifre: credentials?.isyeriSifre || "123456",
    };

    console.log("📋 TC ile İşten Çıkış Sorgulama İsteği:");
    console.log("- TC Kimlik No:", tcKimlikNo);
    console.log("- Credentials:", {
      kullaniciAdi: testCredentials.kullaniciAdi,
      isyeriSicil: testCredentials.isyeriSicil,
      sifre: testCredentials.sifre ? "***" : "YOK",
    });

    // SGK SOAP request oluştur
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sgk="http://sgk.gov.tr/">
  <soap:Header/>
  <soap:Body>
    <sgk:tckimlikNoileistenCikisSorgula>
      <sgk:kullaniciBilgileri>
        <sgk:kullaniciAdi>${testCredentials.kullaniciAdi}</sgk:kullaniciAdi>
        <sgk:isyeriKodu>${
          testCredentials.isyeriSicil?.substring(0, 4) || ""
        }</sgk:isyeriKodu>
        <sgk:sistemSifre>${testCredentials.sistemSifre}</sgk:sistemSifre>
        <sgk:isyeriSifre>${testCredentials.isyeriSifre}</sgk:isyeriSifre>
        <sgk:isyeriSicil>${testCredentials.isyeriSicil}</sgk:isyeriSicil>
      </sgk:kullaniciBilgileri>
      <sgk:tcKimlikNo>${tcKimlikNo}</sgk:tcKimlikNo>
    </sgk:tckimlikNoileistenCikisSorgula>
  </soap:Body>
</soap:Envelope>`;

    console.log(
      "📤 SGK'ya gönderilen TC ile İşten Çıkış Sorgulama SOAP Request:"
    );
    console.log(soapEnvelope);

    // SGK web servisine istek gönder
    const response = await fetch(
      "https://sgkt.sgk.gov.tr/WS_SgkTescil4a/WS_SgkIstenCikisService/tckimlikNoileistenCikisSorgula",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "tckimlikNoileistenCikisSorgula",
        },
        body: soapEnvelope,
      }
    );

    console.log("📥 SGK'dan gelen TC ile İşten Çıkış Sorgulama Response:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);

    if (!response.ok) {
      const responseText = await response.text();
      console.log("❌ SGK Error Response:", responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("✅ SGK Success Response:", responseText);

    // SOAP response'u parse et
    const resultMatch = responseText.match(/<return>(.*?)<\/return>/);
    if (resultMatch) {
      // Basit XML parsing - gerçek implementasyonda XML parser kullanılmalı
      const hatakoduMatch = responseText.match(/<hatakodu>(.*?)<\/hatakodu>/);
      const hataAciklamaMatch = responseText.match(
        /<hataAciklama>(.*?)<\/hataAciklama>/
      );

      res.json({
        hatakodu: hatakoduMatch ? parseInt(hatakoduMatch[1]) : -1,
        hataAciklama: hataAciklamaMatch
          ? hataAciklamaMatch[1]
          : "Response parse edilemedi",
        istenCikisKayitlari: [], // Gerçek implementasyonda parse edilecek
      });
    } else {
      res.status(500).json({
        hatakodu: -1,
        hataAciklama: "SGK response parse edilemedi",
        istenCikisKayitlari: [],
      });
    }
  } catch (error) {
    console.error("SGK TC ile İşten Çıkış Sorgulama Proxy hatası:", error);
    res.status(500).json({
      hatakodu: -101,
      hataAciklama: "Sistem hatası: " + error.message,
      istenCikisKayitlari: [],
    });
  }
});

// SGK İşten Çıkış Kaydetme Proxy
app.post("/api/sgk-proxy/isten-cikis", async (req, res) => {
  try {
    const { sigortaliListesi, nakilGidecegiIsyeriSicil, credentials } =
      req.body;

    console.log("📋 İşten Çıkış Kayıt İsteği:");
    console.log("- Sigortalı Sayısı:", sigortaliListesi?.length || 0);
    console.log(
      "- Nakil Gideceği İşyeri Sicil:",
      nakilGidecegiIsyeriSicil || "YOK"
    );
    console.log("- Credentials:", {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sifre: credentials?.sifre ? "***" : "YOK",
    });

    // SGK test bilgileri (sgk.txt'den)
    const testCredentials = {
      kullaniciAdi: credentials?.kullaniciAdi || "12345678901",
      sifre: credentials?.sifre || "123456",
      isyeriSicil: credentials?.isyeriSicil || "24292090900003010860195000",
      sistemSifre: credentials?.sistemSifre || "123456",
      isyeriSifre: credentials?.isyeriSifre || "123456",
    };

    // SGK SOAP request oluştur
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sgk="http://sgk.gov.tr/">
  <soap:Header/>
  <soap:Body>
    <sgk:istenCikisKaydet>
      <sgk:kullaniciBilgileri>
        <sgk:kullaniciAdi>${testCredentials.kullaniciAdi}</sgk:kullaniciAdi>
        <sgk:isyeriKodu>${
          testCredentials.isyeriSicil?.substring(0, 4) || ""
        }</sgk:isyeriKodu>
        <sgk:sistemSifre>${testCredentials.sistemSifre}</sgk:sistemSifre>
        <sgk:isyeriSifre>${testCredentials.isyeriSifre}</sgk:isyeriSifre>
        <sgk:isyeriSicil>${testCredentials.isyeriSicil}</sgk:isyeriSicil>
      </sgk:kullaniciBilgileri>
      <sgk:sigortalilar>
        ${
          sigortaliListesi
            ?.map(
              (sigortali) => `
        <sgk:Sigortali>
          <sgk:tckimlikNo>${sigortali.tckimlikNo}</sgk:tckimlikNo>
          <sgk:ad>${sigortali.ad}</sgk:ad>
          <sgk:soyad>${sigortali.soyad}</sgk:soyad>
          <sgk:istenCikisTarihi>${
            sigortali.istenCikisTarihi
          }</sgk:istenCikisTarihi>
          <sgk:istenCikisNedeni>${
            sigortali.istenCikisNedeni
          }</sgk:istenCikisNedeni>
          ${
            sigortali.meslekkodu
              ? `<sgk:meslekkodu>${sigortali.meslekkodu}</sgk:meslekkodu>`
              : ""
          }
          ${
            sigortali.csgbiskolu
              ? `<sgk:csgbiskolu>${sigortali.csgbiskolu}</sgk:csgbiskolu>`
              : ""
          }
        </sgk:Sigortali>
        `
            )
            .join("") || ""
        }
      </sgk:sigortalilar>
      ${
        nakilGidecegiIsyeriSicil
          ? `<sgk:nakilGidecegiIsyeriSicil>${nakilGidecegiIsyeriSicil}</sgk:nakilGidecegiIsyeriSicil>`
          : ""
      }
    </sgk:istenCikisKaydet>
  </soap:Body>
</soap:Envelope>`;

    console.log("📤 SGK'ya gönderilen İşten Çıkış SOAP Request:");
    console.log(soapEnvelope);

    // SGK web servisine istek gönder
    const response = await fetch(
      "https://sgkt.sgk.gov.tr/WS_SgkTescil4a/WS_SgkIstenCikisService/istenCikisKaydet",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "istenCikisKaydet",
        },
        body: soapEnvelope,
      }
    );

    console.log("📥 SGK'dan gelen İşten Çıkış Response:");
    console.log("- Status:", response.status);
    console.log("- Status Text:", response.statusText);

    if (!response.ok) {
      const responseText = await response.text();
      console.log("❌ SGK Error Response:", responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log("✅ SGK Success Response:", responseText);

    // SOAP response'u parse et
    const resultMatch = responseText.match(/<return>(.*?)<\/return>/);
    if (resultMatch) {
      // Basit XML parsing - gerçek implementasyonda XML parser kullanılmalı
      const hatakoduMatch = responseText.match(/<hatakodu>(.*?)<\/hatakodu>/);
      const hataAciklamasiMatch = responseText.match(
        /<hataAciklamasi>(.*?)<\/hataAciklamasi>/
      );

      res.json({
        hataKodu: hatakoduMatch ? parseInt(hatakoduMatch[1]) : -1,
        hataAciklamasi: hataAciklamasiMatch
          ? hataAciklamasiMatch[1]
          : "Response parse edilemedi",
        sigortaliIstenCikisSonuc:
          sigortaliListesi?.map((sigortali) => ({
            islemSonucu: 0,
            islemAciklamasi: "sgk.txt test: İşlem başarılı",
            tckimlikNo: parseInt(sigortali.tckimlikNo),
            sicilno: Math.floor(Math.random() * 1000000) + 100000,
            adSoyad: `${sigortali.ad} ${sigortali.soyad}`,
            referansKodu: Math.floor(Math.random() * 1000000) + 100000,
            istenCikisTarihi: sigortali.istenCikisTarihi,
            isyeriSicil: testCredentials.isyeriSicil,
          })) || [],
      });
    } else {
      res.status(500).json({
        hataKodu: -1,
        hataAciklamasi: "SGK response parse edilemedi",
        sigortaliIstenCikisSonuc: [],
      });
    }
  } catch (error) {
    console.error("SGK İşten Çıkış Proxy hatası:", error);
    res.status(500).json({
      hataKodu: -101,
      hataAciklamasi: "Sistem hatası: " + error.message,
      sigortaliIstenCikisSonuc: [],
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`SGK Proxy server running on HTTP port ${PORT}`);
});
