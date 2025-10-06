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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject?: string;
  body: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationQueue {
  id: string;
  template_id: string;
  recipient_type: string;
  recipient_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  body: string;
  variables: any;
  priority: string;
  status: string;
  scheduled_at: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  template?: NotificationTemplate;
}

interface NotificationHistory {
  id: string;
  queue_id?: string;
  template_id?: string;
  recipient_type: string;
  recipient_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject?: string;
  body: string;
  type: string;
  status: string;
  sent_at: string;
  error_message?: string;
  delivery_attempts: number;
  template?: NotificationTemplate;
}

interface SystemNotification {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  target_audience: string;
  is_global: boolean;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
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
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [queue, setQueue] = useState<NotificationQueue[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<
    SystemNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<NotificationQueue | null>(
    null
  );
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openSystemNotificationDialog, setOpenSystemNotificationDialog] =
    useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "email",
    subject: "",
    body: "",
    variables: "{}",
    is_active: true,
  });

  const [sendForm, setSendForm] = useState({
    template_id: "",
    recipient_type: "user",
    recipient_email: "",
    recipient_phone: "",
    priority: "normal",
    scheduled_at: "",
    variables: "{}",
  });

  const [systemNotificationForm, setSystemNotificationForm] = useState({
    type: "maintenance",
    severity: "info",
    title: "",
    message: "",
    target_audience: "all",
    is_global: false,
    is_active: true,
    start_date: "",
    end_date: "",
  });

  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter((t) => t.is_active).length,
    pendingNotifications: queue.filter((q) => q.status === "pending").length,
    sentToday: history.filter(
      (h) => new Date(h.sent_at).toDateString() === new Date().toDateString()
    ).length,
    failedNotifications: queue.filter((q) => q.status === "failed").length,
    activeSystemNotifications: systemNotifications.filter((s) => s.is_active)
      .length,
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadQueue(),
        loadHistory(),
        loadSystemNotifications(),
      ]);
    } catch (error) {
      console.error("Error loading notification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabaseAdmin
      .from("notification_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading templates:", error);
    } else {
      setTemplates(data || []);
    }
  };

  const loadQueue = async () => {
    const { data, error } = await supabaseAdmin
      .from("notification_queue")
      .select(
        `
        *,
        template:notification_templates(*)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading queue:", error);
    } else {
      setQueue(data || []);
    }
  };

  const loadHistory = async () => {
    const { data, error } = await supabaseAdmin
      .from("notification_history")
      .select(
        `
        *,
        template:notification_templates(*)
      `
      )
      .order("sent_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading history:", error);
    } else {
      setHistory(data || []);
    }
  };

  const loadSystemNotifications = async () => {
    const { data, error } = await supabaseAdmin
      .from("system_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading system notifications:", error);
    } else {
      setSystemNotifications(data || []);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <EmailIcon />;
      case "sms":
        return <SmsIcon />;
      case "push":
        return <NotificationsIcon />;
      case "in_app":
        return <InfoIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "#1976d2";
      case "sms":
        return "#4caf50";
      case "push":
        return "#ff9800";
      case "in_app":
        return "#9c27b0";
      default:
        return "#666";
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
      case "cancelled":
        return "default";
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
      case "cancelled":
        return <StopIcon color="disabled" />;
      default:
        return <InfoIcon color="disabled" />;
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
      case "info":
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
      case "info":
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const { error } = await supabaseAdmin
        .from("notification_templates")
        .insert({
          name: templateForm.name,
          type: templateForm.type,
          subject: templateForm.subject,
          body: templateForm.body,
          variables: JSON.parse(templateForm.variables),
          is_active: templateForm.is_active,
        });

      if (error) {
        console.error("Error creating template:", error);
        alert("Şablon oluşturulurken hata oluştu: " + error.message);
      } else {
        await loadTemplates();
        setOpenTemplateDialog(false);
        setTemplateForm({
          name: "",
          type: "email",
          subject: "",
          body: "",
          variables: "{}",
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error in handleCreateTemplate:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleSendNotification = async () => {
    try {
      const { error } = await supabaseAdmin.from("notification_queue").insert({
        template_id: sendForm.template_id,
        recipient_type: sendForm.recipient_type,
        recipient_email: sendForm.recipient_email || null,
        recipient_phone: sendForm.recipient_phone || null,
        priority: sendForm.priority,
        scheduled_at: sendForm.scheduled_at || new Date().toISOString(),
        variables: JSON.parse(sendForm.variables),
      });

      if (error) {
        console.error("Error sending notification:", error);
        alert("Bildirim gönderilirken hata oluştu: " + error.message);
      } else {
        await loadQueue();
        setOpenSendDialog(false);
        setSendForm({
          template_id: "",
          recipient_type: "user",
          recipient_email: "",
          recipient_phone: "",
          priority: "normal",
          scheduled_at: "",
          variables: "{}",
        });
      }
    } catch (error) {
      console.error("Error in handleSendNotification:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCreateSystemNotification = async () => {
    try {
      const { error } = await supabaseAdmin
        .from("system_notifications")
        .insert({
          type: systemNotificationForm.type,
          severity: systemNotificationForm.severity,
          title: systemNotificationForm.title,
          message: systemNotificationForm.message,
          target_audience: systemNotificationForm.target_audience,
          is_global: systemNotificationForm.is_global,
          is_active: systemNotificationForm.is_active,
          start_date:
            systemNotificationForm.start_date || new Date().toISOString(),
          end_date: systemNotificationForm.end_date || null,
        });

      if (error) {
        console.error("Error creating system notification:", error);
        alert("Sistem bildirimi oluşturulurken hata oluştu: " + error.message);
      } else {
        await loadSystemNotifications();
        setOpenSystemNotificationDialog(false);
        setSystemNotificationForm({
          type: "maintenance",
          severity: "info",
          title: "",
          message: "",
          target_audience: "all",
          is_global: false,
          is_active: true,
          start_date: "",
          end_date: "",
        });
      }
    } catch (error) {
      console.error("Error in handleCreateSystemNotification:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleRetryNotification = async (queueId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from("notification_queue")
        .update({
          status: "pending",
          retry_count: 0,
          error_message: null,
        })
        .eq("id", queueId);

      if (error) {
        console.error("Error retrying notification:", error);
        alert("Bildirim yeniden gönderilirken hata oluştu: " + error.message);
      } else {
        await loadQueue();
      }
    } catch (error) {
      console.error("Error in handleRetryNotification:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCancelNotification = async (queueId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from("notification_queue")
        .update({ status: "cancelled" })
        .eq("id", queueId);

      if (error) {
        console.error("Error cancelling notification:", error);
        alert("Bildirim iptal edilirken hata oluştu: " + error.message);
      } else {
        await loadQueue();
      }
    } catch (error) {
      console.error("Error in handleCancelNotification:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Bildirim verileri yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bildirim Sistemi
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
                  <EmailIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalTemplates}</Typography>
                  <Typography color="textSecondary">Toplam Şablon</Typography>
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
                  <Typography variant="h6">{stats.activeTemplates}</Typography>
                  <Typography color="textSecondary">Aktif Şablon</Typography>
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
                  <ScheduleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {stats.pendingNotifications}
                  </Typography>
                  <Typography color="textSecondary">Bekleyen</Typography>
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
                  <SendIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.sentToday}</Typography>
                  <Typography color="textSecondary">
                    Bugün Gönderilen
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
                  <ErrorIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {stats.failedNotifications}
                  </Typography>
                  <Typography color="textSecondary">Başarısız</Typography>
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
                  <NotificationsIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {stats.activeSystemNotifications}
                  </Typography>
                  <Typography color="textSecondary">
                    Sistem Bildirimi
                  </Typography>
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
            <Tab label="Şablonlar" />
            <Tab label="Kuyruk" />
            <Tab label="Geçmiş" />
            <Tab label="Sistem Bildirimleri" />
          </Tabs>
        </Box>

        {/* Templates Tab */}
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
              <Typography variant="h6">Bildirim Şablonları</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenTemplateDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Şablon
              </Button>
            </Box>

            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: getTypeColor(template.type),
                            color: "white",
                            mr: 2,
                          }}
                        >
                          {getTypeIcon(template.type)}
                        </Box>
                        <Box>
                          <Typography variant="h6">{template.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.type.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {template.subject || "Konu yok"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {template.body.length > 100
                          ? template.body.substring(0, 100) + "..."
                          : template.body}
                      </Typography>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Chip
                          label={template.is_active ? "Aktif" : "Pasif"}
                          color={template.is_active ? "success" : "default"}
                          size="small"
                        />
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setTemplateForm({
                                name: template.name,
                                type: template.type,
                                subject: template.subject || "",
                                body: template.body,
                                variables: JSON.stringify(
                                  template.variables,
                                  null,
                                  2
                                ),
                                is_active: template.is_active,
                              });
                              setOpenTemplateDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
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

        {/* Queue Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Bildirim Kuyruğu</Typography>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setOpenSendDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Bildirim Gönder
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Şablon</TableCell>
                    <TableCell>Alıcı</TableCell>
                    <TableCell>Öncelik</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Zamanlama</TableCell>
                    <TableCell>Hata</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queue.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.template?.name || "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.template?.type || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.recipient_email ||
                            item.recipient_phone ||
                            "ID: " + item.recipient_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.recipient_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.priority.toUpperCase()}
                          size="small"
                          color={
                            item.priority === "urgent"
                              ? "error"
                              : item.priority === "high"
                              ? "warning"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(item.status)}
                          label={item.status.toUpperCase()}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(
                          parseISO(item.scheduled_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: tr }
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {item.error_message || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {item.status === "failed" && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleRetryNotification(item.id)}
                            >
                              Yeniden Dene
                            </Button>
                          )}
                          {item.status === "pending" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleCancelNotification(item.id)}
                            >
                              İptal Et
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bildirim Geçmişi
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Şablon</TableCell>
                    <TableCell>Alıcı</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Gönderilme</TableCell>
                    <TableCell>Hata</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.template?.name || "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.recipient_email ||
                            item.recipient_phone ||
                            "ID: " + item.recipient_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.recipient_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(item.status)}
                          label={item.status.toUpperCase()}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(parseISO(item.sent_at), "dd/MM/yyyy HH:mm", {
                          locale: tr,
                        })}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error">
                          {item.error_message || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* System Notifications Tab */}
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
              <Typography variant="h6">Sistem Bildirimleri</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenSystemNotificationDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Bildirim
              </Button>
            </Box>

            <Grid container spacing={2}>
              {systemNotifications.map((notification) => (
                <Grid item xs={12} md={6} key={notification.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor:
                              getSeverityColor(notification.severity) ===
                              "error"
                                ? "#f44336"
                                : getSeverityColor(notification.severity) ===
                                  "warning"
                                ? "#ff9800"
                                : "#2196f3",
                            color: "white",
                            mr: 2,
                          }}
                        >
                          {getSeverityIcon(notification.severity)}
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            {notification.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {notification.type.toUpperCase()} -{" "}
                            {notification.severity.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {notification.message}
                      </Typography>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Chip
                            label={notification.is_active ? "Aktif" : "Pasif"}
                            color={
                              notification.is_active ? "success" : "default"
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={notification.target_audience.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {format(
                            parseISO(notification.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: tr }
                          )}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create Template Dialog */}
      <Dialog
        open={openTemplateDialog}
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bildirim Şablonu Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Şablon Adı"
              fullWidth
              value={templateForm.name}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, name: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tip</InputLabel>
              <Select
                value={templateForm.type}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, type: e.target.value })
                }
                label="Tip"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="push">Push</MenuItem>
                <MenuItem value="in_app">Uygulama İçi</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Konu"
              fullWidth
              value={templateForm.subject}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, subject: e.target.value })
              }
            />
            <TextField
              label="İçerik"
              fullWidth
              multiline
              rows={6}
              value={templateForm.body}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, body: e.target.value })
              }
              required
            />
            <TextField
              label="Değişkenler (JSON)"
              fullWidth
              multiline
              rows={3}
              value={templateForm.variables}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, variables: e.target.value })
              }
              helperText="Örnek: {'user_name': 'string', 'amount': 'number'}"
            />
            <Box display="flex" alignItems="center">
              <Switch
                checked={templateForm.is_active}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
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
          <Button onClick={() => setOpenTemplateDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateTemplate}
            disabled={!templateForm.name || !templateForm.body}
            sx={{ bgcolor: "#1976d2" }}
          >
            Şablon Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog
        open={openSendDialog}
        onClose={() => setOpenSendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bildirim Gönder</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Şablon</InputLabel>
              <Select
                value={sendForm.template_id}
                onChange={(e) =>
                  setSendForm({ ...sendForm, template_id: e.target.value })
                }
                label="Şablon"
                required
              >
                {templates
                  .filter((t) => t.is_active)
                  .map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Alıcı Tipi</InputLabel>
              <Select
                value={sendForm.recipient_type}
                onChange={(e) =>
                  setSendForm({ ...sendForm, recipient_type: e.target.value })
                }
                label="Alıcı Tipi"
              >
                <MenuItem value="user">Kullanıcı</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
                <MenuItem value="all">Tümü</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={sendForm.recipient_email}
              onChange={(e) =>
                setSendForm({ ...sendForm, recipient_email: e.target.value })
              }
            />
            <TextField
              label="Telefon"
              fullWidth
              value={sendForm.recipient_phone}
              onChange={(e) =>
                setSendForm({ ...sendForm, recipient_phone: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Öncelik</InputLabel>
              <Select
                value={sendForm.priority}
                onChange={(e) =>
                  setSendForm({ ...sendForm, priority: e.target.value })
                }
                label="Öncelik"
              >
                <MenuItem value="low">Düşük</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">Yüksek</MenuItem>
                <MenuItem value="urgent">Acil</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Zamanlama"
              fullWidth
              type="datetime-local"
              value={sendForm.scheduled_at}
              onChange={(e) =>
                setSendForm({ ...sendForm, scheduled_at: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Değişkenler (JSON)"
              fullWidth
              multiline
              rows={3}
              value={sendForm.variables}
              onChange={(e) =>
                setSendForm({ ...sendForm, variables: e.target.value })
              }
              helperText="Örnek: {'user_name': 'Ahmet Yılmaz', 'amount': 100}"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={!sendForm.template_id}
            sx={{ bgcolor: "#1976d2" }}
          >
            Bildirim Gönder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create System Notification Dialog */}
      <Dialog
        open={openSystemNotificationDialog}
        onClose={() => setOpenSystemNotificationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sistem Bildirimi Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Tip</InputLabel>
              <Select
                value={systemNotificationForm.type}
                onChange={(e) =>
                  setSystemNotificationForm({
                    ...systemNotificationForm,
                    type: e.target.value,
                  })
                }
                label="Tip"
              >
                <MenuItem value="maintenance">Bakım</MenuItem>
                <MenuItem value="security">Güvenlik</MenuItem>
                <MenuItem value="billing">Faturalandırma</MenuItem>
                <MenuItem value="system">Sistem</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Önem</InputLabel>
              <Select
                value={systemNotificationForm.severity}
                onChange={(e) =>
                  setSystemNotificationForm({
                    ...systemNotificationForm,
                    severity: e.target.value,
                  })
                }
                label="Önem"
              >
                <MenuItem value="info">Bilgi</MenuItem>
                <MenuItem value="low">Düşük</MenuItem>
                <MenuItem value="medium">Orta</MenuItem>
                <MenuItem value="high">Yüksek</MenuItem>
                <MenuItem value="critical">Kritik</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Başlık"
              fullWidth
              value={systemNotificationForm.title}
              onChange={(e) =>
                setSystemNotificationForm({
                  ...systemNotificationForm,
                  title: e.target.value,
                })
              }
              required
            />
            <TextField
              label="Mesaj"
              fullWidth
              multiline
              rows={4}
              value={systemNotificationForm.message}
              onChange={(e) =>
                setSystemNotificationForm({
                  ...systemNotificationForm,
                  message: e.target.value,
                })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Hedef Kitle</InputLabel>
              <Select
                value={systemNotificationForm.target_audience}
                onChange={(e) =>
                  setSystemNotificationForm({
                    ...systemNotificationForm,
                    target_audience: e.target.value,
                  })
                }
                label="Hedef Kitle"
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="admins">Adminler</MenuItem>
                <MenuItem value="tenants">Tenantlar</MenuItem>
                <MenuItem value="users">Kullanıcılar</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Başlangıç Tarihi"
              fullWidth
              type="datetime-local"
              value={systemNotificationForm.start_date}
              onChange={(e) =>
                setSystemNotificationForm({
                  ...systemNotificationForm,
                  start_date: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Bitiş Tarihi"
              fullWidth
              type="datetime-local"
              value={systemNotificationForm.end_date}
              onChange={(e) =>
                setSystemNotificationForm({
                  ...systemNotificationForm,
                  end_date: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <Box display="flex" alignItems="center">
              <Switch
                checked={systemNotificationForm.is_global}
                onChange={(e) =>
                  setSystemNotificationForm({
                    ...systemNotificationForm,
                    is_global: e.target.checked,
                  })
                }
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Global Bildirim
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Switch
                checked={systemNotificationForm.is_active}
                onChange={(e) =>
                  setSystemNotificationForm({
                    ...systemNotificationForm,
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
          <Button onClick={() => setOpenSystemNotificationDialog(false)}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSystemNotification}
            disabled={
              !systemNotificationForm.title || !systemNotificationForm.message
            }
            sx={{ bgcolor: "#1976d2" }}
          >
            Bildirim Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationSystem;
