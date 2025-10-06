import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Share as ShareIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { quoteService, Quote, QuoteItem } from "../services/salesService";
import { PDFService, QuotePDFData } from "../services/pdfService";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTenant } from "../contexts/TenantContext";

interface QuoteHistory {
  id: string;
  action: string;
  date: string;
  time: string;
  user: string;
  type: "update" | "create" | "note";
}

const QuoteView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [quoteData, setQuoteData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(
    null
  );

  useEffect(() => {
    if (id) {
      loadQuoteData();
    }
  }, [id]);

  const loadQuoteData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const quote = await quoteService.getQuote(id);

      // quote_items'ı items'a dönüştür
      const processedQuote = {
        ...quote,
        items: quote.quote_items || [],
      };

      setQuoteData(processedQuote);
    } catch (err) {
      setError("Teklif bilgileri yüklenirken hata oluştu");
      console.error("Error loading quote:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return format(date, "d MMMM yyyy", { locale: tr });
  };

  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return "";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return format(date, "d MMMM yyyy HH:mm", { locale: tr });
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>) => {
    setStatusAnchorEl(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusAnchorEl(null);
  };

  const handleStatusChange = async (
    newStatus: "awaiting_response" | "approved" | "rejected"
  ) => {
    if (!quoteData || !id) return;

    try {
      await quoteService.updateQuote(id, { ...quoteData, status: newStatus });
      setQuoteData({ ...quoteData, status: newStatus });
      setSuccessMessage("Teklif durumu güncellendi");
      setStatusAnchorEl(null);
    } catch (err) {
      setError("Durum güncellenirken hata oluştu");
      console.error("Error updating status:", err);
    }
  };

  const handleEdit = () => {
    navigate(`/accounting/sales/quotes/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm("Bu teklifi silmek istediğinizden emin misiniz?")) {
      try {
        await quoteService.deleteQuote(id);
        setSuccessMessage("Teklif silindi");
        setTimeout(() => {
          navigate("/accounting/sales/quotes");
        }, 1500);
      } catch (err) {
        setError("Teklif silinirken hata oluştu");
        console.error("Error deleting quote:", err);
      }
    }
  };

  const handlePrint = async () => {
    if (!quoteData) return;

    try {
      // Get company info from corporate settings
      const companyInfo = await PDFService.getCompanyInfo(tenant?.id || "");

      // Ensure items array exists and fix currency type
      const quoteWithItems = {
        ...quoteData,
        items: quoteData.items || [],
        currency: quoteData.currency as "TRY" | "USD",
      };

      // Generate quote number
      const quoteNumber = `T-${new Date().getFullYear()}-${String(quoteData.id)
        .slice(-6)
        .toUpperCase()}`;

      const pdfData: QuotePDFData = {
        quote: quoteWithItems,
        companyInfo,
        customerName: quoteData.customer_description || "Müşteri",
        offerDate: formatDate(quoteData.preparation_date),
        validityPeriod: "TEKLİF İLETİLDİKTEN 7 GÜN İÇERİSİNDE GEÇERLİDİR.",
        preparationDate: `${formatDate(
          quoteData.preparation_date
        )} tarihinde hazırlanmıştır.`,
        quoteNumber,
        terms: quoteData.terms || "",
      };

      await PDFService.printQuotePDF(pdfData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("PDF oluşturulurken hata oluştu");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (error || !quoteData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Teklif bulunamadı"}</Alert>
      </Box>
    );
  }

  // Calculate totals
  const subtotal =
    quoteData.items?.reduce((sum, item) => {
      const qty =
        typeof item.quantity === "string"
          ? parseFloat(item.quantity) || 0
          : item.quantity;
      const price =
        typeof item.unit_price === "string"
          ? parseFloat(item.unit_price) || 0
          : item.unit_price;
      const itemTotal = qty * price;
      return sum + itemTotal;
    }, 0) || 0;

  const totalTax =
    quoteData.items?.reduce((sum, item) => {
      const qty =
        typeof item.quantity === "string"
          ? parseFloat(item.quantity) || 0
          : item.quantity;
      const price =
        typeof item.unit_price === "string"
          ? parseFloat(item.unit_price) || 0
          : item.unit_price;
      const itemTotal = qty * price;
      const taxRate = parseFloat(item.tax?.replace(/[^\d.]/g, "") || "0") / 100;
      return sum + itemTotal * taxRate;
    }, 0) || 0;

  const grandTotal = subtotal + totalTax;

  return (
    <Box sx={{ p: 2 }}>
      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {quoteData.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Teklif detayları ve geçmişi
            </Typography>
          </Box>

          {/* Quote Document */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Document Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {quoteData.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  {quoteData.customer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quoteData.customer_description}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hazırlama Tarihi: {formatDate(quoteData.preparation_date)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    Geçerlilik: {formatDate(quoteData.due_date)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Terms */}
            {quoteData.terms && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {quoteData.terms}
                </Typography>
              </Box>
            )}

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      HİZMET/ÜRÜN
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>MİKTAR</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      BİR. FİYAT
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>VERGİ</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>TOPLAM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quoteData.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.service}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.quantity} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(
                            typeof item.unit_price === "string"
                              ? parseFloat(item.unit_price) || 0
                              : item.unit_price,
                            quoteData.currency
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.tax}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.total, quoteData.currency)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Henüz ürün/hizmet eklenmemiş
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mb: 3, mt: 2 }}
            >
              <Box sx={{ minWidth: "300px" }}>
                <Stack spacing={1} alignItems="stretch">
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ARA TOPLAM:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(subtotal, quoteData.currency)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      TOPLAM KDV:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(totalTax, quoteData.currency)}
                    </Typography>
                  </Box>
                  <Divider sx={{ width: "100%", my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ fontSize: "1.1rem" }}
                    >
                      GENEL TOPLAM:
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="primary"
                      sx={{ fontSize: "1.1rem" }}
                    >
                      {formatCurrency(grandTotal, quoteData.currency)}
                    </Typography>
                  </Box>
                  {quoteData.currency === "USD" && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        TL KARŞILIĞI:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(grandTotal * 36.305, "TRY")}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Action Buttons */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  fullWidth
                  onClick={handleEdit}
                  sx={{ bgcolor: "info.main" }}
                >
                  TEKLİFİ DÜZENLE
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ShareIcon />}
                  fullWidth
                  sx={{ bgcolor: "primary.main" }}
                >
                  PAYLAŞ
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  fullWidth
                  onClick={handlePrint}
                >
                  YAZDIR
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ReceiptIcon />}
                  fullWidth
                  sx={{ bgcolor: "success.main" }}
                >
                  FATURA OLUŞTUR
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                DURUM
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ArrowDropDownIcon />}
                onClick={handleStatusClick}
                fullWidth
                sx={{ justifyContent: "space-between" }}
              >
                {quoteData.status === "awaiting_response" &&
                  "Teklif Bekleniyor"}
                {quoteData.status === "approved" && "Onaylandı"}
                {quoteData.status === "rejected" && "Reddedildi"}
              </Button>
              <Menu
                anchorEl={statusAnchorEl}
                open={Boolean(statusAnchorEl)}
                onClose={handleStatusClose}
              >
                <MenuItem
                  onClick={() => handleStatusChange("awaiting_response")}
                >
                  Teklif Bekleniyor
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("approved")}>
                  Onaylandı
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange("rejected")}>
                  Reddedildi
                </MenuItem>
              </Menu>
            </CardContent>
          </Card>

          {/* Quote History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                TEKLİF GEÇMİŞİ
              </Typography>

              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Tümü" />
                <Tab label="Notlar" />
              </Tabs>

              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Avatar
                      sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                    >
                      <DescriptionIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Teklif oluşturuldu"
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(quoteData.created_at)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Sistem
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {quoteData.updated_at &&
                  quoteData.updated_at !== quoteData.created_at && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{ width: 32, height: 32, bgcolor: "info.main" }}
                        >
                          <DescriptionIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary="Teklif güncellendi"
                        secondary={
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDateTime(quoteData.updated_at)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Sistem
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuoteView;
