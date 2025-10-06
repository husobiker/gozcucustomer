import React, { useState, useEffect } from "react";
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
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Stack,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { customerService, Customer } from "../services/salesService";

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Load customers from API
  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerService.getCustomers({
        page,
        limit: rowsPerPage,
        search: searchTerm,
        type: filterType === "all" ? undefined : filterType,
        category: filterCategory === "all" ? undefined : filterCategory,
      });

      setCustomers(result.data);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Müşteriler yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, searchTerm, filterType, filterCategory]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SITE":
        return "default";
      case "ŞAHIS":
        return "primary";
      default:
        return "default";
    }
  };

  const getCategoryIcon = (type: string) => {
    return type === "Tüzel Kişi" ? <BusinessIcon /> : <PersonIcon />;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Bugün";
    if (diffInDays === 1) return "Dün";
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} hafta önce`;
    return `${Math.floor(diffInDays / 30)} ay önce`;
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    customer: Customer
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleView = () => {
    if (selectedCustomer) {
      navigate(`/accounting/sales/customers/view/${selectedCustomer.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedCustomer) {
      navigate(`/accounting/sales/customers/edit/${selectedCustomer.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedCustomer) {
      try {
        await customerService.deleteCustomer(selectedCustomer.id);
        setSuccessMessage("Müşteri başarıyla silindi");
        loadCustomers(); // Reload customers
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Müşteri silinirken hata oluştu"
        );
      }
    }
    handleMenuClose();
  };

  const handleNewCustomer = () => {
    navigate("/accounting/sales/customers/new");
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (field: string, value: string) => {
    if (field === "type") {
      setFilterType(value);
    } else if (field === "category") {
      setFilterCategory(value);
    }
    setPage(1); // Reset to first page when filtering
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={handleCloseSnackbar}>
          {successMessage}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Müşteriler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Müşteri bilgilerini yönetin ve takip edin
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={handleFilterClick}
            sx={{ minWidth: 120 }}
          >
            FİLTRELE
          </Button>

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

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewCustomer}
            sx={{
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              minWidth: 200,
            }}
          >
            YENİ MÜŞTERİ OLUŞTUR
          </Button>
        </Stack>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel>Tür</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="Tüzel Kişi">Tüzel Kişi</MenuItem>
                <MenuItem value="Gerçek Kişi">Gerçek Kişi</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="SITE">Site</MenuItem>
                <MenuItem value="ŞAHIS">Şahıs</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
        </Menu>
      </Paper>

      {/* Customers Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UNVANI</TableCell>
              <TableCell>VKN / TCKN</TableCell>
              <TableCell>BAKİYE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? "Arama kriterlerinize uygun müşteri bulunamadı"
                      : "Henüz müşteri bulunmuyor"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  onClick={() =>
                    navigate(`/accounting/sales/customers/view/${customer.id}`)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {getCategoryIcon(customer.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {customer.company_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {customer.email} • {customer.phone}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={customer.category}
                            size="small"
                            color={getCategoryColor(customer.category) as any}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={customer.type}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.tax_number || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                      >
                        {formatCurrency(customer.balance)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tahsil Edilecek
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {totalRecords} müşteri gösteriliyor
        </Typography>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} />
          Görüntüle
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Düzenle
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Sil
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomersList;
