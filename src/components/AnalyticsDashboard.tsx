import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

interface AnalyticsData {
  tenantGrowth: Array<{
    date: string;
    total: number;
    active: number;
    trial: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
    basic: number;
    pro: number;
    enterprise: number;
  }>;
  subscriptionDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topTenants: Array<{
    name: string;
    users: number;
    revenue: number;
    status: string;
  }>;
  monthlyStats: {
    newTenants: number;
    churnedTenants: number;
    revenueGrowth: number;
    userGrowth: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    tenantGrowth: [],
    revenueData: [],
    subscriptionDistribution: [],
    topTenants: [],
    monthlyStats: {
      newTenants: 0,
      churnedTenants: 0,
      revenueGrowth: 0,
      userGrowth: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6months");

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on selection
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "1month":
          startDate = subMonths(now, 1);
          break;
        case "3months":
          startDate = subMonths(now, 3);
          break;
        case "6months":
          startDate = subMonths(now, 6);
          break;
        case "1year":
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = subMonths(now, 6);
      }

      // Load tenant data
      const { data: tenants, error: tenantsError } = await supabaseAdmin
        .from("tenants")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (tenantsError) {
        console.error("Error loading tenants:", tenantsError);
        return;
      }

      // Load users data
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("*, tenants!inner(*)")
        .gte("created_at", startDate.toISOString());

      if (usersError) {
        console.error("Error loading users:", usersError);
        return;
      }

      // Process data for charts
      const processedData = processAnalyticsData(tenants || [], users || []);
      setData(processedData);
    } catch (error) {
      console.error("Error in loadAnalyticsData:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (tenants: any[], users: any[]) => {
    // Tenant growth data
    const tenantGrowth = generateTenantGrowthData(tenants);

    // Revenue data
    const revenueData = generateRevenueData(tenants);

    // Subscription distribution
    const subscriptionDistribution = generateSubscriptionDistribution(tenants);

    // Top tenants
    const topTenants = generateTopTenants(tenants, users);

    // Monthly stats
    const monthlyStats = calculateMonthlyStats(tenants, users);

    return {
      tenantGrowth,
      revenueData,
      subscriptionDistribution,
      topTenants,
      monthlyStats,
    };
  };

  const generateTenantGrowthData = (tenants: any[]) => {
    const data: any[] = [];
    const now = new Date();
    const days =
      timeRange === "1month"
        ? 30
        : timeRange === "3months"
        ? 90
        : timeRange === "6months"
        ? 180
        : 365;

    for (let i = days; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, "yyyy-MM-dd");

      const totalTenants = tenants.filter(
        (t) => new Date(t.created_at) <= date
      ).length;

      const activeTenants = tenants.filter(
        (t) => new Date(t.created_at) <= date && t.status === "active"
      ).length;

      const trialTenants = tenants.filter(
        (t) => new Date(t.created_at) <= date && t.status === "trial"
      ).length;

      data.push({
        date: dateStr,
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
      });
    }

    return data;
  };

  const generateRevenueData = (tenants: any[]) => {
    const data: any[] = [];
    const now = new Date();
    const months =
      timeRange === "1month"
        ? 1
        : timeRange === "3months"
        ? 3
        : timeRange === "6months"
        ? 6
        : 12;

    for (let i = months; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthStr = format(month, "MMM yyyy", { locale: tr });

      const planPrices = { basic: 99, pro: 299, enterprise: 999 };

      const monthlyTenants = tenants.filter((t) => {
        const tenantDate = new Date(t.created_at);
        return (
          tenantDate.getMonth() === month.getMonth() &&
          tenantDate.getFullYear() === month.getFullYear()
        );
      });

      const revenue = monthlyTenants.reduce((total, tenant) => {
        return (
          total +
          (planPrices[tenant.subscription_plan as keyof typeof planPrices] || 0)
        );
      }, 0);

      const basic =
        monthlyTenants.filter((t) => t.subscription_plan === "basic").length *
        99;
      const pro =
        monthlyTenants.filter((t) => t.subscription_plan === "pro").length *
        299;
      const enterprise =
        monthlyTenants.filter((t) => t.subscription_plan === "enterprise")
          .length * 999;

      data.push({
        month: monthStr,
        revenue,
        basic,
        pro,
        enterprise,
      });
    }

    return data;
  };

