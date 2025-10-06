import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Fullscreen as FullscreenIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Videocam as CameraIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Build as BuildIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useHikvisionIntegration } from "../hooks/useHikvisionIntegration";
import { HikvisionCamera } from "../api/hikvisionIntegration";
import HikvisionCloudTest from "./HikvisionCloudTest";

interface Project {
  id: string;
  name: string;
  cameras: HikvisionCamera[];
}

const MonitoringCenter: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCamera, setSelectedCamera] = useState<HikvisionCamera | null>(
    null
  );
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - gerçek implementasyonda API'den çekilecek
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        // Mock projeler ve kameralar
        const mockProjects: Project[] = [
          {
            id: "1",
            name: "Gözcü360° Ana Bina",
            cameras: [
              {
                id: "1",
                name: "Ana Giriş Kamerası",
                model: "DS-2CD1123G0-IUF",
                ip_address: "192.168.1.100",
                port: 554,
                username: "admin",
                password: "password123",
                rtsp_url:
                  "rtsp://admin:password123@192.168.1.100:554/Streaming/Channels/101",
                status: "online",
                location: "Ana Giriş",
                project_id: "1",
                tenant_id: "mock-tenant",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: "2",
                name: "Güvenlik Odası Kamerası",
                model: "DS-2CD1023G0E-I",
                ip_address: "192.168.1.101",
                port: 554,
                username: "admin",
                password: "password123",
                rtsp_url:
                  "rtsp://admin:password123@192.168.1.101:554/Streaming/Channels/101",
                status: "offline",
                location: "Güvenlik Odası",
                project_id: "1",
                tenant_id: "mock-tenant",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
          {
            id: "2",
            name: "Şube Ofis - Kadıköy",
            cameras: [
              {
                id: "3",
                name: "Reception Kamerası",
                model: "DS-2CD1123G0-IUF",
                ip_address: "192.168.2.100",
                port: 554,
                username: "admin",
                password: "password123",
                rtsp_url:
                  "rtsp://admin:password123@192.168.2.100:554/Streaming/Channels/101",
                status: "online",
                location: "Reception",
                project_id: "2",
                tenant_id: "mock-tenant",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ];

        setProjects(mockProjects);
      } catch (err) {
        setError("Projeler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

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

  const filteredCameras = projects
    .filter(
      (project) => selectedProject === "all" || project.id === selectedProject
    )
    .flatMap((project) => project.cameras)
    .filter((camera) => {
      const matchesSearch =
        camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || camera.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCameraClick = (camera: HikvisionCamera) => {
    setSelectedCamera(camera);
    setOpenCameraDialog(true);
  };

  const handlePlayStream = (camera: HikvisionCamera) => {
    // Gerçek implementasyonda video player açılacak
    window.open(camera.rtsp_url, "_blank");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          İzleme Merkezi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tüm projelerin kameralarını gerçek zamanlı izleyin
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Kamera Görünümü" />
          <Tab label="Hikvision Cloud Test" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Proje Seç</InputLabel>
                  <Select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    <MenuItem value="all">Tüm Projeler</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tüm Durumlar</MenuItem>
                    <MenuItem value="online">Çevrimiçi</MenuItem>
                    <MenuItem value="offline">Çevrimdışı</MenuItem>
                    <MenuItem value="maintenance">Bakımda</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Kamera ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Yenile
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="primary"
                      >
                        {filteredCameras.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Kamera
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <CameraIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="success.main"
                      >
                        {
                          filteredCameras.filter((c) => c.status === "online")
                            .length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Çevrimiçi
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "success.main" }}>
                      <WifiIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="error.main"
                      >
                        {
                          filteredCameras.filter((c) => c.status === "offline")
                            .length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Çevrimdışı
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "error.main" }}>
                      <WifiOffIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="warning.main"
                      >
                        {
                          filteredCameras.filter(
                            (c) => c.status === "maintenance"
                          ).length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bakımda
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: "warning.main" }}>
                      <BuildIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Camera Grid */}
          <Grid container spacing={3}>
            {filteredCameras.map((camera) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={camera.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      transition: "all 0.3s",
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleCameraClick(camera)}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      bgcolor: "grey.300",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {camera.status === "online" ? (
                      <Box sx={{ textAlign: "center" }}>
                        <CameraIcon
                          sx={{ fontSize: 64, color: "primary.main" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Canlı Görüntü
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center" }}>
                        <CameraIcon sx={{ fontSize: 64, color: "grey.500" }} />
                        <Typography variant="body2" color="text.secondary">
                          Görüntü Yok
                        </Typography>
                      </Box>
                    )}

                    {/* Status Badge */}
                    <Chip
                      label={getStatusText(camera.status)}
                      color={getStatusColor(camera.status) as any}
                      icon={getStatusIcon(camera.status)}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                      }}
                    />
                  </CardMedia>

                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {camera.name}
                    </Typography>

                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {
                            projects.find((p) =>
                              p.cameras.some((c) => c.id === camera.id)
                            )?.name
                          }
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {camera.location || "Konum belirtilmemiş"}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <CameraIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {camera.model}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        {camera.ip_address}:{camera.port}
                      </Typography>

                      <Box>
                        <Tooltip title="Stream Aç">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayStream(camera);
                            }}
                            disabled={camera.status !== "online"}
                          >
                            <PlayIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Ayarlar">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Kamera ayarları dialog'u açılacak
                            }}
                          >
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* No Cameras Message */}
          {filteredCameras.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                border: "2px dashed #e0e0e0",
                borderRadius: 2,
                bgcolor: "#fafafa",
              }}
            >
              <CameraIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Kamera Bulunamadı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Arama kriterlerinize uygun kamera bulunamadı
              </Typography>
            </Box>
          )}

          {/* Camera Detail Dialog */}
          <Dialog
            open={openCameraDialog}
            onClose={() => setOpenCameraDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <CameraIcon />
                {selectedCamera?.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedCamera && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Kamera Bilgileri
                      </Typography>
                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Model:
                          </Typography>
                          <Typography variant="body2">
                            {selectedCamera?.model}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            IP Adresi:
                          </Typography>
                          <Typography variant="body2">
                            {selectedCamera?.ip_address}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Port:
                          </Typography>
                          <Typography variant="body2">
                            {selectedCamera?.port}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Konum:
                          </Typography>
                          <Typography variant="body2">
                            {selectedCamera?.location || "-"}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Durum:
                          </Typography>
                          <Chip
                            label={getStatusText(
                              selectedCamera?.status || "offline"
                            )}
                            color={
                              getStatusColor(
                                selectedCamera?.status || "offline"
                              ) as any
                            }
                            icon={getStatusIcon(
                              selectedCamera?.status || "offline"
                            )}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Video Görüntü
                      </Typography>
                      <Box
                        sx={{
                          height: 200,
                          bgcolor: "grey.300",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 1,
                        }}
                      >
                        {selectedCamera?.status === "online" ? (
                          <Box textAlign="center">
                            <CameraIcon
                              sx={{ fontSize: 48, color: "primary.main" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Canlı Görüntü
                            </Typography>
                          </Box>
                        ) : (
                          <Box textAlign="center">
                            <CameraIcon
                              sx={{ fontSize: 48, color: "grey.500" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Görüntü Yok
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenCameraDialog(false)}>Kapat</Button>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() =>
                  selectedCamera && handlePlayStream(selectedCamera)
                }
                disabled={selectedCamera?.status !== "online"}
              >
                Stream Aç
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Hikvision Cloud Test Tab */}
      {tabValue === 1 && <HikvisionCloudTest />}
    </Box>
  );
};

export default MonitoringCenter;
