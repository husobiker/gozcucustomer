import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stack,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AttachFile as AttachFileIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
// Date pickers yerine basit HTML input kullanacağız
import { supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import AdvancedReplacementDialog from "./AdvancedReplacementDialog";
import { useLeaveToSchedule } from "../hooks/useLeaveToSchedule";

interface LeaveType {
  id: string;
  code: string;
  name: string;
  description: string;
  is_paid: boolean;
  color: string;
  max_days_per_year?: number;
  requires_document?: boolean;
}

interface PersonnelLeave {
  id: string;
  personnel_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  operation_notes: string;
  document_url?: string;
  document_name?: string;
  document_type?: string;
  document_size?: number;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  leave_type: LeaveType;
}

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
  employee_id?: string;
}

interface LeaveManagementProps {
  personnel: Personnel;
  onClose: () => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({
  personnel,
  onClose,
}) => {
  const { tenant } = useTenant();
  const { syncLeaveToSchedule, assignReplacement } = useLeaveToSchedule();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaves, setLeaves] = useState<PersonnelLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Replacement dialog state
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [selectedLeaveDay, setSelectedLeaveDay] = useState<any>(null);
  const [selectedLeaveStartDate, setSelectedLeaveStartDate] =
    useState<string>("");
  const [selectedLeaveEndDate, setSelectedLeaveEndDate] = useState<string>("");
  const [currentScheduleId, setCurrentScheduleId] = useState<string>("");

  // Yeni izin formu
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [operationNotes, setOperationNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Belge yükleme
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Düzenleme ve silme
  const [editingLeave, setEditingLeave] = useState<PersonnelLeave | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<PersonnelLeave | null>(
    null
  );

  // Belge görüntüleme
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentToView, setDocumentToView] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // İzin detayları
  const [showLeaveDetailsDialog, setShowLeaveDetailsDialog] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<any>(null);

  // İzin türlerini getir
  const fetchLeaveTypes = async () => {
    try {
      console.log("Fetching leave types for tenant:", tenant?.id);

      const { data, error } = await supabaseAdmin
        .from("leave_types")
        .select("*")
        .eq("tenant_id", tenant?.id)
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Leave types fetched:", data);
      setLeaveTypes(data || []);

      if (!data || data.length === 0) {
        console.warn("No leave types found for tenant:", tenant?.id);
        setError("İzin türleri bulunamadı. Lütfen admin ile iletişime geçin.");
      }
    } catch (err) {
      console.error("Error fetching leave types:", err);
      setError(
        "İzin türleri yüklenirken hata oluştu: " + (err as Error).message
      );
    }
  };

  // Personel izinlerini getir
  const fetchLeaves = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("personnel_leaves")
        .select(
          `
          *,
          leave_type:leave_types(*)
        `
        )
        .eq("personnel_id", personnel.id)
        .eq("tenant_id", tenant?.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setLeaves(data || []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError("İzinler yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLeaveTypes(), fetchLeaves()]);
      setLoading(false);
    };
    loadData();
  }, [personnel.id, tenant?.id]);

