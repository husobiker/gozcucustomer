import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from "@mui/material";
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";

interface CorporateSettings {
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

const CorporateSettings: React.FC = () => {
  const { tenant } = useTenant();
  const [settings, setSettings] = useState<CorporateSettings>({
    tenant_id: "",
    software_name: "Gözcü360°",
    software_version: "1.0.0",
    logo_url: "",
    logo_alt_text: "Gözcü360° Logo",
    favicon_url: "",
    company_name: "GÖZCÜ360° TESİS YÖNETİM HİZMETLERİ",
    company_full_name:
      "GÖZCÜ360° TESİS YÖNETİM HİZMETLERİ TURİZM VE İNŞAAT LİMİTED ŞİRKETİ",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
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
    meta_keywords: "tesis yönetimi, güvenlik, nöbet çizelgesi, dijital yönetim",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true); // Tablo oluştuğunu varsay
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Ayarları yükle
  const loadSettings = async () => {
    // Tenant yoksa varsayılan ayarları kullan
    if (!tenant) {
      setLoading(false);
      setTableExists(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("corporate_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // Eğer tablo yoksa, varsayılan ayarları kullan
        if (
          error.code === "42P01" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          console.log(
            "Corporate settings table does not exist, using default settings"
          );
          setTableExists(false);
          setSettings((prev) => ({ ...prev, tenant_id: tenant.id }));
        } else {
          console.log("Database error:", error);
          // Diğer hatalar için de tablo var kabul et
          setTableExists(true);
          setSettings((prev) => ({ ...prev, tenant_id: tenant.id }));
        }
      } else if (data) {
        setTableExists(true);
        setSettings(data);
      } else {
        // Veri yoksa varsayılan ayarları kullan
        setTableExists(true);
        setSettings((prev) => ({ ...prev, tenant_id: tenant.id }));
      }
    } catch (err) {
      console.error("Error loading corporate settings:", err);
      setError("Ayarlar yüklenirken hata oluştu: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Ayarları kaydet
  const saveSettings = async () => {
    // Tenant kontrolü - tenant olmadan ayarlar kaydedilemez
    if (!tenant) {
      console.error("No tenant found - settings cannot be saved without tenant context");
      setError("Tenant context is required to save settings");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const settingsData = {
        ...settings,
        tenant_id: tenant?.id || "00000000-0000-0000-0000-000000000000",
      };

      const { error } = await supabase
        .from("corporate_settings")
        .upsert(settingsData, {
          onConflict: "tenant_id",
        });

      if (error) {
        // Eğer tablo yoksa, kullanıcıya bilgi ver
        if (
          error.code === "42P01" ||
          error.message.includes("relation") ||
          error.message.includes("does not exist")
        ) {
          setError(
            "Corporate settings tablosu mevcut değil. Lütfen veritabanı yöneticisi ile iletişime geçin."
          );
        } else {
          throw error;
        }
      } else {
        setSuccess("Ayarlar başarıyla kaydedildi!");
      }
    } catch (err) {
      console.error("Error saving corporate settings:", err);
      setError("Ayarlar kaydedilirken hata oluştu: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Tablo oluştur
  const createTable = async () => {
    try {
      setLoading(true);
      setError(null);

      // SQL script içeriğini buraya ekleyebiliriz veya API endpoint kullanabiliriz
      // Şimdilik basit bir mesaj gösterelim
      setSuccess(
        "Tablo oluşturma işlemi başlatıldı. Lütfen veritabanı yöneticisi ile iletişime geçin."
      );
      setTableExists(true);
    } catch (err) {
      console.error("Error creating table:", err);
      setError("Tablo oluşturulurken hata oluştu: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Logo yükle
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo dosyası 5MB'dan küçük olmalıdır.");
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith("image/")) {
      setError("Sadece resim dosyaları yüklenebilir.");
      return;
    }

    try {
      setUploadingLogo(true);
      setError(null);

      // Supabase Storage'a yükle
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from("logos") // Bucket ismini buraya yazın
        .upload(filePath, file);

      if (error) throw error;

      // Public URL'i al
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("logos").getPublicUrl(filePath);

      // Logo URL'ini güncelle
      setSettings((prev) => ({ ...prev, logo_url: publicUrl }));
      setSuccess("Logo başarıyla yüklendi!");
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError("Logo yüklenirken hata oluştu: " + (err as Error).message);
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    // Tenant yoksa da yükle
    loadSettings();
  }, [tenant]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <SettingsIcon color="primary" />
        Kurumsal Ayarlar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Yazılım Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SettingsIcon color="primary" />
                Yazılım Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="Yazılım Adı"
                  value={settings.software_name}
                  onChange={(e) =>
                    setSettings({ ...settings, software_name: e.target.value })
                  }
                  fullWidth
                />

                <TextField
                  label="Yazılım Versiyonu"
                  value={settings.software_version}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      software_version: e.target.value,
                    })
                  }
                  fullWidth
                />

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoUpload}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={
                        uploadingLogo ? (
                          <CircularProgress size={20} />
                        ) : (
                          <CloudUploadIcon />
                        )
                      }
                      disabled={uploadingLogo}
                      fullWidth
                    >
                      {uploadingLogo ? "Yükleniyor..." : "Logo Yükle"}
                    </Button>
                  </label>
                </Box>

                {settings.logo_url && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Mevcut Logo:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        style={{
                          maxWidth: 100,
                          maxHeight: 50,
                          objectFit: "contain",
                          border: "1px solid #ccc",
                          borderRadius: 4,
                        }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, logo_url: "" }))
                        }
                      >
                        Kaldır
                      </Button>
                    </Box>
                  </Box>
                )}

                <TextField
                  label="Logo Alt Metni"
                  value={settings.logo_alt_text}
                  onChange={(e) =>
                    setSettings({ ...settings, logo_alt_text: e.target.value })
                  }
                  fullWidth
                />

                <TextField
                  label="Favicon URL"
                  value={settings.favicon_url}
                  onChange={(e) =>
                    setSettings({ ...settings, favicon_url: e.target.value })
                  }
                  fullWidth
                  placeholder="https://example.com/favicon.ico"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Şirket Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BusinessIcon color="primary" />
                Şirket Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="Şirket Adı (Kısa)"
                  value={settings.company_name}
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                  fullWidth
                />

                <TextField
                  label="Şirket Tam Adı"
                  value={settings.company_full_name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company_full_name: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />

                <TextField
                  label="Adres"
                  value={settings.company_address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company_address: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />

                <TextField
                  label="Telefon"
                  value={settings.company_phone}
                  onChange={(e) =>
                    setSettings({ ...settings, company_phone: e.target.value })
                  }
                  fullWidth
                />

                <TextField
                  label="E-posta"
                  value={settings.company_email}
                  onChange={(e) =>
                    setSettings({ ...settings, company_email: e.target.value })
                  }
                  fullWidth
                  type="email"
                />

                <TextField
                  label="Website"
                  value={settings.company_website}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company_website: e.target.value,
                    })
                  }
                  fullWidth
                  placeholder="https://example.com"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Renk Teması */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PaletteIcon color="primary" />
                Renk Teması
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    label="Ana Renk"
                    value={settings.primary_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        primary_color: e.target.value,
                      })
                    }
                    sx={{ flex: 1 }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: settings.primary_color,
                      borderRadius: 1,
                      border: "1px solid #ccc",
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    label="İkincil Renk"
                    value={settings.secondary_color}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        secondary_color: e.target.value,
                      })
                    }
                    sx={{ flex: 1 }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: settings.secondary_color,
                      borderRadius: 1,
                      border: "1px solid #ccc",
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TextField
                    label="Vurgu Rengi"
                    value={settings.accent_color}
                    onChange={(e) =>
                      setSettings({ ...settings, accent_color: e.target.value })
                    }
                    sx={{ flex: 1 }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: settings.accent_color,
                      borderRadius: 1,
                      border: "1px solid #ccc",
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sistem Ayarları */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sistem Ayarları
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Zaman Dilimi</InputLabel>
                  <Select
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    label="Zaman Dilimi"
                  >
                    <MenuItem value="Europe/Istanbul">
                      İstanbul (UTC+3)
                    </MenuItem>
                    <MenuItem value="Europe/London">Londra (UTC+0)</MenuItem>
                    <MenuItem value="America/New_York">
                      New York (UTC-5)
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Tarih Formatı</InputLabel>
                  <Select
                    value={settings.date_format}
                    onChange={(e) =>
                      setSettings({ ...settings, date_format: e.target.value })
                    }
                    label="Tarih Formatı"
                  >
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Saat Formatı</InputLabel>
                  <Select
                    value={settings.time_format}
                    onChange={(e) =>
                      setSettings({ ...settings, time_format: e.target.value })
                    }
                    label="Saat Formatı"
                  >
                    <MenuItem value="24">24 Saat</MenuItem>
                    <MenuItem value="12">12 Saat (AM/PM)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Para Birimi</InputLabel>
                  <Select
                    value={settings.currency}
                    onChange={(e) =>
                      setSettings({ ...settings, currency: e.target.value })
                    }
                    label="Para Birimi"
                  >
                    <MenuItem value="TRY">Türk Lirası (₺)</MenuItem>
                    <MenuItem value="USD">Amerikan Doları ($)</MenuItem>
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Dil</InputLabel>
                  <Select
                    value={settings.language}
                    onChange={(e) =>
                      setSettings({ ...settings, language: e.target.value })
                    }
                    label="Dil"
                  >
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Footer ve Meta Bilgileri */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Footer ve Meta Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Footer Metni"
                    value={settings.footer_text}
                    onChange={(e) =>
                      setSettings({ ...settings, footer_text: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Meta Başlık"
                    value={settings.meta_title}
                    onChange={(e) =>
                      setSettings({ ...settings, meta_title: e.target.value })
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Meta Açıklama"
                    value={settings.meta_description}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        meta_description: e.target.value,
                      })
                    }
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Meta Anahtar Kelimeler"
                    value={settings.meta_keywords}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        meta_keywords: e.target.value,
                      })
                    }
                    fullWidth
                    placeholder="kelime1, kelime2, kelime3"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* GİB Entegrasyon Ayarları */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SettingsIcon color="primary" />
                GİB Entegrasyon Ayarları
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                {/* Temel GİB Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Temel Bilgiler
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Vergi Dairesi Kodu"
                      value={settings.tax_office_code || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          tax_office_code: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="1234567890"
                    />

                    <TextField
                      label="Vergi Kimlik Numarası"
                      value={settings.tax_identification_number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          tax_identification_number: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="1234567890"
                    />

                    <TextField
                      label="GİB Tanımlayıcı"
                      value={settings.gib_identifier || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_identifier: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="GIB123456789"
                    />

                    <FormControl fullWidth>
                      <InputLabel>Test Modu</InputLabel>
                      <Select
                        value={settings.is_gib_test_mode ? "true" : "false"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            is_gib_test_mode: e.target.value === "true",
                          })
                        }
                      >
                        <MenuItem value="true">Test Modu (Önerilen)</MenuItem>
                        <MenuItem value="false">Canlı Mod</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Grid>

                {/* E-Fatura Adresleri */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    E-Fatura Adresleri
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="E-Fatura Adresi"
                      value={settings.e_invoice_address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          e_invoice_address: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="efatura@example.com"
                    />

                    <TextField
                      label="E-Arşiv Adresi"
                      value={settings.e_archive_address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          e_archive_address: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="earsiv@example.com"
                    />

                    <TextField
                      label="E-İrsaliye Adresi"
                      value={settings.e_waybill_address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          e_waybill_address: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="eirsaliye@example.com"
                    />

                    <TextField
                      label="E-Müşteri Adresi"
                      value={settings.e_musteri_address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          e_musteri_address: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="emusteri@example.com"
                    />
                  </Stack>
                </Grid>

                {/* Sertifika Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Sertifika Bilgileri
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Sertifika Seri Numarası"
                      value={settings.certificate_serial_number || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          certificate_serial_number: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="1234567890ABCDEF"
                    />

                    <TextField
                      label="Sertifika Şifresi"
                      type="password"
                      value={settings.certificate_password || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          certificate_password: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="••••••••"
                    />

                    <TextField
                      label="Sertifika Dosya Yolu"
                      value={settings.certificate_file_path || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          certificate_file_path: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="/path/to/certificate.p12"
                    />
                  </Stack>
                </Grid>

                {/* API Ayarları */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    API Ayarları
                  </Typography>

                  <Stack spacing={2}>
                    <TextField
                      label="Test Ortamı URL"
                      value={settings.gib_test_environment_url || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_test_environment_url: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="https://earsivtest.efatura.gov.tr"
                    />

                    <TextField
                      label="Canlı Ortam URL"
                      value={settings.gib_production_environment_url || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_production_environment_url: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="https://earsiv.efatura.gov.tr"
                    />

                    <TextField
                      label="GİB Kullanıcı Adı"
                      value={settings.gib_username || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_username: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="gib_username"
                    />

                    <TextField
                      label="GİB Şifresi"
                      type="password"
                      value={settings.gib_password || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_password: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="••••••••"
                    />

                    <TextField
                      label="WSDL URL"
                      value={settings.gib_wsdl_url || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_wsdl_url: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="https://earsivtest.efatura.gov.tr/earsiv/services/EFaturaWebService?wsdl"
                    />

                    <TextField
                      label="SOAP Endpoint"
                      value={settings.gib_soap_endpoint || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          gib_soap_endpoint: e.target.value,
                        })
                      }
                      fullWidth
                      placeholder="https://earsivtest.efatura.gov.tr/earsiv/services/EFaturaWebService"
                    />
                  </Stack>
                </Grid>

                {/* GİB Durum Göstergesi */}
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      GİB Entegrasyon Durumu
                    </Typography>
                    <Typography variant="body2">
                      {settings.is_gib_test_mode ? (
                        <>
                          <Chip
                            label="Test Modu"
                            color="warning"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Test ortamında çalışıyor. Canlı ortama geçmeden önce
                          tüm ayarları test edin.
                        </>
                      ) : (
                        <>
                          <Chip
                            label="Canlı Mod"
                            color="success"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          Canlı ortamda çalışıyor. Dikkatli olun!
                        </>
                      )}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Kaydet Butonu */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={loadSettings} disabled={saving}>
              Sıfırla
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CorporateSettings;
