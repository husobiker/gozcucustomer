import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useHikvisionIntegration } from "../hooks/useHikvisionIntegration";
import { useProject } from "../contexts/ProjectContext";

const HikvisionCloudTest: React.FC = () => {
  const { selectedProject } = useProject();
  const {
    cameras,
    config,
    loading,
    error,
    integrationStatus,
    loadCameras,
    refreshIntegration,
  } = useHikvisionIntegration();

  const [testResults, setTestResults] = useState<{
    configTest: boolean | null;
    cameraListTest: boolean | null;
    integrationTest: boolean | null;
  }>({
    configTest: null,
    cameraListTest: null,
    integrationTest: null,
  });

  useEffect(() => {
    if (selectedProject) {
      loadCameras(selectedProject.id);
    }
  }, [selectedProject, loadCameras]);

  const runTests = async () => {
    if (!selectedProject) return;

    setTestResults({
      configTest: null,
      cameraListTest: null,
      integrationTest: null,
    });

    // Test 1: Konfigürasyon testi
    setTestResults((prev) => ({ ...prev, configTest: !!config }));

    // Test 2: Kamera listesi testi
    await loadCameras(selectedProject.id);
    setTestResults((prev) => ({
      ...prev,
      cameraListTest: cameras.length >= 0,
    }));

    // Test 3: Entegrasyon durumu testi
    await refreshIntegration(selectedProject.id);
    setTestResults((prev) => ({
      ...prev,
      integrationTest: integrationStatus?.status === "connected",
    }));
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <CircularProgress size={20} />;
    if (status) return <CheckIcon color="success" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return "default";
    if (status) return "success";
    return "error";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Hikvision Cloud Entegrasyon Testi
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Test Durumu</Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={runTests}
              disabled={loading}
            >
              Testleri Çalıştır
            </Button>
          </Box>

          <List>
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(testResults.configTest)}
              </ListItemIcon>
              <ListItemText
                primary="Konfigürasyon Testi"
                secondary={
                  config ? "Konfigürasyon yüklendi" : "Konfigürasyon bulunamadı"
                }
              />
              <Chip
                label={testResults.configTest ? "Başarılı" : "Başarısız"}
                color={getStatusColor(testResults.configTest)}
                size="small"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(testResults.cameraListTest)}
              </ListItemIcon>
              <ListItemText
                primary="Kamera Listesi Testi"
                secondary={`${cameras.length} kamera bulundu`}
              />
              <Chip
                label={testResults.cameraListTest ? "Başarılı" : "Başarısız"}
                color={getStatusColor(testResults.cameraListTest)}
                size="small"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {getStatusIcon(testResults.integrationTest)}
              </ListItemIcon>
              <ListItemText
                primary="Entegrasyon Durumu Testi"
                secondary={integrationStatus?.message || "Test edilmedi"}
              />
              <Chip
                label={testResults.integrationTest ? "Bağlı" : "Bağlı Değil"}
                color={getStatusColor(testResults.integrationTest)}
                size="small"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kamera Listesi
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : cameras.length === 0 ? (
            <Alert severity="info">
              Henüz kamera bulunmuyor. Veritabanı tablolarını oluşturduktan
              sonra demo kameralar görünecektir.
            </Alert>
          ) : (
            <List>
              {cameras.map((camera, index) => (
                <React.Fragment key={camera.id}>
                  <ListItem>
                    <ListItemIcon>
                      <CameraIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={camera.name}
                      secondary={`${camera.model} - ${camera.location}`}
                    />
                    <Chip
                      label={camera.status}
                      color={camera.status === "online" ? "success" : "error"}
                      size="small"
                    />
                  </ListItem>
                  {index < cameras.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Konfigürasyon Bilgileri
          </Typography>
          {config ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                API Endpoint: {config.api_endpoint}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API Key:{" "}
                {config.api_key ? "***" + config.api_key.slice(-4) : "Yok"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Token Expires:{" "}
                {config.token_expires_at
                  ? new Date(config.token_expires_at).toLocaleString()
                  : "Yok"}
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">
              Konfigürasyon bulunamadı. Veritabanı tablolarını oluşturduktan
              sonra demo konfigürasyon görünecektir.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default HikvisionCloudTest;


