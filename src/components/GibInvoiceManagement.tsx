// GİB E-Fatura Yönetimi Bileşeni
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { gibService } from "../services/gibService";

interface GibInvoice {
  id: string;
  invoice_id: string;
  gib_invoice_id?: string;
  invoice_number: string;
  customer_name: string;
  invoice_type: string;
  status: string;
  amount: number;
  created_at: string;
  sent_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  error_message?: string;
}

const GibInvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<GibInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<GibInvoice | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockInvoices: GibInvoice[] = [
        {
          id: "1",
          invoice_id: "inv-001",
          gib_invoice_id: "GIB-2024-001",
          invoice_number: "EF2024000001",
          customer_name: "Test Müşteri Ltd.",
          invoice_type: "E-Fatura",
          status: "ACCEPTED",
          amount: 1180.0,
          created_at: "2024-01-15T10:00:00Z",
          sent_at: "2024-01-15T10:05:00Z",
          accepted_at: "2024-01-15T10:10:00Z",
        },
        {
          id: "2",
          invoice_id: "inv-002",
          invoice_number: "EF2024000002",
          customer_name: "Örnek Şirket A.Ş.",
          invoice_type: "E-Arşiv",
          status: "PENDING",
          amount: 2500.0,
          created_at: "2024-01-16T14:30:00Z",
        },
        {
          id: "3",
          invoice_id: "inv-003",
          gib_invoice_id: "GIB-2024-003",
          invoice_number: "EF2024000003",
          customer_name: "Demo Firma",
          invoice_type: "E-Fatura",
          status: "REJECTED",
          amount: 750.0,
          created_at: "2024-01-17T09:15:00Z",
          sent_at: "2024-01-17T09:20:00Z",
          rejected_at: "2024-01-17T09:25:00Z",
          error_message: "Vergi numarası geçersiz",
        },
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      console.error("Faturalar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "success";
      case "REJECTED":
        return "error";
      case "SENT":
        return "info";
      case "PENDING":
        return "warning";
      case "PROCESSING":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "Kabul Edildi";
      case "REJECTED":
        return "Reddedildi";
      case "SENT":
        return "Gönderildi";
      case "PENDING":
        return "Beklemede";
      case "PROCESSING":
        return "İşleniyor";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircleIcon />;
      case "REJECTED":
        return <ErrorIcon />;
      case "SENT":
        return <SendIcon />;
      case "PENDING":
        return <ScheduleIcon />;
      case "PROCESSING":
        return <CircularProgress size={16} />;
      default:
        return <ReceiptIcon />;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesType =
      typeFilter === "all" || invoice.invoice_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewInvoice = (invoice: GibInvoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleSendToGib = async (invoiceId: string) => {
    try {
      // GİB'e gönderme işlemi
      console.log("GİB'e gönderiliyor:", invoiceId);
      // API çağrısı burada yapılacak
    } catch (error) {
      console.error("GİB'e gönderme hatası:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        E-Fatura Yönetimi
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        GİB entegrasyonu ile gönderilen faturaların durumunu takip edebilir ve
        yönetebilirsiniz.
      </Alert>

      {/* Filtreler ve Arama */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Fatura numarası veya müşteri adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="PENDING">Beklemede</MenuItem>
                <MenuItem value="SENT">Gönderildi</MenuItem>
                <MenuItem value="ACCEPTED">Kabul Edildi</MenuItem>
                <MenuItem value="REJECTED">Reddedildi</MenuItem>
                <MenuItem value="PROCESSING">İşleniyor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Fatura Tipi</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="E-Fatura">E-Fatura</MenuItem>
                <MenuItem value="E-Arşiv">E-Arşiv</MenuItem>
                <MenuItem value="E-İrsaliye">E-İrsaliye</MenuItem>
                <MenuItem value="E-Müstahsil">E-Müstahsil</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadInvoices}
              fullWidth
            >
              Yenile
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {invoices.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Fatura
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {invoices.filter((i) => i.status === "ACCEPTED").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kabul Edilen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {invoices.filter((i) => i.status === "REJECTED").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reddedilen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {invoices.filter((i) => i.status === "PENDING").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Beklemede
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fatura Listesi */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fatura No</TableCell>
                <TableCell>Müşteri</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Oluşturulma</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Fatura bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoice_number}
                      </Typography>
                      {invoice.gib_invoice_id && (
                        <Typography variant="caption" color="text.secondary">
                          GİB: {invoice.gib_invoice_id}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>
                      <Chip label={invoice.invoice_type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(invoice.status)}
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <ViewIcon />
                        </IconButton>
                        {invoice.status === "PENDING" && (
                          <IconButton
                            size="small"
                            onClick={() => handleSendToGib(invoice.id)}
                            color="primary"
                          >
                            <SendIcon />
                          </IconButton>
                        )}
                        <IconButton size="small">
                          <DownloadIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Fatura Detay Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Fatura Detayları</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fatura Numarası
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.invoice_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    GİB Fatura ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.gib_invoice_id || "Henüz atanmadı"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Müşteri
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.customer_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fatura Tipi
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.invoice_type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Durum
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedInvoice.status)}
                    label={getStatusLabel(selectedInvoice.status)}
                    color={getStatusColor(selectedInvoice.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tutar
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedInvoice.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Oluşturulma
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedInvoice.created_at)}
                  </Typography>
                </Grid>
                {selectedInvoice.sent_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Gönderilme
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedInvoice.sent_at)}
                    </Typography>
                  </Grid>
                )}
                {selectedInvoice.accepted_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Kabul Edilme
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedInvoice.accepted_at)}
                    </Typography>
                  </Grid>
                )}
                {selectedInvoice.rejected_at && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reddedilme
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedInvoice.rejected_at)}
                    </Typography>
                  </Grid>
                )}
                {selectedInvoice.error_message && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Hata Mesajı
                    </Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedInvoice.error_message}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GibInvoiceManagement;


