import React, { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Alert,
  Stack,
} from "@mui/material";
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Videocam as CameraIcon,
  // İzin yönetimi ikonları
  Event as EventIcon,
  Pending as PendingIcon,
  CalendarMonth as CalendarMonthIcon,
  SwapHoriz as SwapHorizIcon,
  // Nöbet çizelgesi ikonları
  WbSunny as DayIcon,
  Nightlight as NightIcon,
  AssignmentInd as AssignmentIndIcon,
  PersonPin as PersonPinIcon,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import ExchangeRates from "./ExchangeRates";
import CameraCard from "./CameraCard";
import PersonnelMap from "./PersonnelMap";

interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  todayLogins: number;
  systemHealth: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  pendingTasks: number;
  // Proje bazlı istatistikler
  projectPersonnelCount: number;
  todayPatrols: { completed: number; total: number };
  todayWorkingPersonnel: number;
  todayIncidents: number;
  // İzin yönetimi istatistikleri
  todayOnLeave: number;
  pendingLeaveRequests: number;
  monthlyLeaveDays: number;
  activeJokerPersonnel: number;
  // Nöbet çizelgesi istatistikleri
  todayDayShifts: number;
  todayNightShifts: number;
  totalActiveShifts: number;
  jokerAssignments: number;
}

