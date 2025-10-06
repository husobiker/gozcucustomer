import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Share as ShareIcon,
  LocalShipping as TruckIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

interface TransferItem {
  id: string;
  product: string;
  quantity: number;
}

interface TransferFormData {
  movementName: string;
  outgoingWarehouse: string;
  deliveringPerson: string;
  incomingWarehouse: string;
  receivingPerson: string;
  preparationDate: string;
  actualShipmentDate: string;
  actualShipmentTime: string;
  items: TransferItem[];
}

const TransferForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TransferFormData>({
    movementName: "",
    outgoingWarehouse: "",
    deliveringPerson: "",
    incomingWarehouse: "",
    receivingPerson: "",
    preparationDate: "2025-09-24",
    actualShipmentDate: "2025-09-24",
    actualShipmentTime: "15:27",
    items: [
      {
        id: "1",
        product: "",
        quantity: 1,
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof TransferFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (itemId: string, field: keyof TransferItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addNewItem = () => {
    const newItem: TransferItem = {
      id: Date.now().toString(),
      product: "",
      quantity: 1,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.movementName.trim()) {
        throw new Error("Hareket adı gereklidir");
      }
      if (!formData.outgoingWarehouse) {
        throw new Error("Çıkış deposu seçilmelidir");
      }
      if (!formData.incomingWarehouse) {
        throw new Error("Giriş deposu seçilmelidir");
      }
      if (formData.outgoingWarehouse === formData.incomingWarehouse) {
        throw new Error("Çıkış ve giriş deposu aynı olamaz");
      }
      if (formData.items.length === 0 || formData.items.every(item => !item.product.trim())) {
        throw new Error("En az bir ürün eklenmelidir");
      }

      // Mock API call - gerçek API'ye bağlandığında değiştirilecek
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage("Transfer fişi başarıyla oluşturuldu");
      setTimeout(() => {
        navigate("/accounting/stock/transfers");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer fişi oluşturulurken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/stock/transfers");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Depolar Arası Transfer &gt; Yeni
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Yeni transfer fişi oluşturun
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
            {/* Transfer Details */}
            <Grid container spacing={3}>
              {/* HAREKET İSMİ */}
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <ShareIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    HAREKET İSMİ
                  </Typography>
                </Stack>
                <TextField
                  fullWidth
                  placeholder="Hareket adını girin"
                  value={formData.movementName}
                  onChange={(e) => handleInputChange("movementName", e.target.value)}
                />
              </Grid>

              {/* ÇIKIŞ DEPOSU */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <TruckIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    ÇIKIŞ DEPOSU
                  </Typography>
                </Stack>
                <FormControl fullWidth>
                  <Select
                    value={formData.outgoingWarehouse}
                    onChange={(e) => handleInputChange("outgoingWarehouse", e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Seçiniz
                    </MenuItem>
                    <MenuItem value="Ana Depo">Ana Depo</MenuItem>
                    <MenuItem value="Demirbaş">Demirbaş</MenuItem>
                    <MenuItem value="SEDAT BEY">SEDAT BEY</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* TESLİM EDEN */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <PersonIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    TESLİM EDEN
                  </Typography>
                </Stack>
                <TextField
                  fullWidth
                  placeholder="Teslim eden kişiyi girin"
                  value={formData.deliveringPerson}
                  onChange={(e) => handleInputChange("deliveringPerson", e.target.value)}
                />
              </Grid>

              {/* GİRİŞ DEPOSU */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <TruckIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    GİRİŞ DEPOSU
                  </Typography>
                </Stack>
                <FormControl fullWidth>
                  <Select
                    value={formData.incomingWarehouse}
                    onChange={(e) => handleInputChange("incomingWarehouse", e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Seçiniz
                    </MenuItem>
                    <MenuItem value="Ana Depo">Ana Depo</MenuItem>
                    <MenuItem value="Demirbaş">Demirbaş</MenuItem>
                    <MenuItem value="SEDAT BEY">SEDAT BEY</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* TESLİM ALAN */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <PersonIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    TESLİM ALAN
                  </Typography>
                </Stack>
                <TextField
                  fullWidth
                  placeholder="Teslim alan kişiyi girin"
                  value={formData.receivingPerson}
                  onChange={(e) => handleInputChange("receivingPerson", e.target.value)}
                />
              </Grid>

              {/* DÜZENLEME TARİHİ */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <CalendarIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    DÜZENLEME TARİHİ
                  </Typography>
                </Stack>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.preparationDate}
                  onChange={(e) => handleInputChange("preparationDate", e.target.value)}
                />
              </Grid>

              {/* FİİLİ SEVK TARİHİ */}
              <Grid item xs={12} md={6}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <CalendarIcon sx={{ color: "text.secondary" }} />
                  <Typography variant="h6" fontWeight="bold">
                    FİİLİ SEVK TARİHİ
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    type="date"
                    value={formData.actualShipmentDate}
                    onChange={(e) => handleInputChange("actualShipmentDate", e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <TextField
                    type="time"
                    value={formData.actualShipmentTime}
                    onChange={(e) => handleInputChange("actualShipmentTime", e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <TimeIcon sx={{ color: "text.secondary", mr: 1 }} />
                      ),
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>

            {/* Products Section */}
            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  ÜRÜN
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  MİKTAR
                </Typography>
              </Stack>

              <TableContainer>
                <Table>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ border: "none", p: 1 }}>
                          <TextField
                            fullWidth
                            placeholder="Ürün ara..."
                            value={item.product}
                            onChange={(e) => handleItemChange(item.id, "product", e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ border: "none", p: 1 }}>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            inputProps={{ step: 0.01, min: 0 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell sx={{ border: "none", p: 1 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(item.id)}
                            disabled={formData.items.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addNewItem}
                  sx={{ minWidth: 160 }}
                >
                  + YENİ SATIR EKLE
                </Button>
              </Box>
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
                Transfer Özeti
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Hareket:</strong> {formData.movementName || "Belirtilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Çıkış:</strong> {formData.outgoingWarehouse || "Seçilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Giriş:</strong> {formData.incomingWarehouse || "Seçilmemiş"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Ürün Sayısı:</strong> {formData.items.filter(item => item.product.trim()).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Tarih:</strong> {formData.preparationDate}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransferForm;
