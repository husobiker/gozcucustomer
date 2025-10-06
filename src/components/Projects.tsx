import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from "@mui/icons-material";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "maintenance";
  created_at: string;
  updated_at: string;
  tenant_id: string;
  // Personnel management fields
  min_personnel_per_shift?: number; // minimum personnel required per shift
  max_personnel_per_shift?: number; // maximum personnel allowed per shift
  requires_24_hour_coverage?: boolean; // if project requires 24-hour coverage
  shift_handover_required?: boolean; // if handover between shifts is required
}

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectLimits, setProjectLimits] = useState<{
    current: number;
    max: number;
    canAdd: boolean;
    remaining: number;
  } | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dialogFormData, setDialogFormData] = useState({
    name: "",
    description: "",
    status: "active" as "active" | "inactive" | "maintenance",
    min_personnel_per_shift: 1,
    shift_handover_required: true,
  });

  // Fetch projects from database
  const fetchProjects = async () => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setError("Projeler yüklenirken bir hata oluştu: " + error.message);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error("Error in fetchProjects:", err);
      setError("Projeler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Load projects when tenant is available
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchProjects();
    }
  }, [tenant, tenantLoading]);

  // Proje limitlerini çek
  useEffect(() => {
    const fetchProjectLimits = async () => {
      if (!tenant?.id) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/tenant-limits?tenantId=${tenant.id}`
        );
        const data = await response.json();

        if (response.ok) {
          // Proje limitlerini doğru şekilde hesapla
          const currentProjects = projects.length;
          // API'den proje limitini çek, yoksa tenant'tan al
          const maxProjects =
            data.limits?.projects?.max || tenant.max_projects || -1;
          const canAdd = maxProjects === -1 || currentProjects < maxProjects;
          const remaining =
            maxProjects === -1
              ? -1
              : Math.max(0, maxProjects - currentProjects);

          setProjectLimits({
            current: currentProjects,
            max: maxProjects,
            canAdd: canAdd,
            remaining: remaining,
          });
        } else {
          console.error("Error fetching project limits:", data.error);
          // API hatası durumunda tenant'tan direkt al
          const currentProjects = projects.length;
          const maxProjects = tenant.max_projects || -1;
          const canAdd = maxProjects === -1 || currentProjects < maxProjects;
          const remaining =
            maxProjects === -1
              ? -1
              : Math.max(0, maxProjects - currentProjects);

          setProjectLimits({
            current: currentProjects,
            max: maxProjects,
            canAdd: canAdd,
            remaining: remaining,
          });
        }
      } catch (error) {
        console.error("Error fetching project limits:", error);
        // Hata durumunda tenant'tan direkt al
        const currentProjects = projects.length;
        const maxProjects = tenant.max_projects || -1;
        const canAdd = maxProjects === -1 || currentProjects < maxProjects;
        const remaining =
          maxProjects === -1 ? -1 : Math.max(0, maxProjects - currentProjects);

        setProjectLimits({
          current: currentProjects,
          max: maxProjects,
          canAdd: canAdd,
          remaining: remaining,
        });
      }
    };

    fetchProjectLimits();
  }, [tenant?.id, tenant?.max_projects, projects.length]);

  // Filter projects based on search term
  React.useEffect(() => {
    let filtered = projects;
    if (searchTerm) {
      filtered = projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchProjects();
  };

  const paginatedProjects = sortedProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleAddProject = () => {
    navigate("/projects/new");
  };

  const handleEditProject = (project: Project) => {
    navigate(`/projects/${project.id}/edit`);
  };

  const handleOpenDialog = () => {
    setEditingProject(null);
    setDialogFormData({
      name: "",
      description: "",
      status: "active",
      min_personnel_per_shift: 1,
      shift_handover_required: true,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setDialogFormData({
      name: "",
      description: "",
      status: "active",
      min_personnel_per_shift: 1,
      shift_handover_required: true,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Error deleting project:", error);
        setError("Proje silinirken bir hata oluştu: " + error.message);
      } else {
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error("Error in handleDeleteProject:", err);
      setError("Proje silinirken bir hata oluştu");
    }
  };

  const handleSaveProject = async () => {
    if (!tenant) return;

    if (!dialogFormData.name.trim()) {
      setError("Proje adı zorunludur");
      return;
    }

    try {
      if (editingProject) {
        // Edit existing project
        const { error } = await supabase
          .from("projects")
          .update({
            name: dialogFormData.name,
            description: dialogFormData.description,
            status: dialogFormData.status,
            min_personnel_per_shift: dialogFormData.min_personnel_per_shift,
            max_personnel_per_shift: dialogFormData.min_personnel_per_shift, // Minimum ile aynı
            requires_24_hour_coverage: true, // Güvenlik sektöründe her zaman 24 saat sürekli
            shift_handover_required: dialogFormData.shift_handover_required,
          })
          .eq("id", editingProject.id)
          .eq("tenant_id", tenant.id);

        if (error) {
          console.error("Error updating project:", error);
          setError("Proje güncellenirken bir hata oluştu: " + error.message);
        } else {
          setProjects(
            projects.map((p) =>
              p.id === editingProject.id ? { ...p, ...dialogFormData } : p
            )
          );
          handleCloseDialog();
        }
      } else {
        // Add new project
        const { data, error } = await supabase
          .from("projects")
          .insert({
            name: dialogFormData.name,
            description: dialogFormData.description,
            status: dialogFormData.status,
            tenant_id: tenant.id,
            min_personnel_per_shift: dialogFormData.min_personnel_per_shift,
            max_personnel_per_shift: dialogFormData.min_personnel_per_shift, // Minimum ile aynı
            requires_24_hour_coverage: true, // Güvenlik sektöründe her zaman 24 saat sürekli
            shift_handover_required: dialogFormData.shift_handover_required,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating project:", error);
          setError("Proje oluşturulurken bir hata oluştu: " + error.message);
        } else {
          setProjects([data, ...projects]);
          handleCloseDialog();
        }
      }
    } catch (err) {
      console.error("Error in handleSaveProject:", err);
      setError("Proje kaydedilirken bir hata oluştu");
    }
  };

  // Show loading state
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

  // Show error if no tenant
  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Tenant bilgisi bulunamadı. Lütfen doğru domain üzerinden giriş yapın.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Projeler - {tenant.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProject}
            sx={{ bgcolor: "#1976d2" }}
          >
            YENİ PROJE
          </Button>
        </Box>

        {/* Proje Limiti Gösterimi */}
        {projectLimits && (
          <Alert
            severity={
              projectLimits.max === -1
                ? "info"
                : projectLimits.canAdd
                ? "success"
                : "warning"
            }
            sx={{ mb: 3 }}
          >
            <Box sx={{ textAlign: "center", width: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                }}
              >
                📁 Proje Limiti: {projectLimits.current}/
                {projectLimits.max === -1 ? "∞" : projectLimits.max}
              </Typography>
              <Typography variant="body2">
                {projectLimits.max === -1
                  ? "Sınırsız proje eklenebilir"
                  : projectLimits.canAdd
                  ? `${projectLimits.remaining} proje daha eklenebilir`
                  : "Paket limiti doldu!"}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content Panel */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Control Bar */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexGrow: 1,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                Ünvan
              </Typography>
              <IconButton size="small" onClick={handleSort}>
                {sortOrder === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </IconButton>
              <TextField
                placeholder="Ünvan Filtresi"
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={clearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Ara">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filtreler">
                <IconButton>
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Görünüm">
                <IconButton>
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Ünvan</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Personel/Vardiya
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Oluşturulma Tarihi
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProjects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography variant="caption" color="text.secondary">
                          {project.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          project.status === "active"
                            ? "Aktif"
                            : project.status === "inactive"
                            ? "Pasif"
                            : "Bakım"
                        }
                        color={
                          project.status === "active"
                            ? "success"
                            : project.status === "inactive"
                            ? "default"
                            : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {project.min_personnel_per_shift || 1}{" "}
                          personel/vardiya
                        </Typography>
                        <Chip
                          label="24h"
                          size="small"
                          color="info"
                          sx={{ fontSize: "0.6rem", height: 16 }}
                        />
                        {project.shift_handover_required && (
                          <Chip
                            label="Teslim"
                            size="small"
                            color="warning"
                            sx={{ fontSize: "0.6rem", height: 16 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(project.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleEditProject(project)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteProject(project.id)}
                          >
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
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa Başına Satır"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} toplam ${count}`
            }
          />
        </Paper>

        {/* Add/Edit Project Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          sx={{ "& .MuiDialog-paper": { maxHeight: "90vh" } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {editingProject ? "✏️ Projeyi Düzenle" : "➕ Yeni Proje Ekle"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2, maxHeight: "70vh", overflow: "auto" }}>
            {/* Basic Information */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 2, color: "#1976d2" }}
              >
                📋 Temel Bilgiler
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    autoFocus
                    label="Proje Adı"
                    fullWidth
                    variant="outlined"
                    value={dialogFormData.name}
                    onChange={(e) =>
                      setDialogFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Örn: ABC Hastanesi, XYZ Apartmanı"
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Açıklama (İsteğe Bağlı)"
                    fullWidth
                    multiline
                    rows={2}
                    variant="outlined"
                    value={dialogFormData.description}
                    onChange={(e) =>
                      setDialogFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Proje hakkında kısa bilgi..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "white",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={dialogFormData.status}
                      onChange={(e) =>
                        setDialogFormData((prev) => ({
                          ...prev,
                          status: e.target.value as
                            | "active"
                            | "inactive"
                            | "maintenance",
                        }))
                      }
                      label="Durum"
                      sx={{
                        backgroundColor: "white",
                      }}
                    >
                      <MenuItem value="active">🟢 Aktif</MenuItem>
                      <MenuItem value="inactive">🔴 Pasif</MenuItem>
                      <MenuItem value="maintenance">🔧 Bakım</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

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

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bu proje için vardiya başına kaç personel çalışacağını
                belirleyin:
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="1 Vardiyada Kaç Personel Çalışacak?"
                    type="number"
                    value={dialogFormData.min_personnel_per_shift}
                    onChange={(e) =>
                      setDialogFormData((prev) => ({
                        ...prev,
                        min_personnel_per_shift: parseInt(e.target.value) || 1,
                      }))
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
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              ❌ İptal
            </Button>
            <Button
              onClick={handleSaveProject}
              variant="contained"
              sx={{ minWidth: 100 }}
            >
              {editingProject ? "💾 Güncelle" : "➕ Ekle"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Projects;
