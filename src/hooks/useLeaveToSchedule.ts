import { useState } from "react";
import { supabaseAdmin } from "../lib/supabase";

interface LeaveDay {
  id: string;
  leave_id: string;
  personnel_id: string;
  leave_date: string;
  leave_type_code: string;
  replacement_type: "none" | "personnel" | "joker";
  joker_info?: any;
}

interface Personnel {
  id: string;
  first_name: string;
  last_name: string;
}

interface ScheduleAssignment {
  id: string;
  personnel_id: string;
  duty_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  is_joker: boolean;
  joker_info?: any;
  original_personnel_id?: string;
  original_shift_type?: string;
}

export const useLeaveToSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // İzin günlerini nöbet çizelgesine yansıt
  const syncLeaveToSchedule = async (
    leaveId: string,
    scheduleId: string,
    tenantId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      console.log("syncLeaveToSchedule çağrıldı:", {
        leaveId,
        scheduleId,
        tenantId,
      });

      // İzin günlerini getir
      const { data: leaveDays, error: leaveDaysError } = await supabaseAdmin
        .from("leave_days")
        .select("*")
        .eq("leave_id", leaveId)
        .eq("replacement_type", "none"); // Henüz yerleştirme yapılmamış olanlar

      if (leaveDaysError) throw leaveDaysError;

      console.log("Leave days bulundu:", leaveDays);

      if (!leaveDays || leaveDays.length === 0) {
        console.log("Yansıtılacak izin günü bulunamadı");
        return;
      }

      // Current user ID'sini al
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser();

      // Önce izinli personelin mevcut assignment'larını sil
      for (const leaveDay of leaveDays) {
        const { error: deleteError } = await supabaseAdmin
          .from("duty_assignments")
          .delete()
          .eq("personnel_id", leaveDay.personnel_id)
          .eq("duty_date", leaveDay.leave_date)
          .eq("is_joker", false); // Sadece normal assignment'ları sil, joker'ları koru

        if (deleteError) {
          console.error("Error deleting existing assignment:", deleteError);
          // Hata olsa da devam et
        } else {
          console.log(
            `✅ Existing assignment deleted for ${leaveDay.personnel_id} on ${leaveDay.leave_date}`
          );
        }
      }

      // Her izin günü için nöbet çizelgesinde assignment oluştur
      const assignments = leaveDays.map((leaveDay: LeaveDay) => {
        console.log("🔍 Creating assignment for leave day:", {
          personnel_id: leaveDay.personnel_id,
          duty_date: leaveDay.leave_date,
          leave_type_code: leaveDay.leave_type_code,
        });

        return {
          schedule_id: scheduleId,
          personnel_id: leaveDay.personnel_id,
          duty_date: leaveDay.leave_date,
          shift_type: leaveDay.leave_type_code,
          start_time: "00:00",
          end_time: "23:59",
          is_joker: false,
          notes: `İzin: ${
            leaveDay.leave_type_code
          } - ${new Date().toLocaleDateString("tr-TR")}`,
          created_by: user?.id,
        };
      });

      console.log("Assignment'lar oluşturuluyor:", assignments);

      // Assignment'ları kaydet
      const { error: assignmentError } = await supabaseAdmin
        .from("duty_assignments")
        .insert(assignments);

      if (assignmentError) {
        console.error("Assignment kaydetme hatası:", assignmentError);
        throw assignmentError;
      }

      console.log(`${leaveDays.length} izin günü nöbet çizelgesine yansıtıldı`);

      return {
        success: true,
        message: `${leaveDays.length} günlük izin nöbet çizelgesine yansıtıldı`,
        leaveDays: leaveDays.length,
      };
    } catch (err) {
      console.error("Error syncing leave to schedule:", err);
      setError(
        "İzin nöbet çizelgesine yansıtılırken hata oluştu: " +
          (err as Error).message
      );
      return {
        success: false,
        message: "İzin yansıtılırken hata oluştu",
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  // İzin günü için yerleştirme yap (tarih aralığı ile)
  const assignReplacement = async (
    leaveDayId: string,
    replacementType: "personnel" | "joker",
    replacementData: {
      personnel_id?: string;
      joker_info?: {
        name: string;
        phone: string;
        id_number: string;
        company_name: string;
      };
    },
    scheduleId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Current user ID'sini al
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser();

      // İzin günü bilgilerini getir
      const { data: leaveDay, error: leaveDayError } = await supabaseAdmin
        .from("leave_days")
        .select("*")
        .eq("id", leaveDayId)
        .single();

      if (leaveDayError) throw leaveDayError;

      if (!leaveDay) {
        throw new Error("İzin günü bulunamadı");
      }

      // Orijinal personelin o günkü vardiya türünü bul
      console.log("🔍 Original assignment query:", {
        personnel_id: leaveDay.personnel_id,
        duty_date: leaveDay.leave_date,
      });

      const { data: originalAssignment, error: originalError } =
        await supabaseAdmin
          .from("duty_assignments")
          .select("shift_type")
          .eq("personnel_id", leaveDay.personnel_id)
          .eq("duty_date", leaveDay.leave_date)
          .eq("is_joker", false)
          .single();

      if (originalError) {
        console.error("❌ Original assignment error:", originalError);
        console.log(
          "ℹ️ Original assignment bulunamadı, default değer kullanılıyor"
        );
        // Hata durumunda default değer kullan
      }

      let originalShiftType = "1"; // Default
      if (
        originalAssignment &&
        ![
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
        originalShiftType = originalAssignment.shift_type;
      }

      // Tarih aralığı için assignment'ları oluştur
      const assignmentDates = [];
      const start = startDate
        ? new Date(startDate)
        : new Date(leaveDay.leave_date);
      const end = endDate ? new Date(endDate) : new Date(leaveDay.leave_date);

      const currentDate = new Date(start);
      while (currentDate <= end) {
        assignmentDates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Önce izinli personelin mevcut assignment'larını sil
      for (const date of assignmentDates) {
        const { error: deleteError } = await supabaseAdmin
          .from("duty_assignments")
          .delete()
          .eq("personnel_id", leaveDay.personnel_id)
          .eq("duty_date", date)
          .eq("is_joker", false); // Sadece normal assignment'ları sil

        if (deleteError) {
          console.error("Error deleting existing assignment:", deleteError);
          // Hata olsa da devam et
        } else {
          console.log(
            `✅ Existing assignment deleted for ${leaveDay.personnel_id} on ${date}`
          );
        }
      }

      // Her tarih için assignment oluştur
      const assignments = assignmentDates.map((date) => ({
        schedule_id: scheduleId,
        personnel_id: replacementData.personnel_id || leaveDay.personnel_id,
        duty_date: date,
        shift_type: originalShiftType,
        start_time: "08:00",
        end_time: "20:00",
        is_joker: replacementType === "joker",
        joker_personnel_id:
          replacementType === "joker"
            ? (replacementData.joker_info as any)?.id
            : null,
        joker_info:
          replacementType === "joker" ? replacementData.joker_info : null,
        original_personnel_id: leaveDay.personnel_id,
        original_shift_type: originalShiftType,
        notes: `İzin yerine geçen ${
          replacementType === "joker" ? "joker" : "personel"
        } - ${new Date().toLocaleDateString("tr-TR")}`,
        created_by: user?.id,
      }));

      // Assignment'ları kaydet
      console.log("🔍 Inserting assignments:", assignments.length, "items");
      console.log("🔍 Sample assignment:", assignments[0]);

      const { error: assignmentError } = await supabaseAdmin
        .from("duty_assignments")
        .insert(assignments);

      if (assignmentError) {
        console.error("❌ Assignment insert error:", assignmentError);
        throw new Error(
          `Assignment kaydetme hatası: ${assignmentError.message}`
        );
      }

      console.log("✅ Assignments successfully inserted");

      // İzin gününü güncelle
      const { error: updateError } = await supabaseAdmin
        .from("leave_days")
        .update({
          replacement_type: replacementType,
          replacement_personnel_id:
            replacementType === "personnel"
              ? replacementData.personnel_id
              : null,
          joker_info:
            replacementType === "joker" ? replacementData.joker_info : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leaveDayId);

      if (updateError) throw updateError;

      console.log("Yerleştirme başarıyla yapıldı");

      return {
        success: true,
        message: `${
          replacementType === "joker" ? "Joker personel" : "Personel"
        } başarıyla yerleştirildi`,
      };
    } catch (err) {
      console.error("Error assigning replacement:", err);
      setError("Yerleştirme yapılırken hata oluştu: " + (err as Error).message);
      return {
        success: false,
        message: "Yerleştirme yapılırken hata oluştu",
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    syncLeaveToSchedule,
    assignReplacement,
    loading,
    error,
  };
};
