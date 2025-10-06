import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewColumn as ViewColumnIcon,
  Link as LinkIcon,
  Videocam as CameraIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";
import { supabase } from "../lib/supabase";
// CameraAddModal import'u Hikvision entegrasyonu için kaldırıldı
import HikvisionCameraIntegration from "./HikvisionCameraIntegration";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

interface Region {
  id: string;
  name: string;
  description: string;
  address: string;
  country: string;
  city: string;
  district: string;
  postal_code: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EditProject: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { tenant } = useTenant();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    companyTitle: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Türkiye",
    city: "",
    district: "",
    postalCode: "",
    min_personnel_per_shift: 1,
  });
  const [regionFormData, setRegionFormData] = useState({
    name: "",
    description: "",
    address: "",
    country: "Türkiye",
    city: "",
    district: "",
    postalCode: "",
  });
  const [openRegionDialog, setOpenRegionDialog] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [regionPage, setRegionPage] = useState(0);
  const [regionRowsPerPage, setRegionRowsPerPage] = useState(10);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  // Kamera state'leri Hikvision entegrasyonu için kaldırıldı

  // Load project data
  useEffect(() => {
    if (projectId && tenant) {
      loadProjectData();
    }
  }, [projectId, tenant]);

  const loadProjectData = async () => {
    if (!tenant || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("tenant_id", tenant.id)
        .single();

      if (projectError) {
        console.error("Error loading project:", projectError);
        setError("Proje yüklenirken bir hata oluştu: " + projectError.message);
        return;
      }

      setProject(projectData);

      // Parse project name for form data
      const nameParts = projectData.name.split(" ");
      setFormData({
        companyTitle: nameParts[0] || "",
        firstName: nameParts[1] || "",
        lastName: nameParts[2] || "",
        email: "",
        phone: "",
        address: "",
        country: "Türkiye",
        city: "İstanbul",
        district: "ömerli/pendik",
        postalCode: "",
        min_personnel_per_shift: projectData.min_personnel_per_shift || 1,
      });

      // Load regions
      await loadRegions();
      // Load users
      await loadUsers();
      // Kameralar Hikvision entegrasyonu ile yönetilecek
    } catch (err) {
      console.error("Error in loadProjectData:", err);
      setError("Proje verileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    if (!tenant || !projectId) return;

    try {
      // RLS policies now work directly with auth.uid()
      const { data, error } = await supabase
        .from("project_regions")
        .select("*")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading regions:", error);
      } else {
        setRegions(data || []);
      }
    } catch (err) {
      console.error("Error in loadRegions:", err);
    }
  };

  const loadUsers = async () => {
    if (!tenant || !projectId) return;

    try {
      // RLS policies now work directly with auth.uid()
      const { data, error } = await supabase
        .from("project_users")
        .select(
          `
          *,
          users:user_id (
            id,
            email,
            full_name,
            role
          )
        `
        )
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Error loading users:", error);
      } else {
        const userData = data?.map((item) => item.users).filter(Boolean) || [];
        setUsers(userData);
      }
    } catch (err) {
      console.error("Error in loadUsers:", err);
    }
  };

  // loadCameras fonksiyonu Hikvision entegrasyonu için kaldırıldı

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegionInputChange = (field: string, value: string) => {
    setRegionFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Kamera fonksiyonları Hikvision entegrasyonu için kaldırıldı

  const handleSaveProject = async () => {
    if (!tenant || !project) {
      setError("Tenant veya proje bilgisi bulunamadı");
      return;
    }

    if (!formData.companyTitle.trim()) {
      setError("Firma ünvanı zorunludur");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      const projectName =
        `${formData.companyTitle} ${formData.firstName} ${formData.lastName}`.trim();
      const projectDescription =
        `${formData.email} ${formData.phone} ${formData.address}`.trim();

      const { error } = await supabase
        .from("projects")
        .update({
          name: projectName,
          description: projectDescription || null,
          min_personnel_per_shift: formData.min_personnel_per_shift,
          max_personnel_per_shift: formData.min_personnel_per_shift, // Minimum ile aynı
          requires_24_hour_coverage: true, // Güvenlik sektöründe her zaman 24 saat sürekli
        })
        .eq("id", project.id)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Error updating project:", error);
        setError("Proje güncellenirken bir hata oluştu: " + error.message);
      } else {
        alert("Proje başarıyla güncellendi!");
        navigate("/projects");
      }
    } catch (err) {
      console.error("Error in handleSaveProject:", err);
      setError("Proje güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegion = async () => {
    if (!tenant || !project) {
      setError("Tenant veya proje bilgisi bulunamadı");
      return;
    }

    if (!regionFormData.name.trim()) {
      setError("Bölge adı zorunludur");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      if (editingRegion) {
        // Update existing region
        const { error } = await supabase
          .from("project_regions")
          .update({
            name: regionFormData.name,
            description: regionFormData.description,
            address: regionFormData.address,
            country: regionFormData.country,
            city: regionFormData.city,
            district: regionFormData.district,
            postal_code: regionFormData.postalCode,
          })
          .eq("id", editingRegion.id)
          .eq("tenant_id", tenant.id);

        if (error) {
          console.error("Error updating region:", error);
          setError("Bölge güncellenirken bir hata oluştu: " + error.message);
        } else {
          await loadRegions();
          handleCloseRegionDialog();
        }
      } else {
        // Create new region
        const { error } = await supabase.from("project_regions").insert({
          name: regionFormData.name,
          description: regionFormData.description,
          address: regionFormData.address,
          country: regionFormData.country,
          city: regionFormData.city,
          district: regionFormData.district,
          postal_code: regionFormData.postalCode,
          project_id: project.id,
          tenant_id: tenant.id,
        });

        if (error) {
          console.error("Error creating region:", error);
          setError("Bölge oluşturulurken bir hata oluştu: " + error.message);
        } else {
          await loadRegions();
          handleCloseRegionDialog();
        }
      }
    } catch (err) {
      console.error("Error in handleSaveRegion:", err);
      setError("Bölge kaydedilirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegion = async (regionId: string) => {
    if (!tenant) return;

    if (!window.confirm("Bu bölgeyi silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      const { error } = await supabase
        .from("project_regions")
        .delete()
        .eq("id", regionId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Error deleting region:", error);
        setError("Bölge silinirken bir hata oluştu: " + error.message);
      } else {
        await loadRegions();
      }
    } catch (err) {
      console.error("Error in handleDeleteRegion:", err);
      setError("Bölge silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegionDialog = (region?: Region) => {
    if (region) {
      setEditingRegion(region);
      setRegionFormData({
        name: region.name,
        description: region.description || "",
        address: region.address || "",
        country: region.country || "Türkiye",
        city: region.city || "",
        district: region.district || "",
        postalCode: region.postal_code || "",
      });
    } else {
      setEditingRegion(null);
      setRegionFormData({
        name: "",
        description: "",
        address: "",
        country: "Türkiye",
        city: "",
        district: "",
        postalCode: "",
      });
    }
    setOpenRegionDialog(true);
  };

  const handleCloseRegionDialog = () => {
    setOpenRegionDialog(false);
    setEditingRegion(null);
    setRegionFormData({
      name: "",
      description: "",
      address: "",
      country: "Türkiye",
      city: "",
      district: "",
      postalCode: "",
    });
  };

  const handleRefresh = () => {
    loadProjectData();
  };

  // Filter regions based on search term
  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().includes(regionSearchTerm.toLowerCase())
  );

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (loading && !project) {
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

  if (!project) {
    return (
      <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
        <Alert severity="error">Proje bulunamadı</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate("/projects")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            {project.name} Proje Düzenle
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Section - Project Details Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: "fit-content" }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Proje Detayları
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Firma Ünvan"
                    value={formData.companyTitle}
                    onChange={(e) =>
                      handleInputChange("companyTitle", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ad"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Soyad"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-Posta"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    size="small"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ülke"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="İl"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="İlçe"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Posta Kodu"
                    value={formData.postalCode}
                    onChange={(e) =>
                      handleInputChange("postalCode", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Personnel Management Section */}
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  bgcolor: "#f8f9fa",
                  borderRadius: 2,
                  border: "1px solid #e9ecef",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "#495057", fontWeight: "bold" }}
                >
                  🔒 Vardiya Personel Ayarları
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Bu proje için vardiya başına kaç personel çalışacağını
                  belirleyin:
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="1 Vardiyada Kaç Personel Çalışacak?"
                      type="number"
                      value={formData.min_personnel_per_shift}
                      onChange={(e) =>
                        handleInputChange(
                          "min_personnel_per_shift",
                          parseInt(e.target.value) || 1
                        )
                      }
                      variant="outlined"
                      helperText="Örnek: Apartman için 1, AVM için 2-3, Büyük hastane için 3-4"
                      inputProps={{ min: 1, max: 10 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Section - Regions and Users Management */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ borderRadius: 2, height: "fit-content" }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                >
                  <Tab label="Bölgeler" />
                  <Tab label="Sistem Kullanıcıları" />
                  <Tab label="Kameralar" />
                </Tabs>
              </Box>

              {/* Regions Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    Bu projenin bölgelerini görüntülüyorsunuz.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenRegionDialog()}
                    sx={{
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#1565c0" },
                    }}
                  >
                    YENİ BÖLGE OLUŞTUR +
                  </Button>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <IconButton onClick={handleRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                  <IconButton size="small">
                    <SearchIcon />
                  </IconButton>
                  <IconButton size="small">
                    <FilterIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ViewColumnIcon />
                  </IconButton>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            Bölge Adı
                            <Box display="flex" flexDirection="column">
                              <Box sx={{ fontSize: "10px", lineHeight: 1 }}>
                                ▲
                              </Box>
                              <Box sx={{ fontSize: "10px", lineHeight: 1 }}>
                                ▼
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Bölge Adı Filtresi"
                            value={regionSearchTerm}
                            onChange={(e) =>
                              setRegionSearchTerm(e.target.value)
                            }
                            sx={{ minWidth: 200 }}
                          />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {filteredRegions
                        .slice(
                          regionPage * regionRowsPerPage,
                          regionPage * regionRowsPerPage + regionRowsPerPage
                        )
                        .map((region) => (
                          <TableRow key={region.id}>
                            <TableCell>{region.name}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenRegionDialog(region)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRegion(region.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredRegions.length}
                  rowsPerPage={regionRowsPerPage}
                  page={regionPage}
                  onPageChange={(e, newPage) => setRegionPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRegionRowsPerPage(parseInt(e.target.value, 10));
                    setRegionPage(0);
                  }}
                  labelRowsPerPage="Sayfa Başına Satır"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} toplam ${count}`
                  }
                />
              </TabPanel>

              {/* Users Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    Bu proje için atanan tüm sistem kullanıcıları
                    görüntüleniyor.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<LinkIcon />}
                    sx={{
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#1565c0" },
                    }}
                  >
                    SEÇ
                  </Button>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <IconButton onClick={handleRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                  <IconButton size="small">
                    <SearchIcon />
                  </IconButton>
                  <IconButton size="small">
                    <FilterIcon />
                  </IconButton>
                  <IconButton size="small">
                    <ViewColumnIcon />
                  </IconButton>
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    placeholder="Ad Filtresi"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: userSearchTerm && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setUserSearchTerm("")}
                          >
                            ×
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    size="small"
                    placeholder="Soyad Filtresi"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small">×</IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {filteredUsers.length === 0 ? (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 1,
                      p: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    Gösterilecek kayıt bulunamadı
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ad</TableCell>
                          <TableCell>Soyad</TableCell>
                          <TableCell>E-Posta</TableCell>
                          <TableCell>Rol</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredUsers
                          .slice(
                            userPage * userRowsPerPage,
                            userPage * userRowsPerPage + userRowsPerPage
                          )
                          .map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                {user.full_name.split(" ")[0] || "N/A"}
                              </TableCell>
                              <TableCell>
                                {user.full_name.split(" ").slice(1).join(" ") ||
                                  "N/A"}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Chip label={user.role} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredUsers.length}
                  rowsPerPage={userRowsPerPage}
                  page={userPage}
                  onPageChange={(e, newPage) => setUserPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setUserRowsPerPage(parseInt(e.target.value, 10));
                    setUserPage(0);
                  }}
                  labelRowsPerPage="Sayfa Başına Satır"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} toplam ${count}`
                  }
                />
              </TabPanel>

              {/* Kameralar Tab - Hikvision Entegrasyonu */}
              <TabPanel value={tabValue} index={2}>
                <HikvisionCameraIntegration projectId={project?.id || ""} />
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            onClick={handleSaveProject}
            disabled={loading}
            sx={{
              bgcolor: "#9e9e9e",
              "&:hover": { bgcolor: "#757575" },
              px: 4,
              py: 1.5,
            }}
          >
            KAYDET ✓
          </Button>
        </Box>

        {/* Region Dialog */}
        <Dialog
          open={openRegionDialog}
          onClose={handleCloseRegionDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRegion ? "Bölgeyi Düzenle" : "Yeni Bölge Oluştur"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Projeye ait bölge detayı
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  label="Bölge Adı"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.name}
                  onChange={(e) =>
                    handleRegionInputChange("name", e.target.value)
                  }
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Açıklama"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={regionFormData.description}
                  onChange={(e) =>
                    handleRegionInputChange("description", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Adres"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.address}
                  onChange={(e) =>
                    handleRegionInputChange("address", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Ülke"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.country}
                  onChange={(e) =>
                    handleRegionInputChange("country", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="İl"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.city}
                  onChange={(e) =>
                    handleRegionInputChange("city", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="İlçe"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.district}
                  onChange={(e) =>
                    handleRegionInputChange("district", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Posta Kodu"
                  fullWidth
                  variant="outlined"
                  value={regionFormData.postalCode}
                  onChange={(e) =>
                    handleRegionInputChange("postalCode", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRegionDialog}>Vazgeç</Button>
            <Button onClick={handleSaveRegion} variant="contained">
              KAYDET
            </Button>
          </DialogActions>
        </Dialog>

        {/* Kamera dialog'ları Hikvision entegrasyonu için kaldırıldı */}
      </Box>
    </Box>
  );
};

export default EditProject;
