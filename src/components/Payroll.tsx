import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { supabaseAdmin } from "../lib/supabase";

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
  duty_type: "security" | "consultant";
  status: "Aktif" | "Pasif";
  hourly_rate?: number;
  daily_rate?: number;
}

interface PayrollRecord {
  id: string;
  personnel_id: string;
  month: number;
  year: number;
  total_working_days: number;
  total_working_hours: number;
  overtime_hours: number;
  holiday_hours: number;
  leave_days: number;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: "draft" | "approved" | "paid";
  created_at: string;
  updated_at: string;
}

interface PayrollDetail {
  id: string;
  payroll_id: string;
  date: string;
  shift_type: string;
  hours_worked: number;
  is_holiday: boolean;
  is_overtime: boolean;
  hourly_rate: number;
  daily_amount: number;
}

const Payroll: React.FC = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(
    null
  );

  // Aylar listesi
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  // Personel verilerini yükle
  const fetchPersonnel = async () => {
    if (!tenant || !selectedProject) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseAdmin
        .from("personnel")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("status", "active")
        .order("first_name");

      if (error) {
        console.error("Error fetching personnel:", error);
        // Tablo yoksa boş array döndür
        if (
          error.code === "PGRST116" ||
          error.message.includes('relation "personnel" does not exist')
        ) {
          console.log("Personnel table does not exist yet, showing empty data");
          setPersonnel([]);
          return;
        }
        setError("Personel verileri yüklenirken hata oluştu: " + error.message);
        return;
      }

      setPersonnel(data || []);
    } catch (err) {
      console.error("Error fetching personnel:", err);
      setPersonnel([]);
    } finally {
      setLoading(false);
    }
  };

  // Puantaj kayıtlarını yükle
  const fetchPayrollRecords = async () => {
    if (!tenant || !selectedProject) return;

    try {
      setError(null);
      const { data, error } = await supabaseAdmin
        .from("payroll_records")
        .select(
          `
          *,
          personnel:personnel(first_name, last_name, hourly_rate, daily_rate)
        `
        )
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payroll records:", error);
        // Tablo yoksa boş array döndür, hata gösterme
        if (
          error.code === "PGRST116" ||
          error.message.includes('relation "payroll_records" does not exist')
        ) {
          console.log(
            "Payroll records table does not exist yet, showing empty data"
          );
          setPayrollRecords([]);
          return;
        }
        setError("Puantaj kayıtları yüklenirken hata oluştu: " + error.message);
        return;
      }

      setPayrollRecords(data || []);
    } catch (err) {
      console.error("Error fetching payroll records:", err);
      // Tablo yoksa boş array döndür
      setPayrollRecords([]);
    }
  };

  // Puantaj hesapla
  const calculatePayroll = async () => {
    if (!personnel.length || !tenant || !selectedProject) {
      setError("Personel verisi bulunamadı. Lütfen önce personel ekleyin.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mevcut puantaj kayıtlarını sil (tablo yoksa hata verme)
      try {
        await supabaseAdmin
          .from("payroll_records")
          .delete()
          .eq("tenant_id", tenant.id)
          .eq("project_id", selectedProject.id)
          .eq("month", selectedMonth)
          .eq("year", selectedYear);
      } catch (deleteError) {
        console.log(
          "Could not delete existing records (table might not exist):",
          deleteError
        );
      }

      // Her personel için puantaj hesapla
      const payrollRecords = personnel.map((person) => {
        // Nöbet çizelgesinden gerçek verileri al (şimdilik basit hesaplama)
        const workingDays = 20; // Gerçek hesaplama nöbet çizelgesinden gelecek
        const workingHours = workingDays * 8;
        const overtimeHours = Math.floor(Math.random() * 10);
        const leaveDays = 2;

        const hourlyRate = person.hourly_rate || 25;
        const grossSalary =
          workingHours * hourlyRate + overtimeHours * hourlyRate * 1.5;
        const deductions = grossSalary * 0.1;
        const netSalary = grossSalary - deductions;

        return {
          id: `temp-${person.id}-${Date.now()}`,
          personnel_id: person.id,
          month: selectedMonth,
          year: selectedYear,
          total_working_days: workingDays,
          total_working_hours: workingHours,
          overtime_hours: overtimeHours,
          holiday_hours: 0,
          leave_days: leaveDays,
          gross_salary: grossSalary,
          deductions: deductions,
          net_salary: netSalary,
          status: "draft" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Veritabanına kaydet (tablo yoksa local state'e kaydet)
      try {
        const { data, error } = await supabaseAdmin
          .from("payroll_records")
          .insert(payrollRecords)
          .select();

        if (error) {
          console.error("Error saving payroll records:", error);
          // Tablo yoksa local state'e kaydet
          if (
            error.code === "PGRST116" ||
            error.message.includes('relation "payroll_records" does not exist')
          ) {
            console.log("Payroll records table does not exist, saving locally");
            setPayrollRecords(payrollRecords);
            return;
          }
          setError(
            "Puantaj kayıtları kaydedilirken hata oluştu: " + error.message
          );
          return;
        }

        setPayrollRecords(data || []);
      } catch (insertError) {
        console.log("Could not save to database, saving locally:", insertError);
        setPayrollRecords(payrollRecords);
      }
    } catch (err) {
      console.error("Error calculating payroll:", err);
      setError(
        "Puantaj hesaplanırken hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  // Personel adını getir
  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find((p) => p.id === personnelId);
    return person ? `${person.first_name} ${person.last_name}` : "Bilinmeyen";
  };

  // Durum rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "warning";
      case "approved":
        return "info";
      case "paid":
        return "success";
      default:
        return "default";
    }
  };

  // Durum etiketi
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Taslak";
      case "approved":
        return "Onaylandı";
      case "paid":
        return "Ödendi";
      default:
        return status;
    }
  };

  // Puantaj detaylarını göster
  const showPayrollDetails = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setOpenDetailDialog(true);
  };

  useEffect(() => {
    if (!tenantLoading && tenant && selectedProject) {
      fetchPersonnel();
      fetchPayrollRecords();
    }
  }, [tenant, tenantLoading, selectedProject, selectedMonth, selectedYear]);

  if (tenantLoading || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Tenant bilgisi bulunamadı. Lütfen doğru domain üzerinden giriş yapın.
        </Alert>
      </Box>
    );
  }

  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Lütfen sidebar'dan bir proje seçiniz.</Alert>
      </Box>
    );
  }

  const paginatedRecords = payrollRecords.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalGrossSalary = payrollRecords.reduce(
    (sum, record) => sum + record.gross_salary,
    0
  );
  const totalNetSalary = payrollRecords.reduce(
    (sum, record) => sum + record.net_salary,
    0
  );
  const totalDeductions = payrollRecords.reduce(
    (sum, record) => sum + record.deductions,
    0
  );

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Puantaj İşlemleri - {selectedProject?.name || "Proje Seçiniz"} -{" "}
            {tenant.name}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<CalculateIcon />}
              sx={{ bgcolor: "#1976d2" }}
              onClick={calculatePayroll}
            >
              Puantaj Hesapla
            </Button>
            <Tooltip title="Yazdır">
              <IconButton>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="İndir">
              <IconButton>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Yenile">
              <IconButton onClick={fetchPayrollRecords}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Month/Year Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Ay</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  label="Ay"
                >
                  {months.map((month, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Yıl</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  label="Yıl"
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Typography variant="h6">
                {months[selectedMonth - 1]} {selectedYear}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <MoneyIcon color="primary" />
                  <Box>
                    <Typography variant="h6" color="primary">
                      {totalGrossSalary.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Brüt Maaş
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <MoneyIcon color="error" />
                  <Box>
                    <Typography variant="h6" color="error">
                      {totalDeductions.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Kesintiler
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <MoneyIcon color="success" />
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {totalNetSalary.toLocaleString("tr-TR")} ₺
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Net Maaş
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payroll Records Table */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Personel</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Çalışma Günü
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Çalışma Saati
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Fazla Mesai</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İzin Günü</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Brüt Maaş</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Kesintiler</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Net Maaş</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {getPersonnelName(record.personnel_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.total_working_days} gün
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.total_working_hours} saat
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.overtime_hours} saat
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.leave_days} gün
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {record.gross_salary.toLocaleString("tr-TR")} ₺
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error">
                        {record.deductions.toLocaleString("tr-TR")} ₺
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="success.main"
                      >
                        {record.net_salary.toLocaleString("tr-TR")} ₺
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(record.status)}
                        color={getStatusColor(record.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Detayları Görüntüle">
                          <IconButton
                            size="small"
                            onClick={() => showPayrollDetails(record)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={payrollRecords.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Sayfa Başına Satır"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} toplam ${count}`
            }
          />
        </Paper>

        {/* Payroll Details Dialog */}
        <Dialog
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Puantaj Detayları -{" "}
            {selectedPayroll && getPersonnelName(selectedPayroll.personnel_id)}
          </DialogTitle>
          <DialogContent>
            {selectedPayroll && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Çalışma Günü
                    </Typography>
                    <Typography variant="h6">
                      {selectedPayroll.total_working_days} gün
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Çalışma Saati
                    </Typography>
                    <Typography variant="h6">
                      {selectedPayroll.total_working_hours} saat
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fazla Mesai
                    </Typography>
                    <Typography variant="h6">
                      {selectedPayroll.overtime_hours} saat
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      İzin Günü
                    </Typography>
                    <Typography variant="h6">
                      {selectedPayroll.leave_days} gün
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Brüt Maaş
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {selectedPayroll.gross_salary.toLocaleString("tr-TR")} ₺
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Kesintiler
                    </Typography>
                    <Typography variant="h5" color="error">
                      {selectedPayroll.deductions.toLocaleString("tr-TR")} ₺
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Net Maaş
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {selectedPayroll.net_salary.toLocaleString("tr-TR")} ₺
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Payroll;
