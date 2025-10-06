import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Skeleton,
  Stack,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  AutoFixHigh as AutoIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { supabase, supabaseAdmin } from "../lib/supabase";

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

interface DutyAssignment {
  id: string;
  personnel_id: string;
  date?: string; // Eski format için
  duty_date?: string; // Yeni format için
  shift_type:
    | "1"
    | "2"
    | "3"
    | "M"
    | "YI"
    | "MI"
    | "DR"
    | "BT"
    | "EI"
    | "ÖI"
    | "HI" // Hastalık İzni
    | "DI"
    | "BI" // Babalık İzni
    | "DG"
    | "HT" // Hafta Tatili
    | "day" // Yeni format için
    | "evening" // Yeni format için
    | "night"; // Yeni format için
  shift_type_id?: string; // Vardiya türü ID'si (off-day gibi)
  start_time?: string; // Vardiya başlangıç saati
  end_time?: string; // Vardiya bitiş saati
  is_joker: boolean;
  joker_info?: {
    name: string;
    phone: string;
    id_number: string;
    company_name: string;
  };
  originalPersonnelId?: string; // Joker atandığında orijinal personelin ID'si
  originalShiftType?: string; // Joker atandığında orijinal personelin vardiya türü
  is_holiday?: boolean; // Hafta tatili işareti
  notes?: string; // Notlar
}

interface JokerCalculation {
  id: string;
  tenant_id: string;
  project_id?: string;
  calculation_year: number;
  calculation_month: number;
  personnel_id: string;
  total_working_hours: number;
  legal_monthly_hours: number;
  legal_yearly_hours: number;
  legal_yearly_overtime: number;
  monthly_overtime: number;
  yearly_overtime: number;
  excess_overtime: number;
  joker_hours_needed: number;
  joker_days_needed: number;
  joker_cost_estimate: number;
  status: "calculated" | "approved" | "joker_assigned" | "completed";
  assigned_joker_id?: string;
  assigned_date?: string;
  assigned_hours: number;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
}

interface ShiftSystem {
  system_id: string;
  system_name: string;
  system_type: "8_hour_3_shift" | "12_hour_2_shift" | "12_36_shift" | "custom";
  description: string;
  shift_count: number;
  shift_duration: number;
  total_daily_hours: number;
  is_active: boolean;
  is_default: boolean;
  shift_details: ShiftDetail[];
}

interface ShiftDetail {
  id: string;
  shift_name: string;
  shift_order: number;
  start_time: string;
  end_time: string;
  duration: number;
  shift_type: "day" | "evening" | "night";
  is_night_shift: boolean;
  break_duration: number;
}

interface DutySchedule {
  id: string;
  month: number;
  year: number;
  status: "draft" | "published" | "archived";
  assignments: DutyAssignment[];
}

