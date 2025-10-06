import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Avatar,
  Tooltip,
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
} from "@mui/material";
import {
  Camera as CameraIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Visibility as ViewIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { useHikvisionIntegration } from "../hooks/useHikvisionIntegration";
import { HikvisionCamera } from "../api/hikvisionIntegration";

interface HikvisionCameraIntegrationProps {
  projectId: string;
}

const HikvisionCameraIntegration: React.FC<HikvisionCameraIntegrationProps> = ({
  projectId,
}) => {
  const {
    cameras,
    config,
    loading,
    error,
    integrationStatus,
    loadCameras,
    updateCameraStatus,
    updateCameraSettings,
    addCamera,
    deleteCamera,
    refreshIntegration,
    getCameraStreamUrl,
    getCameraSnapshotUrl,
  } = useHikvisionIntegration();

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState<HikvisionCamera | null>(
    null
  );
  const [newCameraData, setNewCameraData] = useState({
    name: "",
    model: "",
    ip_address: "",
    port: 554,
    username: "admin",
    password: "",
    location: "",
  });

  // Component mount olduğunda kameraları yükle
  useEffect(() => {
    if (projectId) {
      loadCameras(projectId);
    }
  }, [projectId, loadCameras]);

  const handleRefresh = () => {
    if (projectId) {
      refreshIntegration(projectId);
    }
  };

  const handleAddCamera = async () => {
    if (!projectId) return;

    const cameraData = {
      ...newCameraData,
      rtsp_url: `rtsp://${newCameraData.username}:${newCameraData.password}@${newCameraData.ip_address}:${newCameraData.port}/Streaming/Channels/101`,
      status: "offline" as const,
    };

    const newCamera = await addCamera(projectId, cameraData);
    if (newCamera) {
      setOpenAddDialog(false);
      setNewCameraData({
        name: "",
        model: "",
        ip_address: "",
        port: 554,
        username: "admin",
        password: "",
        location: "",
      });
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (window.confirm("Bu kamerayı silmek istediğinizden emin misiniz?")) {
      await deleteCamera(cameraId);
    }
  };

  const handleStatusToggle = async (camera: HikvisionCamera) => {
    const newStatus = camera.status === "online" ? "offline" : "online";
    await updateCameraStatus(camera.id, newStatus);
  };

  const getStatusColor = (status: HikvisionCamera["status"]) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "default";
      case "maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: HikvisionCamera["status"]) => {
    switch (status) {
      case "online":
        return <WifiIcon />;
      case "offline":
        return <WifiOffIcon />;
      case "maintenance":
        return <BuildIcon />;
      default:
        return <WifiOffIcon />;
    }
  };

  const getStatusText = (status: HikvisionCamera["status"]) => {
    switch (status) {
      case "online":
        return "Çevrimiçi";
      case "offline":
        return "Çevrimdışı";
      case "maintenance":
        return "Bakımda";
      default:
        return "Bilinmiyor";
    }
  };

  if (loading && cameras.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Hikvision Kamera Entegrasyonu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cameras.length} kamera yönetiliyor
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Yenile
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Kamera Ekle
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Integration Status */}
      {integrationStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                label={integrationStatus.message}
                color={
                  integrationStatus.status === "connected"
                    ? "success"
                    : "warning"
                }
                icon={
                  integrationStatus.status === "connected" ? (
                    <WifiIcon />
                  ) : (
                    <WifiOffIcon />
                  )
                }
              />
              {integrationStatus.last_sync && (
                <Typography variant="caption" color="text.secondary">
                  Son senkronizasyon:{" "}
                  {new Date(integrationStatus.last_sync).toLocaleString(
                    "tr-TR"
                  )}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cameras Table */}
      {cameras.length === 0 ? (
        <Box
          sx={{
            border: "2px dashed #e0e0e0",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: "#fafafa",
          }}
        >
          <CameraIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Henüz kamera eklenmemiş
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hikvision Partner Portal entegrasyonu ile kamera ekleyebilirsiniz.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            İlk Kamerayı Ekle
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kamera</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>IP Adresi</TableCell>
                <TableCell>Konum</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cameras.map((camera) => (
                <TableRow key={camera.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <CameraIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {camera.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {camera.rtsp_url}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{camera.model}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {camera.ip_address}:{camera.port}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {camera.location || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(camera.status)}
                      color={getStatusColor(camera.status) as any}
                      icon={getStatusIcon(camera.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Durumu Değiştir">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusToggle(camera)}
                        >
                          {camera.status === "online" ? (
                            <PauseIcon />
                          ) : (
                            <PlayIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Stream Görüntüle">
                        <IconButton
                          size="small"
                          onClick={() =>
                            window.open(getCameraStreamUrl(camera), "_blank")
                          }
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => setEditingCamera(camera)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCamera(camera.id)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Camera Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Kamera Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kamera Adı"
                fullWidth
                value={newCameraData.name}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Model"
                fullWidth
                value={newCameraData.model}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    model: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="IP Adresi"
                fullWidth
                value={newCameraData.ip_address}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    ip_address: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Port"
                type="number"
                fullWidth
                value={newCameraData.port}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    port: parseInt(e.target.value),
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kullanıcı Adı"
                fullWidth
                value={newCameraData.username}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Şifre"
                type="password"
                fullWidth
                value={newCameraData.password}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Konum"
                fullWidth
                value={newCameraData.location}
                onChange={(e) =>
                  setNewCameraData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Vazgeç</Button>
          <Button
            onClick={handleAddCamera}
            variant="contained"
            disabled={loading}
          >
            {loading ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HikvisionCameraIntegration;
