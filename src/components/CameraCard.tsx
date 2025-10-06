import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material";
import {
  Videocam as CameraIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Build as MaintenanceIcon,
} from "@mui/icons-material";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { cameraStreamAPI } from "../api/cameraStream";

interface Camera {
  id: string;
  project_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  rtsp_url: string;
  ip?: string;
  port?: number;
  username?: string;
  password?: string;
  location?: string;
  status: "active" | "inactive" | "maintenance";
  is_recording: boolean;
  recording_quality: "low" | "medium" | "high" | "ultra";
  created_at: string;
  updated_at: string;
}

interface CameraCardProps {
  camera?: Camera;
  onCameraUpdate?: (camera: Camera) => void;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, onCameraUpdate }) => {
  const { tenant } = useTenant();
  const { selectedProject } = useProject();
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsData, setSettingsData] = useState({
    name: "",
    description: "",
    rtsp_url: "",
    username: "",
    password: "",
    location: "",
    status: "active" as "active" | "inactive" | "maintenance",
    is_recording: true,
    recording_quality: "medium" as "low" | "medium" | "high" | "ultra",
  });

  useEffect(() => {
    if (camera) {
      setSettingsData({
        name: camera.name,
        description: camera.description || "",
        rtsp_url: camera.rtsp_url,
        username: camera.username || "",
        password: camera.password || "",
        location: camera.location || "",
        status: camera.status,
        is_recording: camera.is_recording,
        recording_quality: camera.recording_quality,
      });
    }
  }, [camera]);

  const handlePlayPause = async () => {
    if (!camera) return;

    // Şimdilik video stream'i devre dışı - mock server gerçek stream sağlamıyor
    setError(
      "Video stream özelliği henüz aktif değil. Kamera bilgileri görüntüleniyor."
    );
  };

  const handleRefresh = () => {
    // Şimdilik sadece error'ı temizle
    setError(null);
  };

  const handleSaveSettings = async () => {
    if (!camera || !tenant) return;

    try {
      const { error } = await supabase
        .from("cameras")
        .update({
          name: settingsData.name,
          description: settingsData.description,
          rtsp_url: settingsData.rtsp_url,
          username: settingsData.username,
          password: settingsData.password,
          location: settingsData.location,
          status: settingsData.status,
          is_recording: settingsData.is_recording,
          recording_quality: settingsData.recording_quality,
          updated_at: new Date().toISOString(),
        })
        .eq("id", camera.id)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Error updating camera:", error);
        setError("Kamera güncellenirken hata oluştu");
      } else {
        setShowSettings(false);
        if (onCameraUpdate) {
          // Güncellenmiş kamera bilgilerini al
          const { data: updatedCamera } = await supabase
            .from("cameras")
            .select("*")
            .eq("id", camera.id)
            .single();

          if (updatedCamera) {
            onCameraUpdate(updatedCamera);
          }
        }
      }
    } catch (err) {
      console.error("Error in handleSaveSettings:", err);
      setError("Kamera güncellenirken hata oluştu");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon />;
      case "inactive":
        return <ErrorIcon />;
      case "maintenance":
        return <MaintenanceIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  if (!camera) {
    return (
      <Card sx={{ height: 300 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CameraIcon sx={{ fontSize: 48, color: "text.secondary" }} />
          <Typography variant="h6" color="text.secondary">
            Kamera Bulunamadı
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Bu proje için henüz kamera eklenmemiş.
            <br />
            Proje ayarlarından kamera ekleyebilirsiniz.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ height: 300 }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <CameraIcon color="primary" />
              <Typography variant="h6">{camera.name}</Typography>
              <Chip
                icon={getStatusIcon(camera.status)}
                label={
                  camera.status === "active"
                    ? "Aktif"
                    : camera.status === "inactive"
                    ? "Pasif"
                    : "Bakım"
                }
                color={getStatusColor(camera.status) as any}
                size="small"
              />
            </Box>
          }
          action={
            <Box display="flex" gap={1}>
              <Tooltip title="Ayarlar">
                <IconButton size="small" onClick={() => setShowSettings(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Yenile">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <CardContent sx={{ p: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 180,
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed #ccc",
            }}
          >
            <CameraIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Kamera Görüntüsü
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 2 }}
            >
              Video stream özelliği henüz aktif değil
            </Typography>

            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={handlePlayPause}
                startIcon={<PlayIcon />}
              >
                Stream Başlat
              </Button>
            </Box>
          </Box>

          {/* Kamera Bilgileri */}
          <Box sx={{ mt: 2 }}>
            {camera.location && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                📍 {camera.location}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>IP:</strong> {camera.ip || "Belirtilmemiş"}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Port:</strong> {camera.port || "554"}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>RTSP URL:</strong>{" "}
              {camera.rtsp_url ? "✓ Tanımlı" : "✗ Tanımlanmamış"}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Kayıt:</strong>{" "}
              {camera.is_recording ? "✓ Aktif" : "✗ Pasif"}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Kalite:</strong> {camera.recording_quality}
            </Typography>

            {camera.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Açıklama:</strong> {camera.description}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Kamera Ayarları Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Kamera Ayarları</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kamera Adı"
                  fullWidth
                  value={settingsData.name}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Konum"
                  fullWidth
                  value={settingsData.location}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="RTSP URL"
                  fullWidth
                  value={settingsData.rtsp_url}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      rtsp_url: e.target.value,
                    }))
                  }
                  placeholder="rtsp://ip:port/path"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kullanıcı Adı"
                  fullWidth
                  value={settingsData.username}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Şifre"
                  type="password"
                  fullWidth
                  value={settingsData.password}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Açıklama"
                  fullWidth
                  multiline
                  rows={2}
                  value={settingsData.description}
                  onChange={(e) =>
                    setSettingsData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={settingsData.status}
                    onChange={(e) =>
                      setSettingsData((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                  >
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Pasif</MenuItem>
                    <MenuItem value="maintenance">Bakım</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Kayıt Kalitesi</InputLabel>
                  <Select
                    value={settingsData.recording_quality}
                    onChange={(e) =>
                      setSettingsData((prev) => ({
                        ...prev,
                        recording_quality: e.target.value as any,
                      }))
                    }
                  >
                    <MenuItem value="low">Düşük</MenuItem>
                    <MenuItem value="medium">Orta</MenuItem>
                    <MenuItem value="high">Yüksek</MenuItem>
                    <MenuItem value="ultra">Ultra</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settingsData.is_recording}
                      onChange={(e) =>
                        setSettingsData((prev) => ({
                          ...prev,
                          is_recording: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Kayıt Yapılsın"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>İptal</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CameraCard;
