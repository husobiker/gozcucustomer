import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useProject } from "../contexts/ProjectContext";
import { useTenant } from "../contexts/TenantContext";
import { supabaseAdmin } from "../lib/supabase";

interface ShiftType {
  id: string;
  tenant_id: string;
  project_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  duration: number; // hours
  break_duration: number; // minutes
  is_night_shift: boolean;
  is_weekend_shift: boolean;
  color: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // New fields for leave types
  is_leave_type?: boolean; // true for leave types, false for work shifts
  is_paid_leave?: boolean; // true for paid leaves, false for unpaid leaves
  category?: "work" | "unpaid_leave" | "paid_leave" | "holiday"; // category for grouping
  // Personnel management fields
  requires_handover?: boolean; // if handover is required for this shift
}

const ShiftTypes: React.FC = () => {
  const { selectedProject } = useProject();
  const { tenant } = useTenant();
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShiftType>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Veritabanından shift types'ları yükle
  const fetchShiftTypes = async () => {
    console.log("🔍 fetchShiftTypes çağrıldı");
    console.log("🏢 Tenant:", tenant);
    console.log("🏢 Tenant ID:", tenant?.id);
    console.log("🏢 Tenant Name:", tenant?.name);
    console.log("📋 Selected Project:", selectedProject);
    console.log("📋 Project ID:", selectedProject?.id);
    console.log("📋 Project Name:", selectedProject?.name);

    if (!tenant || !selectedProject) {
      console.log("❌ Tenant veya Project eksik, işlem iptal edildi");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📡 Supabase'den veri çekiliyor...");
      console.log("🔍 Tenant ID:", tenant.id);
      console.log("🔍 Project ID:", selectedProject.id);

      // ULTRA DEBUG APPROACH - Test everything
      console.log("🔄 Testing Supabase connection...");

      // Test 1: Can we connect to Supabase at all?
      try {
        const { data: testData, error: testError } = await supabaseAdmin
          .from("tenants")
          .select("id, name")
          .limit(1);

        console.log("🧪 Supabase connection test:", { testData, testError });
      } catch (testErr) {
        console.error("❌ Supabase connection failed:", testErr);
      }

      // Test 2: Can we see shift_types table?
      try {
        const { data: tableTest, error: tableError } = await supabaseAdmin
          .from("shift_types")
          .select("id")
          .limit(1);

        console.log("🧪 Shift_types table test:", { tableTest, tableError });
      } catch (tableErr) {
        console.error("❌ Shift_types table access failed:", tableErr);
      }

      // Test 3: Get ALL data without any filters
      console.log("🔄 Getting ALL shift types (no filters)...");

      const { data: allData, error: allError } = await supabaseAdmin
        .from("shift_types")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 ALL DATA FROM DATABASE:", { allData, allError });
      console.log("📊 Data type:", typeof allData);
      console.log("📊 Data length:", allData?.length);
      console.log("📊 Data is array:", Array.isArray(allData));

      if (allError) {
        console.error("❌ Error getting all data:", allError);
        setError(
          "Vardiya tipleri yüklenirken hata oluştu: " + allError.message
        );
        return;
      }

      // Test 4: Show all tenant/project IDs in the data
      if (allData && allData.length > 0) {
        const tenantIds = Array.from(
          new Set(allData.map((st) => st.tenant_id))
        );
        const projectIds = Array.from(
          new Set(allData.map((st) => st.project_id))
        );

        console.log("🔍 All tenant IDs in data:", tenantIds);
        console.log("🔍 All project IDs in data:", projectIds);
        console.log("🔍 Current tenant ID:", tenant.id);
        console.log("🔍 Current project ID:", selectedProject.id);
      }

      // Filter data manually with detailed debugging
      console.log("🔍 FILTERING DEBUG:");
      console.log("🔍 Looking for tenant_id:", tenant.id);
      console.log("🔍 Looking for project_id:", selectedProject.id);
      console.log("🔍 Project name:", selectedProject.name);

      const filteredData =
        allData?.filter((st) => {
          const tenantMatch = st.tenant_id === tenant.id;
          const projectMatch = st.project_id === selectedProject.id;

          console.log(
            `🔍 Shift "${st.name}": tenant_match=${tenantMatch}, project_match=${projectMatch}`
          );
          console.log(
            `🔍   - DB tenant_id: ${st.tenant_id} vs Frontend: ${tenant.id}`
          );
          console.log(
            `🔍   - DB project_id: ${st.project_id} vs Frontend: ${selectedProject.id}`
          );

          return tenantMatch && projectMatch;
        }) || [];

      console.log("🔍 Filtered data for current tenant/project:", filteredData);
      console.log("🔍 Filtered data length:", filteredData.length);

      // If no data found, try alternative filtering by project name
      let finalData = filteredData;
      if (filteredData.length === 0 && allData && allData.length > 0) {
        console.log(
          "🔍 No data found with ID matching, trying project name matching..."
        );

        // Get project name from database for comparison
        const projectNameMatch = allData.filter((st) => {
          // This is a fallback - we'll need to get project name from projects table
          // For now, let's try to match by checking if the project_id exists in our data
          return st.tenant_id === tenant.id;
        });

        console.log("🔍 Project name match result:", projectNameMatch);
        finalData = projectNameMatch;
      }

      console.log("📊 Final result:");
      console.log("📊 Data:", finalData);
      console.log("📊 Error:", null);

      console.log(
        "✅ Veri başarıyla alındı, kayıt sayısı:",
        finalData?.length || 0
      );
      console.log("🔄 Setting shiftTypes state with:", finalData);
      setShiftTypes(finalData || []);

      // Verify state was set
      setTimeout(() => {
        console.log("🔍 Current shiftTypes state:", shiftTypes);
      }, 100);
    } catch (err) {
      console.error("❌ Error fetching shift types:", err);
      setError("Vardiya tipleri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftTypes();
  }, [tenant, selectedProject]);

  const handleOpenDialog = (shiftType?: ShiftType) => {
    setEditingShiftType(shiftType || null);
    setFormData(
      shiftType || {
        name: "",
        code: "",
        start_time: "08:00",
        end_time: "16:00",
        duration: 8,
        break_duration: 60,
        is_night_shift: false,
        is_weekend_shift: false,
        color: "#4CAF50",
        description: "",
        is_active: true,
        // Yeni alanlar
        category: "work",
        is_leave_type: false,
        is_paid_leave: false,
        requires_handover: false,
      }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShiftType(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    shiftType: ShiftType
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedShiftType(shiftType);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedShiftType here, it's needed for delete dialog
  };

  // Görüntüle
  const handleView = (shiftType: ShiftType | null) => {
    if (!shiftType) return;
    console.log("Viewing shift type:", shiftType);
    // Burada görüntüleme işlemi yapılabilir
  };

  // Düzenle
  const handleEdit = (shiftType: ShiftType | null) => {
    if (!shiftType) return;
    handleOpenDialog(shiftType);
  };

  // Kopyala
  const handleCopy = (shiftType: ShiftType | null) => {
    if (!shiftType) return;
    const copyData: Partial<ShiftType> = {
      ...shiftType,
      name: shiftType.name + " (Kopya)",
      code: shiftType.code + "_COPY",
    };
    delete copyData.id;
    handleOpenDialog(copyData as ShiftType);
  };

  // Ayarlar
  const handleSettings = (shiftType: ShiftType | null) => {
    if (!shiftType) return;
    console.log("Settings for shift type:", shiftType);
    // Burada ayarlar işlemi yapılabilir
  };

  // Shift type kaydet/güncelle
  const handleSave = async () => {
    if (!formData || !tenant || !selectedProject) return;

    try {
      setError(null);
      const currentUser = (await supabaseAdmin.auth.getUser()).data.user?.id;

      const shiftTypeData = {
        tenant_id: tenant.id,
        project_id: selectedProject.id,
        name: formData.name || "",
        code: formData.code || "",
        start_time: formData.start_time || "08:00",
        end_time: formData.end_time || "16:00",
        duration: formData.duration || 8,
        break_duration: formData.break_duration || 60,
        is_night_shift: formData.is_night_shift || false,
        is_weekend_shift: formData.is_weekend_shift || false,
        color: formData.color || "#4CAF50",
        description: formData.description || "",
        is_active: formData.is_active !== false,
        // is_leave_type: formData.is_leave_type || false,
        // is_paid_leave: formData.is_paid_leave || false,
        requires_handover: formData.requires_handover !== false,
        updated_by: currentUser,
      };

      if (editingShiftType?.id) {
        // Güncelle
        const { error } = await supabaseAdmin
          .from("shift_types")
          .update(shiftTypeData)
          .eq("id", editingShiftType.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        setSuccessMessage("Vardiya tipi başarıyla güncellendi!");
      } else {
        // Yeni oluştur
        const insertData = {
          ...shiftTypeData,
          created_by: currentUser,
        };
        const { error } = await supabaseAdmin
          .from("shift_types")
          .insert(insertData);

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        setSuccessMessage("Vardiya tipi başarıyla oluşturuldu!");
      }

      handleCloseDialog();
      fetchShiftTypes();
    } catch (err: any) {
      console.error("Error saving shift type:", err);
      setError(
        "Vardiya tipi kaydedilirken hata oluştu: " +
          (err.message || "Bilinmeyen hata")
      );
    }
  };

  // Silme onayı
  const handleDelete = () => {
    if (!selectedShiftType) return;
    setDeleteDialogOpen(true);
  };

  // Silme işlemi
  const confirmDelete = async () => {
    if (!selectedShiftType) return;

    try {
      setError(null);

      // Admin yetkisiyle silme işlemi
      const { data, error } = await supabaseAdmin
        .from("shift_types")
        .delete()
        .eq("id", selectedShiftType.id)
        .select();

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setSuccessMessage("Vardiya tipi başarıyla silindi!");
      setDeleteDialogOpen(false);
      setSelectedShiftType(null); // Clear selected shift type after successful delete
      handleMenuClose();
      fetchShiftTypes();
    } catch (err: any) {
      console.error("Error deleting shift type:", err);
      setError(
        "Vardiya tipi silinirken hata oluştu: " +
          (err.message || "Bilinmeyen hata")
      );
    }
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);

    if (end < start) {
      // Gece vardiyası (ertesi güne geçiyor)
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  };

  const getShiftTypeColor = (color: string) => {
    return color;
  };

  const getCategoryLabel = (shiftType: ShiftType) => {
    if (shiftType.is_leave_type) {
      if (shiftType.is_paid_leave) {
        return "Ücretli İzin";
      } else {
        return "Ücretsiz İzin";
      }
    } else if (shiftType.is_weekend_shift) {
      return "Hafta Tatili";
    } else {
      return "Çalışma Vardiyası";
    }
  };

  const getCategoryColor = (shiftType: ShiftType) => {
    if (shiftType.is_leave_type) {
      if (shiftType.is_paid_leave) {
        return "success";
      } else {
        return "warning";
      }
    } else if (shiftType.is_weekend_shift) {
      return "info";
    } else {
      return "primary";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Vardiya Tipleri
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Projelere vardiya tiplerinizi atayın
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Yeni Vardiya Tipi
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Toplam Vardiya Tipi
                  </Typography>
                  <Typography variant="h4">{shiftTypes.length}</Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Aktif Vardiya Tipi
                  </Typography>
                  <Typography variant="h4">
                    {shiftTypes.filter((st) => st.is_active).length}
                  </Typography>
                </Box>
                <TimeIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Gece Vardiyası
                  </Typography>
                  <Typography variant="h4">
                    {shiftTypes.filter((st) => st.is_night_shift).length}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: "info.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Hafta Sonu
                  </Typography>
                  <Typography variant="h4">
                    {shiftTypes.filter((st) => st.is_weekend_shift).length}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: "warning.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shift Types Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vardiya/İzin Adı</TableCell>
                  <TableCell>Kod</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Süre</TableCell>
                  <TableCell>Mola</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Özellikler</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  console.log(
                    "🎯 Rendering table with shiftTypes:",
                    shiftTypes
                  );
                  return shiftTypes.map((shiftType) => (
                    <TableRow key={shiftType.id} hover>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: getShiftTypeColor(
                                shiftType.color
                              ),
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {shiftType.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shiftType.code}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatTime(shiftType.start_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatTime(shiftType.end_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {shiftType.duration} saat
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {shiftType.break_duration} dk
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategoryLabel(shiftType)}
                          color={getCategoryColor(shiftType)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {shiftType.is_night_shift && (
                            <Chip label="Gece" color="info" size="small" />
                          )}
                          {shiftType.is_weekend_shift && (
                            <Chip
                              label="Hafta Sonu"
                              color="warning"
                              size="small"
                            />
                          )}
                          {shiftType.is_leave_type && (
                            <Chip
                              label={
                                shiftType.is_paid_leave ? "Ücretli" : "Ücretsiz"
                              }
                              color={
                                shiftType.is_paid_leave ? "success" : "warning"
                              }
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shiftType.is_active ? "Aktif" : "Pasif"}
                          color={shiftType.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, shiftType)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleView(selectedShiftType);
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Görüntüle</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleEdit(selectedShiftType);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleCopy(selectedShiftType);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Kopyala</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleSettings(selectedShiftType);
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ayarlar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Shift Type Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingShiftType ? "Vardiya Tipi Düzenle" : "Yeni Vardiya Tipi"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vardiya Adı"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kod"
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Başlangıç Saati"
                type="time"
                value={formData.start_time || ""}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bitiş Saati"
                type="time"
                value={formData.end_time || ""}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mola Süresi (dakika)"
                type="number"
                value={formData.break_duration || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    break_duration: parseInt(e.target.value) || 0,
                  })
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Renk"
                type="color"
                value={formData.color || "#4CAF50"}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category || "work"}
                  onChange={(e) => {
                    const category = e.target.value as
                      | "work"
                      | "unpaid_leave"
                      | "paid_leave"
                      | "holiday";
                    setFormData({
                      ...formData,
                      category: category,
                      // Kategoriye göre otomatik alan güncellemesi
                      is_leave_type: category !== "work",
                      is_paid_leave:
                        category === "paid_leave" || category === "holiday",
                      // İzin türleri için saatleri sıfırla
                      start_time:
                        category !== "work" ? "00:00" : formData.start_time,
                      end_time:
                        category !== "work" ? "00:00" : formData.end_time,
                      duration: category !== "work" ? 0 : formData.duration,
                      break_duration:
                        category !== "work" ? 0 : formData.break_duration,
                    });
                  }}
                  label="Kategori"
                >
                  <MenuItem value="work">Çalışma Vardiyası</MenuItem>
                  <MenuItem value="unpaid_leave">Ücretsiz İzin</MenuItem>
                  <MenuItem value="paid_leave">Ücretli İzin</MenuItem>
                  <MenuItem value="holiday">Tatil</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {(formData.category === "unpaid_leave" ||
                  formData.category === "paid_leave" ||
                  formData.category === "holiday") && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_leave_type || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_leave_type: e.target.checked,
                            // İzin türü seçilirse saatleri sıfırla
                            start_time: e.target.checked
                              ? "00:00"
                              : formData.start_time,
                            end_time: e.target.checked
                              ? "00:00"
                              : formData.end_time,
                            duration: e.target.checked ? 0 : formData.duration,
                            break_duration: e.target.checked
                              ? 0
                              : formData.break_duration,
                          })
                        }
                      />
                    }
                    label="İzin Türü"
                  />
                )}
                {formData.is_leave_type && formData.category !== "work" && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_paid_leave || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_paid_leave: e.target.checked,
                          })
                        }
                        disabled={formData.category === "unpaid_leave"}
                      />
                    }
                    label="Ücretli İzin"
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_night_shift || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_night_shift: e.target.checked,
                        })
                      }
                      disabled={formData.category !== "work"}
                    />
                  }
                  label="Gece Vardiyası"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_weekend_shift || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_weekend_shift: e.target.checked,
                        })
                      }
                      disabled={formData.category !== "work"}
                    />
                  }
                  label="Hafta Sonu Vardiyası"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Aktif"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.requires_handover !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requires_handover: e.target.checked,
                        })
                      }
                      disabled={formData.is_leave_type}
                    />
                  }
                  label="Teslim Gerekli"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingShiftType ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedShiftType(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vardiya Tipi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{selectedShiftType?.name}" vardiya tipini silmek istediğinizden
            emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftTypes;
