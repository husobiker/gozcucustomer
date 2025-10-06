import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  History as HistoryIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import {
  productService,
  Product,
  InventoryStock,
} from "../services/inventoryService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockInfo, setStockInfo] = useState<InventoryStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const productData = await productService.getProductById(id);
      if (productData) {
        setProduct(productData);
        // Load stock information if available
        const productsWithStock = await productService.getProductsWithStock();
        const productWithStock = productsWithStock.find((p) => p.id === id);
        if (productWithStock?.stock_info) {
          setStockInfo(productWithStock.stock_info);
        }
      } else {
        setError("Ürün bulunamadı");
      }
    } catch (err) {
      console.error("Error loading product:", err);
      setError("Ürün yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/accounting/stock/products/${id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !product ||
      !window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")
    ) {
      return;
    }

    try {
      await productService.deleteProduct(product.id);
      navigate("/accounting/stock/products");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Ürün silinirken hata oluştu");
    }
  };

  const handleBack = () => {
    navigate("/accounting/stock/products");
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "-";
    return `${price.toFixed(2)}${currency === "TRY" ? "₺" : "$"}`;
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity < 0) return "error";
    if (quantity === 0) return "warning";
    return "success";
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity < 0) return "Negatif Stok";
    if (quantity === 0) return "Stok Yok";
    return "Stokta";
  };

  const totalStock = stockInfo.reduce(
    (sum, stock) => sum + stock.current_stock,
    0
  );

  if (loading) {
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
          Ürün yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Ürün bulunamadı"}
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
          <InventoryIcon sx={{ color: "text.secondary", fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ürün Detayları
            </Typography>
          </Box>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            DÜZENLE
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            SİL
          </Button>
        </Stack>
      </Box>

      {/* Product Info Cards */}
      <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <MoneyIcon sx={{ color: "success.main", fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {formatPrice(
                  product.sale_price_excluding_tax,
                  product.currency
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Satış Fiyatı (Vergiler Hariç)
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <MoneyIcon sx={{ color: "info.main", fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {formatPrice(
                  product.purchase_price_excluding_tax,
                  product.currency
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alış Fiyatı (Vergiler Hariç)
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <InventoryIcon sx={{ color: "primary.main", fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {totalStock.toFixed(2)} {product.unit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Stok
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {/* Product Details */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Ürün Bilgileri
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Ürün Kodu:
              </Typography>
              <Typography variant="body2">
                {product.product_code || "-"}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Barkod:
              </Typography>
              <Typography variant="body2">{product.barcode || "-"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Kategori:
              </Typography>
              <Typography variant="body2">{product.category}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Birim:
              </Typography>
              <Typography variant="body2">{product.unit}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                KDV Oranı:
              </Typography>
              <Typography variant="body2">%{product.vat_rate}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Para Birimi:
              </Typography>
              <Typography variant="body2">{product.currency}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Stok Takibi:
              </Typography>
              <Chip
                label={product.stock_tracking ? "Aktif" : "Pasif"}
                color={product.stock_tracking ? "success" : "default"}
                size="small"
              />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Durum:
              </Typography>
              <Chip
                label={product.status === "active" ? "Aktif" : "Pasif"}
                color={product.status === "active" ? "success" : "default"}
                size="small"
              />
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
          >
            <Tab icon={<HistoryIcon />} label="Stok Geçmişi" />
            <Tab icon={<MoneyIcon />} label="Fiyat Geçmişi" />
            <Tab icon={<CartIcon />} label="Satışlar" />
            <Tab icon={<ShippingIcon />} label="Alışlar" />
            <Tab icon={<StoreIcon />} label="Depolar" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Stok Geçmişi
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>İşlem Türü</TableCell>
                  <TableCell>Müşteri / Tedarikçi</TableCell>
                  <TableCell>İşlem Tarihi</TableCell>
                  <TableCell>Depo</TableCell>
                  <TableCell align="right">Miktar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockInfo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Henüz stok hareketi bulunmuyor
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stockInfo.map((stock, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <InventoryIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            Başlangıç Stok Miktarı
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Typography variant="body2">
                            {stock.current_stock.toFixed(2)} {product.unit}
                          </Typography>
                          <Chip
                            label={getStockStatusText(stock.current_stock)}
                            color={getStockStatusColor(stock.current_stock)}
                            size="small"
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Fiyat Geçmişi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fiyat geçmişi özelliği yakında eklenecek.
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Satışlar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Satış geçmişi özelliği yakında eklenecek.
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Alışlar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Alış geçmişi özelliği yakında eklenecek.
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Depolar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Depo bilgileri özelliği yakında eklenecek.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProductDetail;
