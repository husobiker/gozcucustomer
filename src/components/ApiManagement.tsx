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
  LinearProgress,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Api as ApiIcon,
  Key as KeyIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Webhook as WebhookIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO, subDays, subHours } from "date-fns";
import { tr } from "date-fns/locale";

interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  tenant_id?: string;
  user_id?: string;
  permissions: string[];
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata: any;
  tenant?: {
    name: string;
    subdomain: string;
  };
  user?: {
    email: string;
    full_name?: string;
  };
}

interface ApiUsageStat {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  api_key?: ApiKey;
}

interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  description?: string;
  category?: string;
  requires_auth: boolean;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_key?: string;
  is_active: boolean;
  tenant_id?: string;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  user?: {
    email: string;
    full_name?: string;
  };
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  status: string;
  response_status?: number;
  response_body?: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at?: string;
  created_at: string;
  delivered_at?: string;
  webhook?: ApiWebhook;
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
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ApiManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStat[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<ApiWebhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [openWebhookDialog, setOpenWebhookDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState({
    timeRange: "24h",
    status: "",
    endpoint: "",
    tenant: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Form states
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
    tenant_id: "",
    user_id: "",
    permissions: [] as string[],
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000,
    expires_at: "",
    is_active: true,
  });

  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
    secret_key: "",
    is_active: true,
    tenant_id: "",
    retry_count: 3,
    timeout_seconds: 30,
  });

  const stats = {
    totalApiKeys: apiKeys.length,
    activeApiKeys: apiKeys.filter((k) => k.is_active).length,
    totalRequests: usageStats.length,
    successfulRequests: usageStats.filter((s) => s.status_code < 400).length,
    failedRequests: usageStats.filter((s) => s.status_code >= 400).length,
    averageResponseTime:
      usageStats.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) /
        usageStats.length || 0,
    totalEndpoints: endpoints.length,
    activeEndpoints: endpoints.filter((e) => e.is_active).length,
    totalWebhooks: webhooks.length,
    activeWebhooks: webhooks.filter((w) => w.is_active).length,
  };

  const availablePermissions = [
    "read:tenants",
    "write:tenants",
    "delete:tenants",
    "read:users",
    "write:users",
    "delete:users",
    "read:projects",
    "write:projects",
    "delete:projects",
    "read:personnel",
    "write:personnel",
    "delete:personnel",
    "read:checkpoints",
    "write:checkpoints",
    "delete:checkpoints",
    "read:patrols",
    "write:patrols",
    "delete:patrols",
    "read:incidents",
    "write:incidents",
    "delete:incidents",
    "read:reports",
    "write:reports",
    "read:analytics",
    "admin:all",
  ];

  const availableEvents = [
    "tenant.created",
    "tenant.updated",
    "tenant.deleted",
    "user.created",
    "user.updated",
    "user.deleted",
    "project.created",
    "project.updated",
    "project.deleted",
    "personnel.created",
    "personnel.updated",
    "personnel.deleted",
    "checkpoint.created",
    "checkpoint.updated",
    "checkpoint.deleted",
    "patrol.created",
    "patrol.updated",
    "patrol.deleted",
    "incident.created",
    "incident.updated",
    "incident.deleted",
    "backup.completed",
    "backup.failed",
    "system.alert",
    "system.maintenance",
  ];

  const tenants = [
    { id: "all", name: "Tümü" },
    { id: "tenant1", name: "Örnek Tenant 1" },
    { id: "tenant2", name: "Örnek Tenant 2" },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadApiKeys(),
        loadUsageStats(),
        loadEndpoints(),
        loadWebhooks(),
        loadDeliveries(),
      ]);
    } catch (error) {
      console.error("Error loading API data:", error);
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

  const loadApiKeys = async () => {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        user:users(email, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading API keys:", error);
    } else {
      setApiKeys(data || []);
    }
  };

  const loadUsageStats = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("api_usage_stats")
      .select(
        `
        *,
        api_key:api_keys(*)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters.endpoint) {
      query = query.eq("endpoint", filters.endpoint);
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
      console.error("Error loading usage stats:", error);
    } else {
      setUsageStats(data || []);
    }
  };

  const loadEndpoints = async () => {
    const { data, error } = await supabaseAdmin
      .from("api_endpoints")
      .select("*")
      .order("path");

    if (error) {
      console.error("Error loading endpoints:", error);
    } else {
      setEndpoints(data || []);
    }
  };

  const loadWebhooks = async () => {
    const { data, error } = await supabaseAdmin
      .from("api_webhooks")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        user:users(email, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading webhooks:", error);
    } else {
      setWebhooks(data || []);
    }
  };

  const loadDeliveries = async () => {
    const startTime = getTimeFilter();
    const { data, error } = await supabaseAdmin
      .from("webhook_deliveries")
      .select(
        `
        *,
        webhook:api_webhooks(*)
      `
      )
      .gte("created_at", startTime)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading deliveries:", error);
    } else {
      setDeliveries(data || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "retrying":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircleIcon color="success" />;
      case "pending":
        return <ScheduleIcon color="warning" />;
      case "failed":
        return <ErrorIcon color="error" />;
      case "retrying":
        return <PlayArrowIcon color="info" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "success";
      case "POST":
        return "primary";
      case "PUT":
        return "warning";
      case "DELETE":
        return "error";
      case "PATCH":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 300 && statusCode < 400) return "info";
    if (statusCode >= 400 && statusCode < 500) return "warning";
    if (statusCode >= 500) return "error";
    return "default";
  };

  const handleCreateApiKey = async () => {
    try {
      const { data, error } = await supabaseAdmin.from("api_keys").insert({
        name: apiKeyForm.name,
        key_hash: "temp_hash", // Gerçek implementasyonda hash oluşturulacak
        key_prefix: "sk_" + Math.random().toString(36).substring(2, 10),
        tenant_id: apiKeyForm.tenant_id === "all" ? null : apiKeyForm.tenant_id,
        user_id: apiKeyForm.user_id || null,
        permissions: apiKeyForm.permissions,
        rate_limit_per_hour: apiKeyForm.rate_limit_per_hour,
        rate_limit_per_day: apiKeyForm.rate_limit_per_day,
        expires_at: apiKeyForm.expires_at || null,
        is_active: apiKeyForm.is_active,
      });

      if (error) {
        console.error("Error creating API key:", error);
        alert("API anahtarı oluşturulurken hata oluştu: " + error.message);
      } else {
        // Simüle edilmiş API anahtarı
        const generatedKey =
          "sk_" +
          Math.random().toString(36).substring(2, 10) +
          "_" +
          Math.random().toString(36).substring(2, 20);
        setNewApiKey(generatedKey);
        setShowApiKey(true);
        await loadApiKeys();
        setOpenApiKeyDialog(false);
        setApiKeyForm({
          name: "",
          tenant_id: "",
          user_id: "",
          permissions: [],
          rate_limit_per_hour: 1000,
          rate_limit_per_day: 10000,
          expires_at: "",
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error in handleCreateApiKey:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const { error } = await supabaseAdmin.from("api_webhooks").insert({
        name: webhookForm.name,
        url: webhookForm.url,
        events: webhookForm.events,
        secret_key: webhookForm.secret_key || null,
        is_active: webhookForm.is_active,
        tenant_id:
          webhookForm.tenant_id === "all" ? null : webhookForm.tenant_id,
        retry_count: webhookForm.retry_count,
        timeout_seconds: webhookForm.timeout_seconds,
      });

      if (error) {
        console.error("Error creating webhook:", error);
        alert("Webhook oluşturulurken hata oluştu: " + error.message);
      } else {
        await loadWebhooks();
        setOpenWebhookDialog(false);
        setWebhookForm({
          name: "",
          url: "",
          events: [],
          secret_key: "",
          is_active: true,
          tenant_id: "",
          retry_count: 3,
          timeout_seconds: 30,
        });
      }
    } catch (error) {
      console.error("Error in handleCreateWebhook:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (
      window.confirm("Bu API anahtarını silmek istediğinizden emin misiniz?")
    ) {
      try {
        const { error } = await supabaseAdmin
          .from("api_keys")
          .delete()
          .eq("id", apiKeyId);

        if (error) {
          console.error("Error deleting API key:", error);
          alert("API anahtarı silinirken hata oluştu: " + error.message);
        } else {
          await loadApiKeys();
        }
      } catch (error) {
        console.error("Error in handleDeleteApiKey:", error);
        alert("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    }
  };

  const handleToggleApiKey = async (apiKeyId: string, isActive: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from("api_keys")
        .update({ is_active: !isActive })
        .eq("id", apiKeyId);

      if (error) {
        console.error("Error toggling API key:", error);
        alert("API anahtarı güncellenirken hata oluştu: " + error.message);
      } else {
        await loadApiKeys();
      }
    } catch (error) {
      console.error("Error in handleToggleApiKey:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    alert("API anahtarı panoya kopyalandı!");
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">API verileri yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        API Yönetimi
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
                  <KeyIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalApiKeys}</Typography>
                  <Typography color="textSecondary">
                    Toplam API Anahtarı
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
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.activeApiKeys}</Typography>
                  <Typography color="textSecondary">
                    Aktif Anahtarlar
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
                    backgroundColor: "#ff9800",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <ApiIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalRequests}</Typography>
                  <Typography color="textSecondary">Toplam İstek</Typography>
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
                  <SpeedIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {Math.round(stats.averageResponseTime)}ms
                  </Typography>
                  <Typography color="textSecondary">
                    Ort. Yanıt Süresi
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
                    backgroundColor: "#9c27b0",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <WebhookIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalWebhooks}</Typography>
                  <Typography color="textSecondary">Webhook</Typography>
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
                  <AnalyticsIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalEndpoints}</Typography>
                  <Typography color="textSecondary">Endpoint</Typography>
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
            <Tab label="API Anahtarları" />
            <Tab label="Kullanım İstatistikleri" />
            <Tab label="Endpoint'ler" />
            <Tab label="Webhook'lar" />
            <Tab label="Rate Limiting" />
          </Tabs>
        </Box>

        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">API Anahtarları</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenApiKeyDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni API Anahtarı
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Anahtar Adı</TableCell>
                    <TableCell>Anahtar</TableCell>
                    <TableCell>Tenant</TableCell>
                    <TableCell>İzinler</TableCell>
                    <TableCell>Rate Limit</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Son Kullanım</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {key.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace", mr: 1 }}
                          >
                            {key.key_prefix}...
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyApiKey(key.key_prefix + "...")
                            }
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {key.tenant?.name || "Tümü"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {key.permissions.slice(0, 2).map((permission) => (
                            <Chip
                              key={permission}
                              label={permission}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {key.permissions.length > 2 && (
                            <Chip
                              label={`+${key.permissions.length - 2}`}
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {key.rate_limit_per_hour}/saat
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {key.rate_limit_per_day}/gün
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={key.is_active ? "Aktif" : "Pasif"}
                          color={key.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {key.last_used_at ? (
                          <Typography variant="body2">
                            {format(
                              parseISO(key.last_used_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: tr }
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Hiç kullanılmamış
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleToggleApiKey(key.id, key.is_active)
                            }
                          >
                            {key.is_active ? (
                              <StopIcon fontSize="small" />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedApiKey(key)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteApiKey(key.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Usage Stats Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Kullanım İstatistikleri
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Yanıt Süresi</TableCell>
                    <TableCell>Boyut</TableCell>
                    <TableCell>IP Adresi</TableCell>
                    <TableCell>Zaman</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageStats.map((stat) => (
                    <TableRow key={stat.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {stat.endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stat.method}
                          color={getMethodColor(stat.method) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stat.status_code}
                          color={getStatusCodeColor(stat.status_code) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {stat.response_time_ms
                          ? `${stat.response_time_ms}ms`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {stat.request_size_bytes && stat.response_size_bytes ? (
                          <Typography variant="body2">
                            {(
                              stat.request_size_bytes + stat.response_size_bytes
                            ).toLocaleString()}{" "}
                            B
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
                          {stat.ip_address || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(stat.created_at), "dd/MM/yyyy HH:mm", {
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

        {/* Endpoints Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Endpoint'leri ({endpoints.length})
            </Typography>
            <Grid container spacing={2}>
              {endpoints.map((endpoint) => (
                <Grid item xs={12} md={6} lg={4} key={endpoint.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Chip
                          label={endpoint.method}
                          color={getMethodColor(endpoint.method) as any}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {endpoint.path}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {endpoint.description || "Açıklama yok"}
                      </Typography>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Chip
                          label={endpoint.category || "Genel"}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={endpoint.is_active ? "Aktif" : "Pasif"}
                          color={endpoint.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Webhooks Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Webhook'lar</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenWebhookDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Webhook
              </Button>
            </Box>

            <Grid container spacing={2}>
              {webhooks.map((webhook) => (
                <Grid item xs={12} md={6} key={webhook.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: webhook.is_active
                              ? "#4caf50"
                              : "#f44336",
                            color: "white",
                            mr: 2,
                          }}
                        >
                          <WebhookIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6">{webhook.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {webhook.tenant?.name || "Tümü"}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, fontFamily: "monospace" }}
                      >
                        {webhook.url}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                        {webhook.events.slice(0, 3).map((event) => (
                          <Chip
                            key={event}
                            label={event}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {webhook.events.length > 3 && (
                          <Chip
                            label={`+${webhook.events.length - 3}`}
                            size="small"
                          />
                        )}
                      </Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Chip
                          label={webhook.is_active ? "Aktif" : "Pasif"}
                          color={webhook.is_active ? "success" : "default"}
                          size="small"
                        />
                        <Box>
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Rate Limiting Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rate Limiting Yönetimi
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Rate limiting ayarları API anahtarları üzerinden yönetilmektedir.
              Her API anahtarı için saatlik ve günlük istek limitleri
              belirlenebilir.
            </Alert>
            <Typography color="text.secondary">
              Rate limiting detayları yakında eklenecek.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create API Key Dialog */}
      <Dialog
        open={openApiKeyDialog}
        onClose={() => setOpenApiKeyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni API Anahtarı Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Anahtar Adı"
              fullWidth
              value={apiKeyForm.name}
              onChange={(e) =>
                setApiKeyForm({ ...apiKeyForm, name: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={apiKeyForm.tenant_id}
                onChange={(e) =>
                  setApiKeyForm({ ...apiKeyForm, tenant_id: e.target.value })
                }
                label="Tenant"
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                İzinler
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {availablePermissions.map((permission) => (
                  <FormControlLabel
                    key={permission}
                    control={
                      <Checkbox
                        checked={apiKeyForm.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiKeyForm({
                              ...apiKeyForm,
                              permissions: [
                                ...apiKeyForm.permissions,
                                permission,
                              ],
                            });
                          } else {
                            setApiKeyForm({
                              ...apiKeyForm,
                              permissions: apiKeyForm.permissions.filter(
                                (p) => p !== permission
                              ),
                            });
                          }
                        }}
                      />
                    }
                    label={permission}
                  />
                ))}
              </Box>
            </Box>
            <TextField
              label="Saatlik Limit"
              fullWidth
              type="number"
              value={apiKeyForm.rate_limit_per_hour}
              onChange={(e) =>
                setApiKeyForm({
                  ...apiKeyForm,
                  rate_limit_per_hour: parseInt(e.target.value),
                })
              }
            />
            <TextField
              label="Günlük Limit"
              fullWidth
              type="number"
              value={apiKeyForm.rate_limit_per_day}
              onChange={(e) =>
                setApiKeyForm({
                  ...apiKeyForm,
                  rate_limit_per_day: parseInt(e.target.value),
                })
              }
            />
            <TextField
              label="Son Kullanma Tarihi"
              fullWidth
              type="datetime-local"
              value={apiKeyForm.expires_at}
              onChange={(e) =>
                setApiKeyForm({ ...apiKeyForm, expires_at: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <Box display="flex" alignItems="center">
              <Switch
                checked={apiKeyForm.is_active}
                onChange={(e) =>
                  setApiKeyForm({ ...apiKeyForm, is_active: e.target.checked })
                }
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Aktif
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApiKeyDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateApiKey}
            disabled={!apiKeyForm.name}
            sx={{ bgcolor: "#1976d2" }}
          >
            API Anahtarı Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog
        open={openWebhookDialog}
        onClose={() => setOpenWebhookDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Webhook Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Webhook Adı"
              fullWidth
              value={webhookForm.name}
              onChange={(e) =>
                setWebhookForm({ ...webhookForm, name: e.target.value })
              }
              required
            />
            <TextField
              label="URL"
              fullWidth
              value={webhookForm.url}
              onChange={(e) =>
                setWebhookForm({ ...webhookForm, url: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={webhookForm.tenant_id}
                onChange={(e) =>
                  setWebhookForm({ ...webhookForm, tenant_id: e.target.value })
                }
                label="Tenant"
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Event'ler
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {availableEvents.map((event) => (
                  <FormControlLabel
                    key={event}
                    control={
                      <Checkbox
                        checked={webhookForm.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookForm({
                              ...webhookForm,
                              events: [...webhookForm.events, event],
                            });
                          } else {
                            setWebhookForm({
                              ...webhookForm,
                              events: webhookForm.events.filter(
                                (ev) => ev !== event
                              ),
                            });
                          }
                        }}
                      />
                    }
                    label={event}
                  />
                ))}
              </Box>
            </Box>
            <TextField
              label="Secret Key"
              fullWidth
              value={webhookForm.secret_key}
              onChange={(e) =>
                setWebhookForm({ ...webhookForm, secret_key: e.target.value })
              }
            />
            <TextField
              label="Retry Count"
              fullWidth
              type="number"
              value={webhookForm.retry_count}
              onChange={(e) =>
                setWebhookForm({
                  ...webhookForm,
                  retry_count: parseInt(e.target.value),
                })
              }
            />
            <TextField
              label="Timeout (saniye)"
              fullWidth
              type="number"
              value={webhookForm.timeout_seconds}
              onChange={(e) =>
                setWebhookForm({
                  ...webhookForm,
                  timeout_seconds: parseInt(e.target.value),
                })
              }
            />
            <Box display="flex" alignItems="center">
              <Switch
                checked={webhookForm.is_active}
                onChange={(e) =>
                  setWebhookForm({
                    ...webhookForm,
                    is_active: e.target.checked,
                  })
                }
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Aktif
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWebhookDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateWebhook}
            disabled={!webhookForm.name || !webhookForm.url}
            sx={{ bgcolor: "#1976d2" }}
          >
            Webhook Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Show API Key Dialog */}
      <Dialog
        open={showApiKey}
        onClose={() => setShowApiKey(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>API Anahtarı Oluşturuldu</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bu API anahtarını güvenli bir yerde saklayın. Tekrar
            gösterilmeyecektir!
          </Alert>
          <TextField
            label="API Anahtarı"
            fullWidth
            value={newApiKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => handleCopyApiKey(newApiKey)}>
                    <ContentCopyIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKey(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiManagement;
