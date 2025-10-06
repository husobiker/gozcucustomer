import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert,
  Stack,
  IconButton,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { warehouseService } from "../services/inventoryService";

interface WarehouseFormData {
  name: string;
  code?: string;
  address: string;
  district: string;
  city: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  is_abroad: boolean;
  warehouse_type: string;
  responsible_person?: string;
  responsible_person_phone?: string;
  responsible_person_email?: string;
}

const AddWarehouseForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: "",
    code: "",
    address: "",
    district: "",
    city: "",
    country: "Türkiye",
    postal_code: "",
    phone: "",
    email: "",
    is_default: false,
    is_abroad: false,
    warehouse_type: "main",
    responsible_person: "",
    responsible_person_phone: "",
    responsible_person_email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof WarehouseFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error("Depo adı gereklidir");
      }
      if (!formData.address.trim()) {
        throw new Error("Adres gereklidir");
      }
      if (!formData.district.trim()) {
        throw new Error("İlçe gereklidir");
      }
      if (!formData.city.trim()) {
        throw new Error("İl gereklidir");
      }

      // Create warehouse
      const warehouseData = {
        name: formData.name,
        code: formData.code || null,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        country: formData.country,
        postal_code: formData.postal_code || null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_default: formData.is_default,
        is_abroad: formData.is_abroad,
        warehouse_type: formData.warehouse_type as
          | "main"
          | "branch"
          | "virtual"
          | "customer",
        responsible_person: formData.responsible_person || null,
        responsible_person_phone: formData.responsible_person_phone || null,
        responsible_person_email: formData.responsible_person_email || null,
        status: "active" as const,
      };

      await warehouseService.createWarehouse(warehouseData);

      setSuccessMessage("Depo başarıyla eklendi");
      setTimeout(() => {
        navigate("/accounting/stock/warehouses");
      }, 1500);
    } catch (err) {
      console.error("Error creating warehouse:", err);
      setError(
        err instanceof Error ? err.message : "Depo eklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/stock/warehouses");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Depolar &gt; Yeni
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Yeni depo ekleyin
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Form Header */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <LocationIcon sx={{ color: "text.secondary" }} />
              <Typography variant="h6" fontWeight="bold">
                DEPO ADI
              </Typography>
            </Box>

            {/* Depo Adı */}
            <TextField
              fullWidth
              placeholder="Depo adını girin"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3, mb: 3 }}>
              {/* Açık Adresi */}
              <Box
                sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}
              >
                <LocationIcon sx={{ color: "text.secondary" }} />
                <Typography variant="h6" fontWeight="bold">
                  AÇIK ADRESİ
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Açık adresi girin"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                sx={{ mb: 2 }}
              />

              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_abroad}
                      onChange={(e) =>
                        handleInputChange("is_abroad", e.target.checked)
                      }
                    />
                  }
                  label="Adres yurt dışında"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_default}
                      onChange={(e) =>
                        handleInputChange("is_default", e.target.checked)
                      }
                    />
                  }
                  label="Varsayılan depo"
                />
              </Stack>
            </Box>

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
              {/* İlçe, İl */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                İLÇE, İL
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="İLÇE"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    InputProps={{
                      endAdornment: (
                        <IconButton size="small">
                          <LocationIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="İL"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton size="small">
                          <LocationIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Action Buttons */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: "sticky", top: 20 }}>
            <Typography variant="h6" gutterBottom>
              İşlemler
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                fullWidth
                size="large"
                startIcon={<CancelIcon />}
              >
                VAZGEÇ
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                fullWidth
                size="large"
                startIcon={<SaveIcon />}
              >
                {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
              </Button>
            </Stack>

            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="subtitle2" gutterBottom>
                Form Özeti
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Depo Adı:</strong> {formData.name || "Belirtilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Adres:</strong> {formData.address || "Belirtilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Konum:</strong>{" "}
                  {formData.district && formData.city
                    ? `${formData.district}, ${formData.city}`
                    : "Belirtilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Yurt Dışı:</strong>{" "}
                  {formData.is_abroad ? "Evet" : "Hayır"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Varsayılan Depo:</strong>{" "}
                  {formData.is_default ? "Evet" : "Hayır"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddWarehouseForm;
