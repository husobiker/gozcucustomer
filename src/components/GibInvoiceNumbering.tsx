import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  gibInvoiceNumberingService,
  InvoiceNumberingConfig,
  InvoiceNumber,
} from "../services/gibInvoiceNumbering";
import { useTenant } from "../contexts/TenantContext";

const GibInvoiceNumbering: React.FC = () => {
  const { tenant } = useTenant();
  const [configs, setConfigs] = useState<InvoiceNumberingConfig[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [testResult, setTestResult] = useState<InvoiceNumber | null>(null);

  const invoiceTypes = [
    "E-Fatura",
    "E-Arşiv Fatura",
    "E-İrsaliye",
    "E-Müstahsil Makbuzu",
    "Ticari e-Fatura",
    "Satış Faturası",
    "Proforma",
  ];

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant]);

  const loadData = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    try {
      const [configsData, statsData] = await Promise.all([
        loadConfigs(),
        loadStats(),
      ]);

      setConfigs(configsData || []);
      setStats(statsData);
    } catch (error) {
      setError("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    if (!tenant?.id) return [];

    const configs = [];
    for (const invoiceType of invoiceTypes) {
      const config = await gibInvoiceNumberingService.loadNumberingConfig(
        tenant.id,
        invoiceType
      );
      if (config) {
        configs.push(config);
      }
    }
    return configs;
  };

  const loadStats = async () => {
    if (!tenant?.id) return null;

    return await gibInvoiceNumberingService.getNumberingStats(tenant.id);
  };

  const handleGenerateTestNumber = async () => {
    if (!tenant?.id || !selectedInvoiceType) return;

    setLoading(true);
    try {
      const result = await gibInvoiceNumberingService.generateInvoiceNumber(
        tenant.id,
        selectedInvoiceType
      );
      setTestResult(result);
      setSuccess(
        `Test fatura numarası oluşturuldu: ${result?.formatted_number}`
      );
      await loadData(); // Verileri yenile
    } catch (error) {
      setError("Test fatura numarası oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  const handleResetNumbering = async (invoiceType: string) => {
    if (!tenant?.id) return;

    setLoading(true);
    try {
      const success = await gibInvoiceNumberingService.resetNumbering(
        tenant.id,
        invoiceType
      );
      if (success) {
        setSuccess(`${invoiceType} numaralandırması sıfırlandı`);
        await loadData();
      } else {
        setError("Numaralandırma sıfırlanamadı");
      }
    } catch (error) {
      setError("Numaralandırma sıfırlama hatası");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (config: InvoiceNumberingConfig) => {
    const currentYear = new Date().getFullYear();
    if (config.year === currentYear) return "success";
    return "default";
  };

  const getStatusText = (config: InvoiceNumberingConfig) => {
    const currentYear = new Date().getFullYear();
    if (config.year === currentYear) return "Aktif";
    return `Eski (${config.year})`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 2 }}
      >
        <ReceiptIcon color="primary" />
        GİB Fatura Numaralandırma Yönetimi
      </Typography>

      {/* Hata/Başarı Mesajları */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* İstatistikler */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Toplam Fatura
                </Typography>
                <Typography variant="h4">
                  {stats.total_invoices.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Bu Yıl Sıra
                </Typography>
                <Typography variant="h4">
                  {stats.current_year_sequence.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Fatura Tipleri
                </Typography>
                <Typography variant="h4">
                  {Object.keys(stats.invoices_by_type).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Test Fatura Numarası Oluşturma */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Fatura Numarası Oluştur
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Fatura Tipi</InputLabel>
            <Select
              value={selectedInvoiceType}
              onChange={(e) => setSelectedInvoiceType(e.target.value)}
            >
              {invoiceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleGenerateTestNumber}
            disabled={!selectedInvoiceType || loading}
          >
            Test Numarası Oluştur
          </Button>
        </Stack>

        {testResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body1">
              <strong>Oluşturulan Fatura Numarası:</strong>{" "}
              {testResult.formatted_number}
            </Typography>
            <Typography variant="body2">
              Tam Numara: {testResult.full_number} | Sıra: {testResult.sequence}
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Numaralandırma Konfigürasyonları */}
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Numaralandırma Konfigürasyonları</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fatura Tipi</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Yıl</TableCell>
                <TableCell>Sıra</TableCell>
                <TableCell>Son Kullanım</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((config) => (
                <TableRow
                  key={`${config.tenant_id}-${config.invoice_type}-${config.year}`}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {config.invoice_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={config.prefix} size="small" />
                  </TableCell>
                  <TableCell>{config.year}</TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      {config.sequence.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(config.last_used_date).toLocaleDateString(
                      "tr-TR"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(config)}
                      color={getStatusColor(config) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleResetNumbering(config.invoice_type)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {configs.length === 0 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Henüz numaralandırma konfigürasyonu oluşturulmamış.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test fatura numarası oluşturarak başlayın.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Bilgi Kartı */}
      <Paper
        sx={{ p: 3, mt: 3, bgcolor: "info.light", color: "info.contrastText" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <InfoIcon />
          <Typography variant="h6">
            GİB Fatura Numaralandırma Kuralları
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • <strong>Format:</strong> [Prefix][Yıl][6 Haneli Sıra] (Örnek:
          EF2024000001)
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • <strong>Prefix'ler:</strong> EF (E-Fatura), EA (E-Arşiv), EI
          (E-İrsaliye), EM (E-Müstahsil)
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • <strong>Yıllık Sıfırlama:</strong> Her yıl sıra numarası 1'den
          başlar
        </Typography>
        <Typography variant="body2">
          • <strong>GİB Uyumluluk:</strong> Tüm numaralar GİB standartlarına
          uygun formatlanır
        </Typography>
      </Paper>
    </Box>
  );
};

export default GibInvoiceNumbering;


