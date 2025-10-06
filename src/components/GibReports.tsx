// GİB Raporları Bileşeni
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface GibReportData {
  period: string;
  totalInvoices: number;
  acceptedInvoices: number;
  rejectedInvoices: number;
  pendingInvoices: number;
  totalAmount: number;
  successRate: number;
}

interface GibStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

const GibReports: React.FC = () => {
  const [reportData, setReportData] = useState<GibReportData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<GibStatusBreakdown[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01",
    end: "2024-12-31",
  });

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Mock data - gerçek uygulamada API'den gelecek
      const mockData: GibReportData[] = [
        {
          period: "2024-01",
          totalInvoices: 45,
          acceptedInvoices: 38,
          rejectedInvoices: 5,
          pendingInvoices: 2,
          totalAmount: 125000,
          successRate: 84.4,
        },
        {
          period: "2024-02",
          totalInvoices: 52,
          acceptedInvoices: 46,
          rejectedInvoices: 4,
          pendingInvoices: 2,
          totalAmount: 142000,
          successRate: 88.5,
        },
        {
          period: "2024-03",
          totalInvoices: 38,
          acceptedInvoices: 35,
          rejectedInvoices: 2,
          pendingInvoices: 1,
          totalAmount: 98000,
          successRate: 92.1,
        },
        {
          period: "2024-04",
          totalInvoices: 41,
          acceptedInvoices: 37,
          rejectedInvoices: 3,
          pendingInvoices: 1,
          totalAmount: 108000,
          successRate: 90.2,
        },
      ];

      const mockStatusBreakdown: GibStatusBreakdown[] = [
        {
          status: "Kabul Edildi",
          count: 156,
          percentage: 88.6,
          color: "#4caf50",
        },
        { status: "Reddedildi", count: 14, percentage: 8.0, color: "#f44336" },
        { status: "Beklemede", count: 6, percentage: 3.4, color: "#ff9800" },
      ];

      setReportData(mockData);
      setStatusBreakdown(mockStatusBreakdown);
    } catch (error) {
      console.error("Rapor verileri yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const getTotalStats = () => {
    const total = reportData.reduce((acc, curr) => acc + curr.totalInvoices, 0);
    const accepted = reportData.reduce(
      (acc, curr) => acc + curr.acceptedInvoices,
      0
    );
    const rejected = reportData.reduce(
      (acc, curr) => acc + curr.rejectedInvoices,
      0
    );
    const pending = reportData.reduce(
      (acc, curr) => acc + curr.pendingInvoices,
      0
    );
    const totalAmount = reportData.reduce(
      (acc, curr) => acc + curr.totalAmount,
      0
    );
    const successRate = total > 0 ? (accepted / total) * 100 : 0;

    return { total, accepted, rejected, pending, totalAmount, successRate };
  };

  const stats = getTotalStats();

  const exportReport = (format: "pdf" | "excel") => {
    console.log(`Rapor ${format} formatında indiriliyor...`);
    // Export işlemi burada yapılacak
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        GİB Raporları
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        GİB entegrasyonu performansını ve fatura durumlarını analiz
        edebilirsiniz.
      </Alert>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Dönem</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="week">Haftalık</MenuItem>
                <MenuItem value="month">Aylık</MenuItem>
                <MenuItem value="quarter">Çeyreklik</MenuItem>
                <MenuItem value="year">Yıllık</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Başlangıç Tarihi"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Bitiş Tarihi"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadReportData}
                disabled={loading}
              >
                Yenile
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => exportReport("pdf")}
              >
                PDF
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Fatura
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.accepted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kabul Edilen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reddedilen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Beklemede
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {stats.successRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Başarı Oranı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="secondary.main">
                {formatCurrency(stats.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Tutar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Başarı Oranı Trendi */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Başarı Oranı Trendi
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Başarı Oranı"]} />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#4caf50"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Durum Dağılımı */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Durum Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Aylık Performans */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Aylık Fatura Sayısı
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalInvoices" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Aylık Tutar
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "Tutar",
                  ]}
                />
                <Bar dataKey="totalAmount" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detaylı Tablo */}
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Dönemsel Detaylar
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dönem</TableCell>
                <TableCell align="right">Toplam Fatura</TableCell>
                <TableCell align="right">Kabul Edilen</TableCell>
                <TableCell align="right">Reddedilen</TableCell>
                <TableCell align="right">Beklemede</TableCell>
                <TableCell align="right">Toplam Tutar</TableCell>
                <TableCell align="right">Başarı Oranı</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell>{row.period}</TableCell>
                    <TableCell align="right">{row.totalInvoices}</TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={row.acceptedInvoices}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<ErrorIcon />}
                        label={row.rejectedInvoices}
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<ScheduleIcon />}
                        label={row.pendingInvoices}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.totalAmount)}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={row.successRate}
                          sx={{ width: 60, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2">
                          {row.successRate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default GibReports;