  // İzin hesapla
  const calculateTotalDays = (start: Date | null, end: Date | null): number => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Belge yükle
  const uploadDocument = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);

      // Dosya adını güvenli hale getir
      const fileName = `${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;

      // Supabase Storage'a yükle
      const { data, error } = await supabaseAdmin.storage
        .from("leave-documents")
        .upload(`leave-docs/${fileName}`, file);

      if (error) throw error;

      // Public URL al
      const { data: urlData } = supabaseAdmin.storage
        .from("leave-documents")
        .getPublicUrl(`leave-docs/${fileName}`);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("Belge yüklenirken hata oluştu: " + (err as Error).message);
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // İzin düzenleme başlat
  const handleEditLeave = (leave: PersonnelLeave) => {
    setEditingLeave(leave);
    setSelectedLeaveType(leave.leave_type_id);
    setStartDate(new Date(leave.start_date));
    setEndDate(new Date(leave.end_date));
    setReason(leave.reason);
    setOperationNotes(leave.operation_notes);
    setOpenLeaveDialog(true);
  };

  // İzin silme başlat
  const handleDeleteLeave = (leave: PersonnelLeave) => {
    setLeaveToDelete(leave);
    setDeleteDialogOpen(true);
  };

  const handleShowLeaveDetails = async (leave: PersonnelLeave) => {
    try {
      console.log("🔍 Fetching leave details for leave ID:", leave.id);

      // İzin detaylarını getir
      const { data: leaveDays, error: leaveDaysError } = await supabaseAdmin
        .from("leave_days")
        .select("*")
        .eq("leave_id", leave.id);

      console.log("🔍 Leave days query result:", { leaveDays, leaveDaysError });

      if (leaveDaysError) {
        console.error("Error fetching leave details:", leaveDaysError);
        setError(
          `İzin detayları yüklenirken hata oluştu: ${leaveDaysError.message}`
        );
        return;
      }

      // Her leave_day için duty_assignments sorgusu yap
      const leaveDaysWithAssignments = [];
      for (const leaveDay of leaveDays || []) {
        const { data: assignments, error: assignmentsError } =
          await supabaseAdmin
            .from("duty_assignments")
            .select(
              `
            *,
            joker_personnel(*)
          `
            )
            .eq("personnel_id", leaveDay.personnel_id)
            .eq("duty_date", leaveDay.leave_date)
            .eq("is_joker", true);

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
        }

        leaveDaysWithAssignments.push({
          ...leaveDay,
          duty_assignments: assignments || [],
        });
      }

      const detailsData = {
        leave,
        leaveDays: leaveDaysWithAssignments,
      };
      console.log("🔍 Setting selectedLeaveDetails:", detailsData);
      setSelectedLeaveDetails(detailsData);
      console.log("🔍 Setting showLeaveDetailsDialog to true");
      setShowLeaveDetailsDialog(true);
      console.log("🔍 Dialog açıldı ve veri yüklendi");
      console.log("🔍 Final selectedLeaveDetails:", detailsData);
    } catch (error) {
      console.error("Error showing leave details:", error);
      setError(
        `İzin detayları yüklenirken hata oluştu: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    }
  };

  // İzin silme onayla
  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;

    try {
      setLoading(true);

      // Önce leave_days kayıtlarını al (joker assignment'larını silmek için)
      const { data: leaveDays, error: daysSelectError } = await supabaseAdmin
        .from("leave_days")
        .select("personnel_id, leave_date")
        .eq("leave_id", leaveToDelete.id);

      if (daysSelectError) throw daysSelectError;

      // Joker assignment'larını sil (is_joker = true olan kayıtları)
      if (leaveDays && leaveDays.length > 0) {
        for (const leaveDay of leaveDays) {
          const { error: assignmentError } = await supabaseAdmin
            .from("duty_assignments")
            .delete()
            .eq("personnel_id", leaveDay.personnel_id)
            .eq("duty_date", leaveDay.leave_date)
            .eq("is_joker", true);

          if (assignmentError) {
            console.error("Error deleting joker assignments:", assignmentError);
            // Hata olsa da devam et
          }
        }
      }

      // leave_days kayıtlarını sil
      const { error: daysError } = await supabaseAdmin
        .from("leave_days")
        .delete()
        .eq("leave_id", leaveToDelete.id);

      if (daysError) throw daysError;

      // Sonra personnel_leaves kaydını sil
      const { error: leaveError } = await supabaseAdmin
        .from("personnel_leaves")
        .delete()
        .eq("id", leaveToDelete.id);

      if (leaveError) throw leaveError;

      // Başarılı
      setDeleteDialogOpen(false);
      setLeaveToDelete(null);
      setError(
        "İzin ve joker yerleştirmeleri başarıyla silindi. Personel tekrar aktif hale geldi."
      );

      // Listeyi yenile
      await fetchLeaves();
    } catch (err) {
      console.error("Error deleting leave:", err);
      setError("İzin silinirken hata oluştu: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Belge görüntüleme
  const handleViewDocument = (leave: PersonnelLeave) => {
    if (leave.document_url) {
      setDocumentToView({
        url: leave.document_url,
        name: leave.document_name || "Belge",
      });
      setDocumentViewerOpen(true);
    }
  };

  // İzin kaydet
  const handleSubmitLeave = async () => {
    if (!selectedLeaveType || !startDate || !endDate) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    if (endDate < startDate) {
      setError("Bitiş tarihi başlangıç tarihinden önce olamaz");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const totalDays = calculateTotalDays(startDate, endDate);

      // Seçilen izin türünü bul
      const selectedLeaveTypeData = leaveTypes.find(
        (lt) => lt.id === selectedLeaveType
      );

      // Belge yükle (eğer gerekliyse ve dosya seçildiyse)
      let documentUrl = null;
      let documentName = null;
      let documentType = null;
      let documentSize = null;

      // Belge yükle (eğer dosya seçildiyse)
      if (selectedFile) {
        documentUrl = await uploadDocument(selectedFile);
        if (!documentUrl) {
          setError("Belge yüklenemedi. Lütfen tekrar deneyin.");
          return;
        }
        documentName = selectedFile.name;
        documentType = selectedFile.type;
        documentSize = selectedFile.size;
      }

      // İzin kaydını oluştur veya güncelle
      let leaveData;
      if (editingLeave) {
        // Güncelleme
        const { data, error: leaveError } = await supabaseAdmin
          .from("personnel_leaves")
          .update({
            leave_type_id: selectedLeaveType,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            total_days: totalDays,
            reason: reason,
            operation_notes: operationNotes,
            document_url: documentUrl,
            document_name: documentName,
            document_type: documentType,
            document_size: documentSize,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingLeave.id)
          .select()
          .single();

        if (leaveError) throw leaveError;
        leaveData = data;
      } else {
        // Yeni kayıt
        const { data, error: leaveError } = await supabaseAdmin
          .from("personnel_leaves")
          .insert({
            personnel_id: personnel.id,
            leave_type_id: selectedLeaveType,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            total_days: totalDays,
            status: "approved", // Admin tarafından girildiği için otomatik onaylı
            reason: reason,
            operation_notes: operationNotes,
            document_url: documentUrl,
            document_name: documentName,
            document_type: documentType,
            document_size: documentSize,
            tenant_id: tenant?.id,
            created_by: (await supabaseAdmin.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (leaveError) throw leaveError;
        leaveData = data;
      }

      // Her gün için leave_days kaydı oluştur (sadece yeni kayıt için)
      if (!editingLeave) {
        const leaveDays = [];
        const currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);

        while (currentDate <= endDateObj) {
          const leaveType = leaveTypes.find(
            (lt) => lt.id === selectedLeaveType
          );

          console.log("🔍 Creating leave day:", {
            leave_id: leaveData.id,
            personnel_id: personnel.id,
            leave_date: currentDate.toISOString().split("T")[0],
            leave_type_code: leaveType?.code || "",
            leave_type_name: leaveType?.name || "",
          });

          leaveDays.push({
            leave_id: leaveData.id,
            personnel_id: personnel.id,
            leave_date: currentDate.toISOString().split("T")[0],
            leave_type_code: leaveType?.code || "",
            is_weekend:
              currentDate.getDay() === 0 || currentDate.getDay() === 6,
            replacement_type: "none", // Başlangıçta hiçbiri
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        const { error: daysError } = await supabaseAdmin
          .from("leave_days")
          .insert(leaveDays);

        if (daysError) throw daysError;
      }

      // Başarılı
      setOpenLeaveDialog(false);
      setSelectedLeaveType("");
      setStartDate(null);
      setEndDate(null);
      setReason("");
      setOperationNotes("");
      setSelectedFile(null);
      setEditingLeave(null);

      // Listeyi yenile
      await fetchLeaves();

      // Aktif schedule'ı bul (en yeni olanı)
      const { data: schedulesList, error: scheduleError } = await supabaseAdmin
        .from("duty_schedules")
        .select("id, year, month")
        .eq("tenant_id", tenant?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const schedules = schedulesList?.[0];

      if (scheduleError || !schedules) {
        console.error("Aktif schedule bulunamadı:", scheduleError);
        setError(
          "Aktif nöbet çizelgesi bulunamadı. Lütfen admin ile iletişime geçin."
        );
        return;
      }

      console.log("Aktif schedule kullanılıyor:", schedules);

      // Nöbet çizelgesine yansıt
      console.log("Schedule ID:", schedules?.id);
      console.log("Leave ID:", leaveData.id);
      console.log("Tenant ID:", tenant?.id);

      // Schedule ID'yi state'e kaydet
      setCurrentScheduleId(schedules?.id || "");

      const scheduleResult = await syncLeaveToSchedule(
        leaveData.id,
        schedules?.id || "",
        tenant?.id || ""
      );

      console.log("Schedule result:", scheduleResult);

      if (scheduleResult?.success) {
        // İlk izin günü için yerleştirme dialog'unu aç
        const { data: firstLeaveDay } = await supabaseAdmin
          .from("leave_days")
          .select("*")
          .eq("leave_id", leaveData.id)
          .order("leave_date")
          .limit(1)
          .single();

        if (firstLeaveDay) {
          setSelectedLeaveDay(firstLeaveDay);
          setSelectedLeaveStartDate(startDate.toISOString().split("T")[0]);
          setSelectedLeaveEndDate(endDate.toISOString().split("T")[0]);
          setReplacementDialogOpen(true);
        }

        setError(
          `✅ İzin başarıyla kaydedildi ve nöbet çizelgesine yansıtıldı! ${totalDays} günlük izin ${startDate.toLocaleDateString(
            "tr-TR"
          )} - ${endDate.toLocaleDateString("tr-TR")} tarihleri arasında.`
        );
      } else {
        setError(
          `✅ İzin başarıyla kaydedildi! ${totalDays} günlük izin ${startDate.toLocaleDateString(
            "tr-TR"
          )} - ${endDate.toLocaleDateString(
            "tr-TR"
          )} tarihleri arasında. Şimdi nöbet çizelgesinde bu günler için personel veya joker ataması yapmanız gerekiyor.`
        );
      }
    } catch (err) {
      console.error("Error saving leave:", err);
      setError("İzin kaydedilirken hata oluştu: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // İzin durumu rengi
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  // İzin durumu metni
  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Onaylandı";
      case "pending":
        return "Beklemede";
      case "rejected":
        return "Reddedildi";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          İzin Yönetimi - {personnel.first_name} {personnel.last_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenLeaveDialog(true)}
          sx={{ bgcolor: "#1976d2" }}
        >
          Yeni İzin Ekle
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity={error.includes("✅") ? "success" : "error"}
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* İzin Geçmişi */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          İzin Geçmişi
        </Typography>

        {leaves.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CalendarIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              Henüz izin kaydı bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              İlk izin kaydını eklemek için "Yeni İzin Ekle" butonuna tıklayın
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>İzin Türü</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Gün Sayısı</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Sebep</TableCell>
                  <TableCell>Operasyon Notu</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Chip
                        label={leave.leave_type.name}
                        size="small"
                        sx={{
                          bgcolor: leave.leave_type.color,
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.end_date).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {leave.total_days} gün
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(leave.status)}
                        color={getStatusColor(leave.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {leave.reason || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {leave.operation_notes || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {leave.document_url && (
                          <Tooltip title="Belgeyi Görüntüle">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocument(leave)}
                              color="info"
                            >
                              <AttachFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="İzin Detayları">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("🔍 Bilgi ikonuna tıklandı:", leave);
                              console.log(
                                "🔍 handleShowLeaveDetails fonksiyonu:",
                                typeof handleShowLeaveDetails
                              );
                              console.log(
                                "🔍 Current state - showLeaveDetailsDialog:",
                                showLeaveDetailsDialog
                              );
                              console.log(
                                "🔍 Current state - selectedLeaveDetails:",
                                selectedLeaveDetails
                              );
                              try {
                                handleShowLeaveDetails(leave);
                              } catch (error) {
                                console.error("🔍 Handler hatası:", error);
                              }
                            }}
                            color="info"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleEditLeave(leave)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLeave(leave)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Yeni İzin Dialog */}
      <Dialog
        open={openLeaveDialog}
        onClose={() => setOpenLeaveDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {editingLeave ? "İzin Düzenle" : "Yeni İzin Ekle"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>İzin Türü</InputLabel>
                <Select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  label="İzin Türü"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
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
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: type.color,
                            borderRadius: "50%",
                          }}
                        />
                        <Typography>{type.name}</Typography>
                        {type.is_paid && (
                          <Chip label="Ücretli" size="small" color="success" />
                        )}
                        {type.requires_document && (
                          <Chip
                            label="Belge Önerilir"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => {
                  const newStartDate = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  setStartDate(newStartDate);
                  // Başlangıç tarihi değiştiğinde bitiş tarihini sıfırla
                  if (newStartDate && endDate && endDate < newStartDate) {
                    setEndDate(null);
                  }
                }}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
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
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 14px",
                    fontSize: "0.95rem",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="Bitiş Tarihi"
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                fullWidth
                required
                inputProps={{
                  min: startDate
                    ? startDate.toISOString().split("T")[0]
                    : undefined,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
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
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 14px",
                    fontSize: "0.95rem",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="İzin Sebebi"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="İzin sebebini açıklayın..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
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
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 14px",
                    fontSize: "0.95rem",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Operasyon Notu"
                value={operationNotes}
                onChange={(e) => setOperationNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Operasyon ekibi için notlar..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
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
                  "& .MuiOutlinedInput-input": {
                    padding: "12px 14px",
                    fontSize: "0.95rem",
                  },
                }}
              />
            </Grid>

            {/* Belge Yükleme */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Belge Yükle (Opsiyonel)
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  İsteğe bağlı olarak belge yükleyebilirsiniz (PDF, JPG, PNG)
                  {leaveTypes.find((lt) => lt.id === selectedLeaveType)
                    ?.requires_document && (
                    <span style={{ color: "#ff9800", fontWeight: "bold" }}>
                      {" "}
                      - Bu izin türü için belge önerilir
                    </span>
                  )}
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Dosya boyutu kontrolü (5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setError("Dosya boyutu 5MB'dan büyük olamaz.");
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                  style={{ display: "none" }}
                  id="document-upload"
                />
                <label htmlFor="document-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AssignmentIcon />}
                    sx={{ mr: 2 }}
                  >
                    Belge Seç
                  </Button>
                </label>
                {selectedFile && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`${selectedFile.name} (${(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)} MB)`}
                      onDelete={() => setSelectedFile(null)}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            {startDate && endDate && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<CalendarIcon />}>
                  <Typography variant="body2">
                    <strong>Toplam İzin Süresi:</strong>{" "}
                    {calculateTotalDays(startDate, endDate)} gün
                    <br />
                    <strong>Tarih Aralığı:</strong>{" "}
                    {startDate.toLocaleDateString("tr-TR")} -{" "}
                    {endDate.toLocaleDateString("tr-TR")}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenLeaveDialog(false);
              setEditingLeave(null);
              setSelectedLeaveType("");
              setStartDate(null);
              setEndDate(null);
              setReason("");
              setOperationNotes("");
              setSelectedFile(null);
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmitLeave}
            variant="contained"
            disabled={
              submitting || !selectedLeaveType || !startDate || !endDate
            }
            startIcon={
              submitting ? (
                <CircularProgress size={20} />
              ) : editingLeave ? (
                <EditIcon />
              ) : (
                <CheckIcon />
              )
            }
          >
            {submitting
              ? "Kaydediliyor..."
              : editingLeave
              ? "Güncelle"
              : "İzni Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Replacement Dialog */}
      <AdvancedReplacementDialog
        open={replacementDialogOpen}
        onClose={() => {
          setReplacementDialogOpen(false);
          setSelectedLeaveDay(null);
          setSelectedLeaveStartDate("");
          setSelectedLeaveEndDate("");
        }}
        leaveDay={selectedLeaveDay}
        leaveStartDate={selectedLeaveStartDate}
        leaveEndDate={selectedLeaveEndDate}
        scheduleId={currentScheduleId}
        onSuccess={(message) => {
          setSuccess(message);
          setReplacementDialogOpen(false);
          setSelectedLeaveDay(null);
          setSelectedLeaveStartDate("");
          setSelectedLeaveEndDate("");
          fetchLeaves(); // Listeyi yenile
        }}
      />

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            İzin Silme Onayı
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Bu izni silmek istediğinizden emin misiniz?
          </Typography>
          {leaveToDelete && (
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                İzin Detayları:
              </Typography>
              <Typography variant="body2">
                • İzin Türü: {leaveToDelete.leave_type.name}
              </Typography>
              <Typography variant="body2">
                • Tarih:{" "}
                {new Date(leaveToDelete.start_date).toLocaleDateString("tr-TR")}{" "}
                - {new Date(leaveToDelete.end_date).toLocaleDateString("tr-TR")}
              </Typography>
              <Typography variant="body2">
                • Gün Sayısı: {leaveToDelete.total_days} gün
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bu işlem geri alınamaz. İzin ve ilgili tüm veriler silinecektir.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button
            onClick={confirmDeleteLeave}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {loading ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Belge Görüntüleme Dialog */}
      <Dialog
        open={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AttachFileIcon />
            <Typography variant="h6">
              {documentToView?.name || "Belge"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {documentToView && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              {documentToView.url.endsWith(".pdf") ? (
                <iframe
                  src={documentToView.url}
                  width="100%"
                  height="600px"
                  style={{ border: "none" }}
                  title={documentToView.name}
                />
              ) : (
                <img
                  src={documentToView.url}
                  alt={documentToView.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "600px",
                    objectFit: "contain",
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentViewerOpen(false)}>Kapat</Button>
          {documentToView && (
            <Button
              variant="contained"
              onClick={() => window.open(documentToView.url, "_blank")}
              startIcon={<VisibilityIcon />}
            >
              Yeni Sekmede Aç
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* İzin Detayları Dialog */}
      <Dialog
        open={showLeaveDetailsDialog}
        onClose={() => {
          setShowLeaveDetailsDialog(false);
          setSelectedLeaveDetails(null);
        }}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 9999,
          "& .MuiDialog-paper": {
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            İzin Detayları
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: "400px" }}>
          {selectedLeaveDetails ? (
            <Box>
              {/* İzin Bilgileri */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    İzin Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        İzin Türü:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedLeaveDetails.leave.leave_type?.name ||
                          "Bilinmeyen"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Durum:
                      </Typography>
                      <Chip
                        label={getStatusText(selectedLeaveDetails.leave.status)}
                        color={
                          getStatusColor(
                            selectedLeaveDetails.leave.status
                          ) as any
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Başlangıç:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(
                          selectedLeaveDetails.leave.start_date
                        ).toLocaleDateString("tr-TR")}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bitiş:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(
                          selectedLeaveDetails.leave.end_date
                        ).toLocaleDateString("tr-TR")}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Gün:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedLeaveDetails.leave.total_days} gün
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sebep:
                      </Typography>
                      <Typography variant="body1">
                        {selectedLeaveDetails.leave.reason || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Operasyon Notu:
                      </Typography>
                      <Typography variant="body1">
                        {selectedLeaveDetails.leave.operation_notes || "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Joker Atamaları */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Joker Atamaları ({selectedLeaveDetails.leaveDays.length}{" "}
                    gün)
                  </Typography>
                  {selectedLeaveDetails.leaveDays.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Tarih</TableCell>
                            <TableCell>Joker Personel</TableCell>
                            <TableCell>Vardiya Türü</TableCell>
                            <TableCell>Notlar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedLeaveDetails.leaveDays.map(
                            (leaveDay: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                  >
                                    {new Date(
                                      leaveDay.leave_date
                                    ).toLocaleDateString("tr-TR")}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {leaveDay.duty_assignments?.length > 0 ? (
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                      >
                                        {
                                          leaveDay.duty_assignments[0]
                                            .joker_personnel?.first_name
                                        }{" "}
                                        {
                                          leaveDay.duty_assignments[0]
                                            .joker_personnel?.last_name
                                        }
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {leaveDay.duty_assignments[0]
                                          .joker_personnel?.phone ||
                                          "Telefon yok"}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ fontStyle: "italic" }}
                                    >
                                      Joker atanmamış
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {leaveDay.duty_assignments?.length > 0 ? (
                                    <Chip
                                      label={
                                        leaveDay.duty_assignments[0]
                                          .shift_type === "day"
                                          ? "Gündüz"
                                          : leaveDay.duty_assignments[0]
                                              .shift_type === "night"
                                          ? "Gece"
                                          : leaveDay.duty_assignments[0]
                                              .shift_type
                                      }
                                      color={
                                        leaveDay.duty_assignments[0]
                                          .shift_type === "day"
                                          ? "success"
                                          : "primary"
                                      }
                                      size="small"
                                    />
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {leaveDay.duty_assignments?.length > 0
                                      ? leaveDay.duty_assignments[0].notes ||
                                        "-"
                                      : "-"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bu izin için joker ataması bulunamadı.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                İzin detayları yükleniyor...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowLeaveDetailsDialog(false);
              setSelectedLeaveDetails(null);
            }}
            variant="outlined"
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement;
