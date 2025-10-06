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
  Stack,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Avatar,
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
  Receipt as ReceiptIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { invoiceService, Invoice } from "../services/salesService";

// Remove duplicate interface - using imported Invoice type

const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("2024-09-24 - 2024-09-24");

  // Load invoices from API
  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dateFrom, dateTo] = dateRange.split(" - ");

      // Safe date parsing with validation
      let parsedDateFrom: string | undefined;
      let parsedDateTo: string | undefined;

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          parsedDateFrom = fromDate.toISOString();
        } else {
          console.warn("Invalid dateFrom:", dateFrom);
        }
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          parsedDateTo = toDate.toISOString();
        } else {
          console.warn("Invalid dateTo:", dateTo);
        }
      }

      const result = await invoiceService.getInvoices({
        page,
        limit: rowsPerPage,
        search: searchTerm,
        status: filterStatus === "all" ? undefined : filterStatus,
        type: filterType === "all" ? undefined : filterType,
        dateFrom: parsedDateFrom,
        dateTo: parsedDateTo,
      });

      setInvoices(result.data);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Faturalar yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [page, searchTerm, filterStatus, filterType, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Tahsil Edildi":
        return "success";
      case "Gecikmiş":
        return "error";
      case "Tahsil Edilecek":
        return "warning";
      case "Proforma":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "e-Arşiv Fatura":
      case "Ticari e-Fatura":
        return <ReceiptIcon />;
      case "Satış Faturası":
        return <ReceiptIcon />;
      case "Proforma":
        return <ScheduleIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "E-POSTALANDI":
        return <EmailIcon />;
      case "ONAYLANDI":
        return <CheckCircleIcon />;
      default:
        return undefined;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Bilinmiyor";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return "Geçersiz tarih";
      }
      return date.toLocaleDateString("tr-TR");
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "Geçersiz tarih";
    }
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "Bilinmiyor";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string for relative time:", dateString);
        return "Geçersiz tarih";
      }
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) return "Bugün";
      if (diffInDays === 1) return "Dün";
      if (diffInDays < 7) return `${diffInDays} gün önce`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} hafta önce`;
      return `${Math.floor(diffInDays / 30)} ay önce`;
    } catch (error) {
      console.warn("Relative time calculation error:", error);
      return "Geçersiz tarih";
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    invoice: Invoice
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedInvoice(null);
  };

  const handleView = () => {
    if (selectedInvoice) {
      navigate(`/accounting/sales/invoices/view/${selectedInvoice.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedInvoice) {
      navigate(`/accounting/sales/invoices/edit/${selectedInvoice.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedInvoice) {
      try {
        await invoiceService.deleteInvoice(selectedInvoice.id);
        setSuccessMessage("Fatura başarıyla silindi");
        loadInvoices(); // Reload invoices
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Fatura silinirken hata oluştu"
        );
      }
    }
    handleMenuClose();
  };

  const handleNewInvoice = () => {
    navigate("/accounting/sales/invoices/new");
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
    if (field === "status") {
      setFilterStatus(value);
    } else if (field === "type") {
      setFilterType(value);
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
          Faturalar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fatura bilgilerini yönetin ve takip edin
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Tarih Aralığı"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            placeholder="YYYY-MM-DD - YYYY-MM-DD"
            helperText="Format: 2024-09-24 - 2024-09-24"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            onClick={handleFilterClick}
            sx={{ minWidth: 120 }}
          >
            FİLTRELE
          </Button>

          <TextField
            placeholder="İçerisinde ara..."
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
            onClick={handleNewInvoice}
            sx={{
              background: "linear-gradient(45deg, #d32f2f, #f44336)",
              minWidth: 200,
            }}
          >
            YENİ FATURA OLUŞTUR
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
              <InputLabel>Durum</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="Tahsil Edilecek">Tahsil Edilecek</MenuItem>
                <MenuItem value="Tahsil Edildi">Tahsil Edildi</MenuItem>
                <MenuItem value="Gecikmiş">Gecikmiş</MenuItem>
                <MenuItem value="Proforma">Proforma</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
          <MenuItem>
            <FormControl fullWidth size="small">
              <InputLabel>Fatura Türü</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="Satış Faturası">Satış Faturası</MenuItem>
                <MenuItem value="e-Arşiv Fatura">e-Arşiv Fatura</MenuItem>
                <MenuItem value="Ticari e-Fatura">Ticari e-Fatura</MenuItem>
                <MenuItem value="Proforma">Proforma</MenuItem>
              </Select>
            </FormControl>
          </MenuItem>
        </Menu>
      </Paper>

      {/* Invoices Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>FATURA İSMİ</TableCell>
              <TableCell>FATURA NO</TableCell>
              <TableCell>DÜZENLEME TARİHİ</TableCell>
              <TableCell>VADE TARİHİ</TableCell>
              <TableCell>KALAN MEBLAĞ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? "Arama kriterlerinize uygun fatura bulunamadı"
                      : "Henüz fatura bulunmuyor"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  hover
                  onClick={() =>
                    navigate(`/accounting/sales/invoices/view/${invoice.id}`)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {getTypeIcon(invoice.invoice_type)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {invoice.invoice_name}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={invoice.category}
                            size="small"
                            color="default"
                          />
                          {invoice.payment_status && (
                            <Chip
                              {...(getPaymentStatusIcon(
                                invoice.payment_status
                              ) && {
                                icon: getPaymentStatusIcon(
                                  invoice.payment_status
                                ),
                              })}
                              label={invoice.payment_status}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.invoice_number || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(invoice.issue_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.invoice_type}
                      </Typography>
                      {invoice.payment_status && (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            {...(getPaymentStatusIcon(
                              invoice.payment_status
                            ) && {
                              icon: getPaymentStatusIcon(
                                invoice.payment_status
                              ),
                            })}
                            label={invoice.payment_status}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(invoice.due_date)}
                      </Typography>
                      {invoice.is_overdue && invoice.overdue_days && (
                        <Typography variant="caption" color="error">
                          ({invoice.overdue_days} gün gecikti)
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {invoice.status === "Tahsil Edildi" ? (
                        <Typography
                          variant="body2"
                          color="success.main"
                          fontWeight="medium"
                        >
                          Tahsil edildi
                        </Typography>
                      ) : (
                        <>
                          <Typography
                            variant="h6"
                            color="primary"
                            fontWeight="bold"
                          >
                            {formatCurrency(invoice.remaining_amount)}
                          </Typography>
                          <Chip
                            label={invoice.status}
                            size="small"
                            color={getStatusColor(invoice.status) as any}
                          />
                        </>
                      )}
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
          Toplam {totalRecords} fatura gösteriliyor
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

export default InvoicesList;
