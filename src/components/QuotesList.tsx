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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Pagination,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  Mail as MailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileDownload as DownloadIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { quoteService, Quote } from "../services/salesService";

// Remove duplicate interface - using imported Quote type

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [invoicedAmount, setInvoicedAmount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load quotes from API
  const loadQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusMap = {
        0: "awaiting_response",
        1: "approved",
        2: "rejected",
        3: "all",
      };

      const status = statusMap[tabValue as keyof typeof statusMap] || "all";

      const result = await quoteService.getQuotes({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: status === "all" ? undefined : status,
      });

      setQuotes(result.data);
      setTotalRecords(result.total);
      setTotalPages(result.totalPages);

      // Calculate totals
      const total = result.data.reduce(
        (sum, quote) => sum + quote.total_amount,
        0
      );
      const invoiced = result.data.reduce(
        (sum, quote) => sum + quote.invoiced_amount,
        0
      );
      setTotalAmount(total);
      setInvoicedAmount(invoiced);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Teklifler yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [currentPage, searchTerm, tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    quote: Quote
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedQuote(null);
  };

  const handleCreateQuote = () => {
    navigate("/accounting/sales/quotes/new");
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      navigate(`/accounting/sales/quotes/edit/${selectedQuote.id}`);
    }
    handleMenuClose();
  };

  const handleViewQuote = () => {
    if (selectedQuote) {
      navigate(`/accounting/sales/quotes/view/${selectedQuote.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteQuote = async () => {
    if (selectedQuote) {
      try {
        await quoteService.deleteQuote(selectedQuote.id);
        setSuccessMessage("Teklif başarıyla silindi");
        loadQuotes(); // Reload quotes
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Teklif silinirken hata oluştu"
        );
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_response":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "awaiting_response":
        return "CEVAP BEKLENİYOR";
      case "approved":
        return "ONAYLANDI";
      case "rejected":
        return "REDDEDİLDİ";
      default:
        return status;
    }
  };

  const getInvoiceStatusText = (status: string) => {
    switch (status) {
      case "not_created":
        return "Fatura Oluşturulmadı";
      case "created":
        return "Fatura Oluşturuldu";
      default:
        return status;
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}$`;
    }
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  // Remove client-side filtering since we're using server-side filtering

  return (
    <Box sx={{ p: 3 }}>
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
          Teklifler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Müşteri tekliflerini yönetin ve takip edin
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
            },
          }}
        >
          <Tab label="CEVAP BEKLENENLER" />
          <Tab label="ONAYLANANLAR" />
          <Tab label="REDDEDİLENLER" />
          <Tab label="TÜMÜ" />
        </Tabs>
      </Paper>

      {/* Filters and Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            sx={{ textTransform: "none" }}
          >
            FİLTRELE
          </Button>
          <TextField
            placeholder="Ara..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateQuote}
          sx={{
            backgroundColor: "#424242",
            "&:hover": { backgroundColor: "#303030" },
            textTransform: "none",
          }}
        >
          YENİ TEKLİF OLUŞTUR
        </Button>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>Tüm Durumlar</MenuItem>
        <MenuItem onClick={handleFilterClose}>Cevap Beklenenler</MenuItem>
        <MenuItem onClick={handleFilterClose}>Onaylananlar</MenuItem>
        <MenuItem onClick={handleFilterClose}>Reddedilenler</MenuItem>
      </Menu>

      {/* Quotes Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>TEKLİF İSMİ</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>FATURA</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  DÜZENLEME TARİHİ
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  TEKLİF TOPLAMI
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm
                        ? "Arama kriterlerinize uygun teklif bulunamadı"
                        : "Henüz teklif bulunmuyor"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    hover
                    onClick={() =>
                      navigate(`/accounting/sales/quotes/view/${quote.id}`)
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            backgroundColor: "#e0e0e0",
                            color: "#666",
                            width: 32,
                            height: 32,
                          }}
                        >
                          <DescriptionIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {quote.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {quote.customer_description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {getInvoiceStatusText(quote.invoice_status)}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#666",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {getStatusText(quote.status)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {quote.edit_date}
                        </Typography>
                        <Typography variant="caption" color="error">
                          (
                          {new Date(quote.edit_date).toLocaleDateString(
                            "tr-TR"
                          )}
                          )
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(quote.total_amount, quote.currency)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewQuote}>
          <VisibilityIcon sx={{ mr: 1 }} />
          Görüntüle
        </MenuItem>
        <MenuItem onClick={handleEditQuote}>
          <EditIcon sx={{ mr: 1 }} />
          Düzenle
        </MenuItem>
        <MenuItem onClick={handleDeleteQuote}>
          <DeleteIcon sx={{ mr: 1 }} />
          Sil
        </MenuItem>
      </Menu>

      {/* Footer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<MailIcon />}
            sx={{ textTransform: "none" }}
          >
            Mail
          </Button>
          <Button variant="outlined" sx={{ textTransform: "none" }}>
            KAYITLAR
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            disabled={loading}
          />

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary">
              {totalRecords} Kayıt
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {formatCurrency(totalAmount, "TRY")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fatura Edilen {formatCurrency(invoicedAmount, "TRY")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuotesList;
