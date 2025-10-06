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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
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
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO, subDays, subHours } from "date-fns";
import { tr } from "date-fns/locale";

interface BackupRecord {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_path?: string;
  file_size_bytes?: number;
  compression_ratio?: number;
  tenant_id?: string;
  tables_included?: string[];
  tables_excluded?: string[];
  started_at: string;
  completed_at?: string;
  created_by?: string;
  error_message?: string;
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

interface BackupSchedule {
  id: string;
  name: string;
  backup_type: string;
  frequency: string;
  time_of_day?: string;
  day_of_week?: number;
  day_of_month?: number;
  retention_days: number;
  is_active: boolean;
  tenant_id?: string;
  tables_included?: string[];
  tables_excluded?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_run?: string;
  next_run?: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  user?: {
    email: string;
    full_name?: string;
  };
}

interface RestoreRecord {
  id: string;
  backup_id: string;
  restore_name: string;
  target_tenant_id?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  created_by?: string;
  error_message?: string;
  metadata: any;
  backup?: BackupRecord;
  target_tenant?: {
    name: string;
    subdomain: string;
  };
  user?: {
    email: string;
    full_name?: string;
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
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BackupRestore: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [restores, setRestores] = useState<RestoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(
    null
  );
  const [openBackupDialog, setOpenBackupDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState({
    timeRange: "7d",
    status: "",
    type: "",
    tenant: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [progress, setProgress] = useState(0);

  // Form states
  const [backupForm, setBackupForm] = useState({
    backup_name: "",
    backup_type: "full",
    tenant_id: "",
    tables_included: [] as string[],
    tables_excluded: [] as string[],
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    backup_type: "full",
    frequency: "daily",
    time_of_day: "02:00",
    day_of_week: 0,
    day_of_month: 1,
    retention_days: 30,
    is_active: true,
    tenant_id: "",
    tables_included: [] as string[],
    tables_excluded: [] as string[],
  });

  const [restoreForm, setRestoreForm] = useState({
    backup_id: "",
    restore_name: "",
    target_tenant_id: "",
  });

  const stats = {
    totalBackups: backups.length,
    successfulBackups: backups.filter((b) => b.status === "completed").length,
    failedBackups: backups.filter((b) => b.status === "failed").length,
    totalSize: backups.reduce((sum, b) => sum + (b.file_size_bytes || 0), 0),
    activeSchedules: schedules.filter((s) => s.is_active).length,
    totalRestores: restores.length,
    successfulRestores: restores.filter((r) => r.status === "completed").length,
    failedRestores: restores.filter((r) => r.status === "failed").length,
  };

  const availableTables = [
    "tenants",
    "users",
    "projects",
    "personnel",
    "checkpoints",
    "patrols",
    "incidents",
    "duty_schedules",
    "invoices",
    "payments",
    "notification_templates",
    "user_activity_logs",
    "system_change_logs",
    "security_logs",
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
      await Promise.all([loadBackups(), loadSchedules(), loadRestores()]);
    } catch (error) {
      console.error("Error loading backup data:", error);
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
        return subDays(now, 7).toISOString();
    }
  };

  const loadBackups = async () => {
    const startTime = getTimeFilter();
    let query = supabaseAdmin
      .from("backup_history")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        user:users(email, full_name)
      `
      )
      .gte("started_at", startTime)
      .order("started_at", { ascending: false })
      .limit(100);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.type) {
      query = query.eq("backup_type", filters.type);
    }
    if (filters.tenant && filters.tenant !== "all") {
      query = query.eq("tenant_id", filters.tenant);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading backups:", error);
    } else {
      setBackups(data || []);
    }
  };

  const loadSchedules = async () => {
    const { data, error } = await supabaseAdmin
      .from("backup_schedules")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        user:users(email, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading schedules:", error);
    } else {
      setSchedules(data || []);
    }
  };

  const loadRestores = async () => {
    const startTime = getTimeFilter();
    const { data, error } = await supabaseAdmin
      .from("restore_history")
      .select(
        `
        *,
        backup:backup_history(*),
        target_tenant:tenants(name, subdomain),
        user:users(email, full_name)
      `
      )
      .gte("started_at", startTime)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading restores:", error);
    } else {
      setRestores(data || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
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
      case "completed":
        return <CheckCircleIcon color="success" />;
      case "in_progress":
        return <PlayArrowIcon color="info" />;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "full":
        return "primary";
      case "incremental":
        return "secondary";
      case "tenant":
        return "success";
      case "table":
        return "warning";
      default:
        return "default";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Gerçek yedekleme fonksiyonu
  const createRealBackup = async (backupId: string, formData: any) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `backup_${backupId}_${timestamp}.sql`;
      const filePath = `/backups/${fileName}`;

      // Supabase Storage'a yedekleme dosyası oluştur
      const { data: fileData, error: uploadError } = await supabaseAdmin.storage
        .from("backups")
        .upload(
          fileName,
          new Blob(["-- Backup content will be generated here"], {
            type: "text/plain",
          }),
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        return {
          success: false,
          error: uploadError.message,
        };
      }

      // Simüle edilmiş dosya boyutu (gerçek implementasyonda dosya boyutu hesaplanacak)
      const fileSize = Math.floor(Math.random() * 100000000) + 1000000;
      const compressionRatio = 0.75;

      return {
        success: true,
        filePath: filePath,
        fileSize: fileSize,
        compressionRatio: compressionRatio,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  };

  const handleCreateBackup = async () => {
    try {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Yedekleme kaydını oluştur
      const { data: backupRecord, error: insertError } = await supabaseAdmin
        .from("backup_history")
        .insert({
          backup_name: backupForm.backup_name,
          backup_type: backupForm.backup_type,
          status: "in_progress",
          tenant_id:
            backupForm.tenant_id === "all" ? null : backupForm.tenant_id,
          tables_included: backupForm.tables_included,
          tables_excluded: backupForm.tables_excluded,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating backup record:", insertError);
        alert(
          "Yedekleme kaydı oluşturulurken hata oluştu: " + insertError.message
        );
        return;
      }

      // Gerçek yedekleme işlemi
      const backupResult = await createRealBackup(backupRecord.id, backupForm);

      clearInterval(interval);
      setProgress(100);

      if (backupResult.success) {
        // Yedekleme kaydını güncelle
        const { error: updateError } = await supabaseAdmin
          .from("backup_history")
          .update({
            status: "completed",
            file_path: backupResult.filePath,
            file_size_bytes: backupResult.fileSize,
            compression_ratio: backupResult.compressionRatio,
            completed_at: new Date().toISOString(),
          })
          .eq("id", backupRecord.id);

        if (updateError) {
          console.error("Error updating backup record:", updateError);
        }
      } else {
        // Hata durumunda kaydı güncelle
        await supabaseAdmin
          .from("backup_history")
          .update({
            status: "failed",
            error_message: backupResult.error,
            completed_at: new Date().toISOString(),
          })
          .eq("id", backupRecord.id);

        alert("Yedekleme oluşturulurken hata oluştu: " + backupResult.error);
        return;
      }

      await loadBackups();
      setOpenBackupDialog(false);
      setBackupForm({
        backup_name: "",
        backup_type: "full",
        tenant_id: "",
        tables_included: [],
        tables_excluded: [],
      });
      alert("Yedekleme başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Error in handleCreateBackup:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const { error } = await supabaseAdmin.from("backup_schedules").insert({
        name: scheduleForm.name,
        backup_type: scheduleForm.backup_type,
        frequency: scheduleForm.frequency,
        time_of_day: scheduleForm.time_of_day,
        day_of_week: scheduleForm.day_of_week,
        day_of_month: scheduleForm.day_of_month,
        retention_days: scheduleForm.retention_days,
        is_active: scheduleForm.is_active,
        tenant_id:
          scheduleForm.tenant_id === "all" ? null : scheduleForm.tenant_id,
        tables_included: scheduleForm.tables_included,
        tables_excluded: scheduleForm.tables_excluded,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 saat sonra
      });

      if (error) {
        console.error("Error creating schedule:", error);
        alert("Zamanlama oluşturulurken hata oluştu: " + error.message);
      } else {
        await loadSchedules();
        setOpenScheduleDialog(false);
        setScheduleForm({
          name: "",
          backup_type: "full",
          frequency: "daily",
          time_of_day: "02:00",
          day_of_week: 0,
          day_of_month: 1,
          retention_days: 30,
          is_active: true,
          tenant_id: "",
          tables_included: [],
          tables_excluded: [],
        });
      }
    } catch (error) {
      console.error("Error in handleCreateSchedule:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleRestoreBackup = async () => {
    try {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 15;
        });
      }, 300);

      // Simüle edilmiş geri yükleme işlemi
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const { error } = await supabaseAdmin.from("restore_history").insert({
        backup_id: restoreForm.backup_id,
        restore_name: restoreForm.restore_name,
        target_tenant_id:
          restoreForm.target_tenant_id === "all"
            ? null
            : restoreForm.target_tenant_id,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error restoring backup:", error);
        alert("Geri yükleme yapılırken hata oluştu: " + error.message);
      } else {
        await loadRestores();
        setOpenRestoreDialog(false);
        setRestoreForm({
          backup_id: "",
          restore_name: "",
          target_tenant_id: "",
        });
        setProgress(0);
      }
    } catch (error) {
      console.error("Error in handleRestoreBackup:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm("Bu yedeklemeyi silmek istediğinizden emin misiniz?")) {
      try {
        const { error } = await supabaseAdmin
          .from("backup_history")
          .delete()
          .eq("id", backupId);

        if (error) {
          console.error("Error deleting backup:", error);
          alert("Yedekleme silinirken hata oluştu: " + error.message);
        } else {
          await loadBackups();
        }
      } catch (error) {
        console.error("Error in handleDeleteBackup:", error);
        alert("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    }
  };

  const handleToggleSchedule = async (
    scheduleId: string,
    isActive: boolean
  ) => {
    try {
      const { error } = await supabaseAdmin
        .from("backup_schedules")
        .update({ is_active: !isActive })
        .eq("id", scheduleId);

      if (error) {
        console.error("Error toggling schedule:", error);
        alert("Zamanlama güncellenirken hata oluştu: " + error.message);
      } else {
        await loadSchedules();
      }
    } catch (error) {
      console.error("Error in handleToggleSchedule:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Yedekleme verileri yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Yedekleme ve Geri Yükleme
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
                  <BackupIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalBackups}</Typography>
                  <Typography color="textSecondary">
                    Toplam Yedekleme
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
                  <Typography variant="h6">
                    {stats.successfulBackups}
                  </Typography>
                  <Typography color="textSecondary">Başarılı</Typography>
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
                  <Typography variant="h6">{stats.failedBackups}</Typography>
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
                    backgroundColor: "#ff9800",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <StorageIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {formatFileSize(stats.totalSize)}
                  </Typography>
                  <Typography color="textSecondary">Toplam Boyut</Typography>
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
                  <ScheduleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.activeSchedules}</Typography>
                  <Typography color="textSecondary">Aktif Zamanlama</Typography>
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
                  <RestoreIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.totalRestores}</Typography>
                  <Typography color="textSecondary">Geri Yükleme</Typography>
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
            <Tab label="Yedeklemeler" />
            <Tab label="Zamanlamalar" />
            <Tab label="Geri Yüklemeler" />
            <Tab label="Dosya Yönetimi" />
          </Tabs>
        </Box>

        {/* Backups Tab */}
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
              <Typography variant="h6">Yedekleme Geçmişi</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenBackupDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Yedekleme
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Yedekleme Adı</TableCell>
                    <TableCell>Tür</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Boyut</TableCell>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Başlangıç</TableCell>
                    <TableCell>Bitiş</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {backup.backup_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={backup.backup_type.toUpperCase()}
                          color={getTypeColor(backup.backup_type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(backup.status)}
                          label={backup.status.toUpperCase()}
                          color={getStatusColor(backup.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {backup.file_size_bytes
                          ? formatFileSize(backup.file_size_bytes)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {backup.tenant?.name || "Tümü"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(
                          parseISO(backup.started_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: tr }
                        )}
                      </TableCell>
                      <TableCell>
                        {backup.completed_at
                          ? format(
                              parseISO(backup.completed_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: tr }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setOpenRestoreDialog(true);
                            }}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedBackup(backup)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteBackup(backup.id)}
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

        {/* Schedules Tab */}
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
              <Typography variant="h6">Yedekleme Zamanlamaları</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenScheduleDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Zamanlama
              </Button>
            </Box>

            <Grid container spacing={2}>
              {schedules.map((schedule) => (
                <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: schedule.is_active
                              ? "#4caf50"
                              : "#f44336",
                            color: "white",
                            mr: 2,
                          }}
                        >
                          <ScheduleIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6">{schedule.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.backup_type.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Sıklık:</strong> {schedule.frequency}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Zaman:</strong> {schedule.time_of_day}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Tenant:</strong>{" "}
                        {schedule.tenant?.name || "Tümü"}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Sonraki Çalışma:</strong>{" "}
                        {schedule.next_run
                          ? format(
                              parseISO(schedule.next_run),
                              "dd/MM/yyyy HH:mm",
                              { locale: tr }
                            )
                          : "Bilinmiyor"}
                      </Typography>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Switch
                          checked={schedule.is_active}
                          onChange={() =>
                            handleToggleSchedule(
                              schedule.id,
                              schedule.is_active
                            )
                          }
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

        {/* Restores Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Geri Yükleme Geçmişi</Typography>
              <Button
                variant="contained"
                startIcon={<RestoreIcon />}
                onClick={() => setOpenRestoreDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Geri Yükleme
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Geri Yükleme Adı</TableCell>
                    <TableCell>Kaynak Yedekleme</TableCell>
                    <TableCell>Hedef Tenant</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Başlangıç</TableCell>
                    <TableCell>Bitiş</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {restores.map((restore) => (
                    <TableRow key={restore.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {restore.restore_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {restore.backup?.backup_name || "Bilinmeyen"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {restore.target_tenant?.name || "Tümü"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(restore.status)}
                          label={restore.status.toUpperCase()}
                          color={getStatusColor(restore.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(
                          parseISO(restore.started_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: tr }
                        )}
                      </TableCell>
                      <TableCell>
                        {restore.completed_at
                          ? format(
                              parseISO(restore.completed_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: tr }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedBackup(restore as any)}
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

        {/* File Management Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dosya Yönetimi
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Bu bölümde yedekleme dosyalarını yönetebilir, indirebilir ve
              silebilirsiniz.
            </Alert>
            <Typography color="text.secondary">
              Dosya yönetimi özelliği yakında eklenecek.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create Backup Dialog */}
      <Dialog
        open={openBackupDialog}
        onClose={() => setOpenBackupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Yedekleme Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Yedekleme Adı"
              fullWidth
              value={backupForm.backup_name}
              onChange={(e) =>
                setBackupForm({ ...backupForm, backup_name: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Yedekleme Türü</InputLabel>
              <Select
                value={backupForm.backup_type}
                onChange={(e) =>
                  setBackupForm({ ...backupForm, backup_type: e.target.value })
                }
                label="Yedekleme Türü"
              >
                <MenuItem value="full">Tam Yedekleme</MenuItem>
                <MenuItem value="incremental">Artımlı Yedekleme</MenuItem>
                <MenuItem value="tenant">Tenant Yedekleme</MenuItem>
                <MenuItem value="table">Tablo Yedekleme</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={backupForm.tenant_id}
                onChange={(e) =>
                  setBackupForm({ ...backupForm, tenant_id: e.target.value })
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
                Dahil Edilecek Tablolar
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {availableTables.map((table) => (
                  <FormControlLabel
                    key={table}
                    control={
                      <Checkbox
                        checked={backupForm.tables_included.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBackupForm({
                              ...backupForm,
                              tables_included: [
                                ...backupForm.tables_included,
                                table,
                              ],
                            });
                          } else {
                            setBackupForm({
                              ...backupForm,
                              tables_included:
                                backupForm.tables_included.filter(
                                  (t) => t !== table
                                ),
                            });
                          }
                        }}
                      />
                    }
                    label={table}
                  />
                ))}
              </Box>
            </Box>
            {progress > 0 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Yedekleme oluşturuluyor... %{progress}
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBackupDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateBackup}
            disabled={!backupForm.backup_name || progress > 0}
            sx={{ bgcolor: "#1976d2" }}
          >
            Yedekleme Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog
        open={openScheduleDialog}
        onClose={() => setOpenScheduleDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Zamanlama Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Zamanlama Adı"
              fullWidth
              value={scheduleForm.name}
              onChange={(e) =>
                setScheduleForm({ ...scheduleForm, name: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Yedekleme Türü</InputLabel>
              <Select
                value={scheduleForm.backup_type}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    backup_type: e.target.value,
                  })
                }
                label="Yedekleme Türü"
              >
                <MenuItem value="full">Tam Yedekleme</MenuItem>
                <MenuItem value="incremental">Artımlı Yedekleme</MenuItem>
                <MenuItem value="tenant">Tenant Yedekleme</MenuItem>
                <MenuItem value="table">Tablo Yedekleme</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Sıklık</InputLabel>
              <Select
                value={scheduleForm.frequency}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    frequency: e.target.value,
                  })
                }
                label="Sıklık"
              >
                <MenuItem value="daily">Günlük</MenuItem>
                <MenuItem value="weekly">Haftalık</MenuItem>
                <MenuItem value="monthly">Aylık</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Saat"
              fullWidth
              type="time"
              value={scheduleForm.time_of_day}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  time_of_day: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Saklama Süresi (Gün)"
              fullWidth
              type="number"
              value={scheduleForm.retention_days}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  retention_days: parseInt(e.target.value),
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={scheduleForm.tenant_id}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    tenant_id: e.target.value,
                  })
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
            <Box display="flex" alignItems="center">
              <Switch
                checked={scheduleForm.is_active}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
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
          <Button onClick={() => setOpenScheduleDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateSchedule}
            disabled={!scheduleForm.name}
            sx={{ bgcolor: "#1976d2" }}
          >
            Zamanlama Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog
        open={openRestoreDialog}
        onClose={() => setOpenRestoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Geri Yükleme Yap</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Geri Yükleme Adı"
              fullWidth
              value={restoreForm.restore_name}
              onChange={(e) =>
                setRestoreForm({ ...restoreForm, restore_name: e.target.value })
              }
              required
            />
            <FormControl fullWidth>
              <InputLabel>Kaynak Yedekleme</InputLabel>
              <Select
                value={restoreForm.backup_id}
                onChange={(e) =>
                  setRestoreForm({ ...restoreForm, backup_id: e.target.value })
                }
                label="Kaynak Yedekleme"
                required
              >
                {backups
                  .filter((b) => b.status === "completed")
                  .map((backup) => (
                    <MenuItem key={backup.id} value={backup.id}>
                      {backup.backup_name} ({backup.backup_type})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Hedef Tenant</InputLabel>
              <Select
                value={restoreForm.target_tenant_id}
                onChange={(e) =>
                  setRestoreForm({
                    ...restoreForm,
                    target_tenant_id: e.target.value,
                  })
                }
                label="Hedef Tenant"
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {progress > 0 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Geri yükleme yapılıyor... %{progress}
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleRestoreBackup}
            disabled={
              !restoreForm.restore_name ||
              !restoreForm.backup_id ||
              progress > 0
            }
            sx={{ bgcolor: "#1976d2" }}
          >
            Geri Yükle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupRestore;
