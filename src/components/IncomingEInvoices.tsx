// Gelen E-Faturalar Bileşeni
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  CloudDownload as CloudDownloadIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";
import { gibService } from "../services/gibService";
import { useTenant } from "../contexts/TenantContext";

interface IncomingEInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_tax_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  category: string;
  description: string;
  received_at: string;
  processed_at?: string;
  notes?: string;
  // Gib entegrasyonu için ek alanlar
  gib_invoice_id?: string;
  gib_status?: "RECEIVED" | "PROCESSED" | "ERROR";
  gib_received_at?: string;
  gib_error_message?: string;
  is_from_gib?: boolean;
}

const IncomingEInvoices: React.FC = () => {
  const { tenant } = useTenant();
  const [invoices, setInvoices] = useState<IncomingEInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingGib, setSyncingGib] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] =
    useState<IncomingEInvoice | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gibIntegrationStatus, setGibIntegrationStatus] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
    checkGibIntegrationStatus();
  }, [tenant]);

  const checkGibIntegrationStatus = async () => {
    if (!tenant?.id) return;

    try {
      const status = await gibService.checkGibIntegrationStatus(tenant.id);
      setGibIntegrationStatus(status);
    } catch (error) {
      console.error("Gib entegrasyon durumu kontrol hatası:", error);
    }
  };

  const syncWithGib = async () => {
    if (!tenant?.id) return;

    setSyncingGib(true);
    try {
      // Gib'den gelen e-faturaları çek
      console.log("Gib'den gelen e-faturalar çekiliyor...");

      // Mock delay - gerçek uygulamada Gib API'si çağrılacak
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Gib'den gelen faturaları mevcut listeye ekle
      const gibInvoices: IncomingEInvoice[] = [
        {
          id: "gib-1",
          invoice_number: "GIB2024000001",
          supplier_name: "Gib Entegrasyon Test A.Ş.",
          supplier_tax_number: "9876543210",
          invoice_date: "2024-01-20",
          due_date: "2024-02-20",
          amount: 500.0,
          tax_amount: 90.0,
          total_amount: 590.0,
          status: "PENDING",
          category: "Gib Entegrasyonu",
          description: "Gib'den gelen test faturası",
          received_at: new Date().toISOString(),
          gib_invoice_id: "GIB-12345",
          gib_status: "RECEIVED",
          gib_received_at: new Date().toISOString(),
          is_from_gib: true,
        },
      ];

      setInvoices((prev) => [...gibInvoices, ...prev]);
      console.log("Gib entegrasyonu tamamlandı!");
    } catch (error) {
      console.error("Gib entegrasyon hatası:", error);
    } finally {
      setSyncingGib(false);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockInvoices: IncomingEInvoice[] = [
        {
          id: "1",
          invoice_number: "EF2024000001",
          supplier_name: "ABC Teknoloji A.Ş.",
          supplier_tax_number: "1234567890",
          invoice_date: "2024-01-15",
          due_date: "2024-02-15",
          amount: 1000.0,
          tax_amount: 180.0,
          total_amount: 1180.0,
          status: "PENDING",
          category: "Teknoloji",
          description: "Yazılım lisansı",
          received_at: "2024-01-15T10:00:00Z",
          is_from_gib: false,
        },
        {
          id: "2",
          invoice_number: "EF2024000002",
          supplier_name: "XYZ Hizmet Ltd.",
          supplier_tax_number: "0987654321",
          invoice_date: "2024-01-16",
          due_date: "2024-02-16",
          amount: 2500.0,
          tax_amount: 450.0,
          total_amount: 2950.0,
          status: "APPROVED",
          category: "Hizmet",
          description: "Temizlik hizmetleri",
          received_at: "2024-01-16T14:30:00Z",
          processed_at: "2024-01-17T09:00:00Z",
          is_from_gib: false,
        },
        {
          id: "3",
          invoice_number: "EF2024000003",
          supplier_name: "DEF Malzeme A.Ş.",
          supplier_tax_number: "1122334455",
          invoice_date: "2024-01-17",
          due_date: "2024-02-17",
          amount: 750.0,
          tax_amount: 135.0,
          total_amount: 885.0,
          status: "REJECTED",
          category: "Malzeme",
          description: "Ofis malzemeleri",
          received_at: "2024-01-17T09:15:00Z",
          processed_at: "2024-01-17T15:30:00Z",
          notes: "Vergi numarası hatalı",
          is_from_gib: false,
        },
        {
          id: "4",
          invoice_number: "EF2024000004",
          supplier_name: "GHI Enerji Ltd.",
          supplier_tax_number: "5566778899",
          invoice_date: "2024-01-18",
          due_date: "2024-02-18",
          amount: 500.0,
          tax_amount: 90.0,
          total_amount: 590.0,
          status: "PAID",
          category: "Enerji",
          description: "Elektrik faturası",
          received_at: "2024-01-18T08:00:00Z",
          processed_at: "2024-01-18T10:00:00Z",
          is_from_gib: false,
        },
        {
          id: "5",
          invoice_number: "GIB2024000001",
          supplier_name: "Gib Entegrasyon Test A.Ş.",
          supplier_tax_number: "9876543210",
          invoice_date: "2024-01-20",
          due_date: "2024-02-20",
          amount: 1200.0,
          tax_amount: 216.0,
          total_amount: 1416.0,
          status: "PENDING",
          category: "Gib Entegrasyonu",
          description: "Gib'den gelen test faturası",
          received_at: "2024-01-20T12:00:00Z",
          gib_invoice_id: "GIB-12345",
          gib_status: "RECEIVED",
          gib_received_at: "2024-01-20T12:00:00Z",
          is_from_gib: true,
        },
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      console.error("Gelen e-faturalar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      case "PAID":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Onaylandı";
      case "REJECTED":
        return "Reddedildi";
      case "PENDING":
        return "Beklemede";
      case "PAID":
        return "Ödendi";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircleIcon />;
      case "REJECTED":
        return <ErrorIcon />;
      case "PENDING":
        return <ScheduleIcon />;
      case "PAID":
        return <MoneyIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || invoice.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map((invoice) => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoices((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  const handleViewInvoice = (invoice: IncomingEInvoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleApproveInvoices = async () => {
    try {
      console.log("Onaylanan faturalar:", selectedInvoices);
      // API çağrısı burada yapılacak
    } catch (error) {
      console.error("Faturalar onaylanırken hata:", error);
    }
  };

  const handleRejectInvoices = async () => {
    try {
      console.log("Reddedilen faturalar:", selectedInvoices);
      // API çağrısı burada yapılacak
    } catch (error) {
      console.error("Faturalar reddedilirken hata:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gelen E-Faturalar
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Tedarikçilerden gelen e-faturaları görüntüleyebilir, onaylayabilir veya
        reddedebilirsiniz.
      </Alert>

      {/* Gib Entegrasyonu Durumu */}
      {gibIntegrationStatus && (
        <Alert
          severity={gibIntegrationStatus.is_configured ? "success" : "warning"}
          sx={{ mb: 3 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Gib Entegrasyonu:{" "}
                {gibIntegrationStatus.is_configured ? "Aktif" : "Pasif"}
              </Typography>
              {!gibIntegrationStatus.is_configured && (
                <Typography variant="body2">
                  Eksik alanlar:{" "}
                  {gibIntegrationStatus.missing_fields.join(", ")}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={
                syncingGib ? <CircularProgress size={20} /> : <SyncIcon />
              }
              onClick={syncWithGib}
              disabled={syncingGib || !gibIntegrationStatus.is_configured}
              sx={{ ml: 2 }}
            >
              {syncingGib ? "Senkronize Ediliyor..." : "Gib'den Çek"}
            </Button>
          </Box>
        </Alert>
      )}

      {/* Filtreler ve Arama */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Fatura no, tedarikçi veya açıklama ara..."
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
                <MenuItem value="APPROVED">Onaylandı</MenuItem>
                <MenuItem value="REJECTED">Reddedildi</MenuItem>
                <MenuItem value="PAID">Ödendi</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="Teknoloji">Teknoloji</MenuItem>
                <MenuItem value="Hizmet">Hizmet</MenuItem>
                <MenuItem value="Malzeme">Malzeme</MenuItem>
                <MenuItem value="Enerji">Enerji</MenuItem>
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

      {/* Toplu İşlemler */}
      {selectedInvoices.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "primary.50" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle2">
              {selectedInvoices.length} fatura seçildi
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleApproveInvoices}
            >
              Onayla
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<ErrorIcon />}
              onClick={handleRejectInvoices}
            >
              Reddet
            </Button>
          </Stack>
        </Paper>
      )}

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
              <Typography variant="h6" color="warning.main">
                {invoices.filter((i) => i.status === "PENDING").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Beklemede
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {invoices.filter((i) => i.status === "APPROVED").length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Onaylandı
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
                Reddedildi
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
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedInvoices.length === filteredInvoices.length &&
                      filteredInvoices.length > 0
                    }
                    indeterminate={
                      selectedInvoices.length > 0 &&
                      selectedInvoices.length < filteredInvoices.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Fatura No</TableCell>
                <TableCell>Tedarikçi</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Gib Durumu</TableCell>
                <TableCell>Tutar</TableCell>
                <TableCell>Fatura Tarihi</TableCell>
                <TableCell>Vade Tarihi</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Fatura bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) =>
                          handleSelectInvoice(invoice.id, e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {invoice.supplier_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.supplier_tax_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={invoice.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(invoice.status)}
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.is_from_gib ? (
                        <Chip
                          icon={<CloudDownloadIcon />}
                          label={
                            invoice.gib_status === "RECEIVED"
                              ? "Gib'den Geldi"
                              : "Gib İşlendi"
                          }
                          color={
                            invoice.gib_status === "ERROR" ? "error" : "success"
                          }
                          size="small"
                        />
                      ) : (
                        <Chip label="Manuel" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(invoice.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <ViewIcon />
                      </IconButton>
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
                    Tedarikçi
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.supplier_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vergi Numarası
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.supplier_tax_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Kategori
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.category}
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
                    Açıklama
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                {/* Gib Bilgileri */}
                {selectedInvoice.is_from_gib && (
                  <>
                    <Grid item xs={12}>
                      <Typography
                        variant="h6"
                        sx={{ mb: 2, color: "primary.main" }}
                      >
                        Gib Entegrasyon Bilgileri
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gib Fatura ID
                      </Typography>
                      <Typography variant="body2">
                        {selectedInvoice.gib_invoice_id || "Belirtilmemiş"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gib Durumu
                      </Typography>
                      <Chip
                        icon={<CloudDownloadIcon />}
                        label={
                          selectedInvoice.gib_status === "RECEIVED"
                            ? "Gib'den Geldi"
                            : "Gib İşlendi"
                        }
                        color={
                          selectedInvoice.gib_status === "ERROR"
                            ? "error"
                            : "success"
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Gib'den Alınma Tarihi
                      </Typography>
                      <Typography variant="body2">
                        {selectedInvoice.gib_received_at
                          ? formatDate(selectedInvoice.gib_received_at)
                          : "Belirtilmemiş"}
                      </Typography>
                    </Grid>
                    {selectedInvoice.gib_error_message && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Gib Hata Mesajı
                        </Typography>
                        <Typography variant="body2" color="error">
                          {selectedInvoice.gib_error_message}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                    </Grid>
                  </>
                )}

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fatura Tarihi
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedInvoice.invoice_date)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vade Tarihi
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedInvoice.due_date)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Alınma Tarihi
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedInvoice.received_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ara Toplam
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedInvoice.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    KDV
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedInvoice.tax_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </Typography>
                </Grid>
                {selectedInvoice.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notlar
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {selectedInvoice.notes}
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

export default IncomingEInvoices;
