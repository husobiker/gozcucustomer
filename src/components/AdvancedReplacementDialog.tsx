import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Card,
  CardContent,
  Snackbar,
} from "@mui/material";
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { useLeaveToSchedule } from "../hooks/useLeaveToSchedule";

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
}

interface LeaveDay {
  id: string;
  leave_id: string;
  personnel_id: string;
  leave_date: string;
  leave_type_code: string;
  replacement_type: "none" | "personnel" | "joker";
  start_date: string;
  end_date: string;
}

interface ReplacementPeriod {
  id: string;
  startDate: string;
  endDate: string;
  replacementType: "personnel" | "existing_joker" | "new_joker";
  personnelId?: string;
  jokerId?: string;
  jokerInfo?: {
    name: string;
    phone: string;
    id_number: string;
    company_name: string;
  };
}

interface JokerPersonnel {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  id_number: string;
  company_name: string;
  status: string;
  project_id: string;
  name: string; // Computed field: first_name + last_name
}

interface AdvancedReplacementDialogProps {
  open: boolean;
  onClose: () => void;
  leaveDay: LeaveDay | null;
  leaveStartDate?: string;
  leaveEndDate?: string;
  scheduleId?: string;
  onSuccess: (message: string) => void;
}

const AdvancedReplacementDialog: React.FC<AdvancedReplacementDialogProps> = ({
  open,
  onClose,
  leaveDay,
  leaveStartDate,
  leaveEndDate,
  scheduleId,
  onSuccess,
}) => {
  const { tenant } = useTenant();
  const { selectedProject } = useProject();
  const { assignReplacement, loading, error } = useLeaveToSchedule();

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [jokerPersonnel, setJokerPersonnel] = useState<JokerPersonnel[]>([]);
  const [replacementPeriods, setReplacementPeriods] = useState<
    ReplacementPeriod[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [leavePersonnel, setLeavePersonnel] = useState<{
    first_name: string;
    last_name: string;
  } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Tarih kısıtlama fonksiyonları
  const getMinStartDate = (periodId: string) => {
    if (!leaveDay || !leaveStartDate) return undefined;

    // İlk dönem için izin başlangıç tarihi
    const isFirstPeriod =
      replacementPeriods.findIndex((p) => p.id === periodId) === 0;
    if (isFirstPeriod) {
      return leaveStartDate;
    }

    // Sonraki dönemler için önceki dönemlerin bitiş tarihinden sonraki gün
    const currentPeriodIndex = replacementPeriods.findIndex(
      (p) => p.id === periodId
    );
    if (currentPeriodIndex > 0) {
      const previousPeriod = replacementPeriods[currentPeriodIndex - 1];
      if (previousPeriod.endDate) {
        const nextDay = new Date(previousPeriod.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay.toISOString().split("T")[0];
      }
    }

    return leaveStartDate;
  };

  const getMaxStartDate = (periodId: string) => {
    if (!leaveDay || !leaveEndDate) return undefined;

    // İlk dönem için izin bitiş tarihi
    const isFirstPeriod =
      replacementPeriods.findIndex((p) => p.id === periodId) === 0;
    if (isFirstPeriod) {
      return leaveEndDate;
    }

    // Sonraki dönemler için izin bitiş tarihi
    return leaveEndDate;
  };

  const getMaxEndDate = (periodId: string) => {
    if (!leaveDay || !leaveEndDate) return undefined;

    // Tüm dönemler için izin bitiş tarihi
    return leaveEndDate;
  };

  // Tarih çakışma kontrolü
  const checkDateConflict = (
    currentPeriodId: string,
    startDate: string,
    endDate: string
  ) => {
    if (!startDate || !endDate) return false;

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);

    // Diğer dönemlerle çakışma kontrolü
    return replacementPeriods.some((period) => {
      if (
        period.id === currentPeriodId ||
        !period.startDate ||
        !period.endDate
      ) {
        return false;
      }

      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);

      // Çakışma kontrolü: (currentStart <= periodEnd) && (currentEnd >= periodStart)
      return currentStart <= periodEnd && currentEnd >= periodStart;
    });
  };

  useEffect(() => {
    console.log("🚀 useEffect triggered:", { open, leaveDay: leaveDay?.id });
    if (open && leaveDay) {
      console.log("🚀 Starting data loading...");
      loadPersonnel();
      loadJokerPersonnel();
      loadLeavePersonnel();
      // Varsayılan olarak tüm izin süresi için tek bir dönem oluştur
      setReplacementPeriods([
        {
          id: "1",
          startDate: leaveDay.leave_date,
          endDate: leaveDay.leave_date,
          replacementType: "new_joker",
          jokerInfo: {
            name: "",
            phone: "",
            id_number: "",
            company_name: "",
          },
        },
      ]);
    }
  }, [open, leaveDay]);

  const loadPersonnel = async () => {
    try {
      console.log("🔍 Loading personnel for tenant:", tenant?.id);
      console.log("🔍 Selected project:", selectedProject?.name);
      console.log("🔍 Leave day personnel ID:", leaveDay?.personnel_id);

      if (!selectedProject) {
        console.error("❌ No project selected");
        setPersonnel([]);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("personnel")
        .select("id, first_name, last_name")
        .eq("tenant_id", tenant?.id)
        .eq("project_id", selectedProject.id) // Sidebar'da seçili projedeki personeller
        .neq("id", leaveDay?.personnel_id) // İzin alan personeli hariç tut
        .order("first_name");

      if (error) {
        console.error("❌ Personnel loading error:", error);
        console.error(
          "❌ Error details:",
          error.message,
          error.details,
          error.hint
        );
        throw error;
      }

      console.log("✅ Personnel loaded:", data);
      console.log("✅ Personnel count:", data?.length || 0);
      setPersonnel(data || []);
      console.log("✅ Personnel state updated:", data?.length || 0, "items");
    } catch (err) {
      console.error("❌ Error loading personnel:", err);
    }
  };

  const loadLeavePersonnel = async () => {
    try {
      if (!leaveDay?.personnel_id) return;

      const { data, error } = await supabaseAdmin
        .from("personnel")
        .select("first_name, last_name")
        .eq("id", leaveDay.personnel_id)
        .single();

      if (error) {
        console.error("Leave personnel loading error:", error);
        return;
      }

      setLeavePersonnel(data);
    } catch (err) {
      console.error("Error loading leave personnel:", err);
    }
  };

  const loadJokerPersonnel = async () => {
    try {
      console.log("🔍 Loading joker personnel for tenant:", tenant?.id);
      console.log("🔍 Selected project:", selectedProject?.name);

      if (!selectedProject) {
        console.error("❌ No project selected");
        setJokerPersonnel([]);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("joker_personnel")
        .select(
          "id, first_name, last_name, phone, id_number, company_name, status, project_id"
        )
        .eq("tenant_id", tenant?.id)
        .eq("project_id", selectedProject.id) // Sidebar'da seçili projedeki joker personeller
        .eq("status", "Aktif")
        .order("first_name");

      console.log("🔍 Joker personnel query result:", data);
      console.log("🔍 Joker personnel error:", error);

      if (error) {
        console.error("Joker personnel loading error:", error);
        console.error(
          "Error details:",
          error.message,
          error.details,
          error.hint
        );
        // Tablo yoksa boş array döndür
        if (
          error.message.includes('relation "joker_personnel" does not exist')
        ) {
          setJokerPersonnel([]);
          return;
        }
        throw error;
      }

      // name field'ını ekle
      const jokerPersonnelWithName = (data || []).map((joker) => ({
        ...joker,
        name:
          `${joker.first_name || ""} ${joker.last_name || ""}`.trim() ||
          "İsimsiz",
      }));

      console.log("✅ Joker personnel loaded:", jokerPersonnelWithName);
      console.log(
        "✅ Joker personnel count:",
        jokerPersonnelWithName?.length || 0
      );
      setJokerPersonnel(jokerPersonnelWithName);
      console.log(
        "✅ Joker personnel state updated:",
        data?.length || 0,
        "items"
      );
    } catch (err) {
      console.error("Error loading joker personnel:", err);
      setJokerPersonnel([]);
    }
  };

  const saveJokerPersonnel = async (jokerInfo: any) => {
    try {
      console.log("Saving new joker personnel:", jokerInfo);

      // Mevcut projeyi bul
      const { data: projects, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("tenant_id", tenant?.id)
        .limit(1);

      if (projectError || !projects?.[0]) {
        console.error("Project not found:", projectError);
        return null;
      }

      // Ad ve soyadı ayır
      const nameParts = jokerInfo.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data, error } = await supabaseAdmin
        .from("joker_personnel")
        .insert({
          first_name: firstName,
          last_name: lastName,
          phone: jokerInfo.phone,
          id_number: jokerInfo.id_number,
          company_name: jokerInfo.company_name,
          tenant_id: tenant?.id,
          project_id: projects[0].id,
          status: "Aktif",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Joker personnel save error:", error);
        throw error;
      }

      console.log("Joker personnel saved:", data);

      // Listeyi yenile
      await loadJokerPersonnel();

      return data;
    } catch (err) {
      console.error("Error saving joker personnel:", err);
      return null;
    }
  };

  const addReplacementPeriod = () => {
    let startDate = leaveStartDate || leaveDay?.leave_date || "";
    let endDate = leaveStartDate || leaveDay?.leave_date || "";

    // Eğer daha önce dönemler varsa, yeni dönem için uygun tarihleri hesapla
    if (replacementPeriods.length > 0 && leaveDay) {
      const lastPeriod = replacementPeriods[replacementPeriods.length - 1];
      if (lastPeriod.endDate) {
        // Son dönemin bitiş tarihinden sonraki gün
        const nextDay = new Date(lastPeriod.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        startDate = nextDay.toISOString().split("T")[0];
        endDate = nextDay.toISOString().split("T")[0];
      }
    }

    const newPeriod: ReplacementPeriod = {
      id: Date.now().toString(),
      startDate: startDate,
      endDate: endDate,
      replacementType: "new_joker",
      jokerInfo: {
        name: "",
        phone: "",
        id_number: "",
        company_name: "",
      },
    };
    setReplacementPeriods([...replacementPeriods, newPeriod]);
  };

  const removeReplacementPeriod = (id: string) => {
    setReplacementPeriods(replacementPeriods.filter((p) => p.id !== id));
  };

  const updateReplacementPeriod = (
    id: string,
    updates: Partial<ReplacementPeriod>
  ) => {
    setReplacementPeriods((periods) =>
      periods.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleSubmit = async () => {
    if (replacementPeriods.length === 0) {
      onSuccess("En az bir yerleştirme dönemi tanımlanmalıdır.");
      return;
    }

    setSubmitting(true);
    try {
      // Her dönem için yerleştirme yap
      for (const period of replacementPeriods) {
        if (period.replacementType === "personnel" && !period.personnelId) {
          onSuccess("Personel seçimi yapılmalıdır.");
          return;
        }

        if (period.replacementType === "existing_joker" && !period.jokerId) {
          onSuccess("Joker personel seçimi yapılmalıdır.");
          return;
        }

        if (period.replacementType === "new_joker" && !period.jokerInfo?.name) {
          onSuccess("Yeni joker personel bilgileri eksik.");
          return;
        }

        // Joker bilgilerini hazırla
        let jokerInfo: any = period.jokerInfo;
        if (period.replacementType === "existing_joker" && period.jokerId) {
          // Mevcut joker personel bilgilerini bul
          const existingJoker = jokerPersonnel.find(
            (j) => j.id === period.jokerId
          );
          if (existingJoker) {
            jokerInfo = existingJoker;
          }
        } else if (period.replacementType === "new_joker" && period.jokerInfo) {
          const savedJoker = await saveJokerPersonnel(period.jokerInfo);
          if (!savedJoker) {
            onSuccess("Joker personel kaydedilemedi.");
            return;
          }
          jokerInfo = savedJoker;
        }

        // Bu dönem için yerleştirme yap
        const result = await assignReplacement(
          leaveDay!.id,
          period.replacementType === "existing_joker" ||
            period.replacementType === "new_joker"
            ? "joker"
            : "personnel",
          {
            personnel_id: period.personnelId || undefined,
            joker_info: jokerInfo,
          },
          scheduleId || "",
          tenant?.id || "",
          period.startDate,
          period.endDate
        );

        if (!result.success) {
          onSuccess(result.message || "Yerleştirme yapılırken hata oluştu.");
          return;
        }
      }

      onSuccess("Tüm yerleştirmeler başarıyla tamamlandı.");
    } catch (err) {
      console.error("Error submitting replacements:", err);
      onSuccess(
        "Yerleştirme yapılırken hata oluştu: " + (err as Error).message
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!leaveDay) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentIcon />
          <Typography variant="h6">İzin Yerine Yerleştirme</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* İzin Detayları */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            İzin Detayları
          </Typography>
          <Alert severity="info" icon={<CalendarIcon />}>
            <Typography variant="body2">
              <strong>Tarih:</strong>{" "}
              {new Date(leaveDay.leave_date).toLocaleDateString("tr-TR")}
              <br />
              <strong>İzin Türü:</strong> {leaveDay.leave_type_code}
              <br />
              <strong>Personel:</strong>{" "}
              {leavePersonnel
                ? `${leavePersonnel.first_name} ${leavePersonnel.last_name}`
                : leaveDay.personnel_id}
            </Typography>
          </Alert>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Bu gün için personel veya joker yerleştirme yapmanız gerekiyor. İzin
            alan personelin yerine kim çalışacak?
          </Typography>
        </Alert>

        {/* Yerleştirme Dönemleri */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Yerleştirme Dönemleri
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addReplacementPeriod}
              variant="outlined"
              size="small"
            >
              Dönem Ekle
            </Button>
          </Box>

          {replacementPeriods.map((period, index) => (
            <Card key={period.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    Dönem {index + 1}
                  </Typography>
                  {replacementPeriods.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeReplacementPeriod(period.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  {/* Tarih Aralığı */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Başlangıç Tarihi"
                      type="date"
                      value={period.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;

                        // İzin tarihleri kontrolü
                        if (
                          newStartDate &&
                          leaveStartDate &&
                          newStartDate < leaveStartDate
                        ) {
                          setSnackbarMessage(
                            `Başlangıç tarihi izin başlangıç tarihinden (${leaveStartDate}) önce olamaz!`
                          );
                          setSnackbarOpen(true);
                          return;
                        }
                        if (
                          newStartDate &&
                          leaveEndDate &&
                          newStartDate > leaveEndDate
                        ) {
                          setSnackbarMessage(
                            `Başlangıç tarihi izin bitiş tarihinden (${leaveEndDate}) sonra olamaz!`
                          );
                          setSnackbarOpen(true);
                          return;
                        }

                        // Çakışma kontrolü
                        const hasConflict = checkDateConflict(
                          period.id,
                          newStartDate,
                          period.endDate
                        );
                        if (hasConflict) {
                          setSnackbarMessage(
                            "Bu tarih aralığı başka bir dönemle çakışıyor!"
                          );
                          setSnackbarOpen(true);
                          return;
                        }

                        updateReplacementPeriod(period.id, {
                          startDate: newStartDate,
                        });
                        // Başlangıç tarihi değiştiğinde bitiş tarihini sıfırla
                        if (
                          newStartDate &&
                          period.endDate &&
                          period.endDate < newStartDate
                        ) {
                          updateReplacementPeriod(period.id, {
                            endDate: "",
                          });
                        }
                      }}
                      fullWidth
                      size="small"
                      inputProps={{
                        min: getMinStartDate(period.id),
                        max: getMaxStartDate(period.id),
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: "#f1f5f9",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#64748b",
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Bitiş Tarihi"
                      type="date"
                      value={period.endDate}
                      onChange={(e) => {
                        const newEndDate = e.target.value;

                        // İzin tarihleri kontrolü
                        if (
                          newEndDate &&
                          leaveStartDate &&
                          newEndDate < leaveStartDate
                        ) {
                          setSnackbarMessage(
                            `Bitiş tarihi izin başlangıç tarihinden (${leaveStartDate}) önce olamaz!`
                          );
                          setSnackbarOpen(true);
                          return;
                        }
                        if (
                          newEndDate &&
                          leaveEndDate &&
                          newEndDate > leaveEndDate
                        ) {
                          setSnackbarMessage(
                            `Bitiş tarihi izin bitiş tarihinden (${leaveEndDate}) sonra olamaz!`
                          );
                          setSnackbarOpen(true);
                          return;
                        }

                        // Başlangıç tarihi kontrolü
                        if (
                          newEndDate &&
                          period.startDate &&
                          newEndDate < period.startDate
                        ) {
                          setSnackbarMessage(
                            "Bitiş tarihi başlangıç tarihinden önce olamaz!"
                          );
                          setSnackbarOpen(true);
                          return;
                        }

                        // Çakışma kontrolü
                        const hasConflict = checkDateConflict(
                          period.id,
                          period.startDate,
                          newEndDate
                        );
                        if (hasConflict) {
                          setSnackbarMessage(
                            "Bu tarih aralığı başka bir dönemle çakışıyor!"
                          );
                          setSnackbarOpen(true);
                          return;
                        }

                        updateReplacementPeriod(period.id, {
                          endDate: newEndDate,
                        });
                      }}
                      fullWidth
                      size="small"
                      inputProps={{
                        min: period.startDate || getMinStartDate(period.id),
                        max: getMaxEndDate(period.id),
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: "#f1f5f9",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#64748b",
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Grid>

                  {/* Yerleştirme Türü */}
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Yerleştirme Türü</InputLabel>
                      <Select
                        value={period.replacementType}
                        onChange={(e) =>
                          updateReplacementPeriod(period.id, {
                            replacementType: e.target.value as
                              | "personnel"
                              | "existing_joker"
                              | "new_joker",
                          })
                        }
                        label="Yerleştirme Türü"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "#f8fafc",
                            borderRadius: "8px",
                            "&:hover": {
                              backgroundColor: "#f1f5f9",
                            },
                            "&.Mui-focused": {
                              backgroundColor: "#ffffff",
                              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                            },
                          },
                          "& .MuiInputLabel-root": {
                            color: "#64748b",
                            fontWeight: 500,
                          },
                        }}
                      >
                        <MenuItem value="personnel">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <PersonIcon fontSize="small" />
                            <Typography>Kayıtlı Personel</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="existing_joker">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <AssignmentIcon fontSize="small" />
                            <Typography>Kayıtlı Joker</Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="new_joker">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <AssignmentIcon fontSize="small" />
                            <Typography>Yeni Joker</Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Personel Seçimi */}
                  {period.replacementType === "personnel" && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Personel Seçin</InputLabel>
                        <Select
                          value={period.personnelId || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              personnelId: e.target.value,
                            })
                          }
                          label="Personel Seçin"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        >
                          {personnel.map((person) => (
                            <MenuItem key={person.id} value={person.id}>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {person.first_name} {person.last_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ID: {person.id}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Kayıtlı Joker Seçimi */}
                  {period.replacementType === "existing_joker" && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Joker Personel Seçin</InputLabel>
                        <Select
                          value={period.jokerId || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              jokerId: e.target.value,
                            })
                          }
                          label="Joker Personel Seçin"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        >
                          {jokerPersonnel.map((joker) => (
                            <MenuItem key={joker.id} value={joker.id}>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {joker.first_name} {joker.last_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Firma: {joker.company_name || "Belirtilmemiş"}{" "}
                                  | Tel: {joker.phone || "Belirtilmemiş"}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Yeni Joker Bilgileri */}
                  {period.replacementType === "new_joker" && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Ad Soyad *"
                          value={period.jokerInfo?.name || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              jokerInfo: {
                                ...period.jokerInfo!,
                                name: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Telefon *"
                          value={period.jokerInfo?.phone || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              jokerInfo: {
                                ...period.jokerInfo!,
                                phone: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="TC Kimlik No *"
                          value={period.jokerInfo?.id_number || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              jokerInfo: {
                                ...period.jokerInfo!,
                                id_number: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Firma Adı"
                          value={period.jokerInfo?.company_name || ""}
                          onChange={(e) =>
                            updateReplacementPeriod(period.id, {
                              jokerInfo: {
                                ...period.jokerInfo!,
                                company_name: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#f8fafc",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "#f1f5f9",
                              },
                              "&.Mui-focused": {
                                backgroundColor: "#ffffff",
                                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#64748b",
                              fontWeight: 500,
                            },
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading}
          startIcon={
            submitting ? <CircularProgress size={20} /> : <CheckIcon />
          }
        >
          {submitting ? "Yerleştiriliyor..." : "Yerleştir"}
        </Button>
      </DialogActions>

      {/* Snackbar for validation messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Dialog>
  );
};

export default AdvancedReplacementDialog;