const DutySchedules: React.FC = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [jokerPersonnel, setJokerPersonnel] = useState<JokerPersonnel[]>([]);
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<DutySchedule | null>(
    null
  );
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [personnelPerShift, setPersonnelPerShift] = useState<number>(2); // Varsayılan: 1 vardiyada 2 kişi
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<DutyAssignment | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [assignmentType, setAssignmentType] = useState<"registered" | "joker">(
    "registered"
  );

  // Personel bazlı özel ayarlar için state'ler
  const [openPersonnelSettingsModal, setOpenPersonnelSettingsModal] =
    useState(false);
  const [personnelSettings, setPersonnelSettings] = useState<{
    [key: string]: {
      preferredShift: "day" | "evening" | "night" | "auto";
      preferredStartTime: string;
      preferredEndTime: string;
    };
  }>({});

  // Vardiya süresi artık selectedShiftSystem'den alınıyor

  // Joker hesaplama state'leri
  const [jokerCalculations, setJokerCalculations] = useState<
    JokerCalculation[]
  >([]);
  const [openJokerDialog, setOpenJokerDialog] = useState(false);
  const [jokerLoading, setJokerLoading] = useState(false);
  const [jokerStatistics, setJokerStatistics] = useState({
    total_personnel: 0,
    personnel_needing_joker: 0,
    total_excess_overtime: 0,
    total_joker_hours_needed: 0,
    total_joker_cost: 0,
    average_joker_per_personnel: 0,
  });

  // Vardiya sistemi state'leri
  const [shiftSystems, setShiftSystems] = useState<ShiftSystem[]>([]);
  const [selectedShiftSystem, setSelectedShiftSystem] =
    useState<ShiftSystem | null>(null);
  const [openShiftSystemDialog, setOpenShiftSystemDialog] = useState(false);
  const [shiftSystemLoading, setShiftSystemLoading] = useState(false);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPersonnel((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Vardiya saatlerini hesapla
  const getShiftTimes = () => {
    if (!selectedShiftSystem) {
      return {
        day: { start: "08:00", end: "20:00", duration: 12 },
        night: { start: "20:00", end: "08:00", duration: 12 },
      };
    }

    if (selectedShiftSystem.system_type === "8_hour_3_shift") {
      return {
        day: { start: "08:00", end: "16:00", duration: 8 },
        evening: { start: "16:00", end: "00:00", duration: 8 },
        night: { start: "00:00", end: "08:00", duration: 8 },
      };
    } else if (
      selectedShiftSystem.system_type === "12_hour_2_shift" ||
      selectedShiftSystem.system_type === "12_36_shift"
    ) {
      // Özel güvenlik sektörü standartları (RO Group)
      return {
        day: { start: "08:00", end: "20:00", duration: 12 }, // Gündüz vardiyası
        night: { start: "20:00", end: "08:00", duration: 12 }, // Gece vardiyası
      };
    }

    // Default fallback
    return {
      day: { start: "08:00", end: "20:00", duration: 12 },
      night: { start: "20:00", end: "08:00", duration: 12 },
    };
  };

  // Personel için varsayılan saatleri hesapla
  const getDefaultPersonnelTimes = (
    shiftType: "day" | "evening" | "night" | "auto"
  ) => {
    const shiftTimes = getShiftTimes();

    switch (shiftType) {
      case "day":
        return { start: shiftTimes.day.start, end: shiftTimes.day.end };
      case "evening":
        return selectedShiftSystem?.system_type === "8_hour_3_shift"
          ? {
              start: shiftTimes.evening?.start || "16:00",
              end: shiftTimes.evening?.end || "00:00",
            }
          : { start: "08:00", end: "20:00" };
      case "night":
        return { start: shiftTimes.night.start, end: shiftTimes.night.end };
      case "auto":
      default:
        // Otomatik seçildiğinde saatler boş olmalı
        return { start: "", end: "" };
    }
  };

  // Vardiya dengesini kontrol et ve otomatik ayarla
  const balanceShiftAssignments = () => {
    const actualPersonnelCount = personnel.length;

    // Sadece 2 personel varsa ve 12 saatlik sistemde dengeleme yap
    if (
      actualPersonnelCount === 2 &&
      selectedShiftSystem?.system_type === "12_hour_2_shift"
    ) {
      const personIds = Object.keys(personnelSettings);
      const dayShiftCount = personIds.filter(
        (id) => personnelSettings[id]?.preferredShift === "day"
      ).length;
      const nightShiftCount = personIds.filter(
        (id) => personnelSettings[id]?.preferredShift === "night"
      ).length;
      const autoCount = personIds.filter(
        (id) => personnelSettings[id]?.preferredShift === "auto"
      ).length;

      // Eğer bir personel sabahçı seçilmişse ve diğeri otomatikse, otomatik olanı gececi yap
      if (dayShiftCount === 1 && autoCount === 1) {
        const autoPersonId = personIds.find(
          (id) => personnelSettings[id]?.preferredShift === "auto"
        );
        if (autoPersonId) {
          const defaultTimes = getDefaultPersonnelTimes("night");
          setPersonnelSettings((prev) => ({
            ...prev,
            [autoPersonId]: {
              ...prev[autoPersonId],
              preferredShift: "night",
              preferredStartTime: defaultTimes.start,
              preferredEndTime: defaultTimes.end,
            },
          }));
        }
      }
      // Eğer bir personel gececi seçilmişse ve diğeri otomatikse, otomatik olanı sabahçı yap
      else if (nightShiftCount === 1 && autoCount === 1) {
        const autoPersonId = personIds.find(
          (id) => personnelSettings[id]?.preferredShift === "auto"
        );
        if (autoPersonId) {
          const defaultTimes = getDefaultPersonnelTimes("day");
          setPersonnelSettings((prev) => ({
            ...prev,
            [autoPersonId]: {
              ...prev[autoPersonId],
              preferredShift: "day",
              preferredStartTime: defaultTimes.start,
              preferredEndTime: defaultTimes.end,
            },
          }));
        }
      }
    }
  };

  // Vardiya süresi değiştiğinde personel saatlerini güncelle
  useEffect(() => {
    const updatedSettings: any = {};
    Object.keys(personnelSettings).forEach((personId) => {
      const currentShift =
        personnelSettings[personId]?.preferredShift || "auto";
      const defaultTimes = getDefaultPersonnelTimes(currentShift);
      updatedSettings[personId] = {
        ...personnelSettings[personId],
        preferredStartTime: defaultTimes.start,
        preferredEndTime: defaultTimes.end,
      };
    });
    if (Object.keys(updatedSettings).length > 0) {
      setPersonnelSettings((prev) => ({ ...prev, ...updatedSettings }));
    }
  }, [selectedShiftSystem]);

  // Ay navigasyonu fonksiyonları
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setSelectedMonth(newDate.getMonth() + 1);
    setSelectedYear(newDate.getFullYear());
    // Ay değiştiğinde veriyi yenile
    fetchSchedules();
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedMonth(newDate.getMonth() + 1);
    setSelectedYear(newDate.getFullYear());
    // Ay değiştiğinde veriyi yenile
    fetchSchedules();
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
    // Ay değiştiğinde veriyi yenile
    fetchSchedules();
  };

  // Ay isimleri
  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  // Vardiya türleri ve renkleri (dinamik olarak veritabanından yüklenir)
  const defaultShiftTypes = {
    "1": {
      label: "Vardiya 1 (08:00-20:00)",
      color: "#4caf50",
      category: "work",
    },
    "2": {
      label: "Vardiya 2 (20:00-08:00)",
      color: "#2196f3",
      category: "work",
    },
    day: {
      label: "Gündüz Vardiyası (08:00-16:00)",
      color: "#4caf50",
      category: "work",
    },
    night: {
      label: "Gece Vardiyası (20:00-08:00)",
      color: "#2196f3",
      category: "work",
    },
    M: { label: "Mesai", color: "#ff9800", category: "work" },
    YI: { label: "Yıllık İzin", color: "#9c27b0", category: "leave" },
    MI: { label: "Mazeret İzni", color: "#f44336", category: "leave" },
    DR: { label: "Doktor Raporu", color: "#e91e63", category: "leave" },
    BT: { label: "Bayram Tatili", color: "#795548", category: "leave" },
    EI: { label: "Evlilik İzni", color: "#607d8b", category: "leave" },
    ÖI: { label: "Ölüm İzni", color: "#424242", category: "leave" },
    DI: { label: "Doğum İzni", color: "#e1bee7", category: "leave" },
    DG: { label: "Dış Görev", color: "#ffc107", category: "work" },
    HT: { label: "Hafta Tatili", color: "#9e9e9e", category: "leave" },
  };

  // Dinamik shift types'ları kullan, yoksa default'ları kullan
  const currentShiftTypes: any =
    Object.keys(shiftTypes).length > 0 ? shiftTypes : defaultShiftTypes;

  // Vardiya kategorileri (Özel güvenlik sektörü standartları)
  const workShifts = ["1", "2", "day", "night", "M", "DG"]; // Çalışma vardiyaları
  const leaveShifts = [
    "YI",
    "MI",
    "DR",
    "BT",
    "EI",
    "ÖI",
    "HI",
    "DI",
    "BI",
    "HT",
  ]; // İzin türleri

  // Aylar listesi
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  // Personel verilerini yükle
  const fetchPersonnel = async () => {
    if (!tenant || !selectedProject) return;

    try {
      setPersonnelLoading(true);
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
        .eq("status", "Aktif") // Sadece aktif personeli getir
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching personnel:", error);
        setError("Personel verileri yüklenirken hata oluştu: " + error.message);
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
      setError("Personel verileri yüklenirken hata oluştu");
    } finally {
      setPersonnelLoading(false);
    }
  };

  // Joker personel verilerini yükle
  const fetchJokerPersonnel = async () => {
    if (!tenant || !selectedProject) return;

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
        .eq("status", "Aktif") // Sadece aktif joker personeli getir
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching joker personnel:", error);
        // Joker personel tablosu henüz oluşturulmamışsa boş array döndür
        if (
          error.message.includes('relation "joker_personnel" does not exist')
        ) {
          setJokerPersonnel([]);
        } else {
          setError(
            "Joker personel verileri yüklenirken hata oluştu: " + error.message
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
      setError("Joker personel verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Shift types'ları yükle
  const fetchShiftTypes = async () => {
    if (!tenant || !selectedProject) return;

    try {
      const { data, error } = await supabaseAdmin
        .from("shift_types")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching shift types:", error);
        return;
      }

      // Shift types'ları formatla
      const formattedShiftTypes: any = {};
      data?.forEach((shiftType: any) => {
        formattedShiftTypes[shiftType.code.toLowerCase()] = {
          label: shiftType.name,
          color: shiftType.color,
          category: shiftType.is_night_shift ? "night" : "work",
          start_time: shiftType.start_time,
          end_time: shiftType.end_time,
          timeRange: shiftType.is_leave_type
            ? shiftType.name
            : `${shiftType.start_time} - ${shiftType.end_time}`,
          is_leave_type: shiftType.is_leave_type,
          is_paid_leave: shiftType.is_paid_leave,
        };
      });

      setShiftTypes(formattedShiftTypes);
    } catch (err) {
      console.error("Error fetching shift types:", err);
    }
  };

  // Nöbet çizelgelerini yükle
  const fetchSchedules = async () => {
    if (!tenant || !selectedProject) return;

    try {
      console.log("🔄 fetchSchedules başlıyor...");
      setSchedulesLoading(true);
      setError(null);

      const { data, error } = await supabaseAdmin
        .from("duty_schedules")
        .select(
          `
          *,
          assignments:duty_assignments(
            *,
            personnel:personnel(first_name, last_name)
          )
        `
        )
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching schedules:", error);
        setError("Nöbet çizelgeleri yüklenirken hata oluştu: " + error.message);
        return;
      }

      console.log("📊 Veritabanından gelen data:", data);
      const schedules = data || [];
      console.log("📋 Schedules:", schedules);
      console.log("📋 Assignments:", schedules[0]?.assignments);

      // Eğer assignments ayrı geliyorsa, onları schedule objesine ekle
      if (schedules.length > 0 && !schedules[0].assignments) {
        // Assignments'ı ayrı bir query ile çek
        const { data: assignmentsData, error: assignmentsError } =
          await supabaseAdmin
            .from("duty_assignments")
            .select(
              `
            *,
            personnel:personnel(first_name, last_name)
          `
            )
            .eq("tenant_id", tenant.id)
            .eq("project_id", selectedProject.id)
            .eq("month", selectedMonth)
            .eq("year", selectedYear);

        if (assignmentsError) {
          console.error("❌ Error fetching assignments:", assignmentsError);
        } else {
          console.log("📋 Assignments from separate query:", assignmentsData);
          // Assignments'ı schedule objesine ekle
          schedules[0].assignments = assignmentsData || [];
        }
      }

      setSchedules(schedules);
      setCurrentSchedule(schedules[0] || null);
      console.log("✅ fetchSchedules tamamlandı!");
    } catch (err) {
      console.error("❌ Error fetching schedules:", err);
      setError("Nöbet çizelgeleri yüklenirken hata oluştu");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Tüm atamaları temizle
  const clearAllAssignments = async () => {
    if (!currentSchedule) {
      setError("Aktif çizelge bulunamadı");
      return;
    }

    // Onay iste
    const confirmed = window.confirm(
      "Tüm atamaları temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz!"
    );

    if (!confirmed) return;

    try {
      setSchedulesLoading(true);
      setError(null);

      console.log("🗑️ Tüm atamalar temizleniyor...");

      // Mevcut çizelgedeki tüm atamaları sil
      const { error: deleteError } = await supabaseAdmin
        .from("duty_assignments")
        .delete()
        .eq("schedule_id", currentSchedule.id);

      if (deleteError) {
        console.error("Error clearing assignments:", deleteError);
        setError("Atamalar temizlenirken hata: " + deleteError.message);
        return;
      }

      console.log("✅ Tüm atamalar başarıyla temizlendi");

      // Çizelgeleri yeniden yükle
      await fetchSchedules();

      // Başarı mesajı
      setError(null);
      console.log("🎉 Çizelge temizlendi!");
    } catch (err) {
      console.error("Error clearing assignments:", err);
      setError("Atamalar temizlenirken hata oluştu");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Çizelge oluşturma fonksiyonu
  const createSchedule = async () => {
    if (!tenant || !selectedProject) {
      throw new Error("Tenant ve proje seçili olmalı");
    }

    if (!selectedShiftSystem) {
      throw new Error("Vardiya sistemi seçili olmalı");
    }

    const { data, error } = await supabaseAdmin
      .from("duty_schedules")
      .insert({
        tenant_id: tenant.id,
        project_id: selectedProject.id,
        month: selectedMonth,
        year: selectedYear,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Otomatik çizelge oluştur
  const generateSchedule = async () => {
    try {
      setGeneratingSchedule(true);
      setGenerationStep("🔍 İzin kontrolü başlıyor...");

      console.log("🚀 generateSchedule çağrıldı!");
      console.log("Personnel:", personnel.length);
      console.log("Tenant:", tenant);
      console.log("SelectedProject:", selectedProject);
      console.log("Selected Shift System:", selectedShiftSystem?.system_type);
      console.log("Selected Shift System:", selectedShiftSystem);

      // Vardiya sistemi kontrolü
      if (!selectedShiftSystem) {
        setError("Lütfen önce bir vardiya sistemi seçin!");
        setGeneratingSchedule(false);
        return;
      }

      setGenerationStep("👥 Personel sayısı kontrol ediliyor...");

      // Personel sayısı kontrolü
      let requiredPersonnel: number;

      if (
        selectedShiftSystem &&
        (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
      ) {
        // 8 saatlik 3'lü vardiya için minimum 7 personel gerekiyor
        requiredPersonnel = 7;
        if (personnel.length < requiredPersonnel) {
          setError(
            `8 saatlik 3'lü vardiya sistemi için minimum 7 personel gerekiyor! Mevcut: ${personnel.length}. Lütfen en az 7 personel ekleyin.`
          );
          setGeneratingSchedule(false);
          return;
        }
      } else {
        // Diğer sistemler için mevcut hesaplama
        requiredPersonnel = selectedShiftSystem
          ? selectedShiftSystem.shift_count * personnelPerShift
          : personnelPerShift * 2; // Varsayılan 2 vardiya

        if (personnel.length < requiredPersonnel) {
          setError(
            `Yetersiz personel! Gerekli: ${requiredPersonnel}, Mevcut: ${personnel.length}. Lütfen daha fazla personel ekleyin veya vardiya başına personel sayısını azaltın.`
          );
          setGeneratingSchedule(false);
          return;
        }
      }

      setGenerationStep("⚙️ Vardiya sistemi hazırlanıyor...");

      // Vardiya sistemi kontrolü
      if (selectedShiftSystem) {
        console.log(
          "🔍 Seçili vardiya sistemi:",
          selectedShiftSystem.system_type
        );
        switch (selectedShiftSystem.system_type) {
          case "8_hour_3_shift":
            console.log("🚀 8 saatlik 3 vardiya sistemi çağrılıyor...");
            setGenerationStep(
              "🕐 8 saatlik 3'lü vardiya sistemi oluşturuluyor..."
            );
            await generate8Hour3ShiftSchedule();
            return;
          case "12_36_shift":
            console.log("🚀 12/36 vardiya sistemi çağrılıyor...");
            setGenerationStep(
              "🕐 12/36 saatlik vardiya sistemi oluşturuluyor..."
            );
            await generate12_36ShiftSchedule();
            return;
          case "12_hour_2_shift":
          default:
            console.log("🚀 12 saatlik 2'li sistem çağrılıyor...");
            setGenerationStep(
              "🕐 12 saatlik 2'li vardiya sistemi oluşturuluyor..."
            );
            // Mevcut 12 saatlik 2'li sistem devam eder
            break;
        }
      } else {
        console.log("❌ Seçili vardiya sistemi yok!");
        setGeneratingSchedule(false);
        return;
      }

      setGenerationStep("📅 Vardiya saatleri hesaplanıyor...");

      // Vardiya saatlerini al
      const shiftTimes = getShiftTimes();
      console.log("Shift Times:", shiftTimes);

      if (!personnel.length || !tenant || !selectedProject) {
        console.log("❌ Eksik bilgi var!");
        setError("Personel, tenant veya proje bilgisi eksik!");
        setGeneratingSchedule(false);
        return;
      }

      setGenerationStep("🔍 Vardiya tipleri yükleniyor...");

      // Vardiya tiplerini çek
      console.log("🔍 Vardiya tipleri çekiliyor...");
      const { data: shiftTypes, error: shiftTypesError } = await supabaseAdmin
        .from("shift_types")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("is_active", true);

      if (shiftTypesError) {
        console.error("❌ Vardiya tipleri çekilemedi:", shiftTypesError);
        setError(
          "Vardiya tipleri yüklenirken hata: " + shiftTypesError.message
        );
        setGeneratingSchedule(false);
        return;
      }

      console.log("📋 Vardiya tipleri:", shiftTypes);

      setGenerationStep("⚙️ Vardiya tipleri hazırlanıyor...");

      // Çalışma vardiyalarını filtrele
      const workShifts =
        shiftTypes?.filter((st) => st.category === "work") || [];
      let dayShifts = workShifts.filter((st) => !st.is_night_shift);
      let nightShifts = workShifts.filter((st) => st.is_night_shift);

      // Eğer vardiya tipleri yoksa varsayılan vardiya tipleri oluştur
      if (dayShifts.length === 0) {
        dayShifts = [
          {
            id: "default-day",
            name:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? "Sabah Vardiyası"
                : "Gündüz Vardiyası",
            start_time: "08:00",
            end_time:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? "16:00"
                : "20:00",
            duration:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? 8
                : 12,
            break_duration: 60,
            is_night_shift: false,
          },
        ];
      }

      if (nightShifts.length === 0) {
        nightShifts = [
          {
            id: "default-night",
            name: "Gece Vardiyası",
            start_time:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? "00:00"
                : "20:00",
            end_time:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? "08:00"
                : "08:00",
            duration:
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
                ? 8
                : 12,
            break_duration: 0,
            is_night_shift: true,
          },
        ];
      }

      // 8 saatlik sistem için evening shift'i de ekle
      let eveningShifts: any[] = [];
      if (
        selectedShiftSystem &&
        (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
      ) {
        eveningShifts = workShifts.filter(
          (st) =>
            st.start_time === "16:00" ||
            st.name.toLowerCase().includes("akşam") ||
            st.name.toLowerCase().includes("evening")
        );

        // Eğer evening shift yoksa varsayılan oluştur
        if (eveningShifts.length === 0) {
          eveningShifts = [
            {
              id: "default-evening",
              name: "Akşam Vardiyası",
              start_time: "16:00",
              end_time: "00:00",
              duration: 8,
              break_duration: 30,
              is_night_shift: false,
            },
          ];
        }
      }

      console.log("🌅 Gündüz vardiyaları:", dayShifts);
      console.log("🌙 Gece vardiyaları:", nightShifts);
      if (
        selectedShiftSystem &&
        (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
      ) {
        console.log("🌆 Akşam vardiyaları:", eveningShifts);
      }

      setGenerationStep("📊 Personel sayısı hesaplanıyor...");

      // Gerçek personel sayısını al (proje ayarlarındaki min_personnel_per_shift değil)
      const actualPersonnelCount = personnel.length;
      console.log("📊 Gerçek personel sayısı:", actualPersonnelCount);

      // RO Group 2+2+2 sistemi: Her gün sadece 2 personel çalışır (1 gündüz, 1 gece)
      // Diğer personeller izin yapar
      const personnelPerDay = Math.min(2, actualPersonnelCount); // Her gün maksimum 2 personel çalışır
      console.log("📊 Günlük atanacak personel sayısı:", personnelPerDay);
      console.log("📊 Toplam personel sayısı:", actualPersonnelCount);

      setGenerationStep("🔍 İzin kontrolü başlıyor...");

      // İZİN KONTROLÜ - Önce izinli personelleri kontrol et
      console.log("🔍 İzin kontrolü başlıyor...");
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const leaveIssues = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(selectedYear, selectedMonth - 1, day);
        const dateString = currentDate.toISOString().split("T")[0];

        // Bu gün için izinli personelleri kontrol et
        for (const person of personnel) {
          const { data: leaveData, error: leaveError } = await supabaseAdmin
            .from("leave_days")
            .select(
              `
              *,
              personnel_leaves!inner(
                *,
                leave_types(*)
              )
            `
            )
            .eq("personnel_id", person.id)
            .eq("leave_date", dateString);

          if (leaveError) {
            console.error(
              `❌ İzin kontrolü hatası (${person.first_name}):`,
              leaveError
            );
            continue;
          }

          if (leaveData && leaveData.length > 0) {
            const leaveInfo = leaveData[0];
            const leaveType = leaveInfo.personnel_leaves?.leave_types;

            console.log(
              `🚫 ${person.first_name} ${person.last_name} ${dateString} tarihinde izinli: ${leaveType?.name}`
            );

            // Bu izinli personel için joker kontrolü yap
            const { data: jokerData, error: jokerError } = await supabaseAdmin
              .from("joker_personnel")
              .select("*")
              .eq("project_id", selectedProject.id)
              .eq("status", "active")
              .limit(1);

            if (jokerError) {
              console.error(`❌ Joker kontrolü hatası:`, jokerError);
            }

            // Ayrıca bu tarihte zaten joker assignment var mı kontrol et
            const { data: existingJokerAssignment, error: assignmentError } =
              await supabaseAdmin
                .from("duty_assignments")
                .select("*")
                .eq("personnel_id", person.id)
                .eq("duty_date", dateString)
                .eq("is_joker", true);

            if (assignmentError) {
              console.error(`❌ Assignment kontrolü hatası:`, assignmentError);
            }

            if (!jokerData || jokerData.length === 0) {
              leaveIssues.push({
                person: `${person.first_name} ${person.last_name}`,
                date: dateString,
                leaveType: leaveType?.name || "Bilinmeyen",
                issue: "Joker personel bulunamadı",
              });
            } else if (
              !existingJokerAssignment ||
              existingJokerAssignment.length === 0
            ) {
              leaveIssues.push({
                person: `${person.first_name} ${person.last_name}`,
                date: dateString,
                leaveType: leaveType?.name || "Bilinmeyen",
                issue: "Joker personel mevcut ama henüz atanmamış",
              });
            } else {
              console.log(
                `✅ ${person.first_name} için joker mevcut ve atanmış: ${jokerData[0].first_name} ${jokerData[0].last_name}`
              );
            }
          }
        }
      }

      // İzin sorunları varsa uyarı ver
      if (leaveIssues.length > 0) {
        const issueMessage = leaveIssues
          .map(
            (issue) =>
              `• ${issue.person} - ${new Date(issue.date).toLocaleDateString(
                "tr-TR"
              )} (${issue.leaveType}): ${issue.issue}`
          )
          .join("\n");

        setError(
          `🚫 İzin Kontrolünde Sorunlar Bulundu!\n\n${issueMessage}\n\n📋 Çözüm Önerileri:\n• Joker personel ekleyin\n• İzinleri düzenleyin\n• Joker atamalarını tamamlayın\n\nÇizelge oluşturulamadı.`
        );
        return;
      }

      console.log("✅ İzin kontrolü tamamlandı, hiçbir sorun bulunamadı");

      try {
        console.log("✅ Bilgiler tamam, işlem başlıyor...");
        setSchedulesLoading(true);
        setError(null);

        // Önce mevcut çizelgeyi kontrol et veya oluştur
        let scheduleId = currentSchedule?.id;
        console.log("📋 Mevcut scheduleId:", scheduleId);

        if (!scheduleId) {
          console.log("🆕 Yeni çizelge oluşturuluyor...");
          // Yeni çizelge oluştur
          const { data: newSchedule, error: scheduleError } =
            await supabaseAdmin
              .from("duty_schedules")
              .insert({
                tenant_id: tenant.id,
                project_id: selectedProject.id,
                month: selectedMonth,
                year: selectedYear,
                status: "draft",
                created_by: (await supabase.auth.getUser()).data.user?.id,
              })
              .select()
              .single();

          if (scheduleError) {
            console.error("❌ Error creating schedule:", scheduleError);
            setError("Çizelge oluşturulurken hata: " + scheduleError.message);
            return;
          }

          scheduleId = newSchedule.id;
          console.log("✅ Yeni çizelge oluşturuldu:", scheduleId);
        } else {
          console.log("♻️ Mevcut çizelge kullanılıyor:", scheduleId);
        }

        // Mevcut atamaları sil
        console.log("🗑️ Mevcut atamalar siliniyor...");
        await supabaseAdmin
          .from("duty_assignments")
          .delete()
          .eq("schedule_id", scheduleId);

        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        console.log("📅 Ay gün sayısı:", daysInMonth);
        const assignments: any[] = [];

        setGenerationStep("👤 Kullanıcı bilgileri alınıyor...");

        // Proje personel sayısına göre rotasyon sistemi
        const currentUser = (await supabase.auth.getUser()).data.user?.id;

        setGenerationStep("📅 Günlük atamalar yapılıyor...");

        // Her gün için personel ataması yap
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = new Date(
            selectedYear,
            selectedMonth - 1,
            day
          ).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Pazar veya Cumartesi
          const currentDate = new Date(selectedYear, selectedMonth - 1, day);
          const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format

          console.log(`📅 ${day}. gün işleniyor: ${dateString}`);

          // Bu gün için çalışacak personelleri seç
          const workingPersonnel = [];

          // Proje personel sayısına göre vardiya türü dağılımı
          let dayShiftCount = 0;
          let nightShiftCount = 0;
          let eveningShiftCount = 0;

          // RO Group 2+2+2 rotasyon sistemi (Özel güvenlik sektörü standartları)
          if (
            selectedShiftSystem?.system_type === "12_hour_2_shift" ||
            (selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "12_36_shift")
          ) {
            // 12 saatlik sistem: 2+2+2 rotasyonu
            // Her personel 6 günde bir döngü: 2 gün gündüz + 2 gün gece + 2 gün izin

            // Personel sayısına göre günlük atama
            if (actualPersonnelCount >= 3) {
              // 3+ personel: her gün 2 personel çalışır (1 gündüz, 1 gece)
              dayShiftCount = 1;
              nightShiftCount = 1;
              eveningShiftCount = 0;
            } else if (actualPersonnelCount === 2) {
              // 2 personel: her gün 2 personel çalışır (1 gündüz, 1 gece)
              dayShiftCount = 1;
              nightShiftCount = 1;
              eveningShiftCount = 0;
            } else {
              // 1 personel: günlük rotasyon (çift günler gündüz, tek günler gece)
              dayShiftCount = day % 2 === 0 ? 1 : 0;
              nightShiftCount = day % 2 === 1 ? 1 : 0;
              eveningShiftCount = 0;
            }
          } else {
            // 8 saatlik sistem: 3 vardiya rotasyonu
            const shiftsPerType = Math.ceil(personnelPerDay / 3);
            dayShiftCount = shiftsPerType;
            eveningShiftCount = shiftsPerType;
            nightShiftCount = shiftsPerType;
          }

          console.log(
            `📅 Gün ${day}: dayShiftCount=${dayShiftCount}, eveningShiftCount=${eveningShiftCount}, nightShiftCount=${nightShiftCount}`
          );

          // Vardiya tiplerini seç
          const selectedDayShift = dayShifts.length > 0 ? dayShifts[0] : null;
          const selectedNightShift =
            nightShifts.length > 0 ? nightShifts[0] : null;
          const selectedEveningShift =
            selectedShiftSystem &&
            (selectedShiftSystem.system_type as string) === "8_hour_3_shift" &&
            eveningShifts.length > 0
              ? eveningShifts[0]
              : null;

          console.log("🌅 Seçilen gündüz vardiyası:", selectedDayShift);
          console.log("🌙 Seçilen gece vardiyası:", selectedNightShift);

          // Tüm personel için izin kontrolü yap
          const availablePersonnel = [];

          for (let i = 0; i < personnel.length; i++) {
            const person = personnel[i];
            const personSettings = personnelSettings[person.id];

            // Önce personelin bu gün izni var mı kontrol et
            console.log(
              `🔍 ${person.first_name} için izin kontrolü: ${dateString}`
            );
            console.log(`🔍 Personel ID: ${person.id}`);

            // Çiğdem için özel debug
            if (person.first_name === "Çiğdem" && dateString === "2025-09-13") {
              console.log("🚨 ÇİĞDEM 13 EYLÜL İZİN KONTROLÜ BAŞLIYOR!");
            }

            // İzin kontrolü - leave_days tablosunu kontrol et
            const { data: leaveData, error: leaveError } = await supabaseAdmin
              .from("leave_days")
              .select(
                `
                *,
                personnel_leaves!inner(
                  *,
                  leave_types(*)
                )
              `
              )
              .eq("personnel_id", person.id)
              .eq("leave_date", dateString);

            console.log(`🔍 İzin sorgusu sonucu:`, { leaveData, leaveError });

            if (leaveError) {
              console.error(
                `❌ İzin kontrolü hatası (${person.first_name}):`,
                leaveError
              );
            }

            if (leaveData && leaveData.length > 0) {
              const leaveInfo = leaveData[0];
              const leaveType = leaveInfo.personnel_leaves?.leave_types;
              console.log(
                `🚫 ${person.first_name} ${person.last_name} bu gün izinli:`,
                {
                  leaveDate: leaveInfo.leave_date,
                  leaveType: leaveType?.name || "Bilinmeyen",
                  leaveCode: leaveType?.code || "N/A",
                  status: leaveInfo.personnel_leaves?.status || "Bilinmeyen",
                }
              );

              // İzinli personel için joker kontrolü yap
              const { data: jokerData, error: jokerError } = await supabaseAdmin
                .from("joker_personnel")
                .select("*")
                .eq("project_id", selectedProject.id)
                .eq("status", "active")
                .limit(1);

              if (jokerError) {
                console.error(`❌ Joker kontrolü hatası:`, jokerError);
              }

              // İzinli personel için assignment oluştur
              const leaveAssignment = {
                schedule_id: scheduleId,
                personnel_id: person.id,
                duty_date: dateString,
                shift_type: leaveType?.code || "YI", // İzin türü kodu
                start_time: "00:00",
                end_time: "23:59",
                is_joker: false,
                notes: `İzin: ${
                  leaveType?.name || "Bilinmeyen"
                } - ${new Date().toLocaleDateString("tr-TR")}`,
                created_by: currentUser,
              };

              assignments.push(leaveAssignment);
              console.log(
                `✅ ${person.first_name} için izin assignment'ı oluşturuldu: ${leaveType?.code}`
              );

              if (jokerData && jokerData.length > 0) {
                const joker = jokerData[0];
                console.log(
                  `🃏 Joker personel bulundu: ${joker.first_name} ${joker.last_name}`
                );

                // Joker personeli availablePersonnel listesine ekle
                availablePersonnel.push({
                  id: joker.id,
                  first_name: joker.first_name,
                  last_name: joker.last_name,
                  is_joker: true,
                  isJoker: true,
                  originalPersonnel: person,
                  originalLeaveType: leaveType?.name || "Bilinmeyen",
                  originalLeaveCode: leaveType?.code || "N/A",
                });
                console.log(
                  `✅ ${person.first_name} yerine ${joker.first_name} joker olarak atandı`
                );
              } else {
                console.log(
                  `⚠️ Joker personel bulunamadı, ${person.first_name} için boş bırakılıyor`
                );
              }
              continue; // İzinli personeli atla
            }

            // İzinli değilse availablePersonnel listesine ekle
            availablePersonnel.push(person);
          }

          console.log(
            `📊 Gün ${day} için availablePersonnel:`,
            availablePersonnel.length
          );

          // Şimdi availablePersonnel listesi üzerinde rotasyon sistemi uygula
          for (let i = 0; i < availablePersonnel.length; i++) {
            const person = availablePersonnel[i];
            const personSettings = personnelSettings[person.id];

            // Her personel için 6 günlük döngü hesapla
            const cyclePosition = (day - 1) % 6; // 0-5 arası
            const personCycleStart = i * 2; // Her personel 2 gün kaydırılmış başlar
            const personCycleDay = (cyclePosition + personCycleStart) % 6;

            // 2+2+2 rotasyonu: 0-1 gündüz, 2-3 gece, 4-5 izin
            const isDayShift = personCycleDay >= 0 && personCycleDay <= 1;
            const isNightShift = personCycleDay >= 2 && personCycleDay <= 3;
            const isOffDay = personCycleDay >= 4 && personCycleDay <= 5;

            console.log(
              `👤 ${person.first_name} ${
                person.last_name
              } - Gün ${day}, Döngü pozisyonu: ${personCycleDay}, ${
                isDayShift ? "Gündüz" : isNightShift ? "Gece" : "İzin"
              }`
            );

            // Eğer bu gün izin günüyse, HT (Hafta Tatili) ata
            if (isOffDay) {
              console.log(
                `😴 ${person.first_name} bu gün izin günü - İzin Günü atanıyor`
              );
              workingPersonnel.push({
                person,
                shiftType: "YI", // Yıllık İzin (constraint uyumlu)
                shiftTypeId: "off-day",
                shiftTypeName: "İzin Günü",
                startTime: "00:00",
                endTime: "00:00", // 00:00-00:00 = çalışmıyor
                duration: 0,
                breakDuration: 0,
              });
              continue;
            }

            let assigned = false;

            // Önce personel tercihlerini kontrol et
            if (personSettings?.preferredShift === "day" && selectedDayShift) {
              // Personel sabahçı tercihi - sadece gündüz vardiyasına ata
              workingPersonnel.push({
                person,
                shiftType: "1", // Özel güvenlik sektörü standartları
                shiftTypeId: selectedDayShift.id,
                shiftTypeName: selectedDayShift.name,
                startTime:
                  personSettings.preferredStartTime ||
                  selectedDayShift.start_time ||
                  shiftTimes.day.start,
                endTime:
                  personSettings.preferredEndTime ||
                  selectedDayShift.end_time ||
                  shiftTimes.day.end,
                duration: selectedDayShift.duration || shiftTimes.day.duration,
                breakDuration: selectedDayShift.break_duration || 0,
              });
              assigned = true;
              console.log(
                `✅ ${person.first_name} sabahçı tercihi nedeniyle gündüz vardiyasına atandı`
              );
            } else if (
              personSettings?.preferredShift === "night" &&
              selectedNightShift
            ) {
              // Personel gececi tercihi - sadece gece vardiyasına ata
              workingPersonnel.push({
                person,
                shiftType: "2", // Gece vardiyası
                shiftTypeId: selectedNightShift.id,
                shiftTypeName: selectedNightShift.name,
                startTime:
                  personSettings.preferredStartTime ||
                  selectedNightShift.start_time ||
                  shiftTimes.night.start,
                endTime:
                  personSettings.preferredEndTime ||
                  selectedNightShift.end_time ||
                  shiftTimes.night.end,
                duration:
                  selectedNightShift.duration || shiftTimes.night.duration,
                breakDuration: selectedNightShift.break_duration || 0,
              });
              assigned = true;
              console.log(
                `✅ ${person.first_name} gececi tercihi nedeniyle gece vardiyasına atandı`
              );
            } else if (
              personSettings?.preferredShift === "auto" ||
              !personSettings?.preferredShift
            ) {
              // Otomatik tercih veya tercih yoksa 2+2+2 rotasyon sistemine göre ata
              if (isDayShift && selectedDayShift) {
                // Gündüz vardiyası
                workingPersonnel.push({
                  person,
                  shiftType: "1", // Özel güvenlik sektörü standartları
                  shiftTypeId: selectedDayShift.id,
                  shiftTypeName: selectedDayShift.name,
                  startTime:
                    selectedDayShift.start_time || shiftTimes.day.start,
                  endTime: selectedDayShift.end_time || shiftTimes.day.end,
                  duration:
                    selectedDayShift.duration || shiftTimes.day.duration,
                  breakDuration: selectedDayShift.break_duration || 0,
                });
                assigned = true;
                console.log(
                  `✅ ${person.first_name} gündüz vardiyasına atandı (2+2+2 rotasyon)`
                );
              } else if (
                personSettings?.preferredShift === "evening" &&
                eveningShiftCount > 0 &&
                selectedEveningShift &&
                selectedShiftSystem &&
                (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
              ) {
                // Akşamçı tercihi - sadece 8 saatlik 3 vardiya sisteminde geçerli
                workingPersonnel.push({
                  person,
                  shiftType: "evening",
                  shiftTypeId: selectedEveningShift.id,
                  shiftTypeName: selectedEveningShift.name,
                  startTime:
                    selectedEveningShift.start_time ||
                    shiftTimes.evening?.start ||
                    "16:00",
                  endTime:
                    selectedEveningShift.end_time ||
                    shiftTimes.evening?.end ||
                    "00:00",
                  duration:
                    selectedEveningShift.duration ||
                    shiftTimes.evening?.duration ||
                    8,
                  breakDuration: selectedEveningShift.break_duration || 0,
                });
                eveningShiftCount--;
                assigned = true;
                console.log(
                  `✅ ${person.first_name} ${selectedEveningShift.name} vardiyasına atandı`
                );
              } else if (isNightShift && selectedNightShift) {
                // Gece vardiyası
                workingPersonnel.push({
                  person,
                  shiftType: "2", // Özel güvenlik sektörü standartları
                  shiftTypeId: selectedNightShift.id,
                  shiftTypeName: selectedNightShift.name,
                  startTime:
                    selectedNightShift.start_time || shiftTimes.night.start,
                  endTime: selectedNightShift.end_time || shiftTimes.night.end,
                  duration:
                    selectedNightShift.duration || shiftTimes.night.duration,
                  breakDuration: selectedNightShift.break_duration || 0,
                });
                assigned = true;
                console.log(
                  `✅ ${person.first_name} gece vardiyasına atandı (2+2+2 rotasyon)`
                );
              }
            }

            // Eğer personel atanmadıysa izin günü yap (RO Group 2+2+2)
            if (!assigned) {
              console.log(
                `😴 ${person.first_name} bu gün izin günü - İzin Günü atanıyor (atanmadı)`
              );
              workingPersonnel.push({
                person,
                shiftType: "YI", // Yıllık İzin (constraint uyumlu)
                shiftTypeId: "off-day",
                shiftTypeName: "İzin Günü",
                startTime: "00:00",
                endTime: "00:00", // 00:00-00:00 = çalışmıyor
                duration: 0,
                breakDuration: 0,
              });
            }
          }

          // Kalan personelleri otomatik atama ile doldur
          for (const person of availablePersonnel) {
            // RO Group 2+2+2: Her personel rotasyonda olmalı, break yok

            let shiftType = "day";
            let shiftTypeId = null;
            let shiftTypeName = "";
            let startTime = shiftTimes.day.start;
            let endTime = shiftTimes.day.end;
            let duration = shiftTimes.day.duration;

            if (dayShiftCount > 0 && selectedDayShift) {
              shiftType = "1"; // Özel güvenlik sektörü standartları
              shiftTypeId = selectedDayShift.id;
              shiftTypeName = selectedDayShift.name;
              startTime = selectedDayShift.start_time || shiftTimes.day.start;
              endTime = selectedDayShift.end_time || shiftTimes.day.end;
              duration = selectedDayShift.duration || shiftTimes.day.duration;
              dayShiftCount--;
              console.log(
                `🤖 ${person.first_name} otomatik ${selectedDayShift.name} vardiyasına atandı`
              );
            } else if (
              eveningShiftCount > 0 &&
              selectedEveningShift &&
              selectedShiftSystem &&
              (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
            ) {
              shiftType = "evening";
              shiftTypeId = selectedEveningShift.id;
              shiftTypeName = selectedEveningShift.name;
              startTime =
                selectedEveningShift.start_time ||
                shiftTimes.evening?.start ||
                "16:00";
              endTime =
                selectedEveningShift.end_time ||
                shiftTimes.evening?.end ||
                "00:00";
              duration =
                selectedEveningShift.duration ||
                shiftTimes.evening?.duration ||
                8;
              eveningShiftCount--;
              console.log(
                `🤖 ${person.first_name} otomatik ${selectedEveningShift.name} vardiyasına atandı`
              );
            } else if (nightShiftCount > 0 && selectedNightShift) {
              shiftType = "2"; // Özel güvenlik sektörü standartları
              shiftTypeId = selectedNightShift.id;
              shiftTypeName = selectedNightShift.name;
              startTime =
                selectedNightShift.start_time || shiftTimes.night.start;
              endTime = selectedNightShift.end_time || shiftTimes.night.end;
              duration =
                selectedNightShift.duration || shiftTimes.night.duration;
              nightShiftCount--;
              console.log(
                `🤖 ${person.first_name} otomatik ${selectedNightShift.name} vardiyasına atandı`
              );
            } else {
              // Günlük rotasyon - vardiya tiplerini kullan
              if (
                selectedShiftSystem &&
                (selectedShiftSystem.system_type as string) === "8_hour_3_shift"
              ) {
                // 8 saatlik sistem: 3 vardiya rotasyonu
                const shiftIndex = day % 3;
                if (shiftIndex === 0 && selectedDayShift) {
                  shiftType = "day";
                  shiftTypeId = selectedDayShift.id;
                  shiftTypeName = selectedDayShift.name;
                  startTime =
                    selectedDayShift.start_time || shiftTimes.day.start;
                  endTime = selectedDayShift.end_time || shiftTimes.day.end;
                  duration =
                    selectedDayShift.duration || shiftTimes.day.duration;
                } else if (shiftIndex === 1 && selectedEveningShift) {
                  shiftType = "evening";
                  shiftTypeId = selectedEveningShift.id;
                  shiftTypeName = selectedEveningShift.name;
                  startTime =
                    selectedEveningShift.start_time ||
                    shiftTimes.evening?.start ||
                    "16:00";
                  endTime =
                    selectedEveningShift.end_time ||
                    shiftTimes.evening?.end ||
                    "00:00";
                  duration =
                    selectedEveningShift.duration ||
                    shiftTimes.evening?.duration ||
                    8;
                } else if (shiftIndex === 2 && selectedNightShift) {
                  shiftType = "night";
                  shiftTypeId = selectedNightShift.id;
                  shiftTypeName = selectedNightShift.name;
                  startTime =
                    selectedNightShift.start_time || shiftTimes.night.start;
                  endTime = selectedNightShift.end_time || shiftTimes.night.end;
                  duration =
                    selectedNightShift.duration || shiftTimes.night.duration;
                }
              } else {
                // 12 saatlik sistem: 2+2+2 rotasyonu (RO Group önerisi - Özel güvenlik sektörü standartları)
                // Her personel 6 günlük döngüde: 2 gün gündüz, 2 gün gece, 2 gün izin
                const personIndex = availablePersonnel.indexOf(person);
                const cycleDay = day % 6; // 6 günlük döngü
                const personCycleDay = (cycleDay + personIndex) % 6;

                if (personCycleDay < 2) {
                  // İlk 2 gün: Gündüz vardiyası (08:00-20:00)
                  if (selectedDayShift) {
                    shiftType = "1";
                    shiftTypeId = selectedDayShift.id;
                    shiftTypeName = selectedDayShift.name;
                    startTime = selectedDayShift.start_time || "08:00";
                    endTime = selectedDayShift.end_time || "20:00";
                    duration = selectedDayShift.duration || 12;
                  }
                } else if (personCycleDay < 4) {
                  // Sonraki 2 gün: Gece vardiyası (20:00-08:00)
                  if (selectedNightShift) {
                    shiftType = "2";
                    shiftTypeId = selectedNightShift.id;
                    shiftTypeName = selectedNightShift.name;
                    startTime = selectedNightShift.start_time || "20:00";
                    endTime = selectedNightShift.end_time || "08:00";
                    duration = selectedNightShift.duration || 12;
                  }
                } else {
                  // Son 2 gün: İzin günü
                  shiftType = "HT";
                  shiftTypeId = "off-day";
                  shiftTypeName = "Hafta Tatili";
                  startTime = "00:00";
                  endTime = "00:00";
                  duration = 0;
                }
              }
              console.log(
                `🔄 ${person.first_name} günlük rotasyon ile ${shiftTypeName} vardiyasına atandı`
              );
            }

            workingPersonnel.push({
              person,
              shiftType,
              shiftTypeId,
              shiftTypeName,
              startTime,
              endTime,
              duration,
              breakDuration:
                shiftType === "day"
                  ? selectedDayShift?.break_duration || 0
                  : selectedNightShift?.break_duration || 0,
            });
          }

          // Çalışan personelleri atamalara ekle
          workingPersonnel.forEach(
            ({
              person,
              shiftType,
              shiftTypeId,
              shiftTypeName,
              startTime,
              endTime,
              duration,
            }) => {
              // DEBUG: İzin günleri kontrolü
              if (
                shiftTypeId === "off-day" ||
                (startTime === "00:00" && endTime === "00:00")
              ) {
                console.log(
                  `🔍 İzin günü database'e yazılıyor - Personel: ${person.first_name}, shiftType: ${shiftType}, shiftTypeId: ${shiftTypeId}`
                );
              }

              // İzin günleri için özel işlem
              if (
                shiftTypeId === "off-day" ||
                (startTime === "00:00" && endTime === "00:00")
              ) {
                // Hafta tatili olarak işaretle
                assignments.push({
                  schedule_id: scheduleId,
                  personnel_id: person.id,
                  duty_date: `${selectedYear}-${selectedMonth
                    .toString()
                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                  shift_type: "day", // Constraint için gerekli
                  start_time: "00:00", // İzin günü için 00:00
                  end_time: "00:00", // İzin günü için 00:00
                  is_weekend: isWeekend,
                  is_holiday: true, // Hafta tatili işareti
                  notes: "Hafta Tatili",
                  created_by: currentUser,
                });
              } else if ((person as any).isJoker) {
                // Joker personel ataması
                const jokerPerson = person as any;
                assignments.push({
                  schedule_id: scheduleId,
                  personnel_id:
                    jokerPerson.originalPersonnel?.id || jokerPerson.id, // Orijinal personel ID'si
                  duty_date: `${selectedYear}-${selectedMonth
                    .toString()
                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                  shift_type:
                    shiftType === "1" || shiftType === "day"
                      ? "day"
                      : shiftType === "2" || shiftType === "night"
                      ? "night"
                      : "day", // Default to day
                  start_time: startTime,
                  end_time: endTime,
                  is_weekend: isWeekend,
                  is_joker: true,
                  joker_personnel_id: jokerPerson.id, // Joker personel ID'si
                  joker_info: {
                    name: `${jokerPerson.first_name} ${jokerPerson.last_name}`,
                    phone: jokerPerson.phone || "",
                    id_number: jokerPerson.id_number || "",
                    company_name: jokerPerson.company_name || "",
                  },
                  original_personnel_id: jokerPerson.originalPersonnel?.id,
                  original_shift_type: jokerPerson.originalPersonnel
                    ? "day" // Joker için varsayılan gündüz vardiyası
                    : "day",
                  notes: `Joker: ${jokerPerson.first_name} ${
                    jokerPerson.last_name
                  } (${jokerPerson.originalLeaveType || "İzin"})`,
                  created_by: currentUser,
                });
              } else {
                // Normal vardiya ataması
                assignments.push({
                  schedule_id: scheduleId,
                  personnel_id: person.id,
                  duty_date: `${selectedYear}-${selectedMonth
                    .toString()
                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                  shift_type:
                    shiftType === "1" || shiftType === "day"
                      ? "day"
                      : shiftType === "2" || shiftType === "night"
                      ? "night"
                      : shiftType === "evening"
                      ? "day" // Map evening to day for now, or update constraint to include 'evening'
                      : shiftType === "YI" ||
                        shiftType === "M" ||
                        shiftType === "MI" ||
                        shiftType === "DR" ||
                        shiftType === "BT" ||
                        shiftType === "EI" ||
                        shiftType === "ÖI" ||
                        shiftType === "DI" ||
                        shiftType === "DG" ||
                        shiftType === "HT"
                      ? "day" // Map leave types to day for now
                      : "day", // Default to day for any other values
                  start_time: startTime,
                  end_time: endTime,
                  is_weekend: isWeekend,
                  created_by: currentUser,
                });
              }
            }
          );
        }

        // 24 saat kontrolü: Her gün için en az 1 personelin aktif çalışması gerekiyor
        // DEVRE DIŞI: Manuel atamaları bozmasın
        console.log(
          "🔍 24 saat kontrolü devre dışı bırakıldı (manuel atamaları korumak için)"
        );
        /*
        for (let day = 1; day <= daysInMonth; day++) {
          const dayAssignments = assignments.filter(
            (a) =>
              a.duty_date ===
              `${selectedYear}-${selectedMonth
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
          );

          // Aktif çalışan personel sayısı (izin günü olmayanlar)
          const activePersonnel = dayAssignments.filter(
            (a) =>
              !a.is_holiday &&
              !(a.start_time === "00:00" && a.end_time === "00:00") &&
              a.notes !== "Hafta Tatili"
          );

          console.log(
            `📅 Gün ${day}: Toplam ${dayAssignments.length} atama, ${activePersonnel.length} aktif personel`
          );

          // Eğer hiç aktif personel yoksa, otomatik olarak bir personel ata
          if (activePersonnel.length === 0) {
            console.log(
              `⚠️ Gün ${day} için hiç aktif personel yok! Otomatik atama yapılıyor...`
            );

            // İzin günü olmayan personelleri bul
            const availablePersonnel = personnel.filter((person) => {
              const personDayAssignment = dayAssignments.find(
                (a) => a.personnel_id === person.id
              );
              return (
                !personDayAssignment ||
                personDayAssignment.is_holiday ||
                (personDayAssignment.start_time === "00:00" &&
                  personDayAssignment.end_time === "00:00") ||
                personDayAssignment.notes === "Hafta Tatili"
              );
            });

            if (availablePersonnel.length > 0) {
              // İlk müsait personeli gündüz vardiyasına ata
              const personToAssign = availablePersonnel[0];
              const selectedDayShift =
                dayShifts.length > 0 ? dayShifts[0] : null;

              if (selectedDayShift) {
                // Mevcut izin atamasını kaldır
                const existingAssignmentIndex = assignments.findIndex(
                  (a) =>
                    a.personnel_id === personToAssign.id &&
                    a.duty_date ===
                      `${selectedYear}-${selectedMonth
                        .toString()
                        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`
                );

                if (existingAssignmentIndex !== -1) {
                  assignments.splice(existingAssignmentIndex, 1);
                }

                // Yeni aktif atama ekle
                assignments.push({
                  schedule_id: scheduleId,
                  personnel_id: personToAssign.id,
                  duty_date: `${selectedYear}-${selectedMonth
                    .toString()
                    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                  shift_type: "day",
                  start_time:
                    selectedDayShift.start_time || shiftTimes.day.start,
                  end_time: selectedDayShift.end_time || shiftTimes.day.end,
                  is_weekend:
                    new Date(selectedYear, selectedMonth - 1, day).getDay() ===
                      0 ||
                    new Date(selectedYear, selectedMonth - 1, day).getDay() ===
                      6,
                  created_by: currentUser,
                });

                console.log(
                  `✅ ${personToAssign.first_name} ${personToAssign.last_name} gün ${day} için otomatik olarak gündüz vardiyasına atandı`
                );
              }
            } else {
              console.log(`❌ Gün ${day} için müsait personel bulunamadı!`);
            }
          }
        }
        */

        // Yeni atamaları kaydet
        console.log("💾 Oluşturulan atama sayısı:", assignments.length);
        if (assignments.length > 0) {
          setGenerationStep("💾 Atamalar veritabanına kaydediliyor...");
          console.log("💾 Atamalar veritabanına kaydediliyor...");
          const { error: assignmentError } = await supabaseAdmin
            .from("duty_assignments")
            .insert(assignments);

          if (assignmentError) {
            console.error("❌ Error creating assignments:", assignmentError);
            setError(
              "Atamalar oluşturulurken hata: " + assignmentError.message
            );
            return;
          }
          console.log("✅ Atamalar başarıyla kaydedildi!");
        } else {
          console.log("⚠️ Hiç atama oluşturulmadı!");
        }

        // Çizelgeleri yeniden yükle
        setGenerationStep("🔄 Çizelgeler yeniden yükleniyor...");
        console.log("🔄 Çizelgeler yeniden yükleniyor...");
        await fetchSchedules();
        setGenerationStep("🎉 İşlem tamamlandı!");
        console.log("🎉 İşlem tamamlandı!");
      } catch (err) {
        console.error("Error generating schedule:", err);
        setError("Çizelge oluşturulurken hata oluştu");
      } finally {
        setSchedulesLoading(false);
        setGeneratingSchedule(false);
        setGenerationStep("");
      }
    } catch (error) {
      console.error("❌ generateSchedule genel hatası:", error);
      setError("Çizelge oluşturulamadı: " + (error as Error).message);
      setSchedulesLoading(false);
      setGeneratingSchedule(false);
      setGenerationStep("");
    }
  };

  // Joker personel ekle
  const addJokerPersonnel = (date: string, originalPersonnelId?: string) => {
    console.log(
      "🔍 addJokerPersonnel çağrıldı, date:",
      date,
      "originalPersonnelId:",
      originalPersonnelId
    );
    const jokerInfo = {
      name: "",
      phone: "",
      id_number: "",
      company_name: "",
    };

    const newAssignment: DutyAssignment = {
      id: `joker-${date}-${Date.now()}`, // Unique ID için timestamp ekle
      personnel_id: "",
      date,
      shift_type: "day", // Database constraint'i için "day" kullan
      is_joker: true,
      joker_info: jokerInfo,
      originalPersonnelId: originalPersonnelId, // Orijinal personel ID'sini sakla
    };

    console.log("🔍 newAssignment:", newAssignment);
    setEditingAssignment(newAssignment);
    setAssignmentType("joker");
    setOpenDialog(true);
  };

  // Joker hesaplama fonksiyonları
  const fetchJokerCalculations = async () => {
    if (!tenant?.id || !selectedProject?.id) return;

    setJokerLoading(true);
    try {
      const { data, error } = await supabase
        .from("joker_calculations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("project_id", selectedProject.id)
        .eq("calculation_year", selectedYear)
        .eq("calculation_month", selectedMonth)
        .order("excess_overtime", { ascending: false });

      if (error) throw error;
      setJokerCalculations(data || []);
    } catch (error) {
      console.error("Joker hesaplamaları yüklenirken hata:", error);
      setError("Joker hesaplamaları yüklenemedi");
    } finally {
      setJokerLoading(false);
    }
  };

  const calculateJokerNeeds = async () => {
    if (!tenant?.id || !selectedProject?.id) return;

    try {
      setJokerLoading(true);

      // Veritabanı fonksiyonunu çağır
      const { data, error } = await supabase.rpc(
        "create_joker_calculations_for_month",
        {
          tenant_id_param: tenant.id,
          project_id_param: selectedProject.id,
          year_param: selectedYear,
          month_param: selectedMonth,
        }
      );

      if (error) throw error;

      // Hesaplamaları yeniden yükle
      await fetchJokerCalculations();
      await fetchJokerStatistics();
    } catch (error) {
      console.error("Joker hesaplaması yapılırken hata:", error);
      setError("Joker hesaplaması yapılamadı");
    } finally {
      setJokerLoading(false);
    }
  };

  const fetchJokerStatistics = async () => {
    if (!tenant?.id || !selectedProject?.id) return;

    try {
      const { data, error } = await supabase.rpc("get_joker_statistics", {
        tenant_id_param: tenant.id,
        project_id_param: selectedProject.id,
        year_param: selectedYear,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setJokerStatistics(data[0]);
      }
    } catch (error) {
      console.error("Joker istatistikleri yüklenirken hata:", error);
    }
  };

  const assignJokerToCalculation = async (
    calculationId: string,
    jokerId: string,
    hours: number
  ) => {
    try {
      const { error } = await supabase.rpc("assign_joker_to_calculation", {
        calculation_id_param: calculationId,
        joker_id_param: jokerId,
        assigned_hours_param: hours,
      });

      if (error) throw error;

      // Hesaplamaları yeniden yükle
      await fetchJokerCalculations();
    } catch (error) {
      console.error("Joker atanırken hata:", error);
      throw error;
    }
  };

  const approveJokerCalculation = async (calculationId: string) => {
    try {
      const { error } = await supabase
        .from("joker_calculations")
        .update({
          status: "approved",
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", calculationId);

      if (error) throw error;

      // Hesaplamaları yeniden yükle
      await fetchJokerCalculations();
    } catch (error) {
      console.error("Joker hesaplaması onaylanırken hata:", error);
      throw error;
    }
  };

  // Vardiya sistemi fonksiyonları
  const fetchShiftSystems = async () => {
    if (!tenant?.id) return;

    setShiftSystemLoading(true);
    try {
      // Tenant bazında tüm aktif vardiya sistemlerini yükle (proje bazında değil)
      const { data, error } = await supabase.rpc("get_shift_system_info", {
        tenant_id_param: tenant.id,
        project_id_param: null, // null = tüm sistemleri getir
      });

      if (error) throw error;

      const transformedData = (data || []).map((system: any) => ({
        system_id: system.system_id,
        system_name: system.system_name,
        system_type: system.system_type,
        description: system.description,
        shift_count: system.shift_count,
        shift_duration: system.shift_duration,
        total_daily_hours: system.total_daily_hours,
        is_active: system.is_active,
        is_default: system.is_default,
        shift_details: system.shift_details || [],
      }));

      setShiftSystems(transformedData);

      // Debug log
      console.log("🔍 Yüklenen vardiya sistemleri:", transformedData);
      console.log(
        "🔍 Varsayılan sistem:",
        transformedData.find((s: any) => s.is_default)
      );

      // Eğer henüz seçili sistem yoksa varsayılan sistemi seç
      if (!selectedShiftSystem) {
        const defaultSystem = transformedData.find((s: any) => s.is_default);
        if (defaultSystem) {
          setSelectedShiftSystem(defaultSystem);
          console.log(
            "✅ Varsayılan sistem seçildi:",
            defaultSystem.system_type
          );
        } else {
          console.log("❌ Varsayılan sistem bulunamadı!");
        }
      }
    } catch (error) {
      console.error("Vardiya sistemleri yüklenirken hata:", error);
      setError("Vardiya sistemleri yüklenemedi");
    } finally {
      setShiftSystemLoading(false);
    }
  };

  const createShiftSystem = async (systemType: string, systemName?: string) => {
    if (!tenant?.id || !selectedProject?.id) return;

    try {
      setShiftSystemLoading(true);

      let functionName = "";
      let params: any = {
        tenant_id_param: tenant.id,
        project_id_param: selectedProject.id,
      };

      switch (systemType) {
        case "8_hour_3_shift":
          functionName = "create_8_hour_3_shift_system";
          if (systemName) params.system_name_param = systemName;
          break;
        case "12_hour_2_shift":
          functionName = "create_12_hour_2_shift_system";
          if (systemName) params.system_name_param = systemName;
          break;
        case "12_36_shift":
          functionName = "create_12_36_shift_system";
          if (systemName) params.system_name_param = systemName;
          break;
        default:
          throw new Error("Geçersiz vardiya sistemi türü");
      }

      const { data, error } = await supabase.rpc(functionName, params);

      if (error) throw error;

      // Sistemleri yeniden yükle
      await fetchShiftSystems();

      return data;
    } catch (error) {
      console.error("Vardiya sistemi oluşturulurken hata:", error);
      throw error;
    } finally {
      setShiftSystemLoading(false);
    }
  };

  const updateShiftSystem = async (
    systemId: string,
    updates: Partial<ShiftSystem>
  ) => {
    try {
      const { error } = await supabase
        .from("shift_systems")
        .update(updates)
        .eq("id", systemId);

      if (error) throw error;

      // Sistemleri yeniden yükle
      await fetchShiftSystems();
    } catch (error) {
      console.error("Vardiya sistemi güncellenirken hata:", error);
      throw error;
    }
  };

  const deleteShiftSystem = async (systemId: string) => {
    try {
      const { error } = await supabase
        .from("shift_systems")
        .delete()
        .eq("id", systemId);

      if (error) throw error;

      // Sistemleri yeniden yükle
      await fetchShiftSystems();
    } catch (error) {
      console.error("Vardiya sistemi silinirken hata:", error);
      throw error;
    }
  };

  const setDefaultShiftSystem = async (systemId: string) => {
    try {
      // Önce tüm sistemlerin default'unu false yap
      await supabase
        .from("shift_systems")
        .update({ is_default: false })
        .eq("tenant_id", tenant?.id)
        .eq("project_id", selectedProject?.id);

      // Seçilen sistemi default yap
      await supabase
        .from("shift_systems")
        .update({ is_default: true })
        .eq("id", systemId);

      // Sistemleri yeniden yükle
      await fetchShiftSystems();
    } catch (error) {
      console.error("Varsayılan vardiya sistemi ayarlanırken hata:", error);
      throw error;
    }
  };

  // 8 saatlik 3'lü vardiya için özel çizelge oluşturma
  const generate8Hour3ShiftSchedule = async () => {
    console.log("🚀 generate8Hour3ShiftSchedule başladı!");
    console.log("📊 Personel sayısı:", personnel.length);
    console.log("📊 Vardiya sistemi:", selectedShiftSystem);
    console.log("📊 Vardiya başına kişi:", personnelPerShift);

    if (
      !selectedShiftSystem ||
      selectedShiftSystem.system_type !== "8_hour_3_shift"
    ) {
      setError("8 saatlik 3'lü vardiya sistemi seçili değil!");
      setGeneratingSchedule(false);
      return;
    }

    if (!personnel.length) {
      setError("Personel listesi boş!");
      setGeneratingSchedule(false);
      return;
    }

    // 8 saatlik 3'lü vardiya için minimum personel kontrolü
    const requiredPersonnel = 3 * personnelPerShift; // 3 vardiya x vardiya başına kişi
    if (personnel.length < requiredPersonnel) {
      setError(
        `8 saatlik 3'lü vardiya sistemi için minimum ${requiredPersonnel} personel gerekiyor! Mevcut: ${personnel.length}. Lütfen daha fazla personel ekleyin veya vardiya başına personel sayısını azaltın.`
      );
      setGeneratingSchedule(false);
      return;
    }

    try {
      setSchedulesLoading(true);
      setError(null);

      // Mevcut çizelgeyi kontrol et
      const existingSchedule = schedules.find(
        (s) => s.month === selectedMonth && s.year === selectedYear
      );

      if (existingSchedule) {
        // Mevcut atamaları sil
        const { error: deleteError } = await supabaseAdmin
          .from("duty_assignments")
          .delete()
          .eq("schedule_id", existingSchedule.id);

        if (deleteError) throw deleteError;
      }

      const scheduleId = existingSchedule?.id || (await createSchedule());

      setGenerationStep(
        "🕐 8 saatlik 3'lü vardiya algoritması hazırlanıyor..."
      );

      // 8 saatlik 3'lü vardiya algoritması - Düzenli Rotasyon Sistemi
      const shiftDetails = selectedShiftSystem.shift_details;
      const assignments: any[] = [];
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // Her personel için 7 günlük döngüsel pattern oluştur
      // Vardiya başına kişi sayısına göre dinamik pattern oluştur
      const createPersonnelPattern = (personIndex: number) => {
        // Her vardiya için kaç kişi çalışacağını hesapla
        const peoplePerShift = personnelPerShift;
        const totalWorkingPeople = 3 * peoplePerShift; // 3 vardiya x vardiya başına kişi

        // Her gün kaç kişi izin yapacağını hesapla
        const peopleOnLeave = personnel.length - totalWorkingPeople;

        // Pattern oluştur: Her personel için 7 günlük döngü
        const pattern = [];
        for (let day = 0; day < 7; day++) {
          const dayIndex = (personIndex + day) % 7;

          // İlk personeller çalışır, sonrakiler izin yapar
          if (dayIndex < totalWorkingPeople) {
            // Vardiya türünü belirle (1: gündüz, 2: akşam, 3: gece)
            const shiftType = Math.floor(dayIndex / peoplePerShift) + 1;
            pattern.push(shiftType);
          } else {
            // İzin günü
            pattern.push(0);
          }
        }

        return pattern;
      };

      // Aylık çalışma günü hesaplama fonksiyonu
      const calculateMonthlyWorkingDays = (
        pattern: number[],
        daysInMonth: number
      ) => {
        const workingDaysPerWeek = pattern.filter((day) => day !== 0).length; // 0 = izin günü
        const fullWeeks = Math.floor(daysInMonth / 7);
        const remainingDays = daysInMonth % 7;

        let totalWorkingDays = fullWeeks * workingDaysPerWeek;

        // Kalan günler için çalışma günü sayısını hesapla
        for (let i = 0; i < remainingDays; i++) {
          if (pattern[i] !== 0) {
            totalWorkingDays++;
          }
        }

        return totalWorkingDays;
      };

      // Her personel için günlük atamaları hesapla
      for (let personIndex = 0; personIndex < personnel.length; personIndex++) {
        const person = personnel[personIndex];
        const pattern = createPersonnelPattern(personIndex);
        const monthlyWorkingDays = calculateMonthlyWorkingDays(
          pattern,
          daysInMonth
        );

        console.log(
          `Personel ${person.first_name} ${person.last_name} pattern:`,
          pattern
        );
        console.log(
          `Personel ${person.first_name} ${person.last_name} aylık çalışma günü:`,
          monthlyWorkingDays
        );

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(selectedYear, selectedMonth - 1, day);
          const isWeekend =
            currentDate.getDay() === 0 || currentDate.getDay() === 6;

          // Pattern'den günlük vardiya türünü al (7 günlük döngü)
          const patternDay = (day - 1) % 7;
          const shiftType = pattern[patternDay];

          // 0 = İzin günü (T)
          if (shiftType === 0) {
            assignments.push({
              schedule_id: scheduleId,
              personnel_id: person.id,
              duty_date: `${selectedYear}-${selectedMonth
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              shift_type: "day", // Constraint için
              start_time: "00:00",
              end_time: "00:00",
              is_weekend: isWeekend,
              is_holiday: true,
              notes: "Hafta Tatili (İzin)",
              created_by: (await supabase.auth.getUser()).data.user?.id,
            });
            continue;
          }

          // Vardiya türüne göre shift detayını bul
          const shift = shiftDetails.find((s) => {
            if (shiftType === 1) return s.shift_type === "day";
            if (shiftType === 2) return s.shift_type === "evening";
            if (shiftType === 3) return s.shift_type === "night";
            return false;
          });

          if (!shift) {
            console.warn(
              `Shift bulunamadı: shiftType=${shiftType}, day=${day}`
            );
            continue;
          }

          // Debug log
          if (day <= 7) {
            console.log(
              `8H3S - Gün: ${day}, Personel: ${person.first_name} ${person.last_name}, ShiftType: ${shift.shift_type} (${shiftType})`
            );
          }

          const userResult = await supabase.auth.getUser();

          assignments.push({
            schedule_id: scheduleId,
            personnel_id: person.id,
            duty_date: `${selectedYear}-${selectedMonth
              .toString()
              .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
            shift_type:
              shift.shift_type === "evening" ? "day" : shift.shift_type, // evening'i day'e map et (constraint için)
            start_time: shift.start_time,
            end_time: shift.end_time,
            is_weekend: isWeekend,
            is_holiday: false,
            notes:
              shift.shift_type === "evening"
                ? `${shift.shift_name} - ${shift.duration} saat - EVENING_SHIFT`
                : `${shift.shift_name} - ${shift.duration} saat`,
            created_by: userResult.data.user?.id,
          });
        }
      }

      // 24/7 kapsama kontrolü - Her gün her vardiyada en az bir personel olmalı
      const coverageCheck = () => {
        const dailyCoverage: { [key: string]: { [key: string]: number } } = {};

        assignments.forEach((assignment) => {
          if (!assignment.is_holiday) {
            const dayKey = assignment.duty_date;
            const shiftKey = assignment.shift_type;

            if (!dailyCoverage[dayKey]) {
              dailyCoverage[dayKey] = { day: 0, evening: 0, night: 0 };
            }

            if (assignment.shift_type === "evening") {
              dailyCoverage[dayKey].evening++;
            } else {
              dailyCoverage[dayKey][shiftKey]++;
            }
          }
        });

        // Kapsama eksikliklerini kontrol et
        const coverageIssues: string[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dayKey = `${selectedYear}-${selectedMonth
            .toString()
            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
          const coverage = dailyCoverage[dayKey];

          if (
            !coverage ||
            coverage.day === 0 ||
            coverage.evening === 0 ||
            coverage.night === 0
          ) {
            coverageIssues.push(
              `Gün ${day}: Gündüz=${coverage?.day || 0}, Akşam=${
                coverage?.evening || 0
              }, Gece=${coverage?.night || 0}`
            );
          }
        }

        if (coverageIssues.length > 0) {
          console.warn("⚠️ Kapsama eksiklikleri:", coverageIssues);
        } else {
          console.log("✅ 24/7 kapsama sağlandı!");
        }

        return coverageIssues;
      };

      // Kapsama kontrolü yap
      const coverageIssues = coverageCheck();

      // Atamaları veritabanına kaydet
      if (assignments.length > 0) {
        const { error: assignmentError } = await supabaseAdmin
          .from("duty_assignments")
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      // Çizelgeleri yeniden yükle
      await fetchSchedules();

      setCurrentDate(new Date());
    } catch (err) {
      console.error(
        "8 saatlik 3'lü vardiya çizelgesi oluşturulurken hata:",
        err
      );
      setError("Çizelge oluşturulamadı: " + (err as Error).message);
    } finally {
      setSchedulesLoading(false);
      setGeneratingSchedule(false);
      setGenerationStep("");
    }
  };

  // 12/36 saatlik vardiya için özel çizelge oluşturma
  const generate12_36ShiftSchedule = async () => {
    if (
      !selectedShiftSystem ||
      selectedShiftSystem.system_type !== "12_36_shift"
    ) {
      setError("12/36 saatlik vardiya sistemi seçili değil!");
      setGeneratingSchedule(false);
      return;
    }

    if (!personnel.length) {
      setError("Personel listesi boş!");
      setGeneratingSchedule(false);
      return;
    }

    try {
      setSchedulesLoading(true);
      setError(null);

      // Mevcut çizelgeyi kontrol et
      const existingSchedule = schedules.find(
        (s) => s.month === selectedMonth && s.year === selectedYear
      );

      if (existingSchedule) {
        // Mevcut atamaları sil
        const { error: deleteError } = await supabaseAdmin
          .from("duty_assignments")
          .delete()
          .eq("schedule_id", existingSchedule.id);

        if (deleteError) throw deleteError;
      }

      const scheduleId = existingSchedule?.id || (await createSchedule());

      // 12/36 saatlik vardiya algoritması
      const shiftDetails = selectedShiftSystem.shift_details;
      const assignments: any[] = [];
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // 12/36 sistemi: Her personel 12 saat çalışır, 36 saat dinlenir
      // 48 saatlik döngü: 12 saat çalışma + 36 saat dinlenme
      const cycleHours = 48; // 12 + 36
      const workHours = 12;
      const restHours = 36;

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(selectedYear, selectedMonth - 1, day);
        const isWeekend =
          currentDate.getDay() === 0 || currentDate.getDay() === 6;

        // Her personel için 48 saatlik döngüdeki pozisyonunu hesapla
        const userResult = await supabase.auth.getUser();

        for (
          let personIndex = 0;
          personIndex < personnel.length;
          personIndex++
        ) {
          const person = personnel[personIndex];
          // Personel bazlı döngü başlangıcı (her personel farklı zamanda başlar)
          const personCycleStart = personIndex * 12; // Her personel 12 saat arayla başlar

          // Günün başlangıcından itibaren geçen saatler
          const hoursFromMonthStart = (day - 1) * 24;

          // Bu personelin döngüdeki pozisyonu
          const cyclePosition =
            (hoursFromMonthStart + personCycleStart) % cycleHours;

          // Çalışma döneminde mi kontrol et
          const isWorkingPeriod = cyclePosition < workHours;

          if (isWorkingPeriod && shiftDetails.length > 0) {
            // 12/36 sisteminde personel döngüsel olarak 3 vardiya yapar
            const shiftIndex = cyclePosition % 3; // 0, 1, 2 döngüsü

            let shiftType, startTime, endTime, shiftName;

            if (shiftIndex === 0) {
              // Gündüz vardiyası
              shiftType = "day";
              startTime = "08:00";
              endTime = "20:00";
              shiftName = "Gündüz Vardiyası";
            } else if (shiftIndex === 1) {
              // Gece vardiyası
              shiftType = "night";
              startTime = "20:00";
              endTime = "08:00";
              shiftName = "Gece Vardiyası";
            } else {
              // Akşam vardiyası
              shiftType = "evening";
              startTime = "16:00";
              endTime = "00:00";
              shiftName = "Akşam Vardiyası";
            }

            // Debug log
            console.log(
              `12/36 Sistemi - Personel: ${person.first_name} ${person.last_name}, Gün: ${day}, CyclePosition: ${cyclePosition}, shiftIndex: ${shiftIndex}, shiftType: ${shiftType}`
            );

            assignments.push({
              schedule_id: scheduleId,
              personnel_id: person.id,
              duty_date: `${selectedYear}-${selectedMonth
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              shift_type: shiftType,
              start_time: startTime,
              end_time: endTime,
              is_weekend: isWeekend,
              is_holiday: false,
              notes: `${shiftName} - 12/36 Sistemi (12 saat)`,
              created_by: userResult.data.user?.id,
            });
          } else {
            // Dinlenme dönemi - izin günü
            assignments.push({
              schedule_id: scheduleId,
              personnel_id: person.id,
              duty_date: `${selectedYear}-${selectedMonth
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              shift_type: "day", // HT (Hafta Tatili) için day kullan
              start_time: "00:00",
              end_time: "00:00",
              is_weekend: isWeekend,
              is_holiday: true,
              notes: "12/36 Sistemi - Dinlenme Dönemi",
              created_by: userResult.data.user?.id,
            });
          }
        }
      }

      // Atamaları veritabanına kaydet
      if (assignments.length > 0) {
        const { error: assignmentError } = await supabaseAdmin
          .from("duty_assignments")
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      // Çizelgeleri yeniden yükle
      await fetchSchedules();

      setCurrentDate(new Date());
    } catch (err) {
      console.error(
        "12/36 saatlik vardiya çizelgesi oluşturulurken hata:",
        err
      );
      setError("Çizelge oluşturulamadı: " + (err as Error).message);
    } finally {
      setSchedulesLoading(false);
      setGeneratingSchedule(false);
      setGenerationStep("");
    }
  };

  // Yazdırma fonksiyonu
  const handlePrint = async () => {
    if (!currentSchedule) {
      setError("Çizelge bulunamadı!");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const monthNames = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    const currentMonth = monthNames[selectedMonth - 1];
    const currentYear = selectedYear;

    // Müşteri logosunu çek
    let logoUrl = "";
    if (tenant?.branding?.logo) {
      logoUrl = tenant.branding.logo;
    }

    // Vardiya kodları
    const shiftCodes =
      selectedShiftSystem?.system_type === "8_hour_3_shift"
        ? [
            { code: "1", time: "08:00 - 16:00", name: "Sabah Vardiyası" },
            { code: "2", time: "16:00 - 00:00", name: "Akşam Vardiyası" },
            { code: "3", time: "00:00 - 08:00", name: "Gece Vardiyası" },
          ]
        : [
            { code: "1", time: "08:00 - 20:00", name: "Gündüz Vardiyası" },
            { code: "2", time: "20:00 - 08:00", name: "Gece Vardiyası" },
          ];

    // Legend için vardiya tipleri - tüm kategoriler
    const legendItems = [
      // ÜCRETSİZ İZİNLER
      { code: "MI", name: "Mazeret İzni", color: "#ff9800", type: "Ücretsiz" },
      { code: "DR", name: "Doktor Raporu", color: "#2196f3", type: "Ücretsiz" },
      { code: "Üİ", name: "Ücretsiz İzin", color: "#03a9f4", type: "Ücretsiz" },
      {
        code: "MG",
        name: "Mazer. Gelmemez",
        color: "#ffeb3b",
        type: "Ücretsiz",
      },

      // ÜCRETLİ İZİNLER
      { code: "YI", name: "Yıllık İzin", color: "#4caf50", type: "Ücretli" },
      { code: "HT", name: "Hafta Tatili", color: "#9c27b0", type: "Ücretli" },
      { code: "M", name: "Mesai", color: "#ffeb3b", type: "Ücretli" },
      { code: "BT", name: "Bayram Tatili", color: "#ff5722", type: "Ücretli" },
      { code: "EI", name: "Evlilik İzni", color: "#4caf50", type: "Ücretli" },
      { code: "ÖI", name: "Ölüm İzni", color: "#607d8b", type: "Ücretli" },
      { code: "DI", name: "Doğum İzni", color: "#e1bee7", type: "Ücretli" },
      { code: "DG", name: "Dış Görev", color: "#ffc107", type: "Ücretli" },
    ];

    // Günlük toplamları hesapla - sadece çalışan personeli say
    const dailyTotals = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const assignments = getAssignmentsForDay(day);
      const workingAssignments = assignments.filter(
        (a) =>
          a.shift_type !== "HT" &&
          !(a.start_time === "00:00" && a.end_time === "00:00") &&
          !a.is_holiday
      );
      dailyTotals.push(workingAssignments.length);
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nöbet Çizelgesi - ${
          selectedProject?.name
        } - ${currentMonth} ${currentYear}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 8px; 
            font-size: 11px;
            line-height: 1.2;
            width: 100%;
            overflow-x: auto;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 10px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .company-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .logo {
            font-weight: bold;
            font-size: 18px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .logo-img {
            max-height: 60px;
            max-width: 180px;
            object-fit: contain;
            filter: brightness(0) invert(1);
          }
          .project-info {
            text-align: center;
            flex: 1;
          }
          .project-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .legend {
            margin: 8px 0;
            display: flex;
            gap: 15px;
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
          }
          .legend-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .legend-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
            text-align: center;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .legend-items {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            font-size: 10px;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
          }
          .legend-color {
            width: 14px;
            height: 14px;
            margin-right: 6px;
            border-radius: 3px;
            border: 1px solid #333;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .schedule-table th,
          .schedule-table td {
            border: 1px solid #e0e0e0;
            padding: 3px 4px;
            text-align: center;
            vertical-align: middle;
          }
          .schedule-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          .personnel-name {
            text-align: left;
            font-weight: bold;
            min-width: 90px;
            max-width: 90px;
            font-size: 9px;
            padding: 3px 4px;
            background: #f8f9fa;
          }
          .shift-cell {
            min-width: 18px;
            max-width: 18px;
            height: 18px;
            position: relative;
            padding: 0;
            border-radius: 3px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .shift-code {
            font-weight: bold;
            font-size: 9px;
            display: block;
            line-height: 1;
            text-align: center;
            vertical-align: middle;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          .shift-1 { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; }
          .shift-2 { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; }
          .shift-3 { background: linear-gradient(135deg, #FF9800, #F57C00); color: white; }
          .shift-YI { background: linear-gradient(135deg, #4caf50, #45a049); color: white; }
          .shift-HT { background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white; }
          .shift-M { background: linear-gradient(135deg, #ffeb3b, #fbc02d); color: #000; }
          .shift-MI { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
          .shift-DR { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; }
          .shift-BT { background: linear-gradient(135deg, #ff5722, #d84315); color: white; }
          .shift-EI { background: linear-gradient(135deg, #4caf50, #45a049); color: white; }
          .shift-ÖI { background: linear-gradient(135deg, #607d8b, #455a64); color: white; }
          .shift-DI { background: linear-gradient(135deg, #e1bee7, #ce93d8); color: #000; }
          .shift-DG { background: linear-gradient(135deg, #ffc107, #ff8f00); color: #000; }
          .shift-Üİ { background: linear-gradient(135deg, #03a9f4, #0288d1); color: white; }
          .shift-MG { background: linear-gradient(135deg, #ffeb3b, #fbc02d); color: #000; }
          .shift-00 { background: linear-gradient(135deg, #f5f5f5, #e0e0e0); color: #000; }
          .totals-row {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            font-weight: bold;
            font-size: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          .shift-codes {
            margin-top: 10px;
            display: flex;
            gap: 20px;
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            align-items: flex-start;
          }
          .shift-code-item {
            display: flex;
            align-items: center;
            margin: 2px 0;
            font-size: 11px;
            background: #f8f9fa;
            padding: 6px 10px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
          }
          .shift-code-number {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 8px;
            font-weight: bold;
            font-size: 11px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 7px;
          }
          .overtime-section {
            margin-top: 10px;
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
          }

          .overtime-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            text-align: center;
          }

          .overtime-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 8px;
          }

          .overtime-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            background: #f8fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .overtime-label {
            font-size: 9px;
            color: #64748b;
            font-weight: 500;
          }

          .overtime-value {
            font-size: 9px;
            color: #1e40af;
            font-weight: bold;
          }

          .overtime-note {
            font-size: 8px;
            color: #6b7280;
            text-align: center;
            font-style: italic;
            margin-top: 6px;
          }

          .manager-section {
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            flex: 1;
            min-width: 150px;
          }
          .manager-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .manager-title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 4px;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .manager-signature {
            width: 120px;
            height: 40px;
            border: 1px dashed #667eea;
            border-radius: 4px;
            margin-bottom: 4px;
            background: #f8f9fa;
          }
          .manager-name {
            font-size: 9px;
            text-align: center;
            color: #666;
            font-weight: 500;
          }
          .software-info {
            font-size: 8px;
            color: #667eea;
            text-align: center;
            font-weight: 500;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            margin-top: 4px;
          }
          .disclaimer {
            margin: 0;
            font-size: 9px;
            text-align: left;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            flex: 1;
            min-width: 200px;
          }
          .day-header {
            font-size: 6px;
            font-weight: normal;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 2px;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .schedule-table { page-break-inside: avoid; }
            .legend { page-break-after: avoid; }
            .header { page-break-after: avoid; }
            .shift-1 { background: #4CAF50 !important; color: white !important; }
            .shift-2 { background: #2196F3 !important; color: white !important; }
            .shift-3 { background: #FF9800 !important; color: white !important; }
            .shift-YI { background: #4caf50 !important; color: white !important; }
            .shift-HT { background: #9c27b0 !important; color: white !important; }
            .shift-M { background: #ffeb3b !important; color: black !important; }
            .shift-MI { background: #ff9800 !important; color: white !important; }
            .shift-DR { background: #2196f3 !important; color: white !important; }
            .shift-BT { background: #ff5722 !important; color: white !important; }
            .shift-EI { background: #4caf50 !important; color: white !important; }
            .shift-ÖI { background: #607d8b !important; color: white !important; }
            .shift-DI { background: #e1bee7 !important; color: black !important; }
            .shift-DG { background: #ffc107 !important; color: black !important; }
            .shift-Üİ { background: #03a9f4 !important; color: white !important; }
            .shift-MG { background: #ffeb3b !important; color: black !important; }
            .legend-color { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header { 
              background: #667eea !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .schedule-table th { 
              background: #667eea !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .totals-row { 
              background: #ff6b6b !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .shift-code-number { 
              background: #667eea !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .legend-title { 
              background: #ff6b6b !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="logo">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />`
                  : tenant?.branding?.company_name ||
                    "GÖZCÜ360° TESİS YÖNETİM HİZMETLERİ"
              }
            </div>
            <div class="project-info">
              <div class="project-title">${selectedProject?.name?.toUpperCase()} AYLIK NÖBET ÇİZELGESİ</div>
              <div><strong>YIL:</strong> ${currentYear} | <strong>AY:</strong> ${currentMonth}</div>
            </div>
            <div></div>
          </div>
        </div>

        <div class="legend">
          <div class="legend-section">
            <div class="legend-title">ÜCRETSİZ</div>
            <div class="legend-items">
              ${legendItems
                .filter((item) => item.type === "Ücretsiz")
                .map(
                  (item) => `
                <div class="legend-item">
                  <div class="legend-color" style="background-color: ${item.color};"></div>
                  <span>${item.code} - ${item.name}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          <div class="legend-section">
            <div class="legend-title">ÜCRETLİ</div>
            <div class="legend-items">
              ${legendItems
                .filter((item) => item.type === "Ücretli")
                .map(
                  (item) => `
                <div class="legend-item">
                  <div class="legend-color" style="background-color: ${item.color};"></div>
                  <span>${item.code} - ${item.name}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <table class="schedule-table">
          <thead>
            <tr>
              <th class="personnel-name">ADI SOYADI</th>
              <th>GÖREVİ</th>
              ${Array.from({ length: daysInMonth }, (_, i) => {
                return `<th>${i + 1}</th>`;
              }).join("")}
              <th>AYLIK ÇALIŞMA İŞ GÜNÜ</th>
            </tr>
          </thead>
          <tbody>
            ${personnel
              .map((person) => {
                const assignments = [];
                let totalDays = 0;

                for (let day = 1; day <= daysInMonth; day++) {
                  const assignment = getAssignmentsForDay(day).find(
                    (a) => a.personnel_id === person.id
                  );
                  if (assignment) {
                    if (
                      assignment.is_holiday ||
                      assignment.notes === "Hafta Tatili" ||
                      (assignment.start_time === "00:00" &&
                        assignment.end_time === "00:00")
                    ) {
                      assignments.push(
                        '<td class="shift-cell shift-HT"><span class="shift-code">HT</span></td>'
                      );
                    } else {
                      let shiftCode = "1"; // Default

                      // Vardiya sistemi tipine göre kod atama
                      console.log("🔍 DETAYLI DEBUG:");
                      console.log(
                        "  - selectedShiftSystem:",
                        selectedShiftSystem
                      );
                      console.log(
                        "  - system_type:",
                        selectedShiftSystem?.system_type
                      );
                      console.log(
                        "  - assignment.shift_type:",
                        assignment.shift_type
                      );
                      console.log("  - assignment.notes:", assignment.notes);

                      // İzin türleri için özel kodlar
                      if (
                        [
                          "MI",
                          "DR",
                          "BT",
                          "EI",
                          "ÖI",
                          "HI",
                          "DI",
                          "BI",
                          "DG",
                          "HT",
                          "Üİ",
                          "MG",
                        ].includes(assignment.shift_type)
                      ) {
                        shiftCode = assignment.shift_type;
                        console.log(
                          `  📋 İzin türü -> shiftCode = '${shiftCode}'`
                        );
                      } else if (assignment.shift_type === "day") {
                        shiftCode = "1"; // Gündüz vardiyası
                        console.log("  ✅ Gündüz vardiyası -> shiftCode = '1'");
                      } else if (assignment.shift_type === "night") {
                        // 12 saatlik 2'li sistemde gece vardiyası "2", 8 saatlik 3'lü sistemde "3"
                        const is8HourSystem =
                          selectedShiftSystem &&
                          (selectedShiftSystem.system_type as string) ===
                            "8_hour_3_shift";
                        shiftCode = is8HourSystem ? "3" : "2";
                        console.log(
                          `  🌙 Gece vardiyası -> is8HourSystem: ${is8HourSystem} -> shiftCode = '${shiftCode}'`
                        );
                      } else if (assignment.shift_type === "evening") {
                        shiftCode = "2"; // Akşam vardiyası (sadece 8 saatlik sistemde)
                        console.log("  🌆 Akşam vardiyası -> shiftCode = '2'");
                      } else if (
                        assignment.shift_type === "1" ||
                        assignment.shift_type === "2" ||
                        assignment.shift_type === "3"
                      ) {
                        shiftCode = assignment.shift_type;
                        console.log(
                          `  🔢 Sayısal vardiya -> shiftCode = '${shiftCode}'`
                        );
                      } else {
                        console.log(
                          "  ❓ Bilinmeyen vardiya tipi:",
                          assignment.shift_type
                        );
                      }

                      console.log("  🎯 Final shiftCode:", shiftCode);

                      assignments.push(
                        `<td class="shift-cell shift-${shiftCode}"><span class="shift-code">${shiftCode}</span></td>`
                      );
                      totalDays++;
                    }
                  } else {
                    assignments.push('<td class="shift-cell shift-00"></td>');
                  }
                }

                return `
                <tr>
                  <td class="personnel-name">${person.first_name} ${
                  person.last_name
                }</td>
                  <td>GÜVENLİK</td>
                  ${assignments.join("")}
                  <td class="totals-row">${totalDays}</td>
                </tr>
              `;
              })
              .join("")}
            ${getJokerPersonnel()
              .map((jokerPerson) => {
                const assignments = [];
                let totalDays = 0;

                for (let day = 1; day <= daysInMonth; day++) {
                  const assignment = getAssignmentsForDay(day).find(
                    (a) =>
                      a.is_joker &&
                      a.joker_info?.name ===
                        `${jokerPerson.first_name} ${jokerPerson.last_name}`.trim()
                  );
                  if (assignment) {
                    // Joker personel için orijinal vardiya türünü kullan
                    let shiftCode = "1"; // Default
                    const shiftTypeToUse =
                      (assignment as any).original_shift_type ||
                      assignment.shift_type;

                    if (
                      [
                        "MI",
                        "DR",
                        "BT",
                        "EI",
                        "ÖI",
                        "HI",
                        "DI",
                        "BI",
                        "DG",
                        "HT",
                        "Üİ",
                        "MG",
                      ].includes(shiftTypeToUse)
                    ) {
                      shiftCode = shiftTypeToUse;
                    } else if (shiftTypeToUse === "day") {
                      shiftCode = "1";
                    } else if (shiftTypeToUse === "night") {
                      const is8HourSystem =
                        selectedShiftSystem &&
                        (selectedShiftSystem.system_type as string) ===
                          "8_hour_3_shift";
                      shiftCode = is8HourSystem ? "3" : "2";
                    } else if (shiftTypeToUse === "evening") {
                      shiftCode = "2";
                    } else if (
                      shiftTypeToUse === "1" ||
                      shiftTypeToUse === "2" ||
                      shiftTypeToUse === "3"
                    ) {
                      shiftCode = shiftTypeToUse as "1" | "2" | "3";
                    }

                    assignments.push(
                      `<td class="shift-cell shift-${shiftCode}"><span class="shift-code">${shiftCode}</span></td>`
                    );
                    totalDays++;
                  } else {
                    assignments.push('<td class="shift-cell shift-00"></td>');
                  }
                }

                return `
                <tr>
                  <td class="personnel-name">${jokerPerson.first_name} ${
                  jokerPerson.last_name
                } (JOKER)</td>
                  <td>GÜVENLİK</td>
                  ${assignments.join("")}
                  <td class="totals-row">${totalDays}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="totals-row">
              <td colspan="2"><strong>GÜNLÜK TOPLAM</strong></td>
              ${dailyTotals
                .map((total) => `<td><strong>${total}</strong></td>`)
                .join("")}
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="shift-codes">
          <div>
            <strong>VARDİYA KODLARI:</strong>
            ${shiftCodes
              .map(
                (code) => `
              <div class="shift-code-item">
                <div class="shift-code-number">${code.code}</div>
                <span>${code.time} - ${code.name}</span>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="disclaimer">
            <p><strong>VARDİYA ÇİZELGESİNDE İZİNSİZ VE ONAYSIZ DEĞİŞİKLİK YAPILMAZ.</strong></p>
            <p><strong>DOKTOR RAPORU ALANLAR AYNI GÜN RAPORLARINI YÖNETİME İLETMEK MECBURİYETİNDEDİRLER.</strong></p>
          </div>
          <div class="manager-section">
            <div class="manager-info">
              <div class="manager-title">PERSONEL MÜDÜRÜ</div>
              <div class="manager-signature"></div>
              <div class="manager-name">Ad Soyad</div>
            </div>
            <div class="software-info">
              Bu çizelge ${new Date().toLocaleDateString(
                "tr-TR"
              )} tarihinde oluşturulmuştur.<br/>
              <strong>${
                tenant?.branding?.software_name || "Gözcü360°"
              }</strong> yazılımı tarafından oluşturuldu...
            </div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Atama düzenle
  const editAssignment = (assignment: DutyAssignment) => {
    console.log("🔍 editAssignment çağrıldı:", assignment);
    console.log("🔍 assignment.is_joker:", assignment.is_joker);
    console.log("🔍 assignment.joker_info:", assignment.joker_info);
    console.log("🔍 assignment.personnel_id:", assignment.personnel_id);
    console.log(
      "🔍 assignment.joker_personnel_id:",
      (assignment as any).joker_personnel_id
    );

    // Tarih bilgisini doğru şekilde set et
    const assignmentWithDate = {
      ...assignment,
      duty_date: assignment.duty_date || assignment.date,
    };
    console.log("🔍 assignmentWithDate:", assignmentWithDate);
    setEditingAssignment(assignmentWithDate);
    // Joker personel kontrolü: sadece gerçek joker personel için
    const isJokerAssignment = assignment.is_joker === true;
    setAssignmentType(isJokerAssignment ? "joker" : "registered");
    console.log(
      "🔍 assignmentType set edildi:",
      isJokerAssignment ? "joker" : "registered"
    );
    console.log("🔍 isJokerAssignment:", isJokerAssignment);
    console.log("🔍 assignment.is_joker:", assignment.is_joker);
    console.log("🔍 assignment.notes:", assignment.notes);
    console.log("🔍 Dialog açılıyor...");
    setOpenDialog(true);
    console.log("🔍 setOpenDialog(true) çağrıldı");
  };

  // Joker personeli veritabanına kaydet
  const saveJokerToDatabase = async (jokerInfo: any) => {
    if (!tenant || !selectedProject) return null;

    try {
      const insertData = {
        first_name: jokerInfo.name.split(" ")[0] || "",
        last_name: jokerInfo.name.split(" ").slice(1).join(" ") || "",
        phone: jokerInfo.phone || "",
        id_number: jokerInfo.id_number || "",
        company_name: jokerInfo.company_name || "",
        status: "Aktif" as "Aktif" | "Pasif",
        tenant_id: tenant.id,
        project_id: selectedProject.id,
      };

      console.log("Joker personel veritabanına kaydediliyor:", insertData);

      const { data, error } = await supabase
        .from("joker_personnel")
        .upsert([insertData], {
          onConflict: "id_number",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Joker personel kayıt hatası:", error);
        // Hata olsa bile devam et, sadece uyarı ver
        setError("Joker personel veritabanına kaydedilemedi: " + error.message);
        return null;
      }

      console.log("Joker personel başarıyla kaydedildi:", data);

      // Joker personel listesini yenile
      await fetchJokerPersonnel();

      return data;
    } catch (err) {
      console.error("Joker personel kayıt hatası:", err);
      setError("Joker personel kaydedilirken hata oluştu");
      return null;
    }
  };

  // Atama kaydet
  const saveAssignment = async () => {
    console.log("🔍 saveAssignment çağrıldı");
    console.log("🔍 editingAssignment:", editingAssignment);
    console.log("🔍 assignmentType:", assignmentType);
    console.log("🔍 currentSchedule:", currentSchedule);
    console.log("🔍 tenant:", tenant);
    console.log("🔍 selectedProject:", selectedProject);
    console.log("🔍 assignmentType (save):", assignmentType);

    if (!editingAssignment || !currentSchedule || !tenant || !selectedProject) {
      setError("Gerekli bilgiler eksik!");
      return;
    }

    try {
      setSchedulesLoading(true);
      setError(null);

      // Önce mevcut çizelgeyi kontrol et veya oluştur
      let scheduleId = currentSchedule.id;

      if (!scheduleId) {
        // Yeni çizelge oluştur
        const { data: newSchedule, error: scheduleError } = await supabaseAdmin
          .from("duty_schedules")
          .insert({
            tenant_id: tenant.id,
            project_id: selectedProject.id,
            month: selectedMonth,
            year: selectedYear,
            status: "draft",
            created_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (scheduleError) {
          console.error("Error creating schedule:", scheduleError);
          setError("Çizelge oluşturulurken hata: " + scheduleError.message);
          return;
        }

        scheduleId = newSchedule.id;
      }

      // Eğer joker personel seçildiyse validasyon yap
      if (assignmentType === "joker") {
        // Zorunlu alanları kontrol et
        const fullName = editingAssignment.joker_info?.name?.trim() || "";
        const nameParts = fullName.split(" ").filter((part) => part.length > 0);

        if (nameParts.length < 2) {
          setError("Joker personel adı ve soyadı zorunludur");
          return;
        }

        if (!editingAssignment.joker_info?.id_number?.trim()) {
          setError("Joker personel TC Kimlik No zorunludur");
          return;
        }

        if (editingAssignment.joker_info.id_number.length !== 11) {
          setError("TC Kimlik No 11 haneli olmalıdır");
          return;
        }

        // Önce bu joker personelin veritabanında olup olmadığını kontrol et
        const existingJoker = jokerPersonnel.find(
          (j) =>
            j.first_name === editingAssignment.joker_info?.name.split(" ")[0] &&
            j.last_name ===
              editingAssignment.joker_info?.name
                .split(" ")
                .slice(1)
                .join(" ") &&
            j.id_number === editingAssignment.joker_info?.id_number
        );

        if (!existingJoker) {
          // Joker personel veritabanında yok, kaydet
          console.log(
            "Joker personel veritabanında bulunamadı, kaydediliyor..."
          );
          const savedJoker = await saveJokerToDatabase(
            editingAssignment.joker_info
          );

          if (savedJoker) {
            // Kaydedilen joker personelin ID'sini kullan
            editingAssignment.personnel_id = savedJoker.id;
          } else {
            // Kayıt başarısız oldu, hata mesajı zaten setError ile verildi
            return;
          }
        } else {
          // Joker personel zaten var, ID'sini kullan
          editingAssignment.personnel_id = existingJoker.id;
        }
      }

      // Veritabanına kaydet
      const assignmentData = {
        schedule_id: scheduleId,
        personnel_id:
          assignmentType === "joker"
            ? personnel[0]?.id
            : editingAssignment.personnel_id,
        joker_personnel_id:
          assignmentType === "joker" ? editingAssignment.personnel_id : null,
        duty_date: editingAssignment.duty_date || editingAssignment.date,
        shift_type:
          editingAssignment.shift_type === "1" ||
          editingAssignment.shift_type === "day"
            ? "day"
            : editingAssignment.shift_type === "2" ||
              editingAssignment.shift_type === "night"
            ? "night"
            : editingAssignment.shift_type === "evening"
            ? "day" // Map evening to day for now, or update constraint to include 'evening'
            : editingAssignment.shift_type === "YI" ||
              editingAssignment.shift_type === "M" ||
              editingAssignment.shift_type === "MI" ||
              editingAssignment.shift_type === "DR" ||
              editingAssignment.shift_type === "BT" ||
              editingAssignment.shift_type === "EI" ||
              editingAssignment.shift_type === "ÖI" ||
              editingAssignment.shift_type === "DI" ||
              editingAssignment.shift_type === "DG" ||
              editingAssignment.shift_type === "HT"
            ? "day" // Map leave types to day for now
            : "day", // Default to day for any other values
        start_time:
          editingAssignment.shift_type === "1" ||
          editingAssignment.shift_type === "day"
            ? selectedShiftSystem?.system_type === "8_hour_3_shift"
              ? "08:00"
              : "08:00"
            : editingAssignment.shift_type === "2" ||
              editingAssignment.shift_type === "night"
            ? selectedShiftSystem?.system_type === "8_hour_3_shift"
              ? "16:00"
              : "20:00"
            : editingAssignment.shift_type === "evening"
            ? "16:00"
            : leaveShifts.includes(editingAssignment.shift_type)
            ? "00:00"
            : "08:00",
        end_time:
          editingAssignment.shift_type === "1" ||
          editingAssignment.shift_type === "day"
            ? selectedShiftSystem?.system_type === "8_hour_3_shift"
              ? "16:00"
              : "20:00"
            : editingAssignment.shift_type === "2" ||
              editingAssignment.shift_type === "night"
            ? selectedShiftSystem?.system_type === "8_hour_3_shift"
              ? "00:00"
              : "08:00"
            : editingAssignment.shift_type === "evening"
            ? "00:00"
            : leaveShifts.includes(editingAssignment.shift_type)
            ? "23:59"
            : "20:00",
        is_weekend:
          editingAssignment.duty_date || editingAssignment.date
            ? new Date(
                editingAssignment.duty_date || editingAssignment.date!
              ).getDay() === 0 ||
              new Date(
                editingAssignment.duty_date || editingAssignment.date!
              ).getDay() === 6
            : false,
        notes: editingAssignment.joker_info
          ? `Joker: ${editingAssignment.joker_info.name}`
          : editingAssignment.notes || null,
        joker_info:
          assignmentType === "joker" ? editingAssignment.joker_info : null,
        is_joker: assignmentType === "joker",
        original_shift_type: editingAssignment.originalShiftType, // Orijinal vardiya türünü sakla
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      console.log("🔍 assignmentData:", assignmentData);

      const { error: assignmentError } = await supabaseAdmin
        .from("duty_assignments")
        .insert(assignmentData);

      if (assignmentError) {
        console.error("Error saving assignment:", assignmentError);
        setError("Atama kaydedilirken hata: " + assignmentError.message);
        return;
      }

      // Eğer joker personel atandıysa, orijinal personelin o günkü vardiyasını ölüm izni olarak güncelle
      if (assignmentType === "joker" && editingAssignment.originalPersonnelId) {
        console.log(
          `🔄 Orijinal personelin vardiyası ${editingAssignment.shift_type} olarak güncelleniyor...`
        );
        console.log(
          "🔍 originalPersonnelId:",
          editingAssignment.originalPersonnelId
        );
        console.log(
          "🔍 duty_date:",
          editingAssignment.duty_date || editingAssignment.date
        );

        const { error: updateError } = await supabaseAdmin
          .from("duty_assignments")
          .update({
            shift_type: editingAssignment.shift_type, // Joker personelin vardiya türüyle aynı
            start_time: "00:00",
            end_time: "23:59",
            notes: `Joker personel atandığı için ${
              editingAssignment.shift_type
            } yapıldı - ${new Date().toLocaleDateString("tr-TR")}`,
            updated_at: new Date().toISOString(),
          })
          .eq("personnel_id", editingAssignment.originalPersonnelId)
          .eq(
            "duty_date",
            editingAssignment.duty_date || editingAssignment.date
          );

        if (updateError) {
          console.error(
            "Error updating original personnel assignment:",
            updateError
          );
          // Bu hata kritik değil, sadece log'la
        } else {
          console.log("✅ Orijinal personelin vardiyası başarıyla güncellendi");
        }
      } else {
        console.log(
          "⚠️ Joker atama yapıldı ama originalPersonnelId bulunamadı"
        );
        console.log("🔍 assignmentType:", assignmentType);
        console.log(
          "🔍 originalPersonnelId:",
          editingAssignment.originalPersonnelId
        );
      }

      // Çizelgeleri yeniden yükle
      await fetchSchedules();

      // State'i manuel olarak güncelle
      setCurrentDate(new Date());

      setOpenDialog(false);
      setEditingAssignment(null);
      setAssignmentType("registered");
    } catch (err) {
      console.error("Error saving assignment:", err);
      setError("Atama kaydedilirken hata oluştu");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Atama sil
  const deleteAssignment = async (assignmentId: string) => {
    if (!currentSchedule) return;

    try {
      setSchedulesLoading(true);
      setError(null);

      // Veritabanından sil
      const { error } = await supabaseAdmin
        .from("duty_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        console.error("Error deleting assignment:", error);
        setError("Atama silinirken hata: " + error.message);
        return;
      }

      // Çizelgeleri yeniden yükle
      await fetchSchedules();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError("Atama silinirken hata oluştu");
    } finally {
      setSchedulesLoading(false);
    }
  };

  // Günlük atamaları getir
  const getAssignmentsForDay = (day: number) => {
    if (!currentSchedule || !currentSchedule.assignments) return [];

    const date = `${selectedYear}-${selectedMonth
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

    const assignments = currentSchedule.assignments.filter(
      (a) => a.duty_date === date
    );

    // Debug için
    if (day === 1) {
      console.log(`Gün ${day} - Tarih: ${date}`);
      console.log(`Gün ${day} - Toplam atama sayısı: ${assignments.length}`);
      console.log(`Gün ${day} - Atamalar:`, assignments);
    }

    return assignments;
  };

  // Joker personelleri getir
  const getJokerPersonnel = () => {
    if (!currentSchedule) return [];

    const jokerAssignments = currentSchedule.assignments.filter(
      (a) => a.is_joker
    );
    const uniqueJokers = new Map();

    jokerAssignments.forEach((assignment) => {
      if (assignment.joker_info?.name) {
        const key =
          assignment.joker_info.name + assignment.joker_info.id_number;
        if (!uniqueJokers.has(key)) {
          uniqueJokers.set(key, {
            id: `joker-${assignment.joker_info.name}-${assignment.joker_info.id_number}`,
            first_name: assignment.joker_info.name.split(" ")[0] || "",
            last_name:
              assignment.joker_info.name.split(" ").slice(1).join(" ") || "",
            company_name: assignment.joker_info.company_name || "",
            is_joker: true,
            joker_info: assignment.joker_info,
          });
        }
      }
    });

    return Array.from(uniqueJokers.values());
  };

  // Personel adını getir
  const getPersonnelName = (assignment: DutyAssignment) => {
    if (assignment.is_joker && assignment.joker_info) {
      return assignment.joker_info.name || "Joker Personel";
    }
    if (!assignment.personnel_id) return "Bilinmeyen";
    const person = personnel.find((p) => p.id === assignment.personnel_id);
    return person ? `${person.first_name} ${person.last_name}` : "Bilinmeyen";
  };

  // Günlük toplam personel sayısı (izin günleri hariç)
  const getDailyPersonnelCount = (day: number) => {
    const allAssignments = getAssignmentsForDay(day);
    const workingAssignments = allAssignments.filter(
      (assignment) =>
        !assignment.is_joker && // Joker personelleri hariç tut
        !assignment.is_holiday && // Hafta tatili değil
        !(
          assignment.start_time === "00:00" && assignment.end_time === "00:00"
        ) && // Boş saat değil
        assignment.notes !== "Hafta Tatili" && // Hafta tatili notu yok
        assignment.notes !== "12/36 Sistemi - Dinlenme Dönemi" // Dinlenme dönemi değil
    );

    // Debug için - İlk birkaç gün için
    if (day <= 3) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayName = date.toLocaleDateString("tr-TR", { weekday: "long" });
      console.log(
        `Gün ${day} - Tarih: ${date.toLocaleDateString("tr-TR")} (${dayName})`
      );
      console.log(`Gün ${day} - Tüm atamalar:`, allAssignments.length);
      console.log(`Gün ${day} - Çalışan atamalar:`, workingAssignments.length);

      // Filtreleme detayları
      const holidayCount = allAssignments.filter((a) => a.is_holiday).length;
      const emptyTimeCount = allAssignments.filter(
        (a) => a.start_time === "00:00" && a.end_time === "00:00"
      ).length;
      const haftaTatiliCount = allAssignments.filter(
        (a) => a.notes === "Hafta Tatili"
      ).length;
      const dinlenmeCount = allAssignments.filter(
        (a) => a.notes === "12/36 Sistemi - Dinlenme Dönemi"
      ).length;

      console.log(
        `Gün ${day} - Hafta tatili: ${holidayCount}, Boş saat: ${emptyTimeCount}, HT notu: ${haftaTatiliCount}, Dinlenme: ${dinlenmeCount}`
      );
    }

    return workingAssignments.length;
  };

  // RO Group standartlarına göre mesai hesaplama
  const calculateOvertime = () => {
    if (!currentSchedule || !currentSchedule.assignments) return {};

    const personnelOvertime: { [key: string]: number } = {};
    const LEGAL_MONTHLY_HOURS = 195; // Yasal aylık çalışma saati
    const LEGAL_YEARLY_OVERTIME = 270; // Yasal yıllık fazla mesai saati

    // Her personel için aylık çalışma saatini hesapla
    personnel.forEach((person) => {
      const personAssignments = currentSchedule.assignments.filter(
        (a) => a.personnel_id === person.id && !a.is_joker
      );

      const workingAssignments = personAssignments.filter(
        (a) =>
          a.shift_type !== "HT" &&
          !(a.start_time === "00:00" && a.end_time === "00:00") &&
          !a.is_holiday
      );

      // RO Group 2+2+2 rotasyonu: Her personel ayda 20 gün çalışır
      // 20 gün × 12 saat = 240 saat aylık çalışma

      // Sadece gerçek çalışma günlerini say (HT hariç)
      const realWorkingDays = workingAssignments.filter(
        (a) =>
          a.shift_type !== "HT" &&
          a.shift_type !== "YI" &&
          !(a.start_time === "00:00" && a.end_time === "00:00") &&
          !a.is_holiday
      ).length;

      const totalHours = realWorkingDays * 12; // Her çalışma günü 12 saat

      // Debug için
      console.log(`${person.first_name} ${person.last_name}:`);
      console.log(`- Toplam atama: ${workingAssignments.length}`);
      console.log(`- Gerçek çalışma günleri: ${realWorkingDays}`);
      console.log(`- Toplam saat: ${totalHours}`);
      console.log(
        `- Fazla mesai: ${Math.max(0, totalHours - LEGAL_MONTHLY_HOURS)}`
      );

      // Fazla mesai hesapla
      const overtime = Math.max(0, totalHours - LEGAL_MONTHLY_HOURS);
      personnelOvertime[person.id] = overtime;
    });

    return {
      personnelOvertime,
      LEGAL_MONTHLY_HOURS,
      LEGAL_YEARLY_OVERTIME,
    };
  };

  // Seçili projenin vardiya sistemini yükle
  const loadProjectShiftSystem = async () => {
    if (!tenant || !selectedProject || shiftSystems.length === 0) return;

    try {
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("selected_shift_system_id")
        .eq("id", selectedProject.id)
        .eq("tenant_id", tenant.id)
        .single();

      if (projectError) {
        console.error("Error loading project shift system:", projectError);
        return;
      }

      if (projectData?.selected_shift_system_id) {
        // Projenin seçili vardiya sistemini bul
        const system = shiftSystems.find(
          (s) => s.system_id === projectData.selected_shift_system_id
        );
        if (system) {
          setSelectedShiftSystem(system);
          console.log("✅ Proje vardiya sistemi yüklendi:", system.system_name);
        }
      } else {
        // Varsayılan vardiya sistemini seç
        const defaultSystem = shiftSystems.find((s) => s.is_default);
        if (defaultSystem) {
          setSelectedShiftSystem(defaultSystem);
          console.log(
            "✅ Varsayılan vardiya sistemi seçildi:",
            defaultSystem.system_name
          );
        }
      }
    } catch (err) {
      console.error("Error loading project shift system:", err);
    }
  };

  useEffect(() => {
    if (!tenantLoading && tenant && selectedProject) {
      setLoading(true);
      Promise.all([
        fetchPersonnel(),
        fetchJokerPersonnel(),
        fetchShiftTypes(),
        fetchSchedules(),
        fetchJokerCalculations(),
        fetchJokerStatistics(),
        fetchShiftSystems(), // Vardiya sistemleri tenant bazında yüklenir
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [tenant, tenantLoading, selectedProject, selectedMonth, selectedYear]);

  // Vardiya sistemleri sadece tenant değiştiğinde yüklensin
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchShiftSystems();
    }
  }, [tenant, tenantLoading]);

  // Vardiya sistemleri yüklendiğinde projenin seçili sistemini yükle
  useEffect(() => {
    if (shiftSystems.length > 0) {
      loadProjectShiftSystem();
    }
  }, [shiftSystems, selectedProject]);

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

  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Tenant bilgisi bulunamadı. Lütfen doğru domain üzerinden giriş yapın.
        </Alert>
      </Box>
    );
  }

  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Lütfen sidebar'dan bir proje seçiniz.</Alert>
      </Box>
    );
  }

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const weekdays = [
    "Pazar", // 0
    "Pazartesi", // 1
    "Salı", // 2
    "Çarşamba", // 3
    "Perşembe", // 4
    "Cuma", // 5
    "Cumartesi", // 6
  ];

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", p: 0.5 }}>
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
        {/* Compact Header */}
        <Fade in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 1,
              borderRadius: 1.5,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 0.3, fontSize: "1rem" }}
                >
                  <ScheduleIcon
                    sx={{ mr: 0.5, verticalAlign: "middle", fontSize: "1rem" }}
                  />
                  Nöbet Çizelgeleri
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontSize: "0.75rem" }}
                >
                  {tenant.name} - {monthNames[selectedMonth - 1]} {selectedYear}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ color: "white" }}>
                      Vardiya Sistemi
                    </InputLabel>
                    <Select
                      value={selectedShiftSystem?.system_id || ""}
                      onChange={async (e) => {
                        const system = shiftSystems.find(
                          (s) => s.system_id === e.target.value
                        );
                        setSelectedShiftSystem(system || null);

                        // Seçili vardiya sistemini projeye kaydet
                        if (system && selectedProject && tenant) {
                          try {
                            await supabase.rpc("set_tenant_context", {
                              tenant_id: tenant.id,
                            });

                            const { error } = await supabase
                              .from("projects")
                              .update({
                                selected_shift_system_id: system.system_id,
                                updated_at: new Date().toISOString(),
                              })
                              .eq("id", selectedProject.id)
                              .eq("tenant_id", tenant.id);

                            if (error) {
                              console.error(
                                "Error updating project shift system:",
                                error
                              );
                              setError(
                                "Vardiya sistemi güncellenirken hata oluştu: " +
                                  error.message
                              );
                            } else {
                              console.log(
                                "✅ Vardiya sistemi başarıyla güncellendi:",
                                system.system_name
                              );
                            }
                          } catch (err) {
                            console.error(
                              "Error updating project shift system:",
                              err
                            );
                            setError(
                              "Vardiya sistemi güncellenirken hata oluştu"
                            );
                          }
                        }
                      }}
                      label="Vardiya Sistemi"
                      sx={{
                        color: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.5)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.8)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "white",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "white",
                        },
                      }}
                    >
                      {shiftSystems.map((system) => (
                        <MenuItem
                          key={system.system_id}
                          value={system.system_id}
                        >
                          {system.is_default && "⭐ "}
                          {system.system_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: "white" }}>
                      Vardiya Başına
                    </InputLabel>
                    <Select
                      value={personnelPerShift}
                      onChange={(e) =>
                        setPersonnelPerShift(e.target.value as number)
                      }
                      label="Vardiya Başına"
                      sx={{
                        color: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.5)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.8)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "white",
                        },
                        "& .MuiSvgIcon-root": {
                          color: "white",
                        },
                      }}
                    >
                      <MenuItem value={1}>1 Kişi</MenuItem>
                      <MenuItem value={2}>2 Kişi</MenuItem>
                      <MenuItem value={3}>3 Kişi</MenuItem>
                      <MenuItem value={4}>4 Kişi</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    disabled={schedulesLoading || !selectedShiftSystem}
                    sx={{
                      bgcolor: selectedShiftSystem
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.1)",
                      color: "white",
                      backdropFilter: "blur(10px)",
                      fontSize: "0.75rem",
                      py: 0.5,
                      px: 1.5,
                      "&:hover": {
                        bgcolor: selectedShiftSystem
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(255,255,255,0.1)",
                      },
                    }}
                    onClick={() => {
                      if (!selectedShiftSystem) {
                        setError("Lütfen önce bir vardiya sistemi seçin!");
                        return;
                      }

                      console.log("🔴 Buton tıklandı!");

                      // Personel ayarlarını başlat
                      const initialSettings: any = {};
                      personnel.forEach((person) => {
                        initialSettings[person.id] = {
                          preferredShift: "auto",
                          preferredStartTime: "",
                          preferredEndTime: "",
                        };
                      });
                      setPersonnelSettings(initialSettings);

                      setOpenPersonnelSettingsModal(true);
                    }}
                  >
                    {generatingSchedule ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={16} sx={{ color: "white" }} />
                        <Typography variant="body2" sx={{ color: "white" }}>
                          {generationStep || "İşlem yapılıyor..."}
                        </Typography>
                      </Box>
                    ) : (
                      "Otomatik Oluştur"
                    )}
                  </Button>
                  {!selectedShiftSystem && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "0.7rem",
                        ml: 1,
                      }}
                    >
                      ⚠️ Vardiya sistemi seçin
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={
                    generatingSchedule ? (
                      <CircularProgress size={16} sx={{ color: "white" }} />
                    ) : (
                      <AutoIcon />
                    )
                  }
                  size="small"
                  disabled={generatingSchedule}
                  sx={{
                    borderColor: "rgba(255,255,255,0.5)",
                    color: "white",
                    fontSize: "0.75rem",
                    py: 0.5,
                    px: 1.5,
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255,255,255,0.1)",
                    },
                  }}
                  onClick={generateSchedule}
                >
                  {generatingSchedule
                    ? generationStep || "Hesaplanıyor..."
                    : "Yeniden Hesapla"}
                </Button>
                <Tooltip title="Joker Hesaplama">
                  <IconButton
                    sx={{ color: "white", p: 0.5 }}
                    onClick={() => setOpenJokerDialog(true)}
                  >
                    <Badge
                      badgeContent={
                        jokerCalculations.filter((j) => j.excess_overtime > 0)
                          .length
                      }
                      color="warning"
                    >
                      <PersonIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Yazdır">
                  <IconButton
                    sx={{ color: "white", p: 0.5 }}
                    onClick={handlePrint}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="İndir">
                  <IconButton sx={{ color: "white", p: 0.5 }}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Yenile">
                  <IconButton
                    sx={{ color: "white", p: 0.5 }}
                    onClick={fetchSchedules}
                    disabled={schedulesLoading}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tüm Atamaları Temizle">
                  <IconButton
                    sx={{ color: "white", p: 0.5 }}
                    onClick={clearAllAssignments}
                    disabled={schedulesLoading}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        </Fade>

        {/* Month Navigation - Ultra Compact */}
        <Fade in={true} timeout={800}>
          <Paper elevation={1} sx={{ p: 1, mb: 1, borderRadius: 1.5 }}>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={1}
              flexWrap="wrap"
            >
              <Button
                variant="outlined"
                startIcon={<ChevronLeftIcon />}
                size="small"
                onClick={goToPreviousMonth}
                sx={{
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  borderColor: "#e0e7ff",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#6366f1",
                    bgcolor: "#e0e7ff",
                  },
                }}
              >
                Önceki Ay
              </Button>

              <Button
                variant="contained"
                startIcon={<TodayIcon />}
                size="small"
                onClick={goToCurrentMonth}
                sx={{
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Bu Ay
              </Button>

              <Button
                variant="outlined"
                endIcon={<ChevronRightIcon />}
                size="small"
                onClick={goToNextMonth}
                sx={{
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  borderColor: "#e0e7ff",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#6366f1",
                    bgcolor: "#e0e7ff",
                  },
                }}
              >
                Sonraki Ay
              </Button>
            </Stack>
          </Paper>
        </Fade>

        {/* Error Alert */}
        {error && (
          <Fade in={true}>
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError(null)}
              icon={<WarningIcon />}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Month/Year Selector - Ultra Compact */}
        <Fade in={true} timeout={1000}>
          <Paper elevation={1} sx={{ p: 1, mb: 1, borderRadius: 1.5 }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel sx={{ fontSize: "0.7rem" }}>Ay Seçin</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  label="Ay Seçin"
                  sx={{ fontSize: "0.7rem" }}
                >
                  {months.map((month, index) => (
                    <MenuItem
                      key={index + 1}
                      value={index + 1}
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel sx={{ fontSize: "0.7rem" }}>Yıl Seçin</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  label="Yıl Seçin"
                  sx={{ fontSize: "0.7rem" }}
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <MenuItem
                      key={year}
                      value={year}
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                <CalendarIcon color="primary" sx={{ fontSize: "0.9rem" }} />
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="primary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  {months[selectedMonth - 1]} {selectedYear}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Fade>

        {/* Schedule Grid - Ultra Compact */}
        <Fade in={true} timeout={1200}>
          <Paper elevation={2} sx={{ borderRadius: 1.5, overflow: "hidden" }}>
            {schedulesLoading ? (
              <Box sx={{ p: 1.5 }}>
                <LinearProgress sx={{ mb: 0.5 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Nöbet çizelgeleri yükleniyor...
                </Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  maxHeight: "70vh",
                  overflowX: "auto",
                  overflowY: "auto",
                  minHeight: `${Math.max(personnel.length * 40, 300)}px`,
                }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table
                    size="small"
                    sx={{
                      "& .MuiTableCell-root": { py: 0.3, px: 0.3 },
                      tableLayout: "fixed",
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            minWidth: 160,
                            width: 160,
                            bgcolor: "#f1f5f9",
                            borderRight: "2px solid #e2e8f0",
                            py: 0.5,
                            px: 0.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.3}
                          >
                            <GroupIcon
                              color="primary"
                              sx={{ fontSize: "0.8rem" }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Personel
                            </Typography>
                          </Stack>
                        </TableCell>
                        {Array.from(
                          { length: daysInMonth },
                          (_, i) => i + 1
                        ).map((day) => {
                          const dayOfWeek = new Date(
                            selectedYear,
                            selectedMonth - 1,
                            day
                          ).getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          const isToday =
                            new Date().getDate() === day &&
                            new Date().getMonth() === selectedMonth - 1 &&
                            new Date().getFullYear() === selectedYear;

                          return (
                            <TableCell
                              key={day}
                              sx={{
                                fontWeight: "bold",
                                textAlign: "center",
                                minWidth: 40,
                                width: 40,
                                border: "1px solid #e2e8f0",
                                bgcolor: isToday
                                  ? "#dbeafe"
                                  : isWeekend
                                  ? "#fef3c7"
                                  : "#f8fafc",
                                position: "relative",
                                py: 0.3,
                                px: 0.3,
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  color={
                                    isToday
                                      ? "primary.main"
                                      : isWeekend
                                      ? "warning.dark"
                                      : "text.primary"
                                  }
                                  sx={{ fontSize: "0.65rem" }}
                                >
                                  {day}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color={
                                    isWeekend
                                      ? "warning.dark"
                                      : "text.secondary"
                                  }
                                  sx={{ fontSize: "0.5rem" }}
                                >
                                  {weekdays[dayOfWeek].substring(0, 2)}
                                </Typography>
                                {isToday && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      top: 0.5,
                                      right: 0.5,
                                      width: 3,
                                      height: 3,
                                      borderRadius: "50%",
                                      bgcolor: "primary.main",
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            bgcolor: "#f1f5f9",
                            borderLeft: "2px solid #e2e8f0",
                            minWidth: 50,
                            py: 0.5,
                            px: 0.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={0.3}
                          >
                            <AssignmentIcon
                              color="primary"
                              sx={{ fontSize: "0.8rem" }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Toplam
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Loading State for Personnel */}
                      {personnelLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={`loading-${index}`}>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                              >
                                <Skeleton
                                  variant="circular"
                                  width={40}
                                  height={40}
                                />
                                <Box>
                                  <Skeleton
                                    variant="text"
                                    width={120}
                                    height={20}
                                  />
                                  <Skeleton
                                    variant="text"
                                    width={80}
                                    height={16}
                                  />
                                </Box>
                              </Stack>
                            </TableCell>
                            {Array.from(
                              { length: daysInMonth },
                              (_, i) => i + 1
                            ).map((day) => (
                              <TableCell key={day}>
                                <Skeleton
                                  variant="rectangular"
                                  width={60}
                                  height={40}
                                />
                              </TableCell>
                            ))}
                            <TableCell>
                              <Skeleton variant="text" width={40} height={20} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <>
                          {/* Kayıtlı Personeller - Compact */}
                          <SortableContext
                            items={personnel.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {personnel.map((person) => (
                              <SortableRow key={person.id} person={person}>
                                {(listeners) => (
                                  <TableRow
                                    sx={{
                                      "&:hover": {
                                        bgcolor: "#f8fafc",
                                      },
                                      "&:nth-of-type(even)": {
                                        bgcolor: "#fafbfc",
                                      },
                                    }}
                                  >
                                    <TableCell
                                      sx={{
                                        borderRight: "2px solid #e2e8f0",
                                        py: 1,
                                        minWidth: 160,
                                        width: 160,
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                      >
                                        {/* Drag Handle */}
                                        <Box
                                          {...listeners}
                                          sx={{
                                            cursor: "grab",
                                            "&:active": {
                                              cursor: "grabbing",
                                            },
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            p: 0.5,
                                            borderRadius: 1,
                                            minWidth: 24,
                                            minHeight: 24,
                                            "&:hover": {
                                              bgcolor: "#f1f5f9",
                                            },
                                          }}
                                        >
                                          <DragIndicatorIcon
                                            sx={{
                                              fontSize: "1.2rem",
                                              color: "#64748b",
                                              "&:hover": {
                                                color: "#334155",
                                              },
                                            }}
                                          />
                                        </Box>
                                        <Box
                                          sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: "50%",
                                            bgcolor: "#e0e7ff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <PersonIcon
                                            color="primary"
                                            sx={{ fontSize: "0.7rem" }}
                                          />
                                        </Box>
                                        <Box>
                                          <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            sx={{ fontSize: "0.65rem" }}
                                          >
                                            {person.first_name}{" "}
                                            {person.last_name}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: "0.55rem" }}
                                          >
                                            {person.mobile_login_username}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    {Array.from(
                                      { length: daysInMonth },
                                      (_, i) => i + 1
                                    ).map((day) => {
                                      const assignments =
                                        getAssignmentsForDay(day);
                                      const personAssignment = assignments.find(
                                        (a) => a.personnel_id === person.id
                                      );

                                      // DEBUG: İzin günleri kontrolü
                                      if (
                                        personAssignment &&
                                        personAssignment.start_time ===
                                          "00:00" &&
                                        personAssignment.end_time === "00:00"
                                      ) {
                                        console.log(
                                          `🔍 İzin günü tespit edildi - Gün ${day}, Personel: ${person.first_name}, shift_type: ${personAssignment.shift_type}`
                                        );
                                      }
                                      const date = `${selectedYear}-${selectedMonth
                                        .toString()
                                        .padStart(2, "0")}-${day
                                        .toString()
                                        .padStart(2, "0")}`;
                                      const dayOfWeek = new Date(
                                        selectedYear,
                                        selectedMonth - 1,
                                        day
                                      ).getDay();
                                      const isWeekend =
                                        dayOfWeek === 0 || dayOfWeek === 6;
                                      const isToday =
                                        new Date().getDate() === day &&
                                        new Date().getMonth() ===
                                          selectedMonth - 1 &&
                                        new Date().getFullYear() ===
                                          selectedYear;

                                      return (
                                        <TableCell
                                          key={day}
                                          sx={{
                                            textAlign: "center",
                                            border: "1px solid #e2e8f0",
                                            minWidth: 40,
                                            width: 40,
                                            backgroundColor: personAssignment
                                              ? currentShiftTypes[
                                                  personAssignment.shift_type
                                                ]?.color + "15"
                                              : isToday
                                              ? "#dbeafe"
                                              : isWeekend
                                              ? "#fef3c7"
                                              : "transparent",
                                            cursor: "pointer",
                                            position: "relative",
                                            minHeight: 30,
                                            py: 0.3,
                                            px: 0.3,
                                            "&:hover": {
                                              backgroundColor: personAssignment
                                                ? currentShiftTypes[
                                                    personAssignment.shift_type
                                                  ]?.color + "25"
                                                : "#f1f5f9",
                                              transform: "scale(1.02)",
                                              transition:
                                                "all 0.2s ease-in-out",
                                            },
                                          }}
                                          onClick={() => {
                                            console.log(
                                              "🔍 Personel atamasına tıklandı:",
                                              personAssignment
                                            );
                                            if (personAssignment) {
                                              editAssignment(personAssignment);
                                            } else {
                                              console.log(
                                                "🔍 Boş slot'a tıklandı, joker ekleniyor"
                                              );
                                              addJokerPersonnel(date);
                                            }
                                          }}
                                        >
                                          {personAssignment ? (
                                            <Box sx={{ position: "relative" }}>
                                              {/* Hafta tatili kontrolü */}
                                              {personAssignment.is_holiday ||
                                              (personAssignment.start_time ===
                                                "00:00" &&
                                                personAssignment.end_time ===
                                                  "00:00") ||
                                              personAssignment.notes ===
                                                "Hafta Tatili" ? (
                                                <Chip
                                                  label="HT"
                                                  size="small"
                                                  sx={{
                                                    bgcolor: "#9c27b0", // Mor renk
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "0.55rem",
                                                    height: 16,
                                                    "& .MuiChip-label": {
                                                      px: 0.3,
                                                    },
                                                  }}
                                                />
                                              ) : (
                                                <Chip
                                                  label={
                                                    // Joker personel için orijinal vardiya türünü kullan
                                                    (() => {
                                                      const shiftTypeToUse =
                                                        personAssignment.is_joker
                                                          ? (
                                                              personAssignment as any
                                                            )
                                                              .original_shift_type ||
                                                            personAssignment.shift_type
                                                          : personAssignment.shift_type;

                                                      if (
                                                        shiftTypeToUse === "YI"
                                                      ) {
                                                        return "YI"; // Yıllık İzin
                                                      } else if (
                                                        shiftTypeToUse === "MI"
                                                      ) {
                                                        return "MI"; // Mazeret İzni
                                                      } else if (
                                                        shiftTypeToUse === "DR"
                                                      ) {
                                                        return "DR"; // Doktor Raporu
                                                      } else if (
                                                        shiftTypeToUse === "BT"
                                                      ) {
                                                        return "BT"; // Bayram Tatili
                                                      } else if (
                                                        shiftTypeToUse === "EI"
                                                      ) {
                                                        return "EI"; // Evlilik İzni
                                                      } else if (
                                                        shiftTypeToUse === "ÖI"
                                                      ) {
                                                        return "ÖI"; // Ölüm İzni
                                                      } else if (
                                                        shiftTypeToUse === "HI"
                                                      ) {
                                                        return "HI"; // Hastalık İzni
                                                      } else if (
                                                        shiftTypeToUse === "DI"
                                                      ) {
                                                        return "DI"; // Doğum İzni
                                                      } else if (
                                                        shiftTypeToUse === "BI"
                                                      ) {
                                                        return "BI"; // Babalık İzni
                                                      } else if (
                                                        shiftTypeToUse === "DG"
                                                      ) {
                                                        return "DG"; // Doğum Günü
                                                      } else if (
                                                        personAssignment.notes?.includes(
                                                          "EVENING_SHIFT"
                                                        )
                                                      ) {
                                                        return "2"; // Akşam vardiyası
                                                      } else if (
                                                        shiftTypeToUse === "day"
                                                      ) {
                                                        return "1"; // Gündüz vardiyası
                                                      } else if (
                                                        shiftTypeToUse ===
                                                        "night"
                                                      ) {
                                                        return selectedShiftSystem?.system_type ===
                                                          "8_hour_3_shift"
                                                          ? "3"
                                                          : "2";
                                                      } else if (
                                                        shiftTypeToUse ===
                                                        "evening"
                                                      ) {
                                                        return "2"; // Akşam vardiyası
                                                      } else if (
                                                        shiftTypeToUse ===
                                                          "1" ||
                                                        shiftTypeToUse ===
                                                          "2" ||
                                                        shiftTypeToUse === "3"
                                                      ) {
                                                        return shiftTypeToUse;
                                                      } else {
                                                        return "1"; // Default
                                                      }
                                                    })()
                                                  }
                                                  size="small"
                                                  sx={{
                                                    bgcolor:
                                                      currentShiftTypes[
                                                        personAssignment.is_joker
                                                          ? (
                                                              personAssignment as any
                                                            )
                                                              .original_shift_type ||
                                                            personAssignment.shift_type
                                                          : personAssignment.shift_type
                                                      ]?.color || "#2196f3",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "0.55rem",
                                                    height: 16,
                                                    "& .MuiChip-label": {
                                                      px: 0.3,
                                                    },
                                                  }}
                                                />
                                              )}
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  display: "block",
                                                  mt: 0.1,
                                                  fontSize: "0.45rem",
                                                  color: "text.secondary",
                                                }}
                                              >
                                                {personAssignment.is_holiday ||
                                                (personAssignment.start_time ===
                                                  "00:00" &&
                                                  personAssignment.end_time ===
                                                    "00:00") ||
                                                personAssignment.notes ===
                                                  "Hafta Tatili"
                                                  ? "Hafta Tatili"
                                                  : personAssignment.shift_type ===
                                                    "YI"
                                                  ? "Yıllık İzin"
                                                  : personAssignment.start_time &&
                                                    personAssignment.end_time
                                                  ? `${personAssignment.start_time}-${personAssignment.end_time}`
                                                  : currentShiftTypes[
                                                      personAssignment.is_joker
                                                        ? (
                                                            personAssignment as any
                                                          )
                                                            .original_shift_type ||
                                                          personAssignment.shift_type
                                                        : personAssignment.shift_type
                                                    ]?.timeRange ||
                                                    currentShiftTypes[
                                                      personAssignment.is_joker
                                                        ? (
                                                            personAssignment as any
                                                          )
                                                            .original_shift_type ||
                                                          personAssignment.shift_type
                                                        : personAssignment.shift_type
                                                    ]?.label}
                                              </Typography>
                                              {personAssignment.is_joker && (
                                                <Chip
                                                  label="J"
                                                  size="small"
                                                  color="warning"
                                                  sx={{
                                                    position: "absolute",
                                                    top: -4,
                                                    right: -4,
                                                    fontSize: "0.4rem",
                                                    height: 10,
                                                    minWidth: 10,
                                                  }}
                                                />
                                              )}
                                            </Box>
                                          ) : isWeekend ? (
                                            <Box sx={{ position: "relative" }}>
                                              <Chip
                                                label="HT"
                                                size="small"
                                                sx={{
                                                  bgcolor: "#9c27b0", // Mor renk
                                                  color: "white",
                                                  fontWeight: "bold",
                                                  fontSize: "0.55rem",
                                                  height: 16,
                                                  "& .MuiChip-label": {
                                                    px: 0.3,
                                                  },
                                                }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  display: "block",
                                                  mt: 0.1,
                                                  fontSize: "0.45rem",
                                                  color: "text.secondary",
                                                }}
                                              >
                                                {currentShiftTypes["HT"]
                                                  ?.timeRange ||
                                                  currentShiftTypes["HT"]
                                                    ?.label}
                                              </Typography>
                                            </Box>
                                          ) : (
                                            <Box
                                              sx={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                border: "2px dashed #cbd5e1",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                mx: "auto",
                                                "&:hover": {
                                                  borderColor: "#6366f1",
                                                  bgcolor: "#e0e7ff",
                                                },
                                              }}
                                            >
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: "0.6rem" }}
                                              >
                                                +
                                              </Typography>
                                            </Box>
                                          )}
                                        </TableCell>
                                      );
                                    })}
                                    <TableCell
                                      sx={{
                                        textAlign: "center",
                                        fontWeight: "bold",
                                        borderLeft: "2px solid #e2e8f0",
                                        bgcolor: "#f8fafc",
                                        py: 0.5,
                                        px: 0.5,
                                      }}
                                    >
                                      <Badge
                                        badgeContent={
                                          currentSchedule?.assignments.filter(
                                            (a) =>
                                              a.personnel_id === person.id &&
                                              !a.is_holiday &&
                                              !(
                                                a.start_time === "00:00" &&
                                                a.end_time === "00:00"
                                              ) &&
                                              a.notes !== "Hafta Tatili"
                                          ).length || 0
                                        }
                                        color="primary"
                                        sx={{
                                          "& .MuiBadge-badge": {
                                            fontSize: "0.55rem",
                                            height: 14,
                                            minWidth: 16,
                                          },
                                        }}
                                      >
                                        <AssignmentIcon color="action" />
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </SortableRow>
                            ))}

                            {/* Joker Personeller */}
                            {getJokerPersonnel().map((jokerPerson) => (
                              <TableRow
                                key={jokerPerson.id}
                                sx={{
                                  "&:hover": {
                                    bgcolor: "#f8fafc",
                                  },
                                  "&:nth-of-type(even)": {
                                    bgcolor: "#fafbfc",
                                  },
                                }}
                              >
                                <TableCell
                                  sx={{
                                    borderRight: "2px solid #e2e8f0",
                                    minWidth: 160,
                                    width: 160,
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                  >
                                    <Box
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        bgcolor: "#e0e7ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <PersonIcon
                                        color="primary"
                                        sx={{ fontSize: "0.7rem" }}
                                      />
                                    </Box>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                      >
                                        {jokerPerson.first_name}{" "}
                                        {jokerPerson.last_name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: "0.55rem" }}
                                      >
                                        {jokerPerson.company_name ||
                                          "Joker Personel"}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                {Array.from(
                                  { length: daysInMonth },
                                  (_, i) => i + 1
                                ).map((day) => {
                                  const assignments = getAssignmentsForDay(day);
                                  const jokerAssignment = assignments.find(
                                    (a) =>
                                      a.is_joker &&
                                      a.joker_info?.name ===
                                        `${jokerPerson.first_name} ${jokerPerson.last_name}`.trim()
                                  );
                                  const date = `${selectedYear}-${selectedMonth
                                    .toString()
                                    .padStart(2, "0")}-${day
                                    .toString()
                                    .padStart(2, "0")}`;
                                  const dayOfWeek = new Date(
                                    selectedYear,
                                    selectedMonth - 1,
                                    day
                                  ).getDay();
                                  const isWeekend =
                                    dayOfWeek === 0 || dayOfWeek === 6;
                                  const isToday =
                                    new Date().getDate() === day &&
                                    new Date().getMonth() ===
                                      selectedMonth - 1 &&
                                    new Date().getFullYear() === selectedYear;

                                  return (
                                    <TableCell
                                      key={day}
                                      sx={{
                                        textAlign: "center",
                                        border: "1px solid #e2e8f0",
                                        minWidth: 40,
                                        width: 40,
                                        backgroundColor: jokerAssignment
                                          ? currentShiftTypes[
                                              jokerAssignment.shift_type
                                            ]?.color + "15"
                                          : isToday
                                          ? "#dbeafe"
                                          : isWeekend
                                          ? "#fef3c7"
                                          : "transparent",
                                        cursor: "pointer",
                                        position: "relative",
                                        minHeight: 60,
                                        "&:hover": {
                                          backgroundColor: jokerAssignment
                                            ? currentShiftTypes[
                                                jokerAssignment.shift_type
                                              ]?.color + "25"
                                            : "#f1f5f9",
                                          transform: "scale(1.02)",
                                          transition: "all 0.2s ease-in-out",
                                        },
                                      }}
                                      onClick={() => {
                                        if (jokerAssignment) {
                                          editAssignment(jokerAssignment);
                                        } else {
                                          addJokerPersonnel(date);
                                        }
                                      }}
                                    >
                                      {jokerAssignment ? (
                                        <Box sx={{ position: "relative" }}>
                                          <Chip
                                            label={
                                              // Joker personel için orijinal vardiya türünü kullan
                                              (() => {
                                                const shiftTypeToUse =
                                                  (jokerAssignment as any)
                                                    .original_shift_type ||
                                                  jokerAssignment.shift_type;

                                                if (shiftTypeToUse === "YI") {
                                                  return "HT"; // Yıllık İzin
                                                } else if (
                                                  jokerAssignment.notes?.includes(
                                                    "EVENING_SHIFT"
                                                  )
                                                ) {
                                                  return "2"; // Akşam vardiyası
                                                } else if (
                                                  shiftTypeToUse === "day"
                                                ) {
                                                  return "1";
                                                } else if (
                                                  shiftTypeToUse === "night"
                                                ) {
                                                  return selectedShiftSystem?.system_type ===
                                                    "8_hour_3_shift"
                                                    ? "3"
                                                    : "2";
                                                } else if (
                                                  shiftTypeToUse === "evening"
                                                ) {
                                                  return "2";
                                                } else if (
                                                  [
                                                    "MI",
                                                    "DR",
                                                    "BT",
                                                    "EI",
                                                    "ÖI",
                                                    "HI",
                                                    "DI",
                                                    "BI",
                                                    "DG",
                                                    "HT",
                                                    "Üİ",
                                                    "MG",
                                                  ].includes(shiftTypeToUse)
                                                ) {
                                                  return shiftTypeToUse;
                                                } else if (
                                                  shiftTypeToUse === "1" ||
                                                  shiftTypeToUse === "2" ||
                                                  shiftTypeToUse === "3"
                                                ) {
                                                  return shiftTypeToUse;
                                                } else {
                                                  return shiftTypeToUse;
                                                }
                                              })()
                                            }
                                            size="small"
                                            sx={{
                                              bgcolor:
                                                currentShiftTypes[
                                                  (jokerAssignment as any)
                                                    .original_shift_type ||
                                                    jokerAssignment.shift_type
                                                ]?.color,
                                              color: "white",
                                              fontWeight: "bold",
                                              fontSize: "0.75rem",
                                              height: 24,
                                              "& .MuiChip-label": {
                                                px: 1,
                                              },
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: "block",
                                              mt: 0.5,
                                              fontSize: "0.65rem",
                                              color: "text.secondary",
                                            }}
                                          >
                                            {currentShiftTypes[
                                              (jokerAssignment as any)
                                                .original_shift_type ||
                                                jokerAssignment.shift_type
                                            ]?.timeRange ||
                                              currentShiftTypes[
                                                (jokerAssignment as any)
                                                  .original_shift_type ||
                                                  jokerAssignment.shift_type
                                              ]?.label}
                                          </Typography>
                                          <Chip
                                            label="Joker"
                                            size="small"
                                            color="warning"
                                            sx={{
                                              position: "absolute",
                                              top: -8,
                                              right: -8,
                                              fontSize: "0.6rem",
                                              height: 16,
                                            }}
                                          />
                                        </Box>
                                      ) : isWeekend ? (
                                        <Box sx={{ position: "relative" }}>
                                          <Chip
                                            label="HT"
                                            size="small"
                                            sx={{
                                              bgcolor:
                                                currentShiftTypes["HT"]?.color,
                                              color: "white",
                                              fontWeight: "bold",
                                              fontSize: "0.75rem",
                                              height: 24,
                                              "& .MuiChip-label": {
                                                px: 1,
                                              },
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: "block",
                                              mt: 0.5,
                                              fontSize: "0.65rem",
                                              color: "text.secondary",
                                            }}
                                          >
                                            {currentShiftTypes["HT"]
                                              ?.timeRange ||
                                              currentShiftTypes["HT"]?.label}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Box
                                          sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            border: "2px dashed #fbbf24",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mx: "auto",
                                            "&:hover": {
                                              borderColor: "#f59e0b",
                                              bgcolor: "#fef3c7",
                                            },
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            color="warning.dark"
                                            sx={{ fontSize: "0.8rem" }}
                                          >
                                            +
                                          </Typography>
                                        </Box>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell
                                  sx={{
                                    textAlign: "center",
                                    fontWeight: "bold",
                                    borderLeft: "2px solid #e2e8f0",
                                    bgcolor: "#f8fafc",
                                  }}
                                >
                                  <Badge
                                    badgeContent={
                                      currentSchedule?.assignments.filter(
                                        (a) =>
                                          a.is_joker &&
                                          a.joker_info?.name ===
                                            `${jokerPerson.first_name} ${jokerPerson.last_name}`.trim() &&
                                          !a.is_holiday &&
                                          !(
                                            a.start_time === "00:00" &&
                                            a.end_time === "00:00"
                                          ) &&
                                          a.notes !== "Hafta Tatili"
                                      ).length || 0
                                    }
                                    color="warning"
                                    sx={{
                                      "& .MuiBadge-badge": {
                                        fontSize: "0.75rem",
                                        height: 20,
                                        minWidth: 20,
                                      },
                                    }}
                                  >
                                    <AssignmentIcon color="action" />
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}

                            {/* Daily Totals Row */}
                            <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                              <TableCell
                                sx={{
                                  fontWeight: "bold",
                                  bgcolor: "#e2e8f0",
                                  borderRight: "2px solid #cbd5e1",
                                  minWidth: 160,
                                  width: 160,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={0.3}
                                >
                                  <AssignmentIcon
                                    color="primary"
                                    sx={{ fontSize: "0.8rem" }}
                                  />
                                  <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    sx={{ fontSize: "0.7rem" }}
                                  >
                                    Günlük Toplam
                                  </Typography>
                                </Stack>
                              </TableCell>
                              {Array.from(
                                { length: daysInMonth },
                                (_, i) => i + 1
                              ).map((day) => {
                                const dayOfWeek = new Date(
                                  selectedYear,
                                  selectedMonth - 1,
                                  day
                                ).getDay();
                                const isWeekend =
                                  dayOfWeek === 0 || dayOfWeek === 6;
                                const isToday =
                                  new Date().getDate() === day &&
                                  new Date().getMonth() === selectedMonth - 1 &&
                                  new Date().getFullYear() === selectedYear;
                                const count = getDailyPersonnelCount(day);

                                return (
                                  <TableCell
                                    key={day}
                                    sx={{
                                      textAlign: "center",
                                      fontWeight: "bold",
                                      bgcolor: isToday
                                        ? "#dbeafe"
                                        : isWeekend
                                        ? "#fef3c7"
                                        : "#f8fafc",
                                      border: "1px solid #e2e8f0",
                                      py: 0.3,
                                      px: 0.3,
                                      minWidth: 40,
                                      width: 40,
                                    }}
                                  >
                                    <Badge
                                      badgeContent={count}
                                      color={count > 0 ? "primary" : "default"}
                                      sx={{
                                        "& .MuiBadge-badge": {
                                          fontSize: "0.55rem",
                                          height: 14,
                                          minWidth: 14,
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 18,
                                          height: 18,
                                          borderRadius: "50%",
                                          bgcolor:
                                            count > 0 ? "#e0e7ff" : "#f1f5f9",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          mx: "auto",
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          fontWeight="bold"
                                        >
                                          {count}
                                        </Typography>
                                      </Box>
                                    </Badge>
                                  </TableCell>
                                );
                              })}
                              <TableCell
                                sx={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  bgcolor: "#e2e8f0",
                                  borderLeft: "2px solid #cbd5e1",
                                }}
                              >
                                <Badge
                                  badgeContent={
                                    currentSchedule?.assignments.length || 0
                                  }
                                  color="primary"
                                  sx={{
                                    "& .MuiBadge-badge": {
                                      fontSize: "0.75rem",
                                      height: 20,
                                      minWidth: 20,
                                    },
                                  }}
                                >
                                  <AssignmentIcon color="primary" />
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </SortableContext>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </DndContext>
              </TableContainer>
            )}
          </Paper>
        </Fade>

        {/* Assignment Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingAssignment?.is_joker
              ? "Joker Personel Ekle"
              : "Atama Düzenle"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
            >
              {/* Vardiya Türü Seçimi */}
              <FormControl fullWidth>
                <InputLabel>Vardiya Türü</InputLabel>
                <Select
                  value={editingAssignment?.shift_type || ""}
                  onChange={(e) => {
                    if (editingAssignment) {
                      const selectedValue = e.target.value;

                      // İzin türleri için özel handling
                      if (leaveShifts.includes(selectedValue)) {
                        setEditingAssignment({
                          ...editingAssignment,
                          shift_type: selectedValue as any,
                          start_time: "00:00",
                          end_time: "00:00",
                          is_holiday: true,
                          notes:
                            selectedValue === "HT"
                              ? "Hafta Tatili"
                              : selectedValue === "YI"
                              ? "Yıllık İzin"
                              : selectedValue === "MI"
                              ? "Mazeret İzni"
                              : selectedValue === "DR"
                              ? "Doktor Raporu"
                              : selectedValue === "BT"
                              ? "Bayram Tatili"
                              : selectedValue === "EI"
                              ? "Evlilik İzni"
                              : selectedValue === "ÖI"
                              ? "Ölüm İzni"
                              : selectedValue === "DI"
                              ? "Doğum İzni"
                              : "",
                        });
                      } else {
                        // Database constraint'i için mapping yap
                        const dbShiftType =
                          selectedValue === "1" || selectedValue === "day"
                            ? "day"
                            : selectedValue === "2" || selectedValue === "night"
                            ? "night"
                            : selectedValue === "evening"
                            ? "day" // evening'i day olarak map et
                            : "day"; // default

                        setEditingAssignment({
                          ...editingAssignment,
                          shift_type: dbShiftType,
                          is_holiday: false,
                          notes: "",
                        });
                      }
                    }
                  }}
                  label="Vardiya Türü"
                >
                  {/* Çalışma Vardiyaları */}
                  <MenuItem value="day">
                    🌅 Gündüz Vardiyası (
                    {selectedShiftSystem?.system_type === "8_hour_3_shift"
                      ? "08:00-16:00"
                      : "08:00-20:00"}
                    )
                  </MenuItem>
                  <MenuItem value="night">
                    🌙 Gece Vardiyası (
                    {selectedShiftSystem?.system_type === "8_hour_3_shift"
                      ? "00:00-08:00"
                      : "20:00-08:00"}
                    )
                  </MenuItem>
                  {selectedShiftSystem?.system_type === "8_hour_3_shift" && (
                    <MenuItem value="evening">
                      🌆 Akşam Vardiyası (16:00-00:00)
                    </MenuItem>
                  )}

                  {/* İzin Türleri */}
                  <MenuItem value="YI">🏖️ Yıllık İzin</MenuItem>
                  <MenuItem value="MI">📋 Mazeret İzni</MenuItem>
                  <MenuItem value="DR">🏥 Doktor Raporu</MenuItem>
                  <MenuItem value="BT">🎉 Bayram Tatili</MenuItem>
                  <MenuItem value="EI">💒 Evlilik İzni</MenuItem>
                  <MenuItem value="ÖI">🕊️ Ölüm İzni</MenuItem>
                  <MenuItem value="DI">👶 Doğum İzni</MenuItem>
                  <MenuItem value="HT">📅 Hafta Tatili</MenuItem>
                </Select>
              </FormControl>

              {/* İzin türleri için personel seçimi */}
              {editingAssignment &&
                leaveShifts.includes(editingAssignment.shift_type) && (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Personel Türü</InputLabel>
                      <Select
                        value={assignmentType}
                        onChange={(e) => {
                          const newType = e.target.value as
                            | "registered"
                            | "joker";
                          setAssignmentType(newType);

                          // Eğer joker seçildiyse ve mevcut assignment varsa, orijinal personel ID'sini ve vardiya türünü sakla
                          if (
                            newType === "joker" &&
                            editingAssignment &&
                            !editingAssignment.is_joker
                          ) {
                            // Orijinal personelin gerçek vardiya türünü bul
                            const originalPerson = personnel.find(
                              (p) => p.id === editingAssignment.personnel_id
                            );
                            let originalShiftType = "1"; // Default

                            if (originalPerson) {
                              // Orijinal personelin o günkü gerçek vardiya türünü bul
                              const originalAssignment = getAssignmentsForDay(
                                parseInt(
                                  editingAssignment.duty_date?.split("-")[2] ||
                                    editingAssignment.date?.split("-")[2] ||
                                    "1"
                                )
                              ).find(
                                (a) =>
                                  a.personnel_id === originalPerson.id &&
                                  !a.is_joker
                              );

                              if (originalAssignment) {
                                // Eğer orijinal assignment izin türü ise, varsayılan vardiya türünü kullan
                                if (
                                  [
                                    "MI",
                                    "DR",
                                    "BT",
                                    "EI",
                                    "ÖI",
                                    "HI",
                                    "DI",
                                    "BI",
                                    "DG",
                                    "HT",
                                    "Üİ",
                                    "MG",
                                  ].includes(originalAssignment.shift_type)
                                ) {
                                  originalShiftType = "1"; // Varsayılan vardiya türü
                                } else {
                                  originalShiftType =
                                    originalAssignment.shift_type;
                                }
                              }
                            }

                            setEditingAssignment({
                              ...editingAssignment,
                              originalPersonnelId:
                                editingAssignment.personnel_id,
                              originalShiftType: originalShiftType, // Orijinal vardiya türünü sakla
                              personnel_id: "", // Joker personel ID'si için temizle
                              is_joker: true,
                            });
                          }
                        }}
                        label="Personel Türü"
                      >
                        <MenuItem value="registered">
                          Kayıtlı Personelden Seç
                        </MenuItem>
                        <MenuItem value="joker">Joker Gir</MenuItem>
                      </Select>
                    </FormControl>

                    {assignmentType === "registered" && (
                      <FormControl fullWidth>
                        <InputLabel>Personel Seçin</InputLabel>
                        <Select
                          value={editingAssignment.personnel_id || ""}
                          onChange={(e) => {
                            if (editingAssignment) {
                              setEditingAssignment({
                                ...editingAssignment,
                                personnel_id: e.target.value,
                                is_joker: false,
                              });
                            }
                          }}
                          label="Personel Seçin"
                        >
                          {personnel.map((person) => (
                            <MenuItem key={person.id} value={person.id}>
                              {person.first_name} {person.last_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {assignmentType === "joker" && (
                      <>
                        <FormControl fullWidth>
                          <InputLabel>
                            Kayıtlı Joker Personel Seçin (İsteğe Bağlı)
                          </InputLabel>
                          <Select
                            value={editingAssignment?.personnel_id || ""}
                            onChange={(e) => {
                              if (editingAssignment) {
                                const selectedJoker = jokerPersonnel.find(
                                  (j) => j.id === e.target.value
                                );
                                setEditingAssignment({
                                  ...editingAssignment,
                                  personnel_id: e.target.value,
                                  is_joker: true,
                                  originalPersonnelId:
                                    editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                  originalShiftType:
                                    editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                  joker_info: selectedJoker
                                    ? {
                                        name: `${selectedJoker.first_name} ${selectedJoker.last_name}`,
                                        phone: selectedJoker.phone,
                                        id_number: selectedJoker.id_number,
                                        company_name:
                                          selectedJoker.company_name,
                                      }
                                    : editingAssignment.joker_info,
                                });
                              }
                            }}
                            label="Kayıtlı Joker Personel Seçin (İsteğe Bağlı)"
                          >
                            <MenuItem value="">
                              <em>Yeni Joker Personel Gir</em>
                            </MenuItem>
                            {jokerPersonnel.map((joker) => (
                              <MenuItem key={joker.id} value={joker.id}>
                                {joker.first_name} {joker.last_name} -{" "}
                                {joker.company_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Yukarıdan kayıtlı joker personel seçebilir veya yeni
                          joker personel bilgilerini girebilirsiniz. Yeni joker
                          personel otomatik olarak veritabanına kaydedilecektir:
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Ad *"
                              value={
                                editingAssignment?.joker_info?.name?.split(
                                  " "
                                )[0] || ""
                              }
                              onChange={(e) => {
                                if (editingAssignment) {
                                  const lastName =
                                    editingAssignment.joker_info?.name
                                      ?.split(" ")
                                      .slice(1)
                                      .join(" ") || "";
                                  setEditingAssignment({
                                    ...editingAssignment,
                                    originalPersonnelId:
                                      editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                    originalShiftType:
                                      editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                    joker_info: {
                                      ...editingAssignment.joker_info!,
                                      name: `${e.target.value} ${lastName}`.trim(),
                                    },
                                  });
                                }
                              }}
                              fullWidth
                              required
                              helperText="Joker personelin adı"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Soyad *"
                              value={
                                editingAssignment?.joker_info?.name
                                  ?.split(" ")
                                  .slice(1)
                                  .join(" ") || ""
                              }
                              onChange={(e) => {
                                if (editingAssignment) {
                                  const firstName =
                                    editingAssignment.joker_info?.name?.split(
                                      " "
                                    )[0] || "";
                                  setEditingAssignment({
                                    ...editingAssignment,
                                    originalPersonnelId:
                                      editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                    originalShiftType:
                                      editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                    joker_info: {
                                      ...editingAssignment.joker_info!,
                                      name: `${firstName} ${e.target.value}`.trim(),
                                    },
                                  });
                                }
                              }}
                              fullWidth
                              required
                              helperText="Joker personelin soyadı"
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          label="Telefon"
                          value={editingAssignment?.joker_info?.phone || ""}
                          onChange={(e) => {
                            if (editingAssignment) {
                              setEditingAssignment({
                                ...editingAssignment,
                                originalPersonnelId:
                                  editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                originalShiftType:
                                  editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                joker_info: {
                                  ...editingAssignment.joker_info!,
                                  phone: e.target.value,
                                },
                              });
                            }
                          }}
                          fullWidth
                          placeholder="0555 123 45 67"
                        />
                        <TextField
                          label="TC Kimlik No *"
                          value={editingAssignment?.joker_info?.id_number || ""}
                          onChange={(e) => {
                            if (editingAssignment) {
                              setEditingAssignment({
                                ...editingAssignment,
                                originalPersonnelId:
                                  editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                originalShiftType:
                                  editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                joker_info: {
                                  ...editingAssignment.joker_info!,
                                  id_number: e.target.value,
                                },
                              });
                            }
                          }}
                          fullWidth
                          required
                          inputProps={{ maxLength: 11 }}
                          placeholder="12345678901"
                          helperText="11 haneli TC Kimlik No"
                        />
                        <TextField
                          label="Firma Adı"
                          value={
                            editingAssignment?.joker_info?.company_name || ""
                          }
                          onChange={(e) => {
                            if (editingAssignment) {
                              setEditingAssignment({
                                ...editingAssignment,
                                originalPersonnelId:
                                  editingAssignment.originalPersonnelId, // Orijinal personel ID'sini koru
                                originalShiftType:
                                  editingAssignment.originalShiftType, // Orijinal vardiya türünü koru
                                joker_info: {
                                  ...editingAssignment.joker_info!,
                                  company_name: e.target.value,
                                },
                              });
                            }
                          }}
                          fullWidth
                          placeholder="ABC Güvenlik Şirketi"
                        />
                      </>
                    )}
                  </>
                )}

              {/* Çalışma vardiyaları için personel seçimi */}
              {editingAssignment &&
                workShifts.includes(editingAssignment.shift_type) && (
                  <FormControl fullWidth>
                    <InputLabel>Personel Seçin</InputLabel>
                    <Select
                      value={editingAssignment.personnel_id || ""}
                      onChange={(e) => {
                        if (editingAssignment) {
                          setEditingAssignment({
                            ...editingAssignment,
                            personnel_id: e.target.value,
                            is_joker: false,
                          });
                        }
                      }}
                      label="Personel Seçin"
                    >
                      {personnel.map((person) => (
                        <MenuItem key={person.id} value={person.id}>
                          {person.first_name} {person.last_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button onClick={saveAssignment} variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Personel Ayarları Modal */}
        <Dialog
          open={openPersonnelSettingsModal}
          onClose={() => setOpenPersonnelSettingsModal(false)}
          maxWidth="md"
          fullWidth
          sx={{ "& .MuiDialog-paper": { maxHeight: "90vh" } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                ⚙️ Personel Vardiya Ayarları
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2, maxHeight: "70vh", overflow: "auto" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Her personel için tercih edilen vardiya türünü ve saatlerini
              belirleyin. Belirtilmeyen personeller otomatik olarak atanacaktır.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                📊 Proje Bilgisi:
              </Typography>
              <Typography variant="body2">
                Bu proje için <strong>{personnel.length} personel</strong>{" "}
                çalışacak.
                {personnel.length === 1
                  ? " Tek personel günlük rotasyon yapacak (çift günler sabahçı, tek günler gececi)."
                  : (personnel.length === 2 &&
                      selectedShiftSystem?.system_type === "12_hour_2_shift") ||
                    (selectedShiftSystem &&
                      (selectedShiftSystem.system_type as string) ===
                        "12_36_shift")
                  ? " 2 personel dönüşümlü çalışacak (1 sabahçı, 1 gececi)."
                  : " Çoklu personel vardiya dağılımı yapacak."}
              </Typography>
            </Alert>

            {/* Vardiya Sistemi Bilgisi */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                ⏰ Seçili Vardiya Sistemi
              </Typography>
              {selectedShiftSystem ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "white",
                    borderRadius: 1,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {selectedShiftSystem.is_default && "⭐ "}
                    {selectedShiftSystem.system_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {selectedShiftSystem.description}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="body2">
                      <strong>Vardiya Sayısı:</strong>{" "}
                      {selectedShiftSystem.shift_count}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Vardiya Süresi:</strong>{" "}
                      {selectedShiftSystem.shift_duration} saat
                    </Typography>
                    <Typography variant="body2">
                      <strong>Günlük Toplam:</strong>{" "}
                      {selectedShiftSystem.total_daily_hours} saat
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  Vardiya sistemi seçilmedi. Lütfen ana sayfadan bir vardiya
                  sistemi seçin.
                </Alert>
              )}
            </Paper>

            <Grid container spacing={3}>
              {personnel.map((person) => (
                <Grid item xs={12} key={person.id}>
                  <Paper sx={{ p: 2, border: "1px solid #e0e0e0" }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ mb: 2 }}
                    >
                      👤 {person.first_name} {person.last_name}
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>Tercih Edilen Vardiya</InputLabel>
                          <Select
                            value={
                              personnelSettings[person.id]?.preferredShift ||
                              "auto"
                            }
                            onChange={(e) => {
                              const newShiftType = e.target.value as
                                | "day"
                                | "evening"
                                | "night"
                                | "auto";
                              const defaultTimes =
                                getDefaultPersonnelTimes(newShiftType);
                              setPersonnelSettings((prev) => ({
                                ...prev,
                                [person.id]: {
                                  ...prev[person.id],
                                  preferredShift: newShiftType,
                                  preferredStartTime: defaultTimes.start,
                                  preferredEndTime: defaultTimes.end,
                                },
                              }));

                              // Vardiya dengesini kontrol et
                              setTimeout(() => {
                                balanceShiftAssignments();
                              }, 100);
                            }}
                            label="Tercih Edilen Vardiya"
                          >
                            <MenuItem value="auto">🤖 Otomatik</MenuItem>
                            <MenuItem value="day">
                              🌅 Sabahçı (
                              {selectedShiftSystem?.system_type ===
                              "8_hour_3_shift"
                                ? "08:00-16:00"
                                : "08:00-20:00"}
                              )
                            </MenuItem>
                            {selectedShiftSystem?.system_type ===
                              "8_hour_3_shift" && (
                              <MenuItem value="evening">
                                🌆 Akşamçı (16:00-00:00)
                              </MenuItem>
                            )}
                            <MenuItem value="night">
                              🌙 Gececi (
                              {selectedShiftSystem?.system_type ===
                              "8_hour_3_shift"
                                ? "00:00-08:00"
                                : "20:00-08:00"}
                              )
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Başlangıç Saati"
                          type="time"
                          placeholder="Otomatik atanacak"
                          value={
                            personnelSettings[person.id]?.preferredStartTime ||
                            getDefaultPersonnelTimes(
                              personnelSettings[person.id]?.preferredShift ||
                                "auto"
                            ).start
                          }
                          onChange={(e) =>
                            setPersonnelSettings((prev) => ({
                              ...prev,
                              [person.id]: {
                                ...prev[person.id],
                                preferredStartTime: e.target.value,
                              },
                            }))
                          }
                          disabled={
                            personnelSettings[person.id]?.preferredShift ===
                            "auto"
                          }
                        />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Bitiş Saati"
                          type="time"
                          placeholder="Otomatik atanacak"
                          value={
                            personnelSettings[person.id]?.preferredEndTime ||
                            getDefaultPersonnelTimes(
                              personnelSettings[person.id]?.preferredShift ||
                                "auto"
                            ).end
                          }
                          onChange={(e) =>
                            setPersonnelSettings((prev) => ({
                              ...prev,
                              [person.id]: {
                                ...prev[person.id],
                                preferredEndTime: e.target.value,
                              },
                            }))
                          }
                          disabled={
                            personnelSettings[person.id]?.preferredShift ===
                            "auto"
                          }
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => setOpenPersonnelSettingsModal(false)}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              ❌ İptal
            </Button>
            <Button
              onClick={() => {
                setOpenPersonnelSettingsModal(false);
                generateSchedule();
              }}
              variant="contained"
              disabled={!selectedShiftSystem || generatingSchedule}
              startIcon={
                generatingSchedule ? <CircularProgress size={16} /> : null
              }
              sx={{ minWidth: 100 }}
            >
              {generatingSchedule
                ? generationStep || "Oluşturuluyor..."
                : "✅ Çizelge Oluştur"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Joker Hesaplama Dialog */}
        <Dialog
          open={openJokerDialog}
          onClose={() => setOpenJokerDialog(false)}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Joker Personel Hesaplama</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={calculateJokerNeeds}
                  disabled={jokerLoading}
                >
                  {jokerLoading ? <CircularProgress size={20} /> : "Hesapla"}
                </Button>
                <IconButton onClick={() => setOpenJokerDialog(false)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          </DialogTitle>
          <DialogContent>
            {/* İstatistikler */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                📊 Joker İstatistikleri ({selectedYear} - {selectedMonth})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {jokerStatistics.total_personnel}
                    </Typography>
                    <Typography variant="caption">Toplam Personel</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h4" color="warning.main">
                      {jokerStatistics.personnel_needing_joker}
                    </Typography>
                    <Typography variant="caption">Joker Gereken</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h4" color="error.main">
                      {jokerStatistics.total_joker_hours_needed.toFixed(1)}
                    </Typography>
                    <Typography variant="caption">
                      Toplam Joker Saati
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h4" color="success.main">
                      ₺{jokerStatistics.total_joker_cost.toFixed(0)}
                    </Typography>
                    <Typography variant="caption">Toplam Maliyet</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Detaylı Hesaplamalar */}
            {jokerLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Personel</TableCell>
                      <TableCell>Toplam Saat</TableCell>
                      <TableCell>Aylık Mesai</TableCell>
                      <TableCell>Yıllık Mesai</TableCell>
                      <TableCell>Fazla Mesai</TableCell>
                      <TableCell>Joker Saati</TableCell>
                      <TableCell>Maliyet</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jokerCalculations.map((calculation) => {
                      const person = personnel.find(
                        (p) => p.id === calculation.personnel_id
                      );
                      return (
                        <TableRow key={calculation.id}>
                          <TableCell>
                            {person
                              ? `${person.first_name} ${person.last_name}`
                              : "Bilinmeyen"}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {calculation.total_working_hours.toFixed(1)} saat
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                calculation.monthly_overtime > 0
                                  ? "warning.main"
                                  : "text.primary"
                              }
                            >
                              {calculation.monthly_overtime.toFixed(1)} saat
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                calculation.yearly_overtime > 270
                                  ? "error.main"
                                  : "text.primary"
                              }
                            >
                              {calculation.yearly_overtime.toFixed(1)} saat
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                calculation.excess_overtime > 0
                                  ? "error.main"
                                  : "success.main"
                              }
                              fontWeight="bold"
                            >
                              {calculation.excess_overtime.toFixed(1)} saat
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                calculation.joker_hours_needed > 0
                                  ? "error.main"
                                  : "text.primary"
                              }
                              fontWeight="bold"
                            >
                              {calculation.joker_hours_needed.toFixed(1)} saat
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ({calculation.joker_days_needed.toFixed(1)} gün)
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main">
                              ₺{calculation.joker_cost_estimate.toFixed(0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                calculation.status === "calculated"
                                  ? "Hesaplandı"
                                  : calculation.status === "approved"
                                  ? "Onaylandı"
                                  : calculation.status === "joker_assigned"
                                  ? "Joker Atandı"
                                  : "Tamamlandı"
                              }
                              size="small"
                              color={
                                calculation.status === "calculated"
                                  ? "default"
                                  : calculation.status === "approved"
                                  ? "primary"
                                  : calculation.status === "joker_assigned"
                                  ? "warning"
                                  : "success"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {calculation.status === "calculated" && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() =>
                                    approveJokerCalculation(calculation.id)
                                  }
                                >
                                  Onayla
                                </Button>
                              )}
                              {calculation.excess_overtime > 0 && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => {
                                    // Joker atama dialog'u açılacak
                                    console.log("Joker atama:", calculation.id);
                                  }}
                                >
                                  Joker Ata
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenJokerDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>

        {/* Vardiya Sistemi Yönetimi Dialog */}
        <Dialog
          open={openShiftSystemDialog}
          onClose={() => setOpenShiftSystemDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Vardiya Sistemi Yönetimi</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => createShiftSystem("8_hour_3_shift")}
                  disabled={shiftSystemLoading}
                >
                  {shiftSystemLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "8 Saatlik 3'lü"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => createShiftSystem("12_hour_2_shift")}
                  disabled={shiftSystemLoading}
                >
                  {shiftSystemLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "12 Saatlik 2'li"
                  )}
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={() => createShiftSystem("12_36_shift")}
                  disabled={shiftSystemLoading}
                >
                  {shiftSystemLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    "12/36 Saatlik"
                  )}
                </Button>
                <IconButton onClick={() => setOpenShiftSystemDialog(false)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          </DialogTitle>
          <DialogContent>
            {shiftSystemLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sistem Adı</TableCell>
                      <TableCell>Tür</TableCell>
                      <TableCell>Vardiya Sayısı</TableCell>
                      <TableCell>Süre</TableCell>
                      <TableCell>Muvafakatname</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftSystems.map((system) => (
                      <TableRow key={system.system_id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {system.is_default && "⭐ "}
                            {system.system_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {system.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              system.system_type === "8_hour_3_shift"
                                ? "8 Saatlik 3'lü"
                                : system.system_type === "12_hour_2_shift"
                                ? "12 Saatlik 2'li"
                                : system.system_type === "12_36_shift"
                                ? "12/36 Saatlik"
                                : "Özel"
                            }
                            size="small"
                            color={
                              system.system_type === "8_hour_3_shift"
                                ? "primary"
                                : system.system_type === "12_hour_2_shift"
                                ? "secondary"
                                : system.system_type === "12_36_shift"
                                ? "warning"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {system.shift_count} vardiya
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {system.shift_duration} saat
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label="Aktif" size="small" color="success" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={system.is_active ? "Aktif" : "Pasif"}
                            size="small"
                            color={system.is_active ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {!system.is_default && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() =>
                                  setDefaultShiftSystem(system.system_id)
                                }
                              >
                                Varsayılan Yap
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                deleteShiftSystem(system.system_id)
                              }
                            >
                              Sil
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenShiftSystemDialog(false)}>
              Kapat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

// SortableRow komponenti
interface SortableRowProps {
  person: Personnel;
  children: (listeners: any) => React.ReactNode;
}

const SortableRow: React.FC<SortableRowProps> = ({ person, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: person.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
};

export default DutySchedules;
