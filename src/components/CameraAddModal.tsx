import React, { useState } from "react";
import {
  Modal,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Videocam as CameraIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

interface CameraAddModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (camera: CameraData) => void;
  projectId: string;
}

interface CameraData {
  name: string;
  camera_type: "hikvision" | "dahua";
  ip_address: string;
  external_ip?: string;
  username: string;
  password: string;
  rtsp_port: number;
  http_port: number;
  stream_quality: "high" | "medium" | "low";
  recording_enabled: boolean;
  motion_detection: boolean;
  night_vision: boolean;
  ptz_enabled: boolean;
  use_external_ip: boolean;
  media_server_enabled: boolean;
  auto_detect: boolean;
}

const CameraAddModal: React.FC<CameraAddModalProps> = ({
  open,
  onClose,
  onSave,
  projectId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CameraData>({
    name: "",
    camera_type: "hikvision",
    ip_address: "",
    external_ip: "",
    username: "admin",
    password: "",
    rtsp_port: 554,
    http_port: 80,
    stream_quality: "high",
    recording_enabled: false,
    motion_detection: false,
    night_vision: false,
    ptz_enabled: false,
    use_external_ip: false,
    media_server_enabled: true,
    auto_detect: false,
  });
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Kamera Türü",
    "Ağ Ayarları",
    "Stream Ayarları",
    "Media Server",
    "Özellikler",
  ];

  const handleInputChange = (field: keyof CameraData, value: any) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Kamera türü değiştiğinde otomatik ayarları uygula
      if (field === "camera_type") {
        return applyCameraDefaults(newData, value);
      }

      return newData;
    });
  };

  // Kamera türüne göre varsayılan ayarları uygula
  const applyCameraDefaults = (data: CameraData, cameraType: string) => {
    const defaults = getCameraDefaults(cameraType);
    return {
      ...data,
      ...defaults,
    };
  };

  // Kamera türüne göre varsayılan ayarları al
  const getCameraDefaults = (cameraType: string) => {
    switch (cameraType) {
      case "hikvision":
        return {
          username: "admin",
          password: "admin123",
          rtsp_port: 554,
          http_port: 80,
          stream_quality: "high" as const,
          recording_enabled: true,
          motion_detection: true,
          night_vision: true,
          ptz_enabled: false,
        };
      case "dahua":
        return {
          username: "admin",
          password: "admin",
          rtsp_port: 554,
          http_port: 80,
          stream_quality: "high" as const,
          recording_enabled: true,
          motion_detection: true,
          night_vision: true,
          ptz_enabled: true,
        };
      default:
        return {};
    }
  };

  // IP adresini kontrol et ve dış IP öner
  const checkIPAndSuggestExternal = async (ip: string) => {
    if (!ip) return;

    // Yerel IP kontrolü
    const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(
      ip
    );

    if (isLocalIP) {
      // Dış IP öner
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          external_ip: data.ip,
          use_external_ip: true,
        }));
      } catch (error) {
        console.log("Dış IP alınamadı:", error);
      }
    }
  };

  // Kamera otomatik tespit
  const detectCamera = async () => {
    if (!formData.ip_address) {
      setError("Önce IP adresini girin");
      return;
    }

    setError(null);
    try {
      // Kamera türünü otomatik tespit et
      const detectedType = await detectCameraType(
        formData.ip_address,
        formData.username,
        formData.password
      );
      if (detectedType) {
        setFormData((prev) => applyCameraDefaults(prev, detectedType));
        setError(
          `Kamera türü otomatik tespit edildi: ${detectedType.toUpperCase()}`
        );
      }
    } catch (error) {
      setError("Kamera otomatik tespit edilemedi. Manuel ayarları kullanın.");
    }
  };

  // Kamera türünü tespit et
  const detectCameraType = async (
    ip: string,
    username: string,
    password: string
  ): Promise<string | null> => {
    try {
      // Hikvision kontrolü
      const hikvisionResponse = await fetch(
        `http://${ip}/ISAPI/System/deviceInfo`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          },
        }
      );
      if (hikvisionResponse.ok) return "hikvision";

      // Dahua kontrolü
      const dahuaResponse = await fetch(
        `http://${ip}/cgi-bin/magicBox.cgi?action=getDeviceType`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          },
        }
      );
      if (dahuaResponse.ok) return "dahua";

      return null;
    } catch (error) {
      return null;
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSave = () => {
    if (!formData.name || !formData.ip_address) {
      setError("Kamera adı ve IP adresi gereklidir");
      return;
    }

    // RTSP URL oluştur
    const rtspUrl =
      formData.use_external_ip && formData.external_ip
        ? `rtsp://${formData.username}:${formData.password}@${
            formData.external_ip
          }:${formData.rtsp_port}${
            getDefaultPaths(formData.camera_type).rtsp_main
          }`
        : `rtsp://${formData.username}:${formData.password}@${
            formData.ip_address
          }:${formData.rtsp_port}${
            getDefaultPaths(formData.camera_type).rtsp_main
          }`;

    const cameraData = {
      ...formData,
      rtsp_url: rtspUrl,
    };

    onSave(cameraData);
    onClose();
  };

  const getDefaultPaths = (type: string) => {
    switch (type) {
      case "hikvision":
        return {
          rtsp_main: "/Streaming/Channels/101",
          rtsp_sub: "/Streaming/Channels/102",
          mjpeg: "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1",
        };
      case "dahua":
        return {
          rtsp_main: "/cam/realmonitor?channel=1&subtype=0",
          rtsp_sub: "/cam/realmonitor?channel=1&subtype=1",
          mjpeg: "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1",
        };
      default:
        return {
          rtsp_main: "/stream1",
          rtsp_sub: "/stream2",
          mjpeg: "/mjpg/video.mjpg",
        };
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kamera Türü Seçin
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Kamera Türü</InputLabel>
              <Select
                value={formData.camera_type}
                onChange={(e) =>
                  handleInputChange("camera_type", e.target.value)
                }
                label="Kamera Türü"
              >
                <MenuItem value="hikvision">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CameraIcon color="primary" />
                    Hikvision
                  </Box>
                </MenuItem>
                <MenuItem value="dahua">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CameraIcon color="primary" />
                    Dahua
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Kamera Adı"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Örn: Pendik Giriş Kamerası"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.auto_detect}
                  onChange={(e) =>
                    handleInputChange("auto_detect", e.target.checked)
                  }
                />
              }
              label="Otomatik Kamera Tespiti"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              {formData.camera_type === "hikvision" && (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Hikvision Kameralar:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • RTSP Port: 554, HTTP Port: 80
                    <br />
                    • Varsayılan kullanıcı: admin / admin123
                    <br />
                    • RTSP Path: /Streaming/Channels/101
                    <br />• MJPEG Path:
                    /cgi-bin/mjpg/video.cgi?channel=1&subtype=1
                  </Typography>
                </>
              )}
              {formData.camera_type === "dahua" && (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>Dahua Kameralar:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • RTSP Port: 554, HTTP Port: 80
                    <br />
                    • Varsayılan kullanıcı: admin / admin
                    <br />
                    • RTSP Path: /cam/realmonitor?channel=1&subtype=0
                    <br />• MJPEG Path:
                    /cgi-bin/mjpg/video.cgi?channel=1&subtype=1
                  </Typography>
                </>
              )}
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ağ Ayarları
            </Typography>

            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="IP Adresi"
                value={formData.ip_address}
                onChange={(e) => {
                  handleInputChange("ip_address", e.target.value);
                  checkIPAndSuggestExternal(e.target.value);
                }}
                placeholder="192.168.1.100"
              />
              <Button
                variant="outlined"
                onClick={detectCamera}
                disabled={!formData.ip_address}
                sx={{ minWidth: 120 }}
              >
                Tespit Et
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Kullanıcı Adı"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="admin"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Şifre"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Kamera şifresi"
              sx={{ mb: 2 }}
            />

            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <TextField
                label="RTSP Port"
                type="number"
                value={formData.rtsp_port}
                onChange={(e) =>
                  handleInputChange("rtsp_port", parseInt(e.target.value))
                }
                sx={{ width: "50%" }}
              />
              <TextField
                label="HTTP Port"
                type="number"
                value={formData.http_port}
                onChange={(e) =>
                  handleInputChange("http_port", parseInt(e.target.value))
                }
                sx={{ width: "50%" }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.use_external_ip}
                  onChange={(e) =>
                    handleInputChange("use_external_ip", e.target.checked)
                  }
                />
              }
              label="Dış IP Kullan"
            />

            {formData.use_external_ip && (
              <TextField
                fullWidth
                label="Dış IP Adresi"
                value={formData.external_ip || ""}
                onChange={(e) =>
                  handleInputChange("external_ip", e.target.value)
                }
                placeholder="Otomatik tespit edilecek"
                sx={{ mt: 2 }}
                helperText="Kameraya dışarıdan erişim için gerekli"
              />
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>İpucu:</strong> "Tespit Et" butonuna basarak kamera
                türünü otomatik olarak tespit edebilirsiniz. Yerel IP adresi
                girdiğinizde dış IP otomatik olarak önerilecektir.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stream Ayarları
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Stream Kalitesi</InputLabel>
              <Select
                value={formData.stream_quality}
                onChange={(e) =>
                  handleInputChange("stream_quality", e.target.value)
                }
                label="Stream Kalitesi"
              >
                <MenuItem value="high">Yüksek (1080p)</MenuItem>
                <MenuItem value="medium">Orta (720p)</MenuItem>
                <MenuItem value="low">Düşük (480p)</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>RTSP Ana Stream:</strong>{" "}
                {getDefaultPaths(formData.camera_type).rtsp_main}
              </Typography>
              <Typography variant="body2">
                <strong>RTSP Alt Stream:</strong>{" "}
                {getDefaultPaths(formData.camera_type).rtsp_sub}
              </Typography>
              <Typography variant="body2">
                <strong>MJPEG Stream:</strong>{" "}
                {getDefaultPaths(formData.camera_type).mjpeg}
              </Typography>
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Media Server Ayarları
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.media_server_enabled}
                  onChange={(e) =>
                    handleInputChange("media_server_enabled", e.target.checked)
                  }
                />
              }
              label="Media Server Kullan"
            />

            {formData.media_server_enabled && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Stream Yapılandırması
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>RTSP URL:</strong>{" "}
                    {getDefaultPaths(formData.camera_type).rtsp_main}
                    <br />
                    <strong>HLS URL:</strong> /api/camera-stream/{formData.name}
                    /playlist.m3u8
                    <br />
                    <strong>MJPEG URL:</strong>{" "}
                    {getDefaultPaths(formData.camera_type).mjpeg}
                  </Typography>
                </Alert>

                <Typography variant="body2" color="text.secondary">
                  Media server otomatik olarak RTSP stream'i HLS formatına
                  dönüştürecek ve web tarayıcılarında oynatılabilir hale
                  getirecektir.
                </Typography>
              </Box>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Önemli:</strong> Media server kullanımı için FFmpeg ve
                Node Media Server kurulumu gereklidir. Stream kalitesi ve
                performans ayarları yapılabilir.
              </Typography>
            </Alert>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kamera Özellikleri
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.recording_enabled}
                  onChange={(e) =>
                    handleInputChange("recording_enabled", e.target.checked)
                  }
                />
              }
              label="Kayıt Aktif"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.motion_detection}
                  onChange={(e) =>
                    handleInputChange("motion_detection", e.target.checked)
                  }
                />
              }
              label="Hareket Algılama"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.night_vision}
                  onChange={(e) =>
                    handleInputChange("night_vision", e.target.checked)
                  }
                />
              }
              label="Gece Görüş"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ptz_enabled}
                  onChange={(e) =>
                    handleInputChange("ptz_enabled", e.target.checked)
                  }
                />
              }
              label="PTZ Kontrolü"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Card
        sx={{
          maxWidth: 600,
          mx: "auto",
          mt: 4,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Typography variant="h5" fontWeight="bold">
              Kamera Ekle
            </Typography>
            <Button onClick={onClose} startIcon={<CloseIcon />}>
              Kapat
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="space-between">
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Geri
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                >
                  Kaydet
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  İleri
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Modal>
  );
};

export default CameraAddModal;