  const generateSubscriptionDistribution = (tenants: any[]) => {
    const planCounts = tenants.reduce((acc, tenant) => {
      acc[tenant.subscription_plan] = (acc[tenant.subscription_plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      basic: "#1976d2",
      pro: "#2e7d32",
      enterprise: "#ff9800",
    };

    return Object.entries(planCounts).map(([plan, count]) => ({
      name: plan.toUpperCase(),
      value: count as number,
      color: colors[plan as keyof typeof colors] || "#666",
    }));
  };

  const generateTopTenants = (tenants: any[], users: any[]) => {
    return tenants
      .map((tenant) => {
        const tenantUsers = users.filter((u) => u.tenant_id === tenant.id);
        const planPrices = { basic: 99, pro: 299, enterprise: 999 };
        const revenue =
          planPrices[tenant.subscription_plan as keyof typeof planPrices] || 0;

        return {
          name: tenant.name,
          users: tenantUsers.length,
          revenue,
          status: tenant.status,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const calculateMonthlyStats = (tenants: any[], users: any[]) => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const thisMonth = now;

    const newTenants = tenants.filter((t) => {
      const created = new Date(t.created_at);
      return created >= startOfMonth(thisMonth);
    }).length;

    const churnedTenants = tenants.filter((t) => {
      const created = new Date(t.created_at);
      return (
        created >= startOfMonth(lastMonth) &&
        created < startOfMonth(thisMonth) &&
        t.status === "cancelled"
      );
    }).length;

    const lastMonthRevenue = tenants
      .filter((t) => {
        const created = new Date(t.created_at);
        return (
          created >= startOfMonth(lastMonth) &&
          created < startOfMonth(thisMonth)
        );
      })
      .reduce((total, t) => {
        const planPrices = { basic: 99, pro: 299, enterprise: 999 };
        return (
          total +
          (planPrices[t.subscription_plan as keyof typeof planPrices] || 0)
        );
      }, 0);

    const thisMonthRevenue = tenants
      .filter((t) => {
        const created = new Date(t.created_at);
        return created >= startOfMonth(thisMonth);
      })
      .reduce((total, t) => {
        const planPrices = { basic: 99, pro: 299, enterprise: 999 };
        return (
          total +
          (planPrices[t.subscription_plan as keyof typeof planPrices] || 0)
        );
      }, 0);

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    const userGrowth = users.filter((u) => {
      const created = new Date(u.created_at);
      return created >= startOfMonth(thisMonth);
    }).length;

    return {
      newTenants,
      churnedTenants,
      revenueGrowth,
      userGrowth,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "trial":
        return "info";
      case "suspended":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Analitik veriler yükleniyor...
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
          Analitik Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Zaman Aralığı</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Zaman Aralığı"
          >
            <MenuItem value="1month">Son 1 Ay</MenuItem>
            <MenuItem value="3months">Son 3 Ay</MenuItem>
            <MenuItem value="6months">Son 6 Ay</MenuItem>
            <MenuItem value="1year">Son 1 Yıl</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Monthly Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#1976d2",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <BusinessIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {data.monthlyStats.newTenants}
                  </Typography>
                  <Typography color="textSecondary">Yeni Müşteri</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#f44336",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <TrendingDownIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {data.monthlyStats.churnedTenants}
                  </Typography>
                  <Typography color="textSecondary">
                    Kaybedilen Müşteri
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#4caf50",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {data.monthlyStats.revenueGrowth > 0 ? "+" : ""}
                    {data.monthlyStats.revenueGrowth.toFixed(1)}%
                  </Typography>
                  <Typography color="textSecondary">Gelir Artışı</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#ff9800",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {data.monthlyStats.userGrowth}
                  </Typography>
                  <Typography color="textSecondary">Yeni Kullanıcı</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Tenant Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Müşteri Büyüme Trendi
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.tenantGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#1976d2"
                  fill="#1976d2"
                  name="Toplam"
                />
                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="2"
                  stroke="#2e7d32"
                  fill="#2e7d32"
                  name="Aktif"
                />
                <Area
                  type="monotone"
                  dataKey="trial"
                  stackId="3"
                  stroke="#ff9800"
                  fill="#ff9800"
                  name="Deneme"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Subscription Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Abonelik Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.subscriptionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.subscriptionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Aylık Gelir Analizi
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₺${value}`, ""]} />
                <Legend />
                <Bar dataKey="basic" stackId="a" fill="#1976d2" name="Basic" />
                <Bar dataKey="pro" stackId="a" fill="#2e7d32" name="Pro" />
                <Bar
                  dataKey="enterprise"
                  stackId="a"
                  fill="#ff9800"
                  name="Enterprise"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Tenants Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              En Yüksek Gelirli Müşteriler
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Müşteri Adı</TableCell>
                    <TableCell>Kullanıcı Sayısı</TableCell>
                    <TableCell>Aylık Gelir</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.topTenants.map((tenant, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {tenant.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{tenant.users}</TableCell>
                      <TableCell>₺{tenant.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.status.toUpperCase()}
                          color={getStatusColor(tenant.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
