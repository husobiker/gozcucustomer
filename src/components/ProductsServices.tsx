import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Checkbox,
  InputAdornment,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import {
  productService,
  Product,
  InventoryStock,
} from "../services/inventoryService";

interface ProductWithStock extends Product {
  totalStock: number;
  stockInfo: InventoryStock[];
}

const ProductsServices: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsWithStock = await productService.getProductsWithStock();

      // Calculate total stock for each product
      const productsWithTotalStock: ProductWithStock[] = productsWithStock.map(
        (product) => {
          const totalStock =
            product.stock_info?.reduce(
              (sum, stock) => sum + stock.current_stock,
              0
            ) || 0;
          return {
            ...product,
            totalStock,
            stockInfo: product.stock_info || [],
          };
        }
      );

      setProducts(productsWithTotalStock);
      setLoading(false);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Ürünler yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedProducts(filteredProducts.map((product) => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleUpdateStock = () => {
    if (selectedProducts.length === 0) {
      setError("Lütfen stok güncellemek için ürün seçin");
      return;
    }
    setSuccessMessage(
      `${selectedProducts.length} ürün için stok güncelleme sayfası açılacak`
    );
  };

  const handleAddProduct = () => {
    navigate("/accounting/stock/products/new");
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setSuccessMessage("Ürün silindi");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Ürün silinirken hata oluştu");
    }
  };

  const handleRowClick = (productId: string) => {
    navigate(`/accounting/stock/products/${productId}`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "inStock" && product.totalStock > 0) ||
      (stockFilter === "outOfStock" && product.totalStock <= 0) ||
      (stockFilter === "negativeStock" && product.totalStock < 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Hizmet ve Ürünler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ürün ve hizmetlerinizi yönetin, stok durumlarını takip edin
        </Typography>
      </Box>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Filter Button */}
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterMenuOpen}
            sx={{ minWidth: 120 }}
          >
            FİLTRELE
          </Button>

          {/* Search */}
          <TextField
            placeholder="Ara..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />

          {/* Action Buttons */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<InventoryIcon />}
            onClick={handleUpdateStock}
            disabled={selectedProducts.length === 0}
            sx={{ minWidth: 140 }}
          >
            STOK GÜNCELLE
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
            sx={{ minWidth: 160 }}
          >
            HİZMET / ÜRÜN EKLE
          </Button>
        </Stack>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Kategori"
            >
              <MenuItem value="all">Tüm Kategoriler</MenuItem>
              {Array.from(new Set(products.map((p) => p.category))).map(
                (category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Stok Durumu</InputLabel>
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              label="Stok Durumu"
            >
              <MenuItem value="all">Tüm Durumlar</MenuItem>
              <MenuItem value="inStock">Stokta</MenuItem>
              <MenuItem value="outOfStock">Stok Yok</MenuItem>
              <MenuItem value="negativeStock">Negatif Stok</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedProducts.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    indeterminate={
                      selectedProducts.length > 0 &&
                      selectedProducts.length < filteredProducts.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    ADI
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle2" fontWeight="bold">
                    STOK MİKTARI
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    ALIŞ (VERGİLER HARİÇ)
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    SATIŞ (VERGİLER HARİÇ)
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Ürünler yükleniyor...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm
                        ? "Arama kriterlerinize uygun ürün bulunamadı"
                        : "Henüz ürün eklenmemiş"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                    onClick={() => handleRowClick(product.id)}
                  >
                    <TableCell
                      padding="checkbox"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InventoryIcon
                          sx={{ color: "text.secondary", fontSize: 20 }}
                        />
                        <Typography variant="body2">{product.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Typography variant="body2">
                          {product.totalStock.toFixed(2)} {product.unit}
                        </Typography>
                        <Chip
                          label={getStockStatusText(product.totalStock)}
                          color={getStockStatusColor(product.totalStock)}
                          size="small"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatPrice(
                          product.purchase_price_excluding_tax,
                          product.currency
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatPrice(
                          product.sale_price_excluding_tax,
                          product.currency
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {filteredProducts.length} ürün gösteriliyor
          {selectedProducts.length > 0 &&
            ` • ${selectedProducts.length} ürün seçili`}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProductsServices;
