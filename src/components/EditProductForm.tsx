import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import {
  productService,
  warehouseService,
  inventoryStockService,
  Product,
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

const EditProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadWarehouses();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    setInitialLoading(true);
    try {
      const product = await productService.getProductById(id);
      if (product) {
        setOriginalProduct(product);

        // Populate form with existing product data
        setFormData({
          name: product.name,
          productCode: product.product_code || "",
          barcode: product.barcode || "",
          category: product.category,
          photo: null, // We don't handle photo updates in this version
          unit: product.unit,
          stockTracking: product.stock_tracking,
          initialStock: {
            mainWarehouse: 0,
            fixedAsset: 0,
            sedatBey: 0,
          },
          criticalStockWarning: {
            totalQuantity: false,
            warehouseBased: false,
          },
          purchasePriceExcludingTax: product.purchase_price_excluding_tax,
          salePriceExcludingTax: product.sale_price_excluding_tax,
          vatRate: `%${product.vat_rate} KDV`,
          purchasePriceIncludingTax: product.purchase_price_including_tax,
          salePriceIncludingTax: product.sale_price_including_tax,
          currency: product.currency,
          gtipCodes: product.gtip_codes || [],
        });
      } else {
        setError("Ürün bulunamadı");
      }
    } catch (err) {
      console.error("Error loading product:", err);
      setError("Ürün yüklenirken hata oluştu");
    } finally {
      setInitialLoading(false);
    }
  };

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
    const numericValue = isNaN(value) ? 0 : value;

    if (field.includes("ExcludingTax")) {
      const vatRate =
        parseFloat(
          formData.vatRate.replace("%", "").replace("KDV", "").trim()
        ) || 20;
      const includingTax = numericValue * (1 + vatRate / 100);

      setFormData((prev) => ({
        ...prev,
        [field]: numericValue,
        [field.replace("ExcludingTax", "IncludingTax")]: includingTax,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: numericValue,
      }));
    }
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

    if (!originalProduct) {
      setError("Ürün bilgileri yüklenemedi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update product
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

      await productService.updateProduct(originalProduct.id, productData);

      setSuccessMessage("Ürün başarıyla güncellendi!");
      setTimeout(() => {
        navigate(`/accounting/stock/products/${originalProduct.id}`);
      }, 2000);
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Ürün güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (originalProduct) {
      navigate(`/accounting/stock/products/${originalProduct.id}`);
    } else {
      navigate("/accounting/stock/products");
    }
  };

  const handleBack = () => {
    handleCancel();
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Ürün bilgileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error && !originalProduct) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={handleBack}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Hizmet ve Ürünler &gt; Düzenle
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ürün bilgilerini güncelleyin
            </Typography>
          </Box>
        </Stack>
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
        {/* Left Column - Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Genel Bilgiler
            </Typography>

            <Grid container spacing={3}>
              {/* Product Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ADI"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </Grid>

              {/* Product Code */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ÜRÜN / STOK KODU"
                  value={formData.productCode}
                  onChange={(e) =>
                    handleInputChange("productCode", e.target.value)
                  }
                />
              </Grid>

              {/* Barcode */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="BARKOD NUMARASI"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
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
                    <MenuItem value="İnşaat">İnşaat</MenuItem>
                    <MenuItem value="Güvenlik">Güvenlik</MenuItem>
                    <MenuItem value="Diğer">Diğer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Unit */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>ALIŞ / SATIŞ BİRİMİ</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    label="ALIŞ / SATIŞ BİRİMİ"
                  >
                    <MenuItem value="Adet">Adet</MenuItem>
                    <MenuItem value="Metre">Metre</MenuItem>
                    <MenuItem value="Kilogram">Kilogram</MenuItem>
                    <MenuItem value="Litre">Litre</MenuItem>
                    <MenuItem value="Paket">Paket</MenuItem>
                    <MenuItem value="Kutu">Kutu</MenuItem>
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Birim değişikliği geriye dönük olarak faturalara yansır.
                </Typography>
              </Grid>

              {/* Photo Upload */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  component="label"
                  sx={{ mb: 2 }}
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
                  <Typography variant="body2" color="success.main">
                    {formData.photo.name} seçildi
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Product Identification Codes */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              ÜRÜN TANIMLAMA KODLARI
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} sx={{ mb: 2 }}>
              + GTİP KODU EKLE
            </Button>

            <Divider sx={{ my: 3 }} />

            {/* Stock Management */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              STOK TAKİBİ
            </Typography>
            <RadioGroup
              value={formData.stockTracking ? "yes" : "no"}
              onChange={(e) =>
                handleInputChange("stockTracking", e.target.value === "yes")
              }
              sx={{ mb: 3 }}
            >
              <FormControlLabel
                value="yes"
                control={<Radio />}
                label="YAPILSIN"
              />
              <FormControlLabel
                value="no"
                control={<Radio />}
                label="YAPILMASIN"
              />
            </RadioGroup>

            {formData.stockTracking && (
              <>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  BAŞLANGIÇ STOK MİKTARI
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Başlangıç Stok Miktarlarını, stok geçmişinde
                  düzenleyebilirsiniz.
                </Typography>

                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
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
              </>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Pricing */}
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              FİYAT BİLGİLERİ
            </Typography>

            <Grid container spacing={3}>
              {/* Purchase Price Excluding Tax */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VERGİLER HARİÇ ALIŞ FİYATI"
                  type="number"
                  value={formData.purchasePriceExcludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "purchasePriceExcludingTax",
                      parseFloat(e.target.value)
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                />
              </Grid>

              {/* Sale Price Excluding Tax */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VERGİLER HARİÇ SATIŞ FİYATI"
                  type="number"
                  value={formData.salePriceExcludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "salePriceExcludingTax",
                      parseFloat(e.target.value)
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                />
              </Grid>

              {/* VAT Rate */}
              <Grid item xs={12} sm={6}>
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
                <Button variant="text" size="small" sx={{ mt: 1 }}>
                  DİĞER VERGİ EKLE
                </Button>
              </Grid>

              {/* Currency */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>PARA BİRİMİ</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) =>
                      handleInputChange("currency", e.target.value)
                    }
                    label="PARA BİRİMİ"
                  >
                    <MenuItem value="TRY">TRY (₺)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Purchase Price Including Tax */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VERGİLER DAHİL ALIŞ FİYATI"
                  type="number"
                  value={formData.purchasePriceIncludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "purchasePriceIncludingTax",
                      parseFloat(e.target.value)
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                />
              </Grid>

              {/* Sale Price Including Tax */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VERGİLER DAHİL SATIŞ FİYATI"
                  type="number"
                  value={formData.salePriceIncludingTax}
                  onChange={(e) =>
                    handlePriceChange(
                      "salePriceIncludingTax",
                      parseFloat(e.target.value)
                    )
                  }
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {formData.currency === "TRY" ? "₺" : "$"}
                      </Typography>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              İşlemler
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleCancel}
                disabled={loading}
              >
                VAZGEÇ
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<MoneyIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "$ KAYDET"}
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Form Özeti
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Ürün Adı:</strong> {formData.name || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Kategori:</strong> {formData.category}
              </Typography>
              <Typography variant="body2">
                <strong>Birim:</strong> {formData.unit}
              </Typography>
              <Typography variant="body2">
                <strong>Stok Takibi:</strong>{" "}
                {formData.stockTracking ? "Aktif" : "Pasif"}
              </Typography>
              <Typography variant="body2">
                <strong>Para Birimi:</strong> {formData.currency}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditProductForm;
