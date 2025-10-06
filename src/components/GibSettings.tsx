// GİB Ayarları Bileşeni (Web Arayüz için)
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { useTenant } from "../contexts/TenantContext";

interface GibSettings {
  // Temel GİB Bilgileri
  tax_office: string;
  tax_office_code: string;
  tax_identification_number: string;
  gib_identifier: string;

  // E-Fatura Adresleri
  e_invoice_address: string;
  e_archive_address: string;
  e_waybill_address: string;
  e_musteri_address: string;

  // Sertifika Bilgileri
  certificate_serial_number: string;
  certificate_password: string;
  certificate_file_path: string;

  // API Ayarları
  is_test_mode: boolean;
  gib_test_environment_url: string;
  gib_production_environment_url: string;
  gib_username: string;
  gib_password: string;
  gib_wsdl_url: string;
  gib_soap_endpoint: string;
}

const GibSettings: React.FC = () => {
  const { tenant } = useTenant();
  const [settings, setSettings] = useState<GibSettings>({
    tax_office: "",
    tax_office_code: "",
    tax_identification_number: "",
    gib_identifier: "",
    e_invoice_address: "",
    e_archive_address: "",
    e_waybill_address: "",
    e_musteri_address: "",
    certificate_serial_number: "",
    certificate_password: "",
    certificate_file_path: "",
    is_test_mode: true,
    gib_test_environment_url: "https://earsivtest.efatura.gov.tr",
    gib_production_environment_url: "https://earsiv.efatura.gov.tr",
    gib_username: "",
    gib_password: "",
    gib_wsdl_url: "",
    gib_soap_endpoint: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Gerçek uygulamada API'den yüklenecek
      // Şimdilik mock data
      console.log("GİB ayarları yükleniyor...");
    } catch (error) {
      setError("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Gerçek uygulamada API'ye kaydedilecek
      console.log("GİB ayarları kaydediliyor:", settings);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("GİB ayarları başarıyla kaydedildi");
    } catch (error) {
      setError("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GibSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        GİB Entegrasyon Ayarları
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        GİB entegrasyonu için gerekli ayarları buradan yapılandırabilirsiniz.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Temel GİB Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BusinessIcon color="primary" />
                Temel Bilgiler
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="Vergi Dairesi"
                  value={settings.tax_office}
                  onChange={(e) =>
                    handleInputChange("tax_office", e.target.value)
                  }
                  fullWidth
                  placeholder="Pendik Vergi Dairesi"
                />

                <TextField
                  label="Vergi Dairesi Kodu"
                  value={settings.tax_office_code}
                  onChange={(e) =>
                    handleInputChange("tax_office_code", e.target.value)
                  }
                  fullWidth
                  placeholder="1234567890"
                />

                <TextField
                  label="Vergi Kimlik Numarası"
                  value={settings.tax_identification_number}
                  onChange={(e) =>
                    handleInputChange(
                      "tax_identification_number",
                      e.target.value
                    )
                  }
                  fullWidth
                  placeholder="1234567890"
                />

                <TextField
                  label="GİB Tanımlayıcı"
                  value={settings.gib_identifier}
                  onChange={(e) =>
                    handleInputChange("gib_identifier", e.target.value)
                  }
                  fullWidth
                  placeholder="GIB123456789"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* E-Fatura Adresleri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CloudUploadIcon color="primary" />
                E-Fatura Adresleri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="E-Fatura Adresi"
                  value={settings.e_invoice_address}
                  onChange={(e) =>
                    handleInputChange("e_invoice_address", e.target.value)
                  }
                  fullWidth
                  placeholder="efatura@example.com"
                />

                <TextField
                  label="E-Arşiv Adresi"
                  value={settings.e_archive_address}
                  onChange={(e) =>
                    handleInputChange("e_archive_address", e.target.value)
                  }
                  fullWidth
                  placeholder="earsiv@example.com"
                />

                <TextField
                  label="E-İrsaliye Adresi"
                  value={settings.e_waybill_address}
                  onChange={(e) =>
                    handleInputChange("e_waybill_address", e.target.value)
                  }
                  fullWidth
                  placeholder="eirsaliye@example.com"
                />

                <TextField
                  label="E-Müşteri Adresi"
                  value={settings.e_musteri_address}
                  onChange={(e) =>
                    handleInputChange("e_musteri_address", e.target.value)
                  }
                  fullWidth
                  placeholder="emusteri@example.com"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sertifika Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SecurityIcon color="primary" />
                Sertifika Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="Sertifika Seri Numarası"
                  value={settings.certificate_serial_number}
                  onChange={(e) =>
                    handleInputChange(
                      "certificate_serial_number",
                      e.target.value
                    )
                  }
                  fullWidth
                  placeholder="1234567890ABCDEF"
                />

                <TextField
                  label="Sertifika Şifresi"
                  type="password"
                  value={settings.certificate_password}
                  onChange={(e) =>
                    handleInputChange("certificate_password", e.target.value)
                  }
                  fullWidth
                  placeholder="••••••••"
                />

                <TextField
                  label="Sertifika Dosya Yolu"
                  value={settings.certificate_file_path}
                  onChange={(e) =>
                    handleInputChange("certificate_file_path", e.target.value)
                  }
                  fullWidth
                  placeholder="/path/to/certificate.p12"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* API Ayarları */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <SettingsIcon color="primary" />
                API Ayarları
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.is_test_mode}
                      onChange={(e) =>
                        handleInputChange("is_test_mode", e.target.checked)
                      }
                    />
                  }
                  label="Test Modu"
                />

                <TextField
                  label="Test Ortamı URL"
                  value={settings.gib_test_environment_url}
                  onChange={(e) =>
                    handleInputChange(
                      "gib_test_environment_url",
                      e.target.value
                    )
                  }
                  fullWidth
                  disabled={!settings.is_test_mode}
                />

                <TextField
                  label="Canlı Ortam URL"
                  value={settings.gib_production_environment_url}
                  onChange={(e) =>
                    handleInputChange(
                      "gib_production_environment_url",
                      e.target.value
                    )
                  }
                  fullWidth
                  disabled={settings.is_test_mode}
                />

                <TextField
                  label="GİB Kullanıcı Adı"
                  value={settings.gib_username}
                  onChange={(e) =>
                    handleInputChange("gib_username", e.target.value)
                  }
                  fullWidth
                  placeholder="gib_username"
                />

                <TextField
                  label="GİB Şifresi"
                  type="password"
                  value={settings.gib_password}
                  onChange={(e) =>
                    handleInputChange("gib_password", e.target.value)
                  }
                  fullWidth
                  placeholder="••••••••"
                />

                <TextField
                  label="WSDL URL"
                  value={settings.gib_wsdl_url}
                  onChange={(e) =>
                    handleInputChange("gib_wsdl_url", e.target.value)
                  }
                  fullWidth
                  placeholder="https://earsivtest.efatura.gov.tr/earsiv/services/EFaturaWebService?wsdl"
                />

                <TextField
                  label="SOAP Endpoint"
                  value={settings.gib_soap_endpoint}
                  onChange={(e) =>
                    handleInputChange("gib_soap_endpoint", e.target.value)
                  }
                  fullWidth
                  placeholder="https://earsivtest.efatura.gov.tr/earsiv/services/EFaturaWebService"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Durum Göstergesi */}
        <Grid item xs={12}>
          <Alert
            severity={settings.is_test_mode ? "warning" : "success"}
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              GİB Entegrasyon Durumu
            </Typography>
            <Typography variant="body2">
              {settings.is_test_mode ? (
                <>
                  <strong>Test Modu</strong> - Test ortamında çalışıyor. Canlı
                  ortama geçmeden önce tüm ayarları test edin.
                </>
              ) : (
                <>
                  <strong>Canlı Mod</strong> - Canlı ortamda çalışıyor. Dikkatli
                  olun!
                </>
              )}
            </Typography>
          </Alert>
        </Grid>

        {/* Kaydet Butonu */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={saveSettings}
              disabled={saving}
              sx={{ px: 4, py: 1.5 }}
            >
              {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GibSettings;


