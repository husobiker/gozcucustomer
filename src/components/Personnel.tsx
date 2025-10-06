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
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
  project_id: string;
  project_name?: string;
  mobile_login_username: string;
  mobile_login_pin: string;
  mobile_version_system: "ios" | "android";
  mobile_version_version: string;
  status: "Aktif" | "Pasif";
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface JokerPersonnel {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  id_number: string;
  company_name: string;
  project_id: string;
  project_name?: string;
  status: "Aktif" | "Pasif";
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

const Personnel: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [jokerPersonnel, setJokerPersonnel] = useState<JokerPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"personnel" | "joker">(
    "personnel"
  );
  const [personnelLimits, setPersonnelLimits] = useState<{
    current: number;
    max: number;
    canAdd: boolean;
    remaining: number;
  } | null>(null);

  const [filters, setFilters] = useState({
    first_name: "",
    last_name: "",
    project_name: "",
    status: "Aktif",
    mobile_login: "",
    mobile_version: "",
  });

  const [filteredPersonnel, setFilteredPersonnel] =
    useState<Personnel[]>(personnel);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Personnel;
    direction: "asc" | "desc";
  } | null>(null);

  // Fetch personnel from database
  const fetchPersonnel = async () => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    if (!selectedProject) {
      setPersonnel([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("personnel")
        .select(
          `
          *,
          projects!inner(name)
        `
        )
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching personnel:", error);
        setError("Personel yüklenirken bir hata oluştu: " + error.message);
      } else {
        // Transform data to include project_name
        const transformedData =
          data?.map((person: any) => ({
            ...person,
            project_name: person.projects?.name || null,
          })) || [];
        setPersonnel(transformedData);
      }
    } catch (err) {
      console.error("Error in fetchPersonnel:", err);
      setError("Personel yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Fetch joker personnel from database
  const fetchJokerPersonnel = async () => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    if (!selectedProject) {
      setJokerPersonnel([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("joker_personnel")
        .select(
          `
          *,
          projects!inner(name)
        `
        )
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching joker personnel:", error);
        // Joker personel tablosu henüz oluşturulmamışsa boş array döndür
        if (
          error.message.includes('relation "joker_personnel" does not exist')
        ) {
          setJokerPersonnel([]);
        } else {
          setError(
            "Joker personel yüklenirken bir hata oluştu: " + error.message
          );
        }
      } else {
        // Transform data to include project_name
        const transformedData =
          data?.map((person: any) => ({
            ...person,
            project_name: person.projects?.name || null,
          })) || [];
        setJokerPersonnel(transformedData);
      }
    } catch (err) {
      console.error("Error in fetchJokerPersonnel:", err);
      setError("Joker personel yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Load personnel when tenant or selectedProject is available
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchPersonnel();
      fetchJokerPersonnel();
    }
  }, [tenant, tenantLoading, selectedProject]);

  // Personel limitlerini çek
  useEffect(() => {
    const fetchPersonnelLimits = async () => {
      if (!tenant?.id) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/tenant-limits?tenantId=${tenant.id}`
        );
        const data = await response.json();

        if (response.ok) {
          setPersonnelLimits(data.limits.personnel);
        } else {
          console.error("Error fetching personnel limits:", data.error);
        }
      } catch (error) {
        console.error("Error fetching personnel limits:", error);
      }
    };

    fetchPersonnelLimits();
  }, [tenant?.id]);

  // Filter personnel based on all filter criteria
  React.useEffect(() => {
    let filtered = personnel;

    if (filters.first_name) {
      filtered = filtered.filter((p) =>
        p.first_name.toLowerCase().includes(filters.first_name.toLowerCase())
      );
    }
    if (filters.last_name) {
      filtered = filtered.filter((p) =>
        p.last_name.toLowerCase().includes(filters.last_name.toLowerCase())
      );
    }
    if (filters.project_name) {
      filtered = filtered.filter((p) =>
        (p.project_name || "")
          .toLowerCase()
          .includes(filters.project_name.toLowerCase())
      );
    }
    if (filters.status && filters.status !== "Tümü") {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters.mobile_login) {
      filtered = filtered.filter(
        (p) =>
          p.mobile_login_username
            .toLowerCase()
            .includes(filters.mobile_login.toLowerCase()) ||
          p.mobile_login_pin.includes(filters.mobile_login)
      );
    }
    if (filters.mobile_version) {
      filtered = filtered.filter(
        (p) =>
          p.mobile_version_system
            .toLowerCase()
            .includes(filters.mobile_version.toLowerCase()) ||
          p.mobile_version_version.includes(filters.mobile_version)
      );
    }

    setFilteredPersonnel(filtered);
  }, [personnel, filters]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [field]: field === "status" ? "Aktif" : "",
    }));
  };

  const handleSort = (key: keyof Personnel) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedPersonnel = React.useMemo(() => {
    if (!sortConfig) return filteredPersonnel;

    return [...filteredPersonnel].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === "mobile_login_username") {
        aValue = a.mobile_login_username;
        bValue = b.mobile_login_username;
      } else if (sortConfig.key === "mobile_version_system") {
        aValue = a.mobile_version_system;
        bValue = b.mobile_version_system;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredPersonnel, sortConfig]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPersonnel = sortedPersonnel.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string) => {
    return status === "Aktif" ? "success" : "error";
  };

  const handleRefresh = () => {
    fetchPersonnel();
    fetchJokerPersonnel();
  };

  const handleDeletePersonnel = async (
    personnelId: string,
    personnelName: string
  ) => {
    if (
      window.confirm(
        `${personnelName} personelini silmek istediğinizden emin misiniz?`
      )
    ) {
      try {
        setLoading(true);
        setError(null);

        await supabase.rpc("set_tenant_context", { tenant_id: tenant?.id });

        const { error } = await supabase
          .from("personnel")
          .delete()
          .eq("id", personnelId);

        if (error) {
          console.error("Error deleting personnel:", error);
          setError("Personel silinirken hata oluştu: " + error.message);
        } else {
          // Listeyi yenile
          fetchPersonnel();
        }
      } catch (err) {
        console.error("Error in handleDeletePersonnel:", err);
        setError("Personel silinirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteJokerPersonnel = async (
    personnelId: string,
    personnelName: string
  ) => {
    if (
      window.confirm(
        `${personnelName} joker personelini silmek istediğinizden emin misiniz?`
      )
    ) {
      try {
        setLoading(true);
        setError(null);

        await supabase.rpc("set_tenant_context", { tenant_id: tenant?.id });

        const { error } = await supabase
          .from("joker_personnel")
          .delete()
          .eq("id", personnelId);

        if (error) {
          console.error("Error deleting joker personnel:", error);
          setError("Joker personel silinirken hata oluştu: " + error.message);
        } else {
          // Listeyi yenile
          fetchJokerPersonnel();
        }
      } catch (err) {
        console.error("Error in handleDeleteJokerPersonnel:", err);
        setError("Joker personel silinirken hata oluştu");
      } finally {
        setLoading(false);
      }
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

  // Show message if no project selected
  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Lütfen sidebar'dan bir proje seçiniz.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Personel - {selectedProject?.name || "Proje Seçiniz"} -{" "}
            {tenant.name}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: "#1976d2" }}
              onClick={() => navigate("/personnel/new")}
            >
              YENİ PERSONEL
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate("/joker-personnel/new")}
            >
              YENİ JOKER
            </Button>
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
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

        {/* Personel Limiti Gösterimi */}
        {personnelLimits && (
          <Alert
            severity={
              personnelLimits.max === -1
                ? "info"
                : personnelLimits.canAdd
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
                👥 Personel Limiti: {personnelLimits.current}/
                {personnelLimits.max === -1 ? "∞" : personnelLimits.max}
              </Typography>
              <Typography variant="body2">
                {personnelLimits.max === -1
                  ? "Sınırsız personel eklenebilir"
                  : personnelLimits.canAdd
                  ? `${personnelLimits.remaining} personel daha eklenebilir`
                  : "Paket limiti doldu!"}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={`Kayıtlı Personel (${personnel.length})`}
              value="personnel"
            />
            <Tab
              label={`Joker Personel (${jokerPersonnel.length})`}
              value="joker"
            />
          </Tabs>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content Panel */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Personnel Tab Content */}
          {activeTab === "personnel" && (
            <>
              {/* Filter Bar */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                {/* Ad Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Ad
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleSort("first_name")}
                  >
                    {sortConfig?.key === "first_name" &&
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                  </IconButton>
                  <TextField
                    placeholder="Ad Filtresi"
                    value={filters.first_name}
                    onChange={(e) =>
                      handleFilterChange("first_name", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      endAdornment: filters.first_name && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => clearFilter("first_name")}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Soyad Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Soyad
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleSort("last_name")}
                  >
                    {sortConfig?.key === "last_name" &&
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                  </IconButton>
                  <TextField
                    placeholder="Soyad Filtresi"
                    value={filters.last_name}
                    onChange={(e) =>
                      handleFilterChange("last_name", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      endAdornment: filters.last_name && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => clearFilter("last_name")}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Proje Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Proje
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleSort("project_name")}
                  >
                    {sortConfig?.key === "project_name" &&
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                  </IconButton>
                  <TextField
                    placeholder="Proje Filtresi"
                    value={filters.project_name}
                    onChange={(e) =>
                      handleFilterChange("project_name", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      endAdornment: filters.project_name && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => clearFilter("project_name")}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Durum Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Durum
                  </Typography>
                  <IconButton size="small" onClick={() => handleSort("status")}>
                    {sortConfig?.key === "status" &&
                    sortConfig.direction === "asc" ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                  </IconButton>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="Aktif">Aktif</MenuItem>
                      <MenuItem value="Pasif">Pasif</MenuItem>
                      <MenuItem value="Tümü">Tümü</MenuItem>
                    </Select>
                  </FormControl>
                  {filters.status !== "Aktif" && (
                    <IconButton
                      size="small"
                      onClick={() => clearFilter("status")}
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>

                {/* Mobil Giriş Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Mobil Giriş
                  </Typography>
                  <TextField
                    placeholder="Mobil Giriş Filtresi"
                    value={filters.mobile_login}
                    onChange={(e) =>
                      handleFilterChange("mobile_login", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      endAdornment: filters.mobile_login && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => clearFilter("mobile_login")}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Mobil Versiyon Filter */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                    Mobil Versiyon
                  </Typography>
                  <TextField
                    placeholder="Mobil Versiyon Filt..."
                    value={filters.mobile_version}
                    onChange={(e) =>
                      handleFilterChange("mobile_version", e.target.value)
                    }
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      endAdornment: filters.mobile_version && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => clearFilter("mobile_version")}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {/* Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Ad
                          <IconButton
                            size="small"
                            onClick={() => handleSort("first_name")}
                          >
                            {sortConfig?.key === "first_name" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Soyad
                          <IconButton
                            size="small"
                            onClick={() => handleSort("last_name")}
                          >
                            {sortConfig?.key === "last_name" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Proje
                          <IconButton
                            size="small"
                            onClick={() => handleSort("project_name")}
                          >
                            {sortConfig?.key === "project_name" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Durum
                          <IconButton
                            size="small"
                            onClick={() => handleSort("status")}
                          >
                            {sortConfig?.key === "status" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Mobil Giriş
                          <IconButton
                            size="small"
                            onClick={() => handleSort("mobile_login_username")}
                          >
                            {sortConfig?.key === "mobile_login_username" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          Mobil Versiyon
                          <IconButton
                            size="small"
                            onClick={() => handleSort("mobile_version_system")}
                          >
                            {sortConfig?.key === "mobile_version_system" &&
                            sortConfig.direction === "asc" ? (
                              <ArrowUpIcon fontSize="small" />
                            ) : (
                              <ArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        İşlemler
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPersonnel.map((person) => (
                      <TableRow key={person.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.first_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.project_name || "Proje bulunamadı"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.status}
                            color={getStatusColor(person.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.75rem">
                            Kullanıcı adı: {person.mobile_login_username}
                          </Typography>
                          <Typography variant="body2" fontSize="0.75rem">
                            Pin: {person.mobile_login_pin}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.75rem">
                            Sistem: {person.mobile_version_system}
                          </Typography>
                          <Typography variant="body2" fontSize="0.75rem">
                            Versiyon: {person.mobile_version_version}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Personel Kartı">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/personnel/${person.id}`)
                                }
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Düzenle">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(`/personnel/${person.id}`)
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeletePersonnel(
                                    person.id,
                                    `${person.first_name} ${person.last_name}`
                                  )
                                }
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
                count={filteredPersonnel.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Sayfa Başına Satır"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} toplam ${count}`
                }
              />
            </>
          )}

          {/* Joker Personnel Tab Content */}
          {activeTab === "joker" && (
            <>
              {/* Joker Personnel Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Ad</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Soyad</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Telefon</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        TC Kimlik No
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Firma Adı
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        İşlemler
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jokerPersonnel.map((person) => (
                      <TableRow key={person.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.first_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.id_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.company_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.status}
                            color={getStatusColor(person.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Düzenle">
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleDeleteJokerPersonnel(
                                    person.id,
                                    `${person.first_name} ${person.last_name}`
                                  )
                                }
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
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Personnel;
