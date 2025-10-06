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
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Today as TodayIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import NewPatrolModal from "./NewPatrolModal";

interface Patrol {
  id: string;
  taskName: string;
  project: string;
  personnel: string;
  repetition: string;
  startTime: string;
  endTime: string;
  color: string;
  type: "shared" | "individual"; // paylaşımlı veya tekil
  status: "pending" | "partial" | "completed" | "missed"; // bekleyen, kısmen, tamamlanmış, atılmış
  scheduledDate: string;
  completedDate?: string;
  controlPoints: string[];
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

const Patrols: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPatrol, setSelectedPatrol] = useState<Patrol | null>(null);
  const [patrolDetailModal, setPatrolDetailModal] = useState(false);
  const [patrolHistoryModal, setPatrolHistoryModal] = useState(false);
  const [patrolEditModal, setPatrolEditModal] = useState(false);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState(true);

  // Veritabanından devriye verilerini yükle
  useEffect(() => {
    loadPatrols();
  }, []);

  const loadPatrols = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from("patrols")
        .select(
          `
          *,
          project:projects(name),
          personnel:personnel(first_name, last_name),
          control_points:patrol_control_points(checkpoint:checkpoints(name))
        `
        )
        .order("scheduled_date", { ascending: false });

      if (error) {
        console.error("Error loading patrols:", error);
        return;
      }

      const formattedPatrols = (data || []).map((patrol: any) => ({
        id: patrol.id,
        taskName: patrol.task_name,
        project: patrol.project?.name || "Bilinmeyen Proje",
        personnel: patrol.personnel
          ? `${patrol.personnel.first_name} ${patrol.personnel.last_name}`
          : "Paylaşımlı Devriye",
        repetition: patrol.repetition,
        startTime: patrol.start_time,
        endTime: patrol.end_time,
        color: getStatusColor(patrol.status),
        type: patrol.type,
        status: patrol.status,
        scheduledDate: patrol.scheduled_date,
        completedDate: patrol.completed_date,
        controlPoints:
          patrol.control_points?.map((cp: any) => cp.checkpoint?.name) || [],
      }));

      setPatrols(formattedPatrols);
    } catch (error) {
      console.error("Error in loadPatrols:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4caf50";
      case "partial":
        return "#ff9800";
      case "missed":
        return "#f44336";
      case "pending":
        return "#2196f3";
      default:
        return "#2196f3";
    }
  };

  const [filters, setFilters] = useState({
    taskName: "",
    project: "",
    personnel: "",
    repetition: "",
    startTime: "",
    endTime: "",
  });

  const [filteredPatrols, setFilteredPatrols] = useState<Patrol[]>(patrols);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Patrol;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter patrols based on all filter criteria
  React.useEffect(() => {
    let filtered = patrols;

    if (filters.taskName) {
      filtered = filtered.filter((p) =>
        p.taskName.toLowerCase().includes(filters.taskName.toLowerCase())
      );
    }
    if (filters.project) {
      filtered = filtered.filter((p) =>
        p.project.toLowerCase().includes(filters.project.toLowerCase())
      );
    }
    if (filters.personnel) {
      filtered = filtered.filter((p) =>
        p.personnel.toLowerCase().includes(filters.personnel.toLowerCase())
      );
    }
    if (filters.repetition) {
      filtered = filtered.filter((p) =>
        p.repetition.toLowerCase().includes(filters.repetition.toLowerCase())
      );
    }
    if (filters.startTime) {
      filtered = filtered.filter((p) =>
        p.startTime.toLowerCase().includes(filters.startTime.toLowerCase())
      );
    }
    if (filters.endTime) {
      filtered = filtered.filter((p) =>
        p.endTime.toLowerCase().includes(filters.endTime.toLowerCase())
      );
    }

    setFilteredPatrols(filtered);
  }, [patrols, filters]);

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

  const handleSort = (key: keyof Patrol) => {
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

  const sortedPatrols = React.useMemo(() => {
    if (!sortConfig) return filteredPatrols;

    return [...filteredPatrols].sort((a, b) => {
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
  }, [filteredPatrols, sortConfig]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPatrols = sortedPatrols.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSavePatrol = (patrolData: any) => {
    const newPatrol: Patrol = {
      id: Date.now().toString(),
      taskName: patrolData.title,
      project: patrolData.project,
      personnel: patrolData.personnel || "Paylaşımlı Devriye",
      repetition: "Günlük",
      startTime: patrolData.startTime,
      endTime: patrolData.endTime,
      color: "#2196f3", // mavi - henüz vakti gelmeyen
      type: patrolData.personnel ? "individual" : "shared",
      status: "pending",
      scheduledDate: new Date().toISOString().split("T")[0],
      controlPoints: patrolData.controlPoints || [],
    };
    setPatrols([...patrols, newPatrol]);
  };

  // Calendar view data
  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const weekDates = ["15", "16", "17", "18", "19", "20", "21"];
  const timeSlots = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

  const getCalendarEvents = () => {
    const events: Array<{
      day: number;
      hour: number;
      text: string;
      time: string;
      color: string;
      patrol: Patrol | null;
    }> = [];

    // Her gün için patrol'ları kontrol et
    weekDays.forEach((day, dayIndex) => {
      // Her saat için patrol'ları kontrol et
      timeSlots.forEach((time, hourIndex) => {
        const hour = parseInt(time.split(":")[0]);
        const matchingPatrol = patrols.find((patrol) => {
          const patrolHour = parseInt(patrol.startTime.split(":")[0]);
          return patrolHour === hour;
        });

        if (matchingPatrol) {
          events.push({
            day: dayIndex,
            hour: hourIndex,
            text: matchingPatrol.taskName,
            time: matchingPatrol.startTime,
            color: matchingPatrol.color,
            patrol: matchingPatrol,
          });
        }
      });
    });

    return events;
  };

  const handlePatrolClick = (patrol: Patrol) => {
    setSelectedPatrol(patrol);
    setPatrolDetailModal(true);
  };

  const handleHistoryClick = () => {
    setPatrolDetailModal(false);
    setPatrolHistoryModal(true);
  };

  const handleEditClick = () => {
    setPatrolDetailModal(false);
    setPatrolEditModal(true);
  };

  const calendarEvents = getCalendarEvents();

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
          <Box display="flex" alignItems="center" gap={2}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
            >
              <Tab label="Tablo" />
              <Tab label="Takvim" />
            </Tabs>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              sx={{ bgcolor: "#1976d2" }}
            >
              YENİ
            </Button>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value="HAFTA" displayEmpty>
                <MenuItem value="HAFTA">HAFTA</MenuItem>
                <MenuItem value="GÜN">GÜN</MenuItem>
                <MenuItem value="AY">AY</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Main Content Panel */}
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Table View */}
          <TabPanel value={tabValue} index={0}>
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
              </Box>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        Görev Adı
                        <IconButton
                          size="small"
                          onClick={() => handleSort("taskName")}
                        >
                          {sortConfig?.key === "taskName" &&
                          sortConfig.direction === "asc" ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <TextField
                        placeholder="Görev Adı Filtresi"
                        value={filters.taskName}
                        onChange={(e) =>
                          handleFilterChange("taskName", e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1, minWidth: 150 }}
                        InputProps={{
                          endAdornment: filters.taskName && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => clearFilter("taskName")}
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        Personel
                        <IconButton
                          size="small"
                          onClick={() => handleSort("personnel")}
                        >
                          {sortConfig?.key === "personnel" &&
                          sortConfig.direction === "asc" ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <TextField
                        placeholder="Personel Filtresi"
                        value={filters.personnel}
                        onChange={(e) =>
                          handleFilterChange("personnel", e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1, minWidth: 150 }}
                        InputProps={{
                          endAdornment: filters.personnel && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => clearFilter("personnel")}
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
                        Tekrarlama
                        <IconButton
                          size="small"
                          onClick={() => handleSort("repetition")}
                        >
                          {sortConfig?.key === "repetition" &&
                          sortConfig.direction === "asc" ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <TextField
                        placeholder="Tekrarlama Filtresi"
                        value={filters.repetition}
                        onChange={(e) =>
                          handleFilterChange("repetition", e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1, minWidth: 150 }}
                        InputProps={{
                          endAdornment: filters.repetition && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => clearFilter("repetition")}
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
                        Başlangıç
                        <IconButton
                          size="small"
                          onClick={() => handleSort("startTime")}
                        >
                          {sortConfig?.key === "startTime" &&
                          sortConfig.direction === "asc" ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <TextField
                        placeholder="Başlangıç Filtresi"
                        value={filters.startTime}
                        onChange={(e) =>
                          handleFilterChange("startTime", e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1, minWidth: 150 }}
                        InputProps={{
                          endAdornment: filters.startTime && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => clearFilter("startTime")}
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
                        Bitiş
                        <IconButton
                          size="small"
                          onClick={() => handleSort("endTime")}
                        >
                          {sortConfig?.key === "endTime" &&
                          sortConfig.direction === "asc" ? (
                            <ArrowUpIcon fontSize="small" />
                          ) : (
                            <ArrowDownIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      <TextField
                        placeholder="Bitiş Filtresi"
                        value={filters.endTime}
                        onChange={(e) =>
                          handleFilterChange("endTime", e.target.value)
                        }
                        size="small"
                        sx={{ mt: 1, minWidth: 150 }}
                        InputProps={{
                          endAdornment: filters.endTime && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => clearFilter("endTime")}
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
                  {paginatedPatrols.map((patrol) => (
                    <TableRow key={patrol.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {patrol.taskName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {patrol.project}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PeopleIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="medium">
                            {patrol.personnel}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {patrol.repetition}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {patrol.startTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {patrol.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Yenile">
                            <IconButton size="small">
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Daha Fazla">
                            <IconButton size="small">
                              <MoreVertIcon fontSize="small" />
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
              rowsPerPageOptions={[10, 30, 50]}
              component="div"
              count={filteredPatrols.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Sayfa Başına Satır"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} toplam ${count}`
              }
            />
          </TabPanel>

          {/* Calendar View */}
          <TabPanel value={tabValue} index={1}>
            {/* Calendar Navigation */}
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
              <Button startIcon={<TodayIcon />} variant="outlined">
                Bugün
              </Button>
              <IconButton>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="bold">
                15-21 Eylül 2025
              </Typography>
              <IconButton>
                <NavigateNextIcon />
              </IconButton>
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1}>
                {/* Time column header */}
                <Grid item xs={1}>
                  <Box sx={{ height: 40 }} />
                  {timeSlots.map((time, index) => (
                    <Box
                      key={index}
                      sx={{
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        fontSize: "0.75rem",
                        color: "text.secondary",
                      }}
                    >
                      {time}
                    </Box>
                  ))}
                </Grid>

                {/* Days of the week */}
                {weekDays.map((day, dayIndex) => (
                  <Grid item xs key={day}>
                    <Box
                      sx={{
                        height: 40,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: 1,
                        borderColor: "divider",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {day}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {weekDates[dayIndex]}
                      </Typography>
                    </Box>

                    {/* Time slots for each day */}
                    {timeSlots.map((time, timeIndex) => {
                      const event = calendarEvents.find(
                        (e) => e.day === dayIndex && e.hour === timeIndex
                      );

                      return (
                        <Box
                          key={timeIndex}
                          onClick={() =>
                            event?.patrol && handlePatrolClick(event.patrol)
                          }
                          sx={{
                            height: 40,
                            border: "1px solid #e0e0e0",
                            borderTop: "none",
                            position: "relative",
                            backgroundColor: event ? event.color : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: event?.patrol ? "pointer" : "default",
                            "&:hover": {
                              backgroundColor: event ? event.color : "#f5f5f5",
                              opacity: event?.patrol ? 0.8 : 1,
                            },
                          }}
                        >
                          {event && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "0.7rem",
                                textAlign: "center",
                                p: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: "bold",
                                  lineHeight: 1,
                                  color: "white",
                                }}
                              >
                                {event.text}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.6rem",
                                  lineHeight: 1,
                                  color: "white",
                                }}
                              >
                                {event.time}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>
        </Paper>

        {/* New Patrol Modal */}
        <NewPatrolModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSave={handleSavePatrol}
        />

        {/* Patrol Detail Modal */}
        {selectedPatrol && patrolDetailModal && (
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
            onClick={() => setPatrolDetailModal(false)}
          >
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                p: 3,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
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
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: selectedPatrol.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedPatrol.taskName.split(" ")[1]?.substring(0, 2) ||
                      "DV"}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedPatrol.taskName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPatrol.scheduledDate} -{" "}
                      {selectedPatrol.type === "shared"
                        ? "Paylaşımlı Devriye"
                        : "Tekil Devriye"}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    title="Geçmiş"
                    onClick={handleHistoryClick}
                  >
                    <TodayIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    title="Düzenle"
                    onClick={handleEditClick}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <IconButton size="small" title="Kopyala">
                    <MoreVertIcon />
                  </IconButton>
                  <IconButton size="small" title="Sil">
                    <MoreVertIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setPatrolDetailModal(false)}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Content */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Devriye Detayları
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <TodayIcon color="action" />
                    <Typography variant="body2">
                      <strong>Zaman:</strong> {selectedPatrol.startTime} -{" "}
                      {selectedPatrol.endTime}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: selectedPatrol.color,
                      }}
                    />
                    <Typography variant="body2">
                      <strong>Durum:</strong>{" "}
                      {selectedPatrol.status === "pending"
                        ? "Bekliyor"
                        : selectedPatrol.status === "partial"
                        ? "Kısmen Tamamlanmış"
                        : selectedPatrol.status === "completed"
                        ? "Tamamlanmış"
                        : "Atılmış"}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <PeopleIcon color="action" />
                    <Typography variant="body2">
                      <strong>Personel:</strong> {selectedPatrol.personnel}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <MoreVertIcon color="action" />
                    <Typography variant="body2">
                      <strong>Proje:</strong> {selectedPatrol.project}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Control Points */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Kontrol Noktaları
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {selectedPatrol.controlPoints.map((point, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {point}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  pt: 2,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setPatrolDetailModal(false)}
                >
                  Kapat
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Patrol History Detail Modal */}
        {selectedPatrol && patrolHistoryModal && (
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
            onClick={() => setPatrolHistoryModal(false)}
          >
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                p: 3,
                maxWidth: 1000,
                width: "95%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={2}>
                  Devriye Geçmiş Detayı
                </Typography>

                {/* Patrol Info */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1" fontWeight="bold">
                      Adı: {selectedPatrol.taskName}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PeopleIcon fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {selectedPatrol.type === "shared"
                          ? "Paylaşımlı Devriye"
                          : "Tekil Devriye"}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2">
                    <strong>Başlangıç / Bitiş:</strong>{" "}
                    {selectedPatrol.scheduledDate} {selectedPatrol.startTime} /{" "}
                    {selectedPatrol.scheduledDate} {selectedPatrol.endTime}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">
                      <strong>Görev Durumu:</strong>
                    </Typography>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor:
                          selectedPatrol.status === "completed"
                            ? "#4caf50"
                            : selectedPatrol.status === "partial"
                            ? "#ff9800"
                            : selectedPatrol.status === "missed"
                            ? "#f44336"
                            : "#2196f3",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedPatrol.status === "completed"
                        ? "Başarılı"
                        : selectedPatrol.status === "partial"
                        ? "Kısmen Tamamlanmış"
                        : selectedPatrol.status === "missed"
                        ? "Atılmış"
                        : "Bekliyor"}
                    </Box>
                  </Box>
                </Box>

                {/* Personnel Section */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Genişlet
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ color: "#1976d2" }}
                    >
                      Personel
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">
                      {selectedPatrol.personnel}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Control Points Table */}
              <Box sx={{ mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Kontrol Noktası
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Tanımlanan Saat
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Taratılma Saati
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Konum</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Form</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Yönetici Bildirim
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPatrol.controlPoints.map((point, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">{point}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {selectedPatrol.scheduledDate}{" "}
                              {selectedPatrol.startTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: "#4caf50",
                                color: "white",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                display: "inline-block",
                              }}
                            >
                              Doğru zaman aralığında okutuldu
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  pt: 2,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setPatrolHistoryModal(false)}
                >
                  Kapat
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Patrol Edit Modal */}
        {selectedPatrol && patrolEditModal && (
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
            onClick={() => setPatrolEditModal(false)}
          >
            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: 2,
                p: 3,
                maxWidth: 800,
                width: "95%",
                maxHeight: "90vh",
                overflow: "auto",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={1}>
                  Devriye Planı Düzenle
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zaman çizelgesinde var olan bir şifti düzenliyorsunuz
                </Typography>
              </Box>

              {/* Form */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* General Information */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Genel Bilgiler
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      label="Başlık"
                      value={selectedPatrol.taskName}
                      fullWidth
                      size="small"
                    />
                    <FormControl fullWidth size="small">
                      <Select value={selectedPatrol.project}>
                        <MenuItem value={selectedPatrol.project}>
                          {selectedPatrol.project}
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Information Alert */}
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#e3f2fd",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="primary">
                        ℹ️ Personel seçilmediği için bu devriye projedeki tüm
                        personel için paylaşımlı devriyedir.
                      </Typography>
                    </Box>

                    <FormControl fullWidth size="small">
                      <Select value="" displayEmpty>
                        <MenuItem value="">Personel Seçiniz</MenuItem>
                        <MenuItem value="Tanju Yaşar">Tanju Yaşar</MenuItem>
                        <MenuItem value="Ahmet Yılmaz">Ahmet Yılmaz</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Time Range */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Devriye Planı Zaman Aralığı
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <TextField
                      label="Tarih"
                      value={selectedPatrol.scheduledDate}
                      size="small"
                      sx={{ minWidth: 150 }}
                      InputProps={{
                        endAdornment: <TodayIcon fontSize="small" />,
                      }}
                    />
                    <TextField
                      label="Başlangıç Saati"
                      value={selectedPatrol.startTime}
                      size="small"
                      sx={{ minWidth: 150 }}
                      InputProps={{
                        endAdornment: <TodayIcon fontSize="small" />,
                      }}
                    />
                    <TextField
                      label="Bitiş Saati"
                      value={selectedPatrol.endTime}
                      size="small"
                      sx={{ minWidth: 150 }}
                      InputProps={{
                        endAdornment: <TodayIcon fontSize="small" />,
                      }}
                    />
                    <TextField
                      label="Başlangıç Tolerans (Dakika)"
                      value="15"
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                    <TextField
                      label="Bitiş Tolerans (Dakika)"
                      value="15"
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  </Box>
                </Box>

                {/* Control Points */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Kontrol Noktaları
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <FormControl fullWidth size="small">
                      <Select value="" displayEmpty>
                        <MenuItem value="">Kontrol noktası seçiniz</MenuItem>
                        <MenuItem value="3KA PAZARLAMA">3KA PAZARLAMA</MenuItem>
                        <MenuItem value="DENİZ STATİK">DENİZ STATİK</MenuItem>
                        <MenuItem value="OMEKS">OMEKS</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ minWidth: 100 }}
                    >
                      Ekle
                    </Button>
                  </Box>

                  {/* Control Points List */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {selectedPatrol.controlPoints.map((point, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <MoreVertIcon
                          fontSize="small"
                          sx={{ cursor: "grab" }}
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {point}
                        </Typography>
                        <TextField
                          label="Kontrol Saati (En geç)"
                          size="small"
                          sx={{ minWidth: 200 }}
                          InputProps={{
                            endAdornment: <TodayIcon fontSize="small" />,
                          }}
                        />
                        <IconButton size="small" color="error">
                          <ClearIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Repetition Settings */}
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Tekrarlama Ayarları
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <input type="checkbox" defaultChecked />
                      <Typography variant="body2">Tekrarla</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Typography variant="body2" sx={{ minWidth: 150 }}>
                        Tekrarlama Sıklığı:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select value="Günlük">
                          <MenuItem value="Günlük">Günlük</MenuItem>
                          <MenuItem value="Haftalık">Haftalık</MenuItem>
                          <MenuItem value="Aylık">Aylık</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box>
                      <Typography variant="body2" mb={1}>
                        Günler:
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {["Pzt", "Sa", "Ça", "Pe", "Cu", "Cmt", "Pzr"].map(
                          (day, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 1,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                minWidth: 40,
                                textAlign: "center",
                                cursor: "pointer",
                                "&:hover": {
                                  backgroundColor: "#f5f5f5",
                                },
                              }}
                            >
                              <Typography variant="caption">{day}</Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  pt: 3,
                  borderTop: 1,
                  borderColor: "divider",
                  mt: 3,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setPatrolEditModal(false)}
                >
                  Vazgeç
                </Button>
                <Button variant="contained" sx={{ bgcolor: "#1976d2" }}>
                  KAYDET
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Patrols;
