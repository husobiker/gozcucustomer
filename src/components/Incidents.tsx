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
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";

interface Incident {
  id: string;
  serialNo: number;
  status: "open" | "under_review" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  creationDate: string;
  responsiblePerson: string;
  project: string;
  description: string;
  location?: string;
  documents?: string[];
}

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    serialNo: "",
    status: "",
    priority: "",
    creationDate: "",
    responsiblePerson: "",
    project: "",
  });

  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Incident;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [incidentDetailModal, setIncidentDetailModal] = useState(false);

  // Veritabanından olayları yükle
  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from("incidents")
        .select(
          `
          *,
          project:projects(name),
          personnel:personnel(first_name, last_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading incidents:", error);
        return;
      }

      const formattedIncidents = (data || []).map((incident: any) => ({
        id: incident.id,
        serialNo: incident.serial_no,
        status: incident.status,
        priority: incident.priority,
        creationDate: new Date(incident.created_at).toLocaleString("tr-TR"),
        responsiblePerson: incident.personnel
          ? `${incident.personnel.first_name} ${incident.personnel.last_name}`.toUpperCase()
          : "Bilinmeyen",
        project: incident.project?.name || "Bilinmeyen Proje",
        description: incident.description,
        location: incident.location,
        documents: incident.documents || [],
      }));

      setIncidents(formattedIncidents);
    } catch (error) {
      console.error("Error in loadIncidents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter incidents based on all filter criteria
  React.useEffect(() => {
    let filtered = incidents;

    if (filters.serialNo) {
      filtered = filtered.filter((i) =>
        i.serialNo.toString().includes(filters.serialNo)
      );
    }
    if (filters.status) {
      filtered = filtered.filter((i) =>
        i.status.toLowerCase().includes(filters.status.toLowerCase())
      );
    }
    if (filters.priority) {
      filtered = filtered.filter((i) =>
        i.priority.toLowerCase().includes(filters.priority.toLowerCase())
      );
    }
    if (filters.creationDate) {
      filtered = filtered.filter((i) =>
        i.creationDate
          .toLowerCase()
          .includes(filters.creationDate.toLowerCase())
      );
    }
    if (filters.responsiblePerson) {
      filtered = filtered.filter((i) =>
        i.responsiblePerson
          .toLowerCase()
          .includes(filters.responsiblePerson.toLowerCase())
      );
    }
    if (filters.project) {
      filtered = filtered.filter((i) =>
        i.project.toLowerCase().includes(filters.project.toLowerCase())
      );
    }

    setFilteredIncidents(filtered);
  }, [incidents, filters]);

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

  const handleSort = (key: keyof Incident) => {
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

  const sortedIncidents = React.useMemo(() => {
    if (!sortConfig) return filteredIncidents;

    return [...filteredIncidents].sort((a, b) => {
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
  }, [filteredIncidents, sortConfig]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedIncidents = sortedIncidents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentDetailModal(true);
  };

  const getStatusChip = (status: string) => {
    const statusMap = {
      open: { label: "Açık", color: "#f44336" },
      under_review: { label: "İnceleniyor", color: "#ff9800" },
      resolved: { label: "Çözümlendi", color: "#4caf50" },
      closed: { label: "Kapatıldı", color: "#9e9e9e" },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      color: "#9e9e9e",
    };

    return (
      <Chip
        label={statusInfo.label}
        size="small"
        sx={{
          backgroundColor: statusInfo.color,
          color: "white",
          fontWeight: "bold",
        }}
      />
    );
  };

  const getPriorityChip = (priority: string) => {
    const priorityMap = {
      low: { label: "Düşük", color: "#4caf50" },
      medium: { label: "Orta", color: "#ff9800" },
      high: { label: "Yüksek", color: "#f44336" },
      critical: { label: "Kritik", color: "#9c27b0" },
    };
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || {
      label: priority,
      color: "#9e9e9e",
    };

    return (
      <Chip
        label={priorityInfo.label}
        size="small"
        sx={{
          backgroundColor: priorityInfo.color,
          color: "white",
          fontWeight: "bold",
        }}
      />
    );
  };

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
            Olay Kayıtları
          </Typography>
        </Box>

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
              <Tooltip title="Yenile">
                <IconButton>
                  <RefreshIcon />
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
                      Seri No
                      <IconButton
                        size="small"
                        onClick={() => handleSort("serialNo")}
                      >
                        {sortConfig?.key === "serialNo" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <TextField
                      placeholder="Seri No Filtresi"
                      value={filters.serialNo}
                      onChange={(e) =>
                        handleFilterChange("serialNo", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.serialNo && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("serialNo")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
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
                    <TextField
                      placeholder="Durum Filtresi"
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.status && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("status")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      Öncelik
                      <IconButton
                        size="small"
                        onClick={() => handleSort("priority")}
                      >
                        {sortConfig?.key === "priority" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <TextField
                      placeholder="Öncelik Filtresi"
                      value={filters.priority}
                      onChange={(e) =>
                        handleFilterChange("priority", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.priority && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("priority")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      Oluşma Tarihi
                      <IconButton
                        size="small"
                        onClick={() => handleSort("creationDate")}
                      >
                        {sortConfig?.key === "creationDate" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <TextField
                      placeholder="Oluşma Tarihi Filt..."
                      value={filters.creationDate}
                      onChange={(e) =>
                        handleFilterChange("creationDate", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.creationDate && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("creationDate")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      İlgili Kişi
                      <IconButton
                        size="small"
                        onClick={() => handleSort("responsiblePerson")}
                      >
                        {sortConfig?.key === "responsiblePerson" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <TextField
                      placeholder="İlgili Kişi Filtresi"
                      value={filters.responsiblePerson}
                      onChange={(e) =>
                        handleFilterChange("responsiblePerson", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.responsiblePerson && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("responsiblePerson")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      Proje
                      <IconButton
                        size="small"
                        onClick={() => handleSort("project")}
                      >
                        {sortConfig?.key === "project" &&
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon fontSize="small" />
                        ) : (
                          <ArrowDownIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                    <TextField
                      placeholder="Proje Filtresi"
                      value={filters.project}
                      onChange={(e) =>
                        handleFilterChange("project", e.target.value)
                      }
                      size="small"
                      sx={{ mt: 1, minWidth: 150 }}
                      InputProps={{
                        endAdornment: filters.project && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => clearFilter("project")}
                            >
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedIncidents.map((incident) => (
                  <TableRow key={incident.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {incident.serialNo}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(incident.status)}</TableCell>
                    <TableCell>{getPriorityChip(incident.priority)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {incident.creationDate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {incident.responsiblePerson}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {incident.project}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Detayları Görüntüle">
                        <IconButton
                          size="small"
                          onClick={() => handleIncidentClick(incident)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredIncidents.length}
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

        {/* Incident Detail Modal */}
        {selectedIncident && incidentDetailModal && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
            onClick={() => setIncidentDetailModal(false)}
          >
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                p: 3,
                maxWidth: 1200,
                width: "95%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  pb: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Olay Kayıt Detay
                </Typography>
                <IconButton onClick={() => setIncidentDetailModal(false)}>
                  <ClearIcon />
                </IconButton>
              </Box>

              {/* Content */}
              <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                {/* Details Section */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Detaylar
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Proje
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedIncident.project}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Seri No
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedIncident.serialNo}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Durum
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {getStatusChip(selectedIncident.status)}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Öncelik
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {getPriorityChip(selectedIncident.priority)}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Personel
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedIncident.responsiblePerson}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Açıklama
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedIncident.description}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Yüklenen Belgeler
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        -
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Notes Section */}
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Notlar
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "#1976d2",
                        color: "white",
                        textTransform: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Konumu Gör
                    </Button>
                  </Box>
                  {/* Add Note Input */}
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        border: 1,
                        borderColor: "#e0e0e0",
                        borderRadius: 1,
                        backgroundColor: "white",
                        p: 1,
                      }}
                    >
                      <TextField
                        placeholder="Not ekle"
                        fullWidth
                        variant="standard"
                        InputProps={{
                          disableUnderline: true,
                          sx: { px: 1 },
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        sx={{
                          color: "#1976d2",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                          },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Notes List */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {/* Note 1 */}
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="black"
                        >
                          Hüseyin Çetinkoz
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          20.09.2025 11:13
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="black" mb={1}>
                        test
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{
                            cursor: "pointer",
                            fontWeight: "medium",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Düzenle
                        </Typography>
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            cursor: "pointer",
                            fontWeight: "medium",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Sil
                        </Typography>
                      </Box>
                    </Box>

                    {/* Note 2 */}
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="black"
                        >
                          Hüseyin Çetinkoz
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          25.08.2025 11:11
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="black" mb={1}>
                        BASIMDA
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{
                            cursor: "pointer",
                            fontWeight: "medium",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Düzenle
                        </Typography>
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            cursor: "pointer",
                            fontWeight: "medium",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Sil
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Action History Logs */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    İşlem Geçmişi Logları
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                    <IconButton size="small">
                      <SearchIcon />
                    </IconButton>
                    <IconButton size="small">
                      <FilterIcon />
                    </IconButton>
                    <IconButton size="small">
                      <ViewListIcon />
                    </IconButton>
                  </Box>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Tarih</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          İşlem Türü
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          İlgili Kişi
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Değerler
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>25.08.2025 17:17</TableCell>
                        <TableCell>Düzenlendi</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <SearchIcon fontSize="small" />
                            Hüseyin Çetinkoz
                          </Box>
                        </TableCell>
                        <TableCell>Durum: İnceleniyor → Çözümlendi</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>25.08.2025 11:11</TableCell>
                        <TableCell>Oluşturuldu</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <SearchIcon fontSize="small" />
                            Hüseyin Çetinkoz
                          </Box>
                        </TableCell>
                        <TableCell>Not eklendi, Not İçeriği: BASIMDA</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>25.08.2025 11:05</TableCell>
                        <TableCell>Düzenlendi</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <SearchIcon fontSize="small" />
                            Hüseyin Çetinkoz
                          </Box>
                        </TableCell>
                        <TableCell>Durum: Açık → İnceleniyor</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>23.08.2025 22:04</TableCell>
                        <TableCell>Oluşturuldu</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <SearchIcon fontSize="small" />
                            Tanju Yaşar
                          </Box>
                        </TableCell>
                        <TableCell>
                          Durum: Açık, Öncelik: Düşük, Açıklama: omeksin or kodu
                          alınmış bilginiz olsun
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Sayfa Başına Satır 10
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1-4 toplam 4
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Incidents;
