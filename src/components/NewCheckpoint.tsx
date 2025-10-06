import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";

const NewCheckpoint: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    distanceSensitivity: "30",
    checkpointName: "",
    type: "",
    notes: "",
    projectRegion: "",
    mobileForm: "",
  });
  const [projectRegions, setProjectRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Generate unique checkpoint code
  const generateCheckpointCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CP${timestamp}${random}`;
  };

  // Generate QR code
  const generateQRCode = async (code: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(code, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.download = `checkpoint-${generatedCode}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  // Load project regions based on selected project
  const loadProjectRegions = async () => {
    if (!tenant || !selectedProject) {
      setProjectRegions([]);
      return;
    }

    try {
      // RLS policies now work directly with auth.uid()

      // Get project regions from project_regions table
      const { data, error } = await supabase
        .from("project_regions")
        .select("name")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading project regions:", error);
        // Fallback to default regions if no data
        setProjectRegions(getDefaultRegionsForProject(selectedProject.name));
      } else {
        const regions = data?.map((item) => item.name) || [];
        // Add default regions if none exist
        if (regions.length === 0) {
          setProjectRegions(getDefaultRegionsForProject(selectedProject.name));
        } else {
          setProjectRegions(regions);
        }
      }
    } catch (err) {
      console.error("Error in loadProjectRegions:", err);
      setProjectRegions(getDefaultRegionsForProject(selectedProject.name));
    }
  };

  // Get default regions for a project
  const getDefaultRegionsForProject = (projectName: string) => {
    // You can customize this based on project name or other criteria
    const defaultRegions: { [key: string]: string[] } = {
      test: [
        "VELİBABA",
        "Müdürlük",
        "KUMUK İŞ MERKEZİ",
        "PARKEVLERİ KURTKÖY",
        "NEWPORT",
      ],
      "mavi ay güvenlik": [
        "VELİBABA",
        "Müdürlük",
        "KUMUK İŞ MERKEZİ",
        "PARKEVLERİ KURTKÖY",
        "NEWPORT",
      ],
      default: [
        "VELİBABA",
        "Müdürlük",
        "KUMUK İŞ MERKEZİ",
        "PARKEVLERİ KURTKÖY",
        "NEWPORT",
      ],
    };

    return (
      defaultRegions[projectName.toLowerCase()] || defaultRegions["default"]
    );
  };

  // Load project regions when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectRegions();
      // Reset form when project changes
      setFormData((prev) => ({
        ...prev,
        projectRegion: "",
      }));
    }
  }, [selectedProject]);

  const handleSave = async () => {
    if (!tenant || !selectedProject) {
      setError("Tenant veya proje bilgisi bulunamadı");
      return;
    }

    if (!formData.checkpointName || !formData.type || !formData.projectRegion) {
      setError("Lütfen zorunlu alanları doldurun");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate checkpoint code
      const code = generateCheckpointCode();
      setGeneratedCode(code);

      // RLS policies now work directly with auth.uid()

      // Create checkpoint in database
      const { data, error } = await supabase
        .from("checkpoints")
        .insert({
          code: code,
          title: formData.checkpointName,
          type: formData.type,
          project_id: selectedProject.id,
          project_region: formData.projectRegion,
          tenant_id: tenant.id,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          distance_sensitivity: formData.distanceSensitivity
            ? parseInt(formData.distanceSensitivity)
            : 30,
          notes: formData.notes || null,
          mobile_form: formData.mobileForm || null,
        })
        .select();

      if (error) {
        console.error("Error creating checkpoint:", error);
        setError(
          "Kontrol noktası oluşturulurken bir hata oluştu: " + error.message
        );
        return;
      }

      console.log("Checkpoint created successfully:", data);

      // Generate QR code if type is QR
      if (formData.type === "QR") {
        await generateQRCode(code);
      }

      alert(`Kontrol noktası başarıyla oluşturuldu!\n\nKod: ${code}`);
      navigate("/checkpoints");
    } catch (err) {
      console.error("Error in handleSave:", err);
      setError("Kontrol noktası oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate("/checkpoints")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Yeni Kontrol Noktası Oluştur
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Project Selection Alert */}
        {!selectedProject && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Lütfen sidebar'dan bir proje seçiniz. Proje seçilmeden kontrol
            noktası oluşturulamaz.
          </Alert>
        )}

        {/* Success Alert with Generated Code */}
        {generatedCode && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kontrol Noktası Oluşturuldu!
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Kod:</strong> {generatedCode}
            </Typography>
            {formData.type === "QR" && qrCodeDataUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  QR Kod:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    style={{ maxWidth: 100, maxHeight: 100 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={downloadQRCode}
                    sx={{ borderColor: "#1976d2", color: "#1976d2" }}
                  >
                    QR Kodu İndir
                  </Button>
                </Box>
              </Box>
            )}
          </Alert>
        )}

        {/* Main Content Panel */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          {/* Information Alert */}
          <Alert
            severity="info"
            icon={<InfoIcon />}
            sx={{
              mb: 3,
              bgcolor: "#e3f2fd",
              "& .MuiAlert-icon": {
                color: "#1976d2",
              },
            }}
          >
            Bu kontrol noktası için eylem boylam değerlerini giriniz, aksi halde
            raporlama yapılırken doğru sonuçlar elde edemeyebilirsiniz.
          </Alert>

          <Grid container spacing={3}>
            {/* Location and Sensitivity Fields */}
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Enlem (Latitude)"
                value={formData.latitude}
                onChange={(e) => handleInputChange("latitude", e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Boylam (Longitude)"
                value={formData.longitude}
                onChange={(e) => handleInputChange("longitude", e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Mesafe Hassasiyeti (metre)"
                value={formData.distanceSensitivity}
                onChange={(e) =>
                  handleInputChange("distanceSensitivity", e.target.value)
                }
                size="small"
              />
            </Grid>

            {/* Checkpoint Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Kontrol Noktası Adı"
                value={formData.checkpointName}
                onChange={(e) =>
                  handleInputChange("checkpointName", e.target.value)
                }
                size="small"
              />
            </Grid>

            {/* Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Tip</InputLabel>
                <Select
                  value={formData.type}
                  label="Tip"
                  onChange={(e) => handleInputChange("type", e.target.value)}
                >
                  <MenuItem value="QR">QR</MenuItem>
                  <MenuItem value="NFC">NFC</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Notes Section */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Notlar
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Mobil uygulamada kontrol noktası okutulurken personel bu notları
                görecektir.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                size="small"
                placeholder="Notlarınızı buraya yazın..."
              />
            </Grid>

            {/* Project Region Selection */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Proje Bölgesi
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {selectedProject
                  ? `${selectedProject.name} projesi için mevcut bölgeler:`
                  : "Önce sidebar'dan bir proje seçiniz"}
              </Typography>
              <FormControl fullWidth size="small" required>
                <InputLabel>Proje bölgesi seçiniz</InputLabel>
                <Select
                  value={formData.projectRegion}
                  label="Proje bölgesi seçiniz"
                  onChange={(e) =>
                    handleInputChange("projectRegion", e.target.value)
                  }
                  disabled={!selectedProject}
                >
                  {!selectedProject ? (
                    <MenuItem disabled>
                      Önce sidebar'dan bir proje seçiniz
                    </MenuItem>
                  ) : projectRegions.length === 0 ? (
                    <MenuItem disabled>
                      Bu proje için bölge yükleniyor...
                    </MenuItem>
                  ) : (
                    projectRegions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Mobile Form Section */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Mobil Form
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Mobil uygulamada kontrol noktası okutulduktan sonra personel bu
                formu dolduracaktır.
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Form seçiniz</InputLabel>
                <Select
                  value={formData.mobileForm}
                  label="Form seçiniz"
                  onChange={(e) =>
                    handleInputChange("mobileForm", e.target.value)
                  }
                >
                  <MenuItem value="Güvenlik Kontrol Formu">
                    Güvenlik Kontrol Formu
                  </MenuItem>
                  <MenuItem value="Devriye Formu">Devriye Formu</MenuItem>
                  <MenuItem value="Olay Raporu">Olay Raporu</MenuItem>
                  <MenuItem value="Ekipman Kontrol Formu">
                    Ekipman Kontrol Formu
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Save Button */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
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
              disabled={loading || !selectedProject}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                px: 4,
                py: 1.5,
              }}
            >
              {loading
                ? "KAYDEDİLİYOR..."
                : !selectedProject
                ? "PROJE SEÇİNİZ"
                : "KAYDET"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewCheckpoint;
