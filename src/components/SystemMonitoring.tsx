import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  BugReport as BugReportIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabaseAdmin } from "../lib/supabase";
import { format, subHours, subDays } from "date-fns";
import { tr } from "date-fns/locale";

interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  timestamp: string;
  server_name: string;
  tags: any;
}

interface ErrorLog {
  id: string;
  error_type: string;
  severity: string;
  message: string;
  stack_trace?: string;
  user_id?: string;
  tenant_id?: string;
  request_url?: string;
  request_method?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

interface UptimeCheck {
  id: string;
  service_name: string;
  endpoint_url: string;
  status: string;
  response_time_ms?: number;
  status_code?: number;
  error_message?: string;
  checked_at: string;
  server_name: string;
}

interface PerformanceLog {
  id: string;
  operation_name: string;
  duration_ms: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  database_queries: number;
  cache_hits: number;
  cache_misses: number;
  user_id?: string;
  tenant_id?: string;
  created_at: string;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string;
  status: string;
  triggered_at: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemMonitoring: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [uptimeChecks, setUptimeChecks] = useState<UptimeCheck[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [systemHealth, setSystemHealth] = useState({
    overall: 95,
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 98,
    database: 99,
  });

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // 30 saniyede bir güncelle
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMetrics(),
        loadErrorLogs(),
        loadUptimeChecks(),
        loadPerformanceLogs(),
        loadAlerts(),
      ]);
      calculateSystemHealth();
    } catch (error) {
      console.error("Error loading monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    const hours =
      timeRange === "1h"
        ? 1
        : timeRange === "24h"
        ? 24
        : timeRange === "7d"
        ? 168
        : 720;
    const startTime = subHours(new Date(), hours).toISOString();

    const { data, error } = await supabaseAdmin
      .from("system_metrics")
      .select("*")
      .gte("timestamp", startTime)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error loading metrics:", error);
    } else {
      setMetrics(data || []);
    }
  };

  const loadErrorLogs = async () => {
    const hours =
      timeRange === "1h"
        ? 1
        : timeRange === "24h"
        ? 24
        : timeRange === "7d"
        ? 168
        : 720;
    const startTime = subHours(new Date(), hours).toISOString();

    const { data, error } = await supabaseAdmin
      .from("error_logs")
      .select("*")
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading error logs:", error);
    } else {
      setErrorLogs(data || []);
    }
  };

  const loadUptimeChecks = async () => {
    const { data, error } = await supabaseAdmin
      .from("uptime_checks")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading uptime checks:", error);
    } else {
      setUptimeChecks(data || []);
    }
  };

  const loadPerformanceLogs = async () => {
    const hours =
      timeRange === "1h"
        ? 1
        : timeRange === "24h"
        ? 24
        : timeRange === "7d"
        ? 168
        : 720;
    const startTime = subHours(new Date(), hours).toISOString();

    const { data, error } = await supabaseAdmin
      .from("performance_logs")
      .select("*")
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error loading performance logs:", error);
    } else {
      setPerformanceLogs(data || []);
    }
  };

  const loadAlerts = async () => {
    const { data, error } = await supabaseAdmin
      .from("system_alerts")
      .select("*")
      .order("triggered_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading alerts:", error);
    } else {
      setAlerts(data || []);
    }
  };

  const calculateSystemHealth = () => {
    // CPU kullanımı
    const cpuMetrics = metrics.filter((m) => m.metric_name === "cpu_usage");
    const avgCpu =
      cpuMetrics.length > 0
        ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          cpuMetrics.length
        : 0;

    // Memory kullanımı
    const memoryMetrics = metrics.filter(
      (m) => m.metric_name === "memory_usage"
    );
    const avgMemory =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          memoryMetrics.length
        : 0;

    // Disk kullanımı
    const diskMetrics = metrics.filter((m) => m.metric_name === "disk_usage");
    const avgDisk =
      diskMetrics.length > 0
        ? diskMetrics.reduce((sum, m) => sum + m.metric_value, 0) /
          diskMetrics.length
        : 0;

    // Uptime durumu
    const recentUptime = uptimeChecks.filter(
      (u) => new Date(u.checked_at) > subHours(new Date(), 1)
    );
    const uptimePercentage =
      recentUptime.length > 0
        ? (recentUptime.filter((u) => u.status === "up").length /
            recentUptime.length) *
          100
        : 100;

    // Kritik hatalar
    const criticalErrors = errorLogs.filter(
      (e) => e.severity === "critical"
    ).length;
    const errorScore = Math.max(0, 100 - criticalErrors * 10);

    setSystemHealth({
      overall: Math.round(
        (100 -
          avgCpu +
          100 -
          avgMemory +
          100 -
          avgDisk +
          uptimePercentage +
          errorScore) /
          5
      ),
      cpu: Math.round(100 - avgCpu),
      memory: Math.round(100 - avgMemory),
      disk: Math.round(100 - avgDisk),
      network: Math.round(uptimePercentage),
      database: Math.round(errorScore),
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ErrorIcon color="error" />;
      case "high":
        return <ErrorIcon color="error" />;
      case "medium":
        return <WarningIcon color="warning" />;
      case "low":
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "success";
      case "down":
        return "error";
      case "degraded":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircleIcon color="success" />;
      case "down":
        return <ErrorIcon color="error" />;
      case "degraded":
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "error";
      case "acknowledged":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  const processMetricsForChart = (metricName: string) => {
    return metrics
      .filter((m) => m.metric_name === metricName)
      .map((m) => ({
        time: format(new Date(m.timestamp), "HH:mm", { locale: tr }),
        value: m.metric_value,
      }))
      .slice(-50); // Son 50 veri noktası
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from("system_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) {
        console.error("Error resolving alert:", error);
        alert("Uyarı çözümlenirken hata oluştu: " + error.message);
      } else {
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error in handleResolveAlert:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from("system_alerts")
        .update({ status: "acknowledged" })
        .eq("id", alertId);

      if (error) {
        console.error("Error acknowledging alert:", error);
        alert("Uyarı onaylanırken hata oluştu: " + error.message);
      } else {
        await loadAlerts();
      }
    } catch (error) {
      console.error("Error in handleAcknowledgeAlert:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Sistem verileri yükleniyor...
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
          Sistem İzleme
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Zaman Aralığı</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Zaman Aralığı"
            >
              <MenuItem value="1h">Son 1 Saat</MenuItem>
              <MenuItem value="24h">Son 24 Saat</MenuItem>
              <MenuItem value="7d">Son 7 Gün</MenuItem>
              <MenuItem value="30d">Son 30 Gün</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Yenile
          </Button>
          <Button
            variant={autoRefresh ? "contained" : "outlined"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ bgcolor: autoRefresh ? "#1976d2" : undefined }}
          >
            Otomatik Yenileme
          </Button>
        </Box>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
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
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.overall}%</Typography>
                  <Typography color="textSecondary">Genel Sağlık</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
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
                  <SpeedIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.cpu}%</Typography>
                  <Typography color="textSecondary">CPU</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#2196f3",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <MemoryIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.memory}%</Typography>
                  <Typography color="textSecondary">Memory</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#9c27b0",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <StorageIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.disk}%</Typography>
                  <Typography color="textSecondary">Disk</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#00bcd4",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <NetworkIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.network}%</Typography>
                  <Typography color="textSecondary">Network</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#795548",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <TimelineIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{systemHealth.database}%</Typography>
                  <Typography color="textSecondary">Database</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Metrikler" />
            <Tab label="Hata Logları" />
            <Tab label="Uptime" />
            <Tab label="Performans" />
            <Tab label="Uyarılar" />
          </Tabs>
        </Box>

        {/* Metrics Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                CPU Kullanımı
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={processMetricsForChart("cpu_usage")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "CPU"]} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ff9800"
                    fill="#ff9800"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                Memory Kullanımı
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={processMetricsForChart("memory_usage")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Memory"]} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2196f3"
                    fill="#2196f3"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                Disk Kullanımı
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={processMetricsForChart("disk_usage")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Disk"]} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#9c27b0"
                    fill="#9c27b0"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                Aktif Bağlantılar
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={processMetricsForChart("active_connections")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}`, "Bağlantı"]} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00bcd4"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Error Logs Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Hata Logları ({errorLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Zaman</TableCell>
                    <TableCell>Tür</TableCell>
                    <TableCell>Önem</TableCell>
                    <TableCell>Mesaj</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.error_type.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(log.severity)}
                          label={log.severity.toUpperCase()}
                          color={getSeverityColor(log.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {log.message.length > 100
                            ? log.message.substring(0, 100) + "..."
                            : log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{ maxWidth: 200, display: "block" }}
                        >
                          {log.request_url || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.resolved_at ? "Çözümlendi" : "Aktif"}
                          color={log.resolved_at ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Uptime Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Servis Durumu
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Servis</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Yanıt Süresi</TableCell>
                    <TableCell>Status Code</TableCell>
                    <TableCell>Son Kontrol</TableCell>
                    <TableCell>Hata Mesajı</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uptimeChecks.map((check) => (
                    <TableRow key={check.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {check.service_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {check.endpoint_url}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(check.status)}
                          label={check.status.toUpperCase()}
                          color={getStatusColor(check.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {check.response_time_ms
                          ? `${check.response_time_ms}ms`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {check.status_code ? (
                          <Chip
                            label={check.status_code}
                            size="small"
                            color={
                              check.status_code >= 200 &&
                              check.status_code < 300
                                ? "success"
                                : "error"
                            }
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(check.checked_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: tr }
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {check.error_message || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performans Logları
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Operasyon</TableCell>
                    <TableCell>Süre (ms)</TableCell>
                    <TableCell>Memory (MB)</TableCell>
                    <TableCell>CPU (%)</TableCell>
                    <TableCell>DB Sorguları</TableCell>
                    <TableCell>Cache Hit</TableCell>
                    <TableCell>Zaman</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.operation_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={
                            log.duration_ms > 1000
                              ? "error"
                              : log.duration_ms > 500
                              ? "warning"
                              : "text.primary"
                          }
                        >
                          {log.duration_ms}ms
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.memory_usage_mb?.toFixed(2) || "-"}
                      </TableCell>
                      <TableCell>
                        {log.cpu_usage_percent?.toFixed(1) || "-"}
                      </TableCell>
                      <TableCell>{log.database_queries}</TableCell>
                      <TableCell>
                        {log.cache_hits}/{log.cache_hits + log.cache_misses}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sistem Uyarıları
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tür</TableCell>
                    <TableCell>Önem</TableCell>
                    <TableCell>Başlık</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Tetiklenme</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id} hover>
                      <TableCell>
                        <Chip
                          label={alert.alert_type.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(alert.severity)}
                          label={alert.severity.toUpperCase()}
                          color={getSeverityColor(alert.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.title}
                        </Typography>
                        {alert.description && (
                          <Typography variant="caption" color="text.secondary">
                            {alert.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.status.toUpperCase()}
                          color={getAlertStatusColor(alert.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(alert.triggered_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: tr }
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {alert.status === "active" && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                Çöz
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            Detay
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Alert Detail Dialog */}
      <Dialog
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Uyarı Detayları - {selectedAlert?.title}</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tür
                  </Typography>
                  <Chip
                    label={selectedAlert.alert_type.toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Önem
                  </Typography>
                  <Chip
                    icon={getSeverityIcon(selectedAlert.severity)}
                    label={selectedAlert.severity.toUpperCase()}
                    color={getSeverityColor(selectedAlert.severity) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Durum
                  </Typography>
                  <Chip
                    label={selectedAlert.status.toUpperCase()}
                    color={getAlertStatusColor(selectedAlert.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tetiklenme Zamanı
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      new Date(selectedAlert.triggered_at),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: tr }
                    )}
                  </Typography>
                </Grid>
                {selectedAlert.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Açıklama
                    </Typography>
                    <Typography variant="body1">
                      {selectedAlert.description}
                    </Typography>
                  </Grid>
                )}
                {selectedAlert.metadata &&
                  Object.keys(selectedAlert.metadata).length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Metadata
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                        <pre style={{ margin: 0, fontSize: "12px" }}>
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAlert(null)}>Kapat</Button>
          {selectedAlert && selectedAlert.status === "active" && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  handleAcknowledgeAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
              >
                Onayla
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleResolveAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
              >
                Çöz
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemMonitoring;