interface RecentActivity {
  id: string;
  type: "login" | "project" | "user" | "expense" | "payment";
  user: string;
  action: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const { tenant } = useTenant();
  const { selectedProject } = useProject();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProjects: 0,
    todayLogins: 0,
    systemHealth: 100,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    profitMargin: 0,
    pendingTasks: 0,
    // Proje bazlı istatistikler
    projectPersonnelCount: 0,
    todayPatrols: { completed: 0, total: 0 },
    todayWorkingPersonnel: 0,
    todayIncidents: 0,
    // İzin yönetimi istatistikleri
    todayOnLeave: 0,
    pendingLeaveRequests: 0,
    monthlyLeaveDays: 0,
    activeJokerPersonnel: 0,
    // Nöbet çizelgesi istatistikleri
    todayDayShifts: 0,
    todayNightShifts: 0,
    totalActiveShifts: 0,
    jokerAssignments: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [camera, setCamera] = useState<any>(null);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      loadDashboardData();
    }
  }, [tenant, selectedProject]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadStats(),
        loadRecentActivities(),
        loadExpenseData(),
        loadUserActivityData(),
        loadCameraData(),
        loadPersonnelData(),
      ]);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Dashboard verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!tenant) return;

    try {
      // Toplam kullanıcı sayısı
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Aktif proje sayısı
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "active");

      // Bugün giriş yapan kullanıcılar
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { count: todayLoginCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .gte("last_login", startOfToday)
        .lte("last_login", endOfToday);

      // Aylık gelir (örnek veri - gerçek uygulamada billing tablosundan gelecek)
      const monthlyRevenue = 125000; // TL
      const monthlyExpenses = 85000; // TL
      const profitMargin =
        ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100;

      // Proje bazlı istatistikler
      let projectPersonnelCount = 0;
      let todayPatrols = { completed: 0, total: 0 };
      let todayWorkingPersonnel = 0;
      let todayIncidents = 0;
      // İzin yönetimi istatistikleri
      let todayOnLeave = 0;
      let pendingLeaveRequests = 0;
      let monthlyLeaveDays = 0;
      let activeJokerPersonnel = 0;
      // Nöbet çizelgesi istatistikleri
      let todayDayShifts = 0;
      let todayNightShifts = 0;
      let totalActiveShifts = 0;
      let jokerAssignments = 0;

      if (selectedProject) {
        // Proje personel sayısı
        const { count: personnelCount } = await supabase
          .from("personnel")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("project_id", selectedProject.id);

        projectPersonnelCount = personnelCount || 0;

        // Bugünkü devriyeler (mock data)
        todayPatrols = { completed: 1, total: 10 };

        // Bugün çalışacak personel (mock data)
        todayWorkingPersonnel = Math.floor(projectPersonnelCount * 0.7); // %70'i çalışıyor

        // Bugünkü olaylar/ihlaller (mock data)
        todayIncidents = 2;

        // İzin yönetimi istatistikleri
        try {
          // Bugün izinli personel sayısı
          const { count: leaveCount } = await supabase
            .from("leave_days")
            .select("*", { count: "exact", head: true })
            .eq("leave_date", format(new Date(), "yyyy-MM-dd"))
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          todayOnLeave = leaveCount || 0;

          // Bekleyen izin talepleri
          const { count: pendingCount } = await supabase
            .from("personnel_leaves")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          pendingLeaveRequests = pendingCount || 0;

          // Bu ayki izin günleri
          const currentMonth = format(new Date(), "yyyy-MM");
          const { count: monthlyCount } = await supabase
            .from("leave_days")
            .select("*", { count: "exact", head: true })
            .like("leave_date", `${currentMonth}%`)
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          monthlyLeaveDays = monthlyCount || 0;

          // Aktif joker personel sayısı
          const { count: jokerCount } = await supabase
            .from("joker_personnel")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenant.id)
            .eq("project_id", selectedProject.id)
            .eq("status", "active");

          activeJokerPersonnel = jokerCount || 0;

          // Nöbet çizelgesi istatistikleri
          const today = format(new Date(), "yyyy-MM-dd");

          // Bugünkü gündüz vardiyaları
          const { count: dayCount } = await supabase
            .from("duty_assignments")
            .select("*", { count: "exact", head: true })
            .eq("duty_date", today)
            .eq("shift_type", "day")
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          todayDayShifts = dayCount || 0;

          // Bugünkü gece vardiyaları
          const { count: nightCount } = await supabase
            .from("duty_assignments")
            .select("*", { count: "exact", head: true })
            .eq("duty_date", today)
            .eq("shift_type", "night")
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          todayNightShifts = nightCount || 0;

          // Toplam aktif vardiya
          totalActiveShifts = todayDayShifts + todayNightShifts;

          // Joker atamaları
          const { count: jokerAssignCount } = await supabase
            .from("duty_assignments")
            .select("*", { count: "exact", head: true })
            .eq("duty_date", today)
            .eq("is_joker", true)
            .in(
              "personnel_id",
              await supabase
                .from("personnel")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("project_id", selectedProject.id)
                .then((res) => res.data?.map((p) => p.id) || [])
            );

          jokerAssignments = jokerAssignCount || 0;
        } catch (err) {
          console.error("Error loading leave/duty stats:", err);
        }
      }

      setStats({
        totalUsers: userCount || 0,
        activeProjects: projectCount || 0,
        todayLogins: todayLoginCount || 0,
        systemHealth: 98,
        monthlyRevenue,
        monthlyExpenses,
        profitMargin: Math.round(profitMargin),
        pendingTasks: 12,
        // Proje bazlı istatistikler
        projectPersonnelCount,
        todayPatrols,
        todayWorkingPersonnel,
        todayIncidents,
        // İzin yönetimi istatistikleri
        todayOnLeave,
        pendingLeaveRequests,
        monthlyLeaveDays,
        activeJokerPersonnel,
        // Nöbet çizelgesi istatistikleri
        todayDayShifts,
        todayNightShifts,
        totalActiveShifts,
        jokerAssignments,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadRecentActivities = async () => {
    if (!tenant) return;

    try {
      // Son kullanıcı girişleri
      const { data: recentUsers } = await supabase
        .from("users")
        .select("full_name, last_login, email")
        .eq("tenant_id", tenant.id)
        .not("last_login", "is", null)
        .order("last_login", { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = (recentUsers || []).map(
        (user, index) => ({
          id: `login-${index}`,
          type: "login",
          user: user.full_name || user.email,
          action: "sisteme giriş yaptı",
          timestamp: user.last_login,
          icon: <SecurityIcon />,
          color: "#4caf50",
        })
      );

      // Örnek aktiviteler ekle
      const sampleActivities: RecentActivity[] = [
        {
          id: "expense-1",
          type: "expense",
          user: "Muhasebe",
          action: "yeni gider kaydı oluşturdu",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: <MoneyIcon />,
          color: "#f44336",
        },
        {
          id: "project-1",
          type: "project",
          user: "Proje Yöneticisi",
          action: "yeni proje oluşturdu",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: <BusinessIcon />,
          color: "#2196f3",
        },
        {
          id: "user-1",
          type: "user",
          user: "Admin",
          action: "yeni kullanıcı ekledi",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: <PersonAddIcon />,
          color: "#ff9800",
        },
      ];

      setRecentActivities([...activities, ...sampleActivities].slice(0, 8));
    } catch (err) {
      console.error("Error loading recent activities:", err);
    }
  };

  const loadExpenseData = async () => {
    // Örnek gider verileri - gerçek uygulamada expenses tablosundan gelecek
    const expenses: ExpenseData[] = [
      { category: "Personel Maaşları", amount: 45000, color: "#f44336" },
      { category: "Ofis Giderleri", amount: 15000, color: "#ff9800" },
      { category: "Teknoloji", amount: 12000, color: "#2196f3" },
      { category: "Ulaşım", amount: 8000, color: "#4caf50" },
      { category: "Diğer", amount: 5000, color: "#9c27b0" },
    ];

    setExpenseData(expenses);
  };

  const loadUserActivityData = async () => {
    // Son 7 günlük kullanıcı aktivitesi
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      activityData.push({
        date: format(date, "dd/MM", { locale: tr }),
        logins: Math.floor(Math.random() * 20) + 10,
        newUsers: Math.floor(Math.random() * 5) + 1,
      });
    }
    setUserActivityData(activityData);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const loadCameraData = async () => {
    if (!tenant || !selectedProject) return;

    try {
      const { data, error } = await supabase
        .from("cameras")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        console.error("Error loading camera:", error);
      } else {
        setCamera(data);
      }
    } catch (err) {
      console.error("Error in loadCameraData:", err);
    }
  };

  const loadPersonnelData = async () => {
    if (!tenant || !selectedProject) return;

    try {
      const { data, error } = await supabase
        .from("personnel")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading personnel:", error);
      } else {
        setPersonnel(data || []);
      }
    } catch (err) {
      console.error("Error in loadPersonnelData:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Dashboard yükleniyor...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Yenile
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ background: "linear-gradient(45deg, #1976d2, #42a5f5)" }}
          >
            Hızlı İşlem
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Ana İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stats.projectPersonnelCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proje Personeli
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="secondary">
                    {stats.todayPatrols.completed}/{stats.todayPatrols.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugünkü Devriyeler
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <SecurityIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.todayWorkingPersonnel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugün Çalışan
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.todayIncidents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugünkü Olaylar
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "error.main" }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* İzin Yönetimi İstatistikleri */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <EventIcon color="primary" />
            İzin Yönetimi
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.todayOnLeave}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bugün İzinli
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <EventIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {stats.pendingLeaveRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bekleyen Talepler
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stats.monthlyLeaveDays}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bu Ay İzin Günü
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <CalendarMonthIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="secondary">
                    {stats.activeJokerPersonnel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktif Joker
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <SwapHorizIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Nöbet Çizelgesi İstatistikleri */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <AssignmentIndIcon color="primary" />
            Nöbet Çizelgesi
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {stats.todayDayShifts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gündüz Vardiyası
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <DayIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.todayNightShifts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gece Vardiyası
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "info.main" }}>
                  <NightIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stats.totalActiveShifts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Aktif Vardiya
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <AssignmentIndIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "#ffffff",
              border: "1px solid #e0e0e0",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
              },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="secondary">
                    {stats.jokerAssignments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Joker Atamaları
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  <PersonPinIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kamera Görüntüsü */}
      {selectedProject && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CameraIcon color="primary" />
                {selectedProject.name} - Canlı Kamera Görüntüsü
              </Typography>
            </Box>

            {/* Kamera Kartı */}
            <CameraCard
              camera={camera}
              onCameraUpdate={(updatedCamera) => setCamera(updatedCamera)}
            />
          </Grid>
        </Grid>
      )}

      {/* Personel Konum Takibi - Harita ve Liste */}
      {selectedProject && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
            >
              <PeopleIcon color="primary" />
              {selectedProject.name} - Personel Konum Takibi
            </Typography>

            <Grid container spacing={2}>
              {/* Harita Bölümü */}
              <Grid item xs={12} md={8}>
                <Card sx={{ height: 400 }}>
                  <CardContent sx={{ p: 0, height: "100%" }}>
                    <PersonnelMap />
                  </CardContent>
                </Card>
              </Grid>

              {/* Personel Listesi */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: 400 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personel
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Son görülme (önce)
                    </Typography>

                    <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
                      {personnel.length > 0 ? (
                        personnel.map((person, index) => {
                          // Renk paleti
                          const colors = [
                            "#00bcd4",
                            "#f44336",
                            "#9c27b0",
                            "#ff9800",
                            "#4caf50",
                            "#2196f3",
                          ];
                          const color = colors[index % colors.length];

                          // Son görülme zamanı (mock - gerçek uygulamada last_seen alanından gelecek)
                          const lastSeenOptions = [
                            "22 dakika",
                            "1 saat",
                            "2 saat",
                            "1 gün",
                            "2 gün",
                            "3 gün",
                          ];
                          const lastSeen =
                            lastSeenOptions[index % lastSeenOptions.length];

                          return (
                            <Box
                              key={person.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                                p: 1,
                                backgroundColor: "#f8f9fa",
                                borderRadius: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: color,
                                  borderRadius: "50%",
                                  mr: 1,
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {person.first_name} {person.last_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {lastSeen}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      ) : (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Bu proje için henüz personel eklenmemiş.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

      {/* Giderler ve Maliyet Analizi */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AccountBalanceIcon color="primary" />
                Aylık Gelir-Gider
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Gelir
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ₺{stats.monthlyRevenue.toLocaleString()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Gider
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    ₺{stats.monthlyExpenses.toLocaleString()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Kar Marjı
                  </Typography>
                  <Chip
                    label={`%${stats.profitMargin}`}
                    color={
                      stats.profitMargin >= 20
                        ? "success"
                        : stats.profitMargin >= 10
                        ? "warning"
                        : "error"
                    }
                    variant="outlined"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <ExchangeRates />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BarChartIcon color="primary" />
                Gider Dağılımı
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({ category, amount }) =>
                      `${category}: ₺${amount.toLocaleString()}`
                    }
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [
                      `₺${value.toLocaleString()}`,
                      "Tutar",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler ve Trendler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TrendingUpIcon color="primary" />
                Son 7 Günlük Aktivite
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stackId="1"
                    stroke="#1976d2"
                    fill="#1976d2"
                    name="Girişler"
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="2"
                    stroke="#4caf50"
                    fill="#4caf50"
                    name="Yeni Kullanıcılar"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <NotificationIcon color="primary" />
                Hızlı İşlemler
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Yeni Kullanıcı Ekle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Hızlı İzin Ekle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIndIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Vardiya Düzenle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Joker Ata
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Proje Oluştur
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MoneyIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Gider Kaydet
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Rapor Oluştur
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  fullWidth
                  sx={{ justifyContent: "flex-start" }}
                >
                  Ayarlar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Son Aktiviteler */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ScheduleIcon color="primary" />
                Son Aktiviteler
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.color }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body1">
                              <strong>{activity.user}</strong> {activity.action}
                            </Typography>
                            <Chip
                              label={format(
                                new Date(activity.timestamp),
                                "HH:mm",
                                { locale: tr }
                              )}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={format(
                          new Date(activity.timestamp),
                          "dd MMMM yyyy",
                          { locale: tr }
                        )}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
