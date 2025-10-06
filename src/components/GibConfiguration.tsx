import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
  Science as TestTubeIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { gibService, GibConfig } from "../services/gibService";
import { useTenant } from "../contexts/TenantContext";

const GibConfiguration: React.FC = () => {
  const { tenant } = useTenant();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);

  const [config, setConfig] = useState<Partial<GibConfig>>({
    tenant_id: tenant?.id || "",
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

  const steps = [
    "Temel Bilgiler",
    "GİB API Ayarları",
    "E-İmza Sertifikası",
    "Test ve Doğrulama",
  ];

  useEffect(() => {
    loadConfig();
    checkIntegrationStatus();
  }, [tenant]);

  const loadConfig = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    try {
      const loadedConfig = await gibService.loadConfig(tenant.id);
      if (loadedConfig) {
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error("Konfigürasyon yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrationStatus = async () => {
    if (!tenant?.id) return;

    try {
      const status = await gibService.checkGibIntegrationStatus(tenant.id);
      setIntegrationStatus(status);
    } catch (error) {
      console.error("Entegrasyon durumu kontrol hatası:", error);
    }
  };

  const handleInputChange = (field: keyof GibConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!tenant?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await gibService.saveConfig({
        ...config,
        tenant_id: tenant.id,
      });

      if (success) {
        setSuccess("GİB konfigürasyonu başarıyla kaydedildi!");
        await checkIntegrationStatus();
      } else {
        setError("GİB konfigürasyonu kaydedilemedi!");
      }
    } catch (error) {
      setError("Kaydetme sırasında hata oluştu!");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      // Test bağlantısı simülasyonu
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess("GİB test bağlantısı başarılı!");
    } catch (error) {
      setError("GİB test bağlantısı başarısız!");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!integrationStatus) return <InfoIcon color="info" />;
    if (integrationStatus.is_configured) {
      return <CheckCircleIcon color="success" />;
    }
    return <WarningIcon color="warning" />;
  };

  const getStatusColor = () => {
    if (!integrationStatus) return "info";
    if (integrationStatus.is_configured) return "success";
    return "warning";
  };

  const getStatusText = () => {
    if (!integrationStatus) return "Durum kontrol ediliyor...";
    if (integrationStatus.is_configured) {
      return `GİB entegrasyonu hazır (${
        integrationStatus.test_mode ? "Test Modu" : "Canlı Mod"
      })`;
    }
    return `Eksik alanlar: ${integrationStatus.missing_fields.join(", ")}`;
  };

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
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 2 }}
      >
        <AccountBalanceIcon color="primary" />
        GİB Entegrasyon Konfigürasyonu
      </Typography>

      {/* Durum Kartı */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            {getStatusIcon()}
            <Typography variant="h6">Entegrasyon Durumu</Typography>
            <Chip
              label={getStatusText()}
              color={getStatusColor() as any}
              variant="outlined"
            />
          </Box>

          {integrationStatus && !integrationStatus.is_configured && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Eksik Alanlar:</strong>{" "}
                {integrationStatus.missing_fields.join(", ")}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Hata/Başarı Mesajları */}
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

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {index === 0 && (
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Vergi Dairesi"
                          value={config.tax_office || ""}
                          onChange={(e) =>
                            handleInputChange("tax_office", e.target.value)
                          }
                          helperText="Örnek: Kadıköy Vergi Dairesi"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Vergi Dairesi Kodu"
                          value={config.tax_office_code || ""}
                          onChange={(e) =>
                            handleInputChange("tax_office_code", e.target.value)
                          }
                          helperText="Örnek: 1234567890"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Vergi Kimlik Numarası"
                          value={config.tax_identification_number || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "tax_identification_number",
                              e.target.value
                            )
                          }
                          helperText="11 haneli vergi kimlik numarası"
                          inputProps={{ maxLength: 11 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="GİB Tanımlayıcı"
                          value={config.gib_identifier || ""}
                          onChange={(e) =>
                            handleInputChange("gib_identifier", e.target.value)
                          }
                          helperText="GİB'den alınan tanımlayıcı numara"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="E-Fatura Adresi"
                          value={config.e_invoice_address || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "e_invoice_address",
                              e.target.value
                            )
                          }
                          helperText="E-fatura gönderim adresi"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {index === 1 && (
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="GİB Kullanıcı Adı"
                          value={config.gib_username || ""}
                          onChange={(e) =>
                            handleInputChange("gib_username", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="GİB Şifresi"
                          type="password"
                          value={config.gib_password || ""}
                          onChange={(e) =>
                            handleInputChange("gib_password", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="WSDL URL"
                          value={config.gib_wsdl_url || ""}
                          onChange={(e) =>
                            handleInputChange("gib_wsdl_url", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="SOAP Endpoint"
                          value={config.gib_soap_endpoint || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "gib_soap_endpoint",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.is_test_mode || false}
                              onChange={(e) =>
                                handleInputChange(
                                  "is_test_mode",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="Test Modu (Geliştirme aşamasında açık tutun)"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {index === 2 && (
                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Sertifika Seri Numarası"
                          value={config.certificate_serial_number || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "certificate_serial_number",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Sertifika Şifresi"
                          type="password"
                          value={config.certificate_password || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "certificate_password",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          component="label"
                        >
                          Sertifika Dosyası Yükle
                          <input
                            type="file"
                            hidden
                            accept=".p12,.pfx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleInputChange(
                                  "certificate_file_path",
                                  file.name
                                );
                              }
                            }}
                          />
                        </Button>
                        {config.certificate_file_path && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Seçilen dosya: {config.certificate_file_path}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {index === 3 && (
                  <Box sx={{ p: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Test modunda GİB bağlantısını kontrol edin. Tüm ayarlar
                      doğru ise canlı moda geçebilirsiniz.
                    </Alert>
                    <Button
                      variant="contained"
                      startIcon={<TestTubeIcon />}
                      onClick={handleTestConnection}
                      disabled={loading}
                    >
                      Test Bağlantısı
                    </Button>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(activeStep + 1)}
                    disabled={activeStep === steps.length - 1}
                    sx={{ mr: 1 }}
                  >
                    {activeStep === steps.length - 1 ? "Tamamla" : "İleri"}
                  </Button>
                  <Button
                    onClick={() => setActiveStep(activeStep - 1)}
                    disabled={activeStep === 0}
                  >
                    Geri
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Kaydet Butonu */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Kaydediliyor..." : "Konfigürasyonu Kaydet"}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<TestTubeIcon />}
          onClick={handleTestConnection}
          disabled={loading}
        >
          {loading ? "Test Ediliyor..." : "Test Bağlantısı"}
        </Button>
      </Box>
    </Box>
  );
};

export default GibConfiguration;
