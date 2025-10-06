import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyTitle: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Türkiye",
    city: "",
    district: "",
    postalCode: "",
    min_personnel_per_shift: 1,
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!tenant) {
      setError("Tenant bilgisi bulunamadı");
      return;
    }

    if (!formData.companyTitle.trim()) {
      setError("Firma ünvanı zorunludur");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: formData.companyTitle,
          description:
            `${formData.firstName} ${formData.lastName}`.trim() || null,
          status: "active",
          tenant_id: tenant.id,
          min_personnel_per_shift: formData.min_personnel_per_shift,
          max_personnel_per_shift: formData.min_personnel_per_shift, // Minimum ile aynı
          requires_24_hour_coverage: true, // Güvenlik sektöründe her zaman 24 saat sürekli
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        setError("Proje oluşturulurken bir hata oluştu: " + error.message);
      } else {
        console.log("Project created successfully:", data);
        // Navigate back to projects list
        navigate("/projects");
      }
    } catch (err) {
      console.error("Error in handleSave:", err);
      setError("Proje oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate("/projects")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Yeni Proje Oluştur
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Section - Project Information Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "fit-content" }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Proje Bilgileri
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Firma Ünvan *"
                    value={formData.companyTitle}
                    onChange={(e) =>
                      handleInputChange("companyTitle", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ad"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Soyad"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-Posta"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    size="small"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ülke *"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="İl *"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="İlçe *"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Posta Kodu"
                    value={formData.postalCode}
                    onChange={(e) =>
                      handleInputChange("postalCode", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Personnel Management Section */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  bgcolor: "#f8f9fa",
                  borderRadius: 2,
                  border: "1px solid #e9ecef",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "#495057", fontWeight: "bold" }}
                >
                  🔒 Vardiya Personel Ayarları
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Bu proje için vardiya başına kaç personel çalışacağını
                  belirleyin:
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="1 Vardiyada Kaç Personel Çalışacak?"
                      type="number"
                      value={formData.min_personnel_per_shift}
                      onChange={(e) =>
                        handleInputChange(
                          "min_personnel_per_shift",
                          parseInt(e.target.value) || 1
                        )
                      }
                      variant="outlined"
                      helperText="Örnek: Apartman için 1, AVM için 2-3, Büyük hastane için 3-4"
                      inputProps={{ min: 1, max: 10 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Section - Tabs and Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ height: "fit-content" }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                >
                  <Tab label="Bölgeler" />
                  <Tab label="Sistem Kullanıcıları" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <Alert
                  severity="info"
                  icon={<InfoIcon />}
                  sx={{
                    bgcolor: "#e3f2fd",
                    "& .MuiAlert-icon": {
                      color: "#1976d2",
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Bilgi!
                  </Typography>
                  <Typography variant="body2">
                    Bu konfigürasyon ayarına ulaşmak için önce{" "}
                    <strong>Proje</strong> kaydını tamamlayınız.
                  </Typography>
                </Alert>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Alert
                  severity="info"
                  icon={<InfoIcon />}
                  sx={{
                    bgcolor: "#e3f2fd",
                    "& .MuiAlert-icon": {
                      color: "#1976d2",
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Bilgi!
                  </Typography>
                  <Typography variant="body2">
                    Bu konfigürasyon ayarına ulaşmak için önce{" "}
                    <strong>Proje</strong> kaydını tamamlayınız.
                  </Typography>
                </Alert>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSave}
            disabled={loading}
            sx={{
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
              px: 4,
              py: 1.5,
            }}
          >
            {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default NewProject;
