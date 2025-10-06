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
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useLeaveToSchedule } from "../hooks/useLeaveToSchedule";

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface LeaveDay {
  id: string;
  leave_id: string;
  personnel_id: string;
  leave_date: string;
  leave_type_code: string;
  replacement_type: "none" | "personnel" | "joker";
}

interface ReplacementDialogProps {
  open: boolean;
  onClose: () => void;
  leaveDay: LeaveDay | null;
  onSuccess: (message: string) => void;
}

const ReplacementDialog: React.FC<ReplacementDialogProps> = ({
  open,
  onClose,
  leaveDay,
  onSuccess,
}) => {
  const { tenant } = useTenant();
  const { assignReplacement } = useLeaveToSchedule();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [replacementType, setReplacementType] = useState<"personnel" | "joker">(
    "personnel"
  );
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [jokerInfo, setJokerInfo] = useState({
    name: "",
    phone: "",
    id_number: "",
    company_name: "",
  });

  // Personel listesini getir
  const fetchPersonnel = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("personnel")
        .select("id, first_name, last_name, employee_id")
        .eq("tenant_id", tenant?.id)
        .eq("status", "Aktif")
        .neq("id", leaveDay?.personnel_id) // İzin alan personeli hariç tut
        .order("first_name");

      if (error) throw error;
      setPersonnel(data || []);
    } catch (err) {
      console.error("Error fetching personnel:", err);
      setError("Personel listesi yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    if (open && leaveDay) {
      fetchPersonnel();
      setReplacementType("personnel");
      setSelectedPersonnel("");
      setJokerInfo({
        name: "",
        phone: "",
        id_number: "",
        company_name: "",
      });
      setError(null);
    }
  }, [open, leaveDay, tenant?.id]);

  // Yerleştirme yap
  const handleSubmit = async () => {
    if (!leaveDay) return;

    if (replacementType === "personnel" && !selectedPersonnel) {
      setError("Lütfen bir personel seçin");
      return;
    }

    if (replacementType === "joker") {
      if (!jokerInfo.name || !jokerInfo.phone || !jokerInfo.id_number) {
        setError("Lütfen joker personel bilgilerini doldurun");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const replacementData = {
        personnel_id:
          replacementType === "personnel" ? selectedPersonnel : undefined,
        joker_info: replacementType === "joker" ? jokerInfo : undefined,
      };

      const result = await assignReplacement(
        leaveDay.id,
        replacementType,
        replacementData,
        "current-schedule-id", // TODO: Gerçek schedule ID'si alınacak
        tenant?.id || ""
      );

      if (result?.success) {
        onSuccess(result.message);
        onClose();
      } else {
        setError(result?.message || "Yerleştirme yapılırken hata oluştu");
      }
    } catch (err) {
      console.error("Error assigning replacement:", err);
      setError("Yerleştirme yapılırken hata oluştu: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!leaveDay) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            İzin Yerine Yerleştirme
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* İzin Bilgileri */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>İzin Detayları:</strong>
            <br />• Tarih:{" "}
            {new Date(leaveDay.leave_date).toLocaleDateString("tr-TR")}
            <br />• İzin Türü: {leaveDay.leave_type_code}
            <br />• Personel: {leaveDay.personnel_id}
          </Typography>
        </Alert>

        {/* Uyarı */}
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="body2">
            Bu gün için personel veya joker yerleştirme yapmanız gerekiyor. İzin
            alan personelin yerine kim çalışacak?
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Yerleştirme Türü */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Yerleştirme Türü</InputLabel>
              <Select
                value={replacementType}
                onChange={(e) =>
                  setReplacementType(e.target.value as "personnel" | "joker")
                }
                label="Yerleştirme Türü"
              >
                <MenuItem value="personnel">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon />
                    <Typography>Kayıtlı Personel</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="joker">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AssignmentIcon />
                    <Typography>Joker Personel</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Kayıtlı Personel Seçimi */}
          {replacementType === "personnel" && (
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Personel Seçin</InputLabel>
                <Select
                  value={selectedPersonnel}
                  onChange={(e) => setSelectedPersonnel(e.target.value)}
                  label="Personel Seçin"
                >
                  {personnel.map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonIcon fontSize="small" />
                        <Typography>
                          {person.first_name} {person.last_name}
                        </Typography>
                        <Chip
                          label={person.employee_id}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Joker Personel Bilgileri */}
          {replacementType === "joker" && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Ad Soyad"
                  value={jokerInfo.name}
                  onChange={(e) =>
                    setJokerInfo({ ...jokerInfo, name: e.target.value })
                  }
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefon"
                  value={jokerInfo.phone}
                  onChange={(e) =>
                    setJokerInfo({ ...jokerInfo, phone: e.target.value })
                  }
                  fullWidth
                  required
                  placeholder="0555 123 45 67"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="TC Kimlik No"
                  value={jokerInfo.id_number}
                  onChange={(e) =>
                    setJokerInfo({ ...jokerInfo, id_number: e.target.value })
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 11 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Firma Adı"
                  value={jokerInfo.company_name}
                  onChange={(e) =>
                    setJokerInfo({ ...jokerInfo, company_name: e.target.value })
                  }
                  fullWidth
                  placeholder="ABC Güvenlik Şirketi"
                />
              </Grid>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={
            submitting ? <CircularProgress size={20} /> : <CheckIcon />
          }
        >
          {submitting ? "Yerleştiriliyor..." : "Yerleştir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReplacementDialog;
