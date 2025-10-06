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
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Alert,
  Stack,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  productService,
  warehouseService,
  inventoryStockService,
} from "../services/inventoryService";

interface ProductFormData {
  name: string;
  productCode: string;
  barcode: string;
  category: string;
  photo: File | null;
  unit: string;
  stockTracking: boolean;
  initialStock: {
    [key: string]: number;
  };
  criticalStockWarning: {
    totalQuantity: boolean;
    warehouseBased: boolean;
  };
  purchasePriceExcludingTax: number;
  salePriceExcludingTax: number;
  vatRate: string;
  purchasePriceIncludingTax: number;
  salePriceIncludingTax: number;
  currency: string;
  gtipCodes: string[];
}

const AddProductForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    productCode: "",
    barcode: "",
    category: "KATEGORİSİZ",
    photo: null,
    unit: "Adet",
    stockTracking: true,
    initialStock: {
      mainWarehouse: 0,
      fixedAsset: 0,
      sedatBey: 0,
    },
    criticalStockWarning: {
      totalQuantity: false,
      warehouseBased: false,
    },
    purchasePriceExcludingTax: 0,
    salePriceExcludingTax: 0,
    vatRate: "%20 KDV",
    purchasePriceIncludingTax: 0,
    salePriceIncludingTax: 0,
    currency: "TRY",
    gtipCodes: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const warehousesData = await warehouseService.getAllWarehouses();
      setWarehouses(warehousesData);
    } catch (err) {
      console.error("Error loading warehouses:", err);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (
    parentField: keyof ProductFormData,
    childField: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as any),
        [childField]: value,
      },
    }));
  };

  const handlePriceChange = (field: string, value: number) => {
    const vatRate = parseFloat(
      formData.vatRate.replace("%", "").replace(" KDV", "")
    );
    const vatMultiplier = 1 + vatRate / 100;

    if (field === "purchasePriceExcludingTax") {
      setFormData((prev) => ({
        ...prev,
        purchasePriceExcludingTax: value,
        purchasePriceIncludingTax: value * vatMultiplier,
      }));
    } else if (field === "salePriceExcludingTax") {
      setFormData((prev) => ({
        ...prev,
        salePriceExcludingTax: value,
        salePriceIncludingTax: value * vatMultiplier,
      }));
    } else if (field === "purchasePriceIncludingTax") {
      setFormData((prev) => ({
        ...prev,
        purchasePriceIncludingTax: value,
        purchasePriceExcludingTax: value / vatMultiplier,
      }));
    } else if (field === "salePriceIncludingTax") {
      setFormData((prev) => ({
        ...prev,
        salePriceIncludingTax: value,
        salePriceExcludingTax: value / vatMultiplier,
      }));
    }
  };

  const handleAddGtipCode = () => {
    setFormData((prev) => ({
      ...prev,
      gtipCodes: [...prev.gtipCodes, ""],
    }));
  };

  const handleRemoveGtipCode = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gtipCodes: prev.gtipCodes.filter((_, i) => i !== index),
    }));
  };

  const handleGtipCodeChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      gtipCodes: prev.gtipCodes.map((code, i) => (i === index ? value : code)),
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Ürün adı zorunludur");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create product
      const productData = {
        name: formData.name,
        product_code: formData.productCode || null,
        barcode: formData.barcode || null,
        category: formData.category,
        type: "product" as const,
        unit: formData.unit,
        description: null,
        stock_tracking: formData.stockTracking,
        critical_stock_level: 0,
        purchase_price_excluding_tax: formData.purchasePriceExcludingTax,
        sale_price_excluding_tax: formData.salePriceExcludingTax,
        vat_rate:
          parseFloat(
            formData.vatRate.replace("%", "").replace("KDV", "").trim()
          ) || 20,
        purchase_price_including_tax: formData.purchasePriceIncludingTax,
        sale_price_including_tax: formData.salePriceIncludingTax,
        currency: formData.currency,
        gtip_codes: formData.gtipCodes.filter((code) => code.trim()),
        status: "active" as const,
      };

      const newProduct = await productService.createProduct(productData);

      // If stock tracking is enabled, create initial stock entries
      if (formData.stockTracking && warehouses.length > 0) {
        for (const warehouse of warehouses) {
          const stockQuantity =
            formData.initialStock[
              warehouse.name.toLowerCase().replace(/\s+/g, "")
            ] || 0;
          if (stockQuantity > 0) {
            await inventoryStockService.adjustStock(
              newProduct.id,
              warehouse.id,
              stockQuantity,
              "İlk stok girişi"
            );
          }
        }
      }

      setSuccessMessage("Ürün başarıyla eklendi!");
      setTimeout(() => {
        navigate("/accounting/stock/products");
      }, 2000);
    } catch (err) {
      console.error("Error creating product:", err);
      setError("Ürün eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/stock/products");
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Hizmet ve Ürünler &gt; Yeni
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Yeni hizmet veya ürün ekleyin
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
            {/* Genel Bilgiler */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Genel Bilgiler
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ADI"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ürün adını girin"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ÜRÜN / STOK KODU"
                  value={formData.productCode}
                  onChange={(e) =>
                    handleInputChange("productCode", e.target.value)
                  }
                  placeholder="Ürün kodunu girin"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="BARKOD NUMARASI"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  placeholder="Barkod numarasını girin"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>KATEGORİSİ</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    label="KATEGORİSİ"
                  >
                    <MenuItem value="KATEGORİSİZ">KATEGORİSİZ</MenuItem>
                    <MenuItem value="Elektrik">Elektrik</MenuItem>
                    <MenuItem value="Teknoloji">Teknoloji</MenuItem>
                    <MenuItem value="Güvenlik">Güvenlik</MenuItem>
                    <MenuItem value="Aydınlatma">Aydınlatma</MenuItem>
                    <MenuItem value="Hizmet">Hizmet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  component="label"
                  fullWidth
                  sx={{ height: 56 }}
                >
                  FOTOĞRAF YÜKLE
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </Button>
                {formData.photo && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Seçilen dosya: {formData.photo.name}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ALIŞ / SATIŞ BİRİMİ</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    label="ALIŞ / SATIŞ BİRİMİ"
                  >
                    <MenuItem value="Adet">Adet</MenuItem>
                    <MenuItem value="Kg">Kg</MenuItem>
                    <MenuItem value="Litre">Litre</MenuItem>
                    <MenuItem value="Metre">Metre</MenuItem>
                    <MenuItem value="Paket">Paket</MenuItem>
                    <MenuItem value="Kutu">Kutu</MenuItem>
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Birim değişikliği geriye dönük olarak faturalara yansır.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ÜRÜN TANIMLAMA KODLARI
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddGtipCode}
                    size="small"
                  >
                    + GTİP KODU EKLE
                  </Button>
                </Box>
                {formData.gtipCodes.map((code, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", mb: 1 }}
                  >
                    <TextField
                      value={code}
                      onChange={(e) =>
                        handleGtipCodeChange(index, e.target.value)
                      }
                      placeholder="GTİP kodu girin"
                      size="small"
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <IconButton
                      onClick={() => handleRemoveGtipCode(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Stok Takibi */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Stok Takibi
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                STOK TAKİBİ
              </Typography>
              <RadioGroup
                value={formData.stockTracking}
                onChange={(e) =>
                  handleInputChange("stockTracking", e.target.value === "true")
                }
                row
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label="YAPILSIN"
                />
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  label="YAPILMASIN"
                />
              </RadioGroup>
            </Box>

            {formData.stockTracking && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  BAŞLANGIÇ STOK MİKTARI
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ANA DEPO"
                      type="number"
                      value={formData.initialStock.mainWarehouse}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "initialStock",
                          "mainWarehouse",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="DEMİRBAŞ"
                      type="number"
                      value={formData.initialStock.fixedAsset}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "initialStock",
                          "fixedAsset",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="SEDAT BEY"
                      type="number"
                      value={formData.initialStock.sedatBey}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "initialStock",
                          "sedatBey",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      inputProps={{ step: 0.01 }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    KRİTİK STOK UYARISI
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.criticalStockWarning.totalQuantity}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "criticalStockWarning",
                            "totalQuantity",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Toplam ürün miktarı için belirle"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.criticalStockWarning.warehouseBased}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "criticalStockWarning",
                            "warehouseBased",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Depo bazında ürün miktarı için belirle"
                  />
                </Box>
              </>
            )}

            <Divider sx={{ my: 4 }} />

            {/* Fiyatlandırma */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Fiyatlandırma
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="VERGİLER HARİÇ ALIŞ FİYATI"
                  type="number"
                  value={formData.purchasePriceExcludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "purchasePriceExcludingTax",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Box
                        sx={{ display: "flex", alignItems: "center", ml: 1 }}
                      >
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {formData.currency === "TRY" ? "₺" : "$"}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={formData.currency}
                            onChange={(e) =>
                              handleInputChange("currency", e.target.value)
                            }
                            variant="standard"
                          >
                            <MenuItem value="TRY">TRY</MenuItem>
                            <MenuItem value="USD">USD</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="VERGİLER HARİÇ SATIŞ FİYATI"
                  type="number"
                  value={formData.salePriceExcludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "salePriceExcludingTax",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Box
                        sx={{ display: "flex", alignItems: "center", ml: 1 }}
                      >
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {formData.currency === "TRY" ? "₺" : "$"}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={formData.currency}
                            onChange={(e) =>
                              handleInputChange("currency", e.target.value)
                            }
                            variant="standard"
                          >
                            <MenuItem value="TRY">TRY</MenuItem>
                            <MenuItem value="USD">USD</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    ),
                  }}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>KDV</InputLabel>
                  <Select
                    value={formData.vatRate}
                    onChange={(e) =>
                      handleInputChange("vatRate", e.target.value)
                    }
                    label="KDV"
                  >
                    <MenuItem value="%0 KDV">%0 KDV</MenuItem>
                    <MenuItem value="%1 KDV">%1 KDV</MenuItem>
                    <MenuItem value="%8 KDV">%8 KDV</MenuItem>
                    <MenuItem value="%18 KDV">%18 KDV</MenuItem>
                    <MenuItem value="%20 KDV">%20 KDV</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                  DİĞER VERGİ EKLE
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="VERGİLER DAHİL ALIŞ FİYATI"
                  type="number"
                  value={formData.purchasePriceIncludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "purchasePriceIncludingTax",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="VERGİLER DAHİL SATIŞ FİYATI"
                  type="number"
                  value={formData.salePriceIncludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "salePriceIncludingTax",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
            </Grid>
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
              >
                VAZGEÇ
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                fullWidth
                size="large"
                startIcon={<MoneyIcon />}
              >
                {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" gutterBottom>
              Form Özeti
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Ürün Adı:</strong> {formData.name || "Belirtilmemiş"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Kategori:</strong> {formData.category}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Birim:</strong> {formData.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Stok Takibi:</strong>{" "}
                {formData.stockTracking ? "Aktif" : "Pasif"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Para Birimi:</strong> {formData.currency}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddProductForm;
