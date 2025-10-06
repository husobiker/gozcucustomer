import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface NewPatrolModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (patrolData: any) => void;
}

const NewPatrolModal: React.FC<NewPatrolModalProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    project: "",
    personnel: "",
    date: "",
    startTime: "",
    endTime: "",
    startTolerance: 0,
    endTolerance: 0,
    controlPoints: [] as string[],
    repeat: false,
    sendNotification: false,
  });

  const [selectedControlPoint, setSelectedControlPoint] = useState("");

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddControlPoint = () => {
    if (
      selectedControlPoint &&
      !formData.controlPoints.includes(selectedControlPoint)
    ) {
      setFormData((prev) => ({
        ...prev,
        controlPoints: [...prev.controlPoints, selectedControlPoint],
      }));
      setSelectedControlPoint("");
    }
  };

  const handleRemoveControlPoint = (controlPoint: string) => {
    setFormData((prev) => ({
      ...prev,
      controlPoints: prev.controlPoints.filter((cp) => cp !== controlPoint),
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
    // Reset form
    setFormData({
      title: "",
      project: "",
      personnel: "",
      date: "",
      startTime: "",
      endTime: "",
      startTolerance: 0,
      endTolerance: 0,
      controlPoints: [],
      repeat: false,
      sendNotification: false,
    });
  };

  const controlPointOptions = [
    "ÇIKIŞ",
    "GİRİŞ",
    "VENPAK ANA KAPI GİRİŞ",
    "SİLAT",
    "OMEKS",
    "DENİZ STATİK",
    "3KA PAZARLAMA",
    "42 NOLU VİLLA",
    "KAPALI GARAJ",
    "GÜVENLİK KABİNİ",
  ];

  const projectOptions = [
    "KURTKÖY PARKEVLERİ",
    "TATBAK VELİBABA",
    "GÖZCÜ360° TESİS YÖNETİM HİZMETLERİ TURİZM VE İNŞAAT LİMİTED ŞİRKETİ",
    "KUMUK İŞ MERKEZİ",
    "KENTPLUS NEWPORT",
    "PARKVERDE",
    "Hakmar",
  ];

  const personnelOptions = [
    "Güçlü Tezel",
    "Ramazan Danışır",
    "Kaya Arslan",
    "Mustafa Yenibaş",
    "Soner Okan",
    "Paylaşımlı Devriye",
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Yeni Devriye Planı Oluştur
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Zaman çizelgesine yeni şift ekliyorsunuz
        </Typography>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Temel Bilgiler
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Başlık"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Proje</InputLabel>
              <Select
                value={formData.project}
                label="Proje"
                onChange={(e) => handleInputChange("project", e.target.value)}
              >
                {projectOptions.map((project) => (
                  <MenuItem key={project} value={project}>
                    {project}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {!formData.personnel && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ bgcolor: "#e3f2fd" }}>
                Personel seçilmediği için bu devriye projedeki tüm personel için
                paylaşımlı devriyedir.
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Personel</InputLabel>
              <Select
                value={formData.personnel}
                label="Personel"
                onChange={(e) => handleInputChange("personnel", e.target.value)}
              >
                {personnelOptions.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Time Range Section */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
              Devriye Planı Zaman Aralığı
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tarih"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Başlangıç Saati"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <TimeIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Bitiş Saati"
              value={formData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <TimeIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Başlangıç Tolerans (Dakika)"
              type="number"
              value={formData.startTolerance}
              onChange={(e) =>
                handleInputChange(
                  "startTolerance",
                  parseInt(e.target.value) || 0
                )
              }
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bitiş Tolerans (Dakika)"
              type="number"
              value={formData.endTolerance}
              onChange={(e) =>
                handleInputChange("endTolerance", parseInt(e.target.value) || 0)
              }
              size="small"
            />
          </Grid>

          {/* Control Points Section */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
              Kontrol Noktaları
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={1} mb={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Kontrol noktası seçiniz</InputLabel>
                <Select
                  value={selectedControlPoint}
                  label="Kontrol noktası seçiniz"
                  onChange={(e) => setSelectedControlPoint(e.target.value)}
                >
                  {controlPointOptions.map((point) => (
                    <MenuItem key={point} value={point}>
                      {point}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddControlPoint}
                disabled={!selectedControlPoint}
                sx={{ minWidth: 100 }}
              >
                Ekle
              </Button>
            </Box>
          </Grid>

          {/* Selected Control Points */}
          {formData.controlPoints.length > 0 && (
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.controlPoints.map((controlPoint) => (
                  <Chip
                    key={controlPoint}
                    label={controlPoint}
                    onDelete={() => handleRemoveControlPoint(controlPoint)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* Recurrence Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
              Tekrarlama Ayarları
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.repeat}
                  onChange={(e) =>
                    handleInputChange("repeat", e.target.checked)
                  }
                />
              }
              label="Tekrarla"
            />
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
              Bildirim Ayarları
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendNotification}
                  onChange={(e) =>
                    handleInputChange("sendNotification", e.target.checked)
                  }
                />
              }
              label="Kontrol saatini geçerse bildirim gönderilsin mi?"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendNotification}
                  onChange={(e) =>
                    handleInputChange("sendNotification", e.target.checked)
                  }
                />
              }
              label="Bildirim Gönder (E-Posta)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Vazgeç
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ bgcolor: "#1976d2" }}
        >
          KAYDET
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewPatrolModal;
