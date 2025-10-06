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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Api as ApiIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO, subDays, subHours } from "date-fns";
import { tr } from "date-fns/locale";

interface UserActivityLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_url?: string;
  request_method?: string;
  response_status?: number;
  duration_ms?: number;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  tenant?: {
    name: string;
    subdomain: string;
  };
}

interface SystemChangeLog {
  id: string;
  changed_by?: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_values?: any;
  new_values?: any;
  changed_columns?: string[];
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

interface SecurityLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  event_type: string;
  severity: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  additional_data?: any;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  tenant?: {
    name: string;
    subdomain: string;
  };
}

interface ApiUsageLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  endpoint: string;
  method: string;
  request_body?: any;
  response_body?: any;
  status_code: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  api_key_id?: string;
  rate_limit_remaining?: number;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  tenant?: {
    name: string;
    subdomain: string;
  };
}

interface DataAccessLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  table_name: string;
  operation: string;
  record_count?: number;
  filters?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  tenant?: {
    name: string;
    subdomain: string;
  };
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
      id={`audit-tabpanel-${index}`}
      aria-labelledby={`audit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AuditLogs: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>(
    []
  );
  const [systemChangeLogs, setSystemChangeLogs] = useState<SystemChangeLog[]>(
    []
  );
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsageLog[]>([]);
  const [dataAccessLogs, setDataAccessLogs] = useState<DataAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [filters, setFilters] = useState({
    timeRange: "24h",
    user: "",
    tenant: "",
    action: "",
    severity: "",
    status: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const stats = {
    totalActivities: userActivityLogs.length,
    totalChanges: systemChangeLogs.length,
    securityEvents: securityLogs.length,
    apiCalls: apiUsageLogs.length,
    dataAccess: dataAccessLogs.length,
    criticalSecurity: securityLogs.filter((s) => s.severity === "critical")
      .length,
    failedApiCalls: apiUsageLogs.filter((a) => a.status_code >= 400).length,
    unresolvedSecurity: securityLogs.filter((s) => !s.resolved).length,
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserActivityLogs(),
        loadSystemChangeLogs(),
        loadSecurityLogs(),
        loadApiUsageLogs(),
        loadDataAccessLogs(),
      ]);
    } catch (error) {
      console.error("Error loading audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeFilter = () => {
    const now = new Date();
    switch (filters.timeRange) {
      case "1h":
        return subHours(now, 1).toISOString();
      case "24h":
        return subHours(now, 24).toISOString();
      case "7d":
        return subDays(now, 7).toISOString();
      case "30d":
        return subDays(now, 30).toISOString();
      default:
        return subHours(now, 24).toISOString();
    }
  };

  const loadUserActivityLogs = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("user_activity_logs")
      .select(
        `
        *,
        user:users(email, full_name),
        tenant:tenants(name, subdomain)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.user) {
      query = query.eq("user_id", filters.user);
    }
    if (filters.tenant) {
      query = query.eq("tenant_id", filters.tenant);
    }
    if (filters.action) {
      query = query.eq("action", filters.action);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading user activity logs:", error);
    } else {
      setUserActivityLogs(data || []);
    }
  };

  const loadSystemChangeLogs = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("system_change_logs")
      .select(
        `
        *,
        user:users(email, full_name)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.user) {
      query = query.eq("changed_by", filters.user);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading system change logs:", error);
    } else {
      setSystemChangeLogs(data || []);
    }
  };

  const loadSecurityLogs = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("security_logs")
      .select(
        `
        *,
        user:users(email, full_name),
        tenant:tenants(name, subdomain)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.user) {
      query = query.eq("user_id", filters.user);
    }
    if (filters.tenant) {
      query = query.eq("tenant_id", filters.tenant);
    }
    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading security logs:", error);
    } else {
      setSecurityLogs(data || []);
    }
  };

  const loadApiUsageLogs = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("api_usage_logs")
      .select(
        `
        *,
        user:users(email, full_name),
        tenant:tenants(name, subdomain)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.user) {
      query = query.eq("user_id", filters.user);
    }
    if (filters.tenant) {
      query = query.eq("tenant_id", filters.tenant);
    }
    if (filters.status) {
      if (filters.status === "success") {
        query = query.lt("status_code", 400);
      } else if (filters.status === "error") {
        query = query.gte("status_code", 400);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading API usage logs:", error);
    } else {
      setApiUsageLogs(data || []);
    }
  };

  const loadDataAccessLogs = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("data_access_logs")
      .select(
        `
        *,
        user:users(email, full_name),
        tenant:tenants(name, subdomain)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.user) {
      query = query.eq("user_id", filters.user);
    }
    if (filters.tenant) {
      query = query.eq("tenant_id", filters.tenant);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading data access logs:", error);
    } else {
      setDataAccessLogs(data || []);
    }
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

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 300 && statusCode < 400) return "info";
    if (statusCode >= 400 && statusCode < 500) return "warning";
    if (statusCode >= 500) return "error";
    return "default";
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "login":
        return "success";
      case "logout":
        return "info";
      case "create":
        return "primary";
      case "update":
        return "warning";
      case "delete":
        return "error";
      case "view":
        return "default";
      default:
        return "default";
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "INSERT":
        return "success";
      case "UPDATE":
        return "warning";
      case "DELETE":
        return "error";
      default:
        return "default";
    }
  };

  const filteredUserActivityLogs = userActivityLogs.filter(
    (log) =>
      searchTerm === "" ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSecurityLogs = securityLogs.filter(
    (log) =>
      searchTerm === "" ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApiUsageLogs = apiUsageLogs.filter(
    (log) =>
      searchTerm === "" ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Audit logları yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Audit Logları
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
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
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalActivities}</Typography>
                  <Typography color="textSecondary">
                    Kullanıcı Aktivitesi
                  </Typography>
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
                    backgroundColor: "#4caf50",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <HistoryIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalChanges}</Typography>
                  <Typography color="textSecondary">
                    Sistem Değişikliği
                  </Typography>
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
                    backgroundColor: "#f44336",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <SecurityIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.securityEvents}</Typography>
                  <Typography color="textSecondary">Güvenlik Olayı</Typography>
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
                  <ApiIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.apiCalls}</Typography>
                  <Typography color="textSecondary">API Çağrısı</Typography>
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
                  <Typography variant="h6">{stats.dataAccess}</Typography>
                  <Typography color="textSecondary">Veri Erişimi</Typography>
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
                  <ErrorIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.criticalSecurity}</Typography>
                  <Typography color="textSecondary">Kritik Güvenlik</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Filtreler</Typography>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Filtreleri Gizle" : "Filtreleri Göster"}
          </Button>
        </Box>

        {showFilters && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Zaman Aralığı</InputLabel>
                <Select
                  value={filters.timeRange}
                  onChange={(e) =>
                    setFilters({ ...filters, timeRange: e.target.value })
                  }
                  label="Zaman Aralığı"
                >
                  <MenuItem value="1h">Son 1 Saat</MenuItem>
                  <MenuItem value="24h">Son 24 Saat</MenuItem>
                  <MenuItem value="7d">Son 7 Gün</MenuItem>
                  <MenuItem value="30d">Son 30 Gün</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Güvenlik Seviyesi</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) =>
                    setFilters({ ...filters, severity: e.target.value })
                  }
                  label="Güvenlik Seviyesi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="critical">Kritik</MenuItem>
                  <MenuItem value="high">Yüksek</MenuItem>
                  <MenuItem value="medium">Orta</MenuItem>
                  <MenuItem value="low">Düşük</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>API Durumu</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  label="API Durumu"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="success">Başarılı</MenuItem>
                  <MenuItem value="error">Hatalı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Ara"
                fullWidth
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                fullWidth
              >
                Yenile
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Main Content */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Kullanıcı Aktivitesi" />
            <Tab label="Sistem Değişiklikleri" />
            <Tab label="Güvenlik Logları" />
            <Tab label="API Kullanımı" />
            <Tab label="Veri Erişimi" />
          </Tabs>
        </Box>

        {/* User Activity Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Aktivite Logları ({filteredUserActivityLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Aksiyon</TableCell>
                    <TableCell>Kaynak</TableCell>
                    <TableCell>IP Adresi</TableCell>
                    <TableCell>Yanıt Süresi</TableCell>
                    <TableCell>Zaman</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUserActivityLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user?.full_name ||
                            log.user?.email ||
                            "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.tenant?.name || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action.toUpperCase()}
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.resource_type}
                        </Typography>
                        {log.resource_name && (
                          <Typography variant="caption" color="text.secondary">
                            {log.resource_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.ip_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* System Changes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sistem Değişiklik Logları ({systemChangeLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Değiştiren</TableCell>
                    <TableCell>Tablo</TableCell>
                    <TableCell>İşlem</TableCell>
                    <TableCell>Kayıt ID</TableCell>
                    <TableCell>Değişen Kolonlar</TableCell>
                    <TableCell>Zaman</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {systemChangeLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user?.full_name || log.user?.email || "Sistem"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.table_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.operation}
                          color={getOperationColor(log.operation) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.record_id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.changed_columns &&
                        log.changed_columns.length > 0 ? (
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {log.changed_columns.slice(0, 3).map((col) => (
                              <Chip
                                key={col}
                                label={col}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {log.changed_columns.length > 3 && (
                              <Chip
                                label={`+${log.changed_columns.length - 3}`}
                                size="small"
                              />
                            )}
                          </Box>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Security Logs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Güvenlik Logları ({filteredSecurityLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Olay Türü</TableCell>
                    <TableCell>Önem</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>IP Adresi</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Zaman</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSecurityLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user?.full_name ||
                            log.user?.email ||
                            "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.tenant?.name || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.event_type}
                        </Typography>
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
                          {log.description.length > 100
                            ? log.description.substring(0, 100) + "..."
                            : log.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.ip_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.resolved ? "Çözümlendi" : "Açık"}
                          color={log.resolved ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* API Usage Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Kullanım Logları ({filteredApiUsageLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Yanıt Süresi</TableCell>
                    <TableCell>IP Adresi</TableCell>
                    <TableCell>Zaman</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApiUsageLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user?.full_name ||
                            log.user?.email ||
                            "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.tenant?.name || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.method}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status_code}
                          color={getStatusColor(log.status_code) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {log.response_time_ms
                          ? `${log.response_time_ms}ms`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.ip_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Data Access Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Veri Erişim Logları ({dataAccessLogs.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Tablo</TableCell>
                    <TableCell>İşlem</TableCell>
                    <TableCell>Kayıt Sayısı</TableCell>
                    <TableCell>Filtreler</TableCell>
                    <TableCell>IP Adresi</TableCell>
                    <TableCell>Zaman</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataAccessLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {log.user?.full_name ||
                            log.user?.email ||
                            "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.tenant?.name || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.table_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.operation}
                          color={getOperationColor(log.operation) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.record_count || "-"}</TableCell>
                      <TableCell>
                        {log.filters ? (
                          <Typography
                            variant="caption"
                            sx={{ maxWidth: 200, display: "block" }}
                          >
                            {JSON.stringify(log.filters).length > 50
                              ? JSON.stringify(log.filters).substring(0, 50) +
                                "..."
                              : JSON.stringify(log.filters)}
                          </Typography>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.ip_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLog(log);
                            setOpenDetailDialog(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Log Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Detayları</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {selectedLog.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Zaman
                  </Typography>
                  <Typography variant="body1">
                    {format(
                      parseISO(selectedLog.created_at),
                      "dd/MM/yyyy HH:mm:ss",
                      { locale: tr }
                    )}
                  </Typography>
                </Grid>
                {selectedLog.user_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Kullanıcı
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.user?.full_name ||
                        selectedLog.user?.email ||
                        "Bilinmeyen"}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.tenant_id && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tenant
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.tenant?.name || "Bilinmeyen"}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.ip_address && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      IP Adresi
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {selectedLog.ip_address}
                    </Typography>
                  </Grid>
                )}
                {selectedLog.user_agent && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      User Agent
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: "0.875rem" }}>
                      {selectedLog.user_agent}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {(selectedLog.old_values || selectedLog.new_values) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Değişiklik Detayları
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedLog.old_values && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Eski Değerler
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                          <pre
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              overflow: "auto",
                            }}
                          >
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                    {selectedLog.new_values && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Yeni Değerler
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                          <pre
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              overflow: "auto",
                            }}
                          >
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {selectedLog.additional_data && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Ek Veriler
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <pre
                      style={{ margin: 0, fontSize: "12px", overflow: "auto" }}
                    >
                      {JSON.stringify(selectedLog.additional_data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
