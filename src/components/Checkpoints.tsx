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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import QRCode from "qrcode";

interface Checkpoint {
  id: string;
  code: string;
  title: string;
  type: string;
  project_id: string;
  project_name?: string;
  project_region: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

const Checkpoints: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    code: "",
    title: "",
    type: "",
    project_name: "",
    project_region: "",
  });

  const [filteredCheckpoints, setFilteredCheckpoints] =
    useState<Checkpoint[]>(checkpoints);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Checkpoint;
    direction: "asc" | "desc";
  } | null>(null);

  // Fetch checkpoints from database
  const fetchCheckpoints = async () => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    if (!selectedProject) {
      setCheckpoints([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("checkpoints")
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
        console.error("Error fetching checkpoints:", error);
        setError(
          "Kontrol noktaları yüklenirken bir hata oluştu: " + error.message
        );
      } else {
        // Transform data to include project_name
        const transformedData =
          data?.map((checkpoint: any) => ({
            ...checkpoint,
            project_name: checkpoint.projects?.name || null,
          })) || [];
        setCheckpoints(transformedData);
      }
    } catch (err) {
      console.error("Error in fetchCheckpoints:", err);
      setError("Kontrol noktaları yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Load checkpoints when tenant or selectedProject is available
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchCheckpoints();
    }
  }, [tenant, tenantLoading, selectedProject]);

  // Filter checkpoints based on all filter criteria
  React.useEffect(() => {
    let filtered = checkpoints;

    if (filters.code) {
      filtered = filtered.filter((c) =>
        c.code.toLowerCase().includes(filters.code.toLowerCase())
      );
    }
    if (filters.title) {
      filtered = filtered.filter((c) =>
        c.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    if (filters.type) {
      filtered = filtered.filter((c) =>
        c.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    if (filters.project_name) {
      filtered = filtered.filter((c) =>
        (c.project_name || "")
          .toLowerCase()
          .includes(filters.project_name.toLowerCase())
      );
    }
    if (filters.project_region) {
      filtered = filtered.filter((c) =>
        c.project_region
          .toLowerCase()
          .includes(filters.project_region.toLowerCase())
      );
    }

    setFilteredCheckpoints(filtered);
  }, [checkpoints, filters]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilter = (field: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleSort = (key: keyof Checkpoint) => {
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

  const sortedCheckpoints = React.useMemo(() => {
    if (!sortConfig) return filteredCheckpoints;

    return [...filteredCheckpoints].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredCheckpoints, sortConfig]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCheckpoints = sortedCheckpoints.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Generate QR code for a checkpoint
  const generateQRCode = async (code: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(code, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return qrDataUrl;
    } catch (err) {
      console.error("Error generating QR code:", err);
      return null;
    }
  };

  // Download single QR code
  const downloadSingleQR = async (checkpoint: Checkpoint) => {
    if (checkpoint.type !== "QR") {
      alert("Bu kontrol noktası QR kod tipinde değil");
      return;
    }

    const qrDataUrl = await generateQRCode(checkpoint.code);
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = `checkpoint-${checkpoint.code}.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  // Download all QR codes as ZIP
  const handleBulkQRDownload = async () => {
    const qrCheckpoints = checkpoints.filter((cp) => cp.type === "QR");

    if (qrCheckpoints.length === 0) {
      alert("QR kod tipinde kontrol noktası bulunamadı");
      return;
    }

    try {
      // For now, download each QR code individually
      // In a real app, you'd create a ZIP file
      for (const checkpoint of qrCheckpoints) {
        await downloadSingleQR(checkpoint);
        // Small delay to prevent browser blocking
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error("Error downloading QR codes:", err);
      alert("QR kodları indirilirken bir hata oluştu");
    }
  };

  const handleAddCheckpoint = () => {
    navigate("/checkpoints/new");
  };

  const handleRefresh = () => {
    fetchCheckpoints();
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
            Kontrol Noktaları - {selectedProject?.name || "Proje Seçiniz"} -{" "}
            {tenant.name}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleBulkQRDownload}
              sx={{ borderColor: "#1976d2", color: "#1976d2" }}
            >
              TOPLU QR İNDİR
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCheckpoint}
              sx={{ bgcolor: "#1976d2" }}
            >
              YENİ KONTROL NOKTASI
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content Panel */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
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
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {/* Kontrol Noktası Kod Filter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                Kontrol Noktası Kod
              </Typography>
              <IconButton size="small" onClick={() => handleSort("code")}>
                {sortConfig?.key === "code" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}
              </IconButton>
              <TextField
                placeholder="Kontrol Noktası Kod Filtresi"
                value={filters.code}
                onChange={(e) => handleFilterChange("code", e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  endAdornment: filters.code && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => clearFilter("code")}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Başlık Filter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                Başlık
              </Typography>
              <IconButton size="small" onClick={() => handleSort("title")}>
                {sortConfig?.key === "title" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}
              </IconButton>
              <TextField
                placeholder="Başlık Filtresi"
                value={filters.title}
                onChange={(e) => handleFilterChange("title", e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
                InputProps={{
                  endAdornment: filters.title && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => clearFilter("title")}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Tipi Filter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                Tipi
              </Typography>
              <IconButton size="small" onClick={() => handleSort("type")}>
                {sortConfig?.key === "type" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}
              </IconButton>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">Tipi Filtresi</MenuItem>
                  <MenuItem value="QR Kod">QR Kod</MenuItem>
                  <MenuItem value="NFC">NFC</MenuItem>
                  <MenuItem value="GPS">GPS</MenuItem>
                </Select>
              </FormControl>
              {filters.type && (
                <IconButton size="small" onClick={() => clearFilter("type")}>
                  <ClearIcon />
                </IconButton>
              )}
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

            {/* Proje Bölgesi Filter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
                Proje Bölgesi
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleSort("project_region")}
              >
                {sortConfig?.key === "project_region" &&
                sortConfig.direction === "asc" ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )}
              </IconButton>
              <TextField
                placeholder="Proje Bölgesi Filtresi"
                value={filters.project_region}
                onChange={(e) =>
                  handleFilterChange("project_region", e.target.value)
                }
                size="small"
                sx={{ minWidth: 150 }}
                InputProps={{
                  endAdornment: filters.project_region && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => clearFilter("project_region")}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
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
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      Kontrol Noktası Kod
                      <IconButton
                        size="small"
                        onClick={() => handleSort("code")}
                      >
                        {sortConfig?.key === "code" &&
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
                      Başlık
                      <IconButton
                        size="small"
                        onClick={() => handleSort("title")}
                      >
                        {sortConfig?.key === "title" &&
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
                      Tipi
                      <IconButton
                        size="small"
                        onClick={() => handleSort("type")}
                      >
                        {sortConfig?.key === "type" &&
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
                      Proje Bölgesi
                      <IconButton
                        size="small"
                        onClick={() => handleSort("project_region")}
                      >
                        {sortConfig?.key === "project_region" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCheckpoints.map((checkpoint) => (
                  <TableRow key={checkpoint.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {checkpoint.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {checkpoint.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={checkpoint.type}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {checkpoint.project_name || "Proje bulunamadı"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {checkpoint.project_region}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {checkpoint.type === "QR" && (
                          <Tooltip title="QR Kodu İndir">
                            <IconButton
                              size="small"
                              onClick={() => downloadSingleQR(checkpoint)}
                              sx={{ color: "#1976d2" }}
                            >
                              <QrCodeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Düzenle">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" color="error">
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
            count={filteredCheckpoints.length}
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
      </Box>
    </Box>
  );
};

export default Checkpoints;
