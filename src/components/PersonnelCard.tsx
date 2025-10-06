import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  People as FamilyIcon,
  AccountBalance as AccountIcon,
  Gavel as GavelIcon,
  Checkroom as ClothingIcon,
  ContactPhone as ContactIcon,
  Business as ExperienceIcon,
  CardMembership as CertificateIcon,
  Event as LeaveIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  LocalShipping as ClothingDeliveryIcon,
  CreditCard as CardIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CloudUpload as CloudUploadIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import LeaveManagement from "./LeaveManagement";
import SgkManagement from "./SgkManagement";
import { sgkService } from "../services/sgkService";

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
  // Detay bilgileri
  phone?: string;
  email?: string;
  id_number?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  exit_date?: string;
  position?: string;
  department?: string;
  salary?: number;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_type?: string;
  medical_notes?: string;
  notes?: string;
  gender?: "Erkek" | "Kadın";
  // SGK Alanları (sgk.txt spesifikasyonlarına uygun)
  tc_kimlik_no?: string;
  sgk_sicil_no?: number;
  sgk_giris_tarihi?: string;
  sgk_cikis_tarihi?: string;
  sgk_referans_kodu?: number;
  sgk_durum?: "Giriş Yapılmamış" | "Aktif" | "Çıkış Yapılmış";
  sigorta_turu?: number;
  gorev_kodu?: string;
  meslek_kodu?: string;
  csgb_iskolu?: string;
  eskihukumlu?: "E" | "H";
  ozurlu?: "E" | "H";
  ogrenim_kodu?: string;
  mezuniyet_bolumu?: string;
  mezuniyet_yili?: number;
  kismi_sureli_calisiyormu?: "E" | "H";
  kismi_sureli_calisma_gun_sayisi?: number;
  isten_cikis_nedeni?: string;
  bulundugumuz_donem_belge_turu?: string;
  bulundugumuz_donem_hakedilen_ucret?: number;
  bulundugumuz_donem_prim_ikramiye?: number;
  bulundugumuz_donem_eksik_gun_sayisi?: number;
  bulundugumuz_donem_eksik_gun_nedeni?: string;
  onceki_donem_belge_turu?: string;
  onceki_donem_hakedilen_ucret?: number;
  onceki_donem_prim_ikramiye?: number;
  onceki_donem_eksik_gun_sayisi?: number;
  onceki_donem_eksik_gun_nedeni?: string;
}

interface PersonnelCardProps {
  personnelId?: string;
}

const PersonnelCard: React.FC<PersonnelCardProps> = ({ personnelId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { tenant } = useTenant();
  const { selectedProject } = useProject();

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<Personnel>>({});

  // SGK için state'ler
  const [sgkCredentials, setSgkCredentials] = useState<any>(null);
  const [sgkLoading, setSgkLoading] = useState(false);
  const [sgkError, setSgkError] = useState<string | null>(null);
  const [sgkSuccess, setSgkSuccess] = useState<string | null>(null);
  const [sgkIslemler, setSgkIslemler] = useState<any[]>([]);
  const [sgkSorgulamaSonuc, setSgkSorgulamaSonuc] = useState<any>(null);
  const [sgkDonemBilgileri, setSgkDonemBilgileri] = useState<any>(null);
  // SGK Service instance

  // SGK Metodları
  const loadSgkCredentials = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from("sgk_credentials")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("SGK credentials yüklenirken hata:", error);
        return;
      }

      setSgkCredentials(data);
      sgkService.setCredentials(data);
    } catch (error) {
      console.error("SGK credentials yüklenirken hata:", error);
    }
  };

  const loadSgkIslemler = async () => {
    if (!personnel) return;

    try {
      const { data, error } = await supabase
        .from("personnel_sgk_islemleri")
        .select("*")
        .eq("personnel_id", personnel.id)
        .order("islem_tarihi", { ascending: false });

      if (error) {
        console.error("SGK işlemler yüklenirken hata:", error);
        return;
      }

      setSgkIslemler(data || []);
    } catch (error) {
      console.error("SGK işlemler yüklenirken hata:", error);
    }
  };

  // Düzenleme dialog'unu açma fonksiyonu
  const handleEditClick = () => {
    if (personnel) {
      setEditData({
        first_name: personnel.first_name,
        last_name: personnel.last_name,
        phone: personnel.phone,
        email: personnel.email,
        id_number: personnel.id_number,
        gender: personnel.gender,
        birth_date: personnel.birth_date,
        status: personnel.status,
        address: personnel.address,
        emergency_contact: personnel.emergency_contact,
        emergency_phone: personnel.emergency_phone,
        blood_type: personnel.blood_type,
        medical_notes: personnel.medical_notes,
        notes: personnel.notes,
        // SGK Alanları
        tc_kimlik_no: personnel.tc_kimlik_no,
        sigorta_turu: personnel.sigorta_turu,
        gorev_kodu: personnel.gorev_kodu,
        meslek_kodu: personnel.meslek_kodu,
        csgb_iskolu: personnel.csgb_iskolu,
        eskihukumlu: personnel.eskihukumlu,
        ozurlu: personnel.ozurlu,
        ogrenim_kodu: personnel.ogrenim_kodu,
        mezuniyet_bolumu: personnel.mezuniyet_bolumu,
        mezuniyet_yili: personnel.mezuniyet_yili,
        kismi_sureli_calisiyormu: personnel.kismi_sureli_calisiyormu,
        kismi_sureli_calisma_gun_sayisi:
          personnel.kismi_sureli_calisma_gun_sayisi,
      });
      setEditDialogOpen(true);
    }
  };

  // Düzenleme kaydetme fonksiyonu
  const handleSaveEdit = async () => {
    if (!personnel || !tenant) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("personnel")
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone,
          email: editData.email,
          id_number: editData.id_number,
          gender: editData.gender,
          birth_date: editData.birth_date,
          status: editData.status,
          address: editData.address,
          emergency_contact: editData.emergency_contact,
          emergency_phone: editData.emergency_phone,
          blood_type: editData.blood_type,
          medical_notes: editData.medical_notes,
          notes: editData.notes,
          // SGK Alanları
          tc_kimlik_no: editData.tc_kimlik_no,
          sigorta_turu: editData.sigorta_turu,
          gorev_kodu: editData.gorev_kodu,
          meslek_kodu: editData.meslek_kodu,
          csgb_iskolu: editData.csgb_iskolu,
          eskihukumlu: editData.eskihukumlu,
          ozurlu: editData.ozurlu,
          ogrenim_kodu: editData.ogrenim_kodu,
          mezuniyet_bolumu: editData.mezuniyet_bolumu,
          mezuniyet_yili: editData.mezuniyet_yili,
          kismi_sureli_calisiyormu: editData.kismi_sureli_calisiyormu,
          kismi_sureli_calisma_gun_sayisi:
            editData.kismi_sureli_calisma_gun_sayisi,
          updated_at: new Date().toISOString(),
        })
        .eq("id", personnel.id)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("Personel güncellenirken hata:", error);
        setError(
          "Personel bilgileri güncellenirken hata oluştu: " + error.message
        );
        return;
      }

      // Personel bilgilerini yeniden yükle
      await fetchPersonnel();
      setEditDialogOpen(false);
      setSgkSuccess("Personel bilgileri başarıyla güncellendi!");
    } catch (error: any) {
      console.error("Personel güncellenirken hata:", error);
      setError(
        "Personel bilgileri güncellenirken hata oluştu: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIseGirisKaydet = async () => {
    if (!personnel || !sgkCredentials) {
      setSgkError("SGK kimlik bilgileri bulunamadı");
      return;
    }

    if (!personnel.tc_kimlik_no) {
      setSgkError(
        "TC Kimlik No bulunamadı. Lütfen personel bilgilerini güncelleyin."
      );
      return;
    }

    // SGK durumu kontrolü - zaten aktif olan personel için uyarı
    if (personnel.sgk_durum === "Aktif") {
      setSgkError(
        "Bu personel zaten SGK'da aktif durumda. İşe giriş işlemi yapılamaz."
      );
      return;
    }

    // SGK durumu kontrolü - çıkış yapılmış personel için uyarı
    if (personnel.sgk_durum === "Çıkış Yapılmış") {
      setSgkError(
        "Bu personel SGK'da çıkış yapmış durumda. Önce SGK'ya tekrar giriş yapılması gerekiyor."
      );
      return;
    }

    setSgkLoading(true);
    setSgkError(null);
    setSgkSuccess(null);

    try {
      const sigortaliListesi = [
        {
          tckimlikNo: personnel.tc_kimlik_no,
          ad: personnel.first_name,
          soyad: personnel.last_name,
          giristarihi: new Date()
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("."),
          sigortaliTuru: personnel.sigorta_turu || 0,
          gorevkodu: personnel.gorev_kodu || "02",
          meslekkodu: personnel.meslek_kodu,
          csgbiskolu: personnel.csgb_iskolu,
          eskihukumlu: personnel.eskihukumlu || "H",
          ozurlu: personnel.ozurlu || "H",
          ogrenimkodu: personnel.ogrenim_kodu || "0",
          mezuniyetbolumu: personnel.mezuniyet_bolumu,
          mezuniyetyili: personnel.mezuniyet_yili,
          kismiSureliCalisiyormu: personnel.kismi_sureli_calisiyormu || "H",
          kismiSureliCalismaGunSayisi:
            personnel.kismi_sureli_calisma_gun_sayisi,
        },
      ];

      const result = await sgkService.iseGirisKaydet(sigortaliListesi);

      if (result.hataKodu === 0) {
        const sgkSonuc = result.sigortaliIseGirisSonuc[0];

        // Personel bilgilerini güncelle
        const { error: updateError } = await supabase
          .from("personnel")
          .update({
            sgk_sicil_no: sgkSonuc.sicilno,
            sgk_giris_tarihi: new Date().toISOString().split("T")[0],
            sgk_referans_kodu: sgkSonuc.referansKodu,
            sgk_durum: "Aktif",
            updated_at: new Date().toISOString(),
          })
          .eq("id", personnel.id);

        if (updateError) {
          console.error("Personel güncellenirken hata:", updateError);
        }

        // SGK işlem geçmişine kaydet
        const { error: insertError } = await supabase
          .from("personnel_sgk_islemleri")
          .insert({
            personnel_id: personnel.id,
            tenant_id: tenant?.id,
            islem_turu: "ise_giris",
            sgk_referans_kodu: sgkSonuc.referansKodu,
            sgk_hatakodu: result.hataKodu,
            sgk_hata_aciklamasi: result.hataAciklamasi,
            sgk_islem_sonucu: sgkSonuc.islemSonucu,
            sgk_islem_aciklamasi: sgkSonuc.islemAciklamasi,
            sgk_sicil_no: sgkSonuc.sicilno,
            sgk_ad_soyad: sgkSonuc.adSoyad,
            sgk_tarih: new Date().toISOString().split("T")[0],
          });

        if (insertError) {
          console.error("SGK işlem geçmişi kaydedilirken hata:", insertError);
        }

        setSgkSuccess("İşe giriş bildirgesi başarıyla gönderildi!");
        await fetchPersonnel();
        await loadSgkIslemler();
      } else {
        setSgkError(`SGK Hatası: ${result.hataAciklamasi}`);
      }
    } catch (error: any) {
      console.error("İşe giriş kaydetme hatası:", error);
      setSgkError(
        "İşe giriş bildirgesi gönderilirken hata oluştu: " + error.message
      );
    } finally {
      setSgkLoading(false);
    }
  };

  const handleIstenCikisKaydet = async () => {
    if (!personnel || !sgkCredentials) {
      setSgkError("SGK kimlik bilgileri bulunamadı");
      return;
    }

    if (!personnel.tc_kimlik_no) {
      setSgkError(
        "TC Kimlik No bulunamadı. Lütfen personel bilgilerini güncelleyin."
      );
      return;
    }

    // SGK durumu kontrolü - aktif olmayan personel için uyarı
    if (personnel.sgk_durum !== "Aktif") {
      if (personnel.sgk_durum === "Giriş Yapılmamış") {
        setSgkError(
          "Bu personel SGK'da giriş yapmamış. Önce işe giriş bildirgesi gönderilmelidir."
        );
      } else if (personnel.sgk_durum === "Çıkış Yapılmış") {
        setSgkError(
          "Bu personel SGK'da zaten çıkış yapmış durumda. İşten çıkış işlemi yapılamaz."
        );
      } else {
        setSgkError("Personel SGK'da aktif değil. Önce işe giriş yapılmalı.");
      }
      return;
    }

    setSgkLoading(true);
    setSgkError(null);
    setSgkSuccess(null);

    try {
      const sigortaliListesi = [
        {
          tckimlikNo: personnel.tc_kimlik_no,
          ad: personnel.first_name,
          soyad: personnel.last_name,
          istenCikisTarihi: new Date()
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("."),
          istenCikisNedeni: personnel.isten_cikis_nedeni || "22", // Diğer nedenler
          meslekkodu: personnel.meslek_kodu,
          csgbiskolu: personnel.csgb_iskolu,
        },
      ];

      const result = await sgkService.istenCikisKaydet(sigortaliListesi);

      if (result.hataKodu === 0) {
        const sgkSonuc = result.sigortaliIstenCikisSonuc[0];

        // Personel bilgilerini güncelle
        const { error: updateError } = await supabase
          .from("personnel")
          .update({
            sgk_cikis_tarihi: new Date().toISOString().split("T")[0],
            sgk_durum: "Çıkış Yapılmış",
            updated_at: new Date().toISOString(),
          })
          .eq("id", personnel.id);

        if (updateError) {
          console.error("Personel güncellenirken hata:", updateError);
        }

        // SGK işlem geçmişine kaydet
        const { error: insertError } = await supabase
          .from("personnel_sgk_islemleri")
          .insert({
            personnel_id: personnel.id,
            tenant_id: tenant?.id,
            islem_turu: "isten_cikis",
            sgk_referans_kodu: sgkSonuc.referansKodu,
            sgk_hatakodu: result.hataKodu,
            sgk_hata_aciklamasi: result.hataAciklamasi,
            sgk_islem_sonucu: sgkSonuc.islemSonucu,
            sgk_islem_aciklamasi: sgkSonuc.islemAciklamasi,
            sgk_sicil_no: sgkSonuc.sicilno,
            sgk_ad_soyad: sgkSonuc.adSoyad,
            sgk_tarih: new Date().toISOString().split("T")[0],
          });

        if (insertError) {
          console.error("SGK işlem geçmişi kaydedilirken hata:", insertError);
        }

        setSgkSuccess("İşten çıkış bildirgesi başarıyla gönderildi!");
        await fetchPersonnel();
        await loadSgkIslemler();
      } else {
        setSgkError(`SGK Hatası: ${result.hataAciklamasi}`);
      }
    } catch (error: any) {
      console.error("İşten çıkış kaydetme hatası:", error);
      setSgkError(
        "İşten çıkış bildirgesi gönderilirken hata oluştu: " + error.message
      );
    } finally {
      setSgkLoading(false);
    }
  };

  const handleSgkSorgula = async () => {
    if (!personnel || !sgkCredentials) {
      setSgkError("SGK kimlik bilgileri bulunamadı");
      return;
    }

    if (!personnel.tc_kimlik_no) {
      setSgkError(
        "TC Kimlik No bulunamadı. Lütfen personel bilgilerini güncelleyin."
      );
      return;
    }

    setSgkLoading(true);
    setSgkError(null);
    setSgkSuccess(null);

    try {
      // İşe giriş sorgulama
      const iseGirisSonuc = await sgkService.tckimlikNoileiseGirisSorgula(
        personnel.tc_kimlik_no
      );

      // İşten çıkış sorgulama
      const istenCikisSonuc = await sgkService.tckimlikNoileistenCikisSorgula(
        personnel.tc_kimlik_no
      );

      // Sonuçları birleştir
      const sorgulamaSonuc = {
        tcKimlikNo: personnel.tc_kimlik_no,
        adSoyad: `${personnel.first_name} ${personnel.last_name}`,
        iseGirisSonuc,
        istenCikisSonuc,
        sorgulamaTarihi: new Date().toISOString(),
      };

      setSgkSorgulamaSonuc(sorgulamaSonuc);

      // Başarılı sorgulama mesajı
      setSgkSuccess("SGK sorgulama başarıyla tamamlandı!");
    } catch (error: any) {
      console.error("SGK sorgulama hatası:", error);
      setSgkError("SGK sorgulama yapılırken hata oluştu: " + error.message);
    } finally {
      setSgkLoading(false);
    }
  };

  const handleDonemVeGunSayisiBul = async () => {
    if (!personnel || !sgkCredentials) {
      setSgkError("SGK kimlik bilgileri bulunamadı");
      return;
    }

    if (!personnel.tc_kimlik_no) {
      setSgkError(
        "TC Kimlik No bulunamadı. Lütfen personel bilgilerini güncelleyin."
      );
      return;
    }

    if (
      personnel.sgk_durum !== "Aktif" &&
      personnel.sgk_durum !== "Çıkış Yapılmış"
    ) {
      setSgkError(
        "Dönem bilgileri sadece aktif veya çıkış yapmış personel için sorgulanabilir."
      );
      return;
    }

    setSgkLoading(true);
    setSgkError(null);
    setSgkSuccess(null);

    try {
      const donemSonuc = await sgkService.istenCikisDonemVeGunSayisiBul(
        personnel.tc_kimlik_no,
        personnel.sgk_cikis_tarihi || new Date().toISOString().split("T")[0]
      );

      // Sonuçları birleştir
      const donemBilgileri = {
        tcKimlikNo: personnel.tc_kimlik_no,
        adSoyad: `${personnel.first_name} ${personnel.last_name}`,
        donemSonuc,
        sorgulamaTarihi: new Date().toISOString(),
      };

      setSgkDonemBilgileri(donemBilgileri);

      // Başarılı sorgulama mesajı
      setSgkSuccess("Dönem ve gün sayısı bilgileri başarıyla alındı!");
    } catch (error: any) {
      console.error("Dönem sorgulama hatası:", error);
      setSgkError(
        "Dönem bilgileri sorgulanırken hata oluştu: " + error.message
      );
    } finally {
      setSgkLoading(false);
    }
  };

  const handlePdfIndir = async (
    referansKodu: number,
    islemTuru: "ise_giris" | "isten_cikis"
  ) => {
    if (!sgkCredentials) {
      setSgkError("SGK kimlik bilgileri bulunamadı");
      return;
    }

    if (!personnel) {
      setSgkError("Personel bilgileri bulunamadı");
      return;
    }

    // SGK durumu kontrolü - PDF indirme için
    if (islemTuru === "ise_giris" && personnel.sgk_durum !== "Aktif") {
      setSgkError("İşe giriş PDF'i sadece aktif personel için indirilebilir.");
      return;
    }

    if (
      islemTuru === "isten_cikis" &&
      personnel.sgk_durum !== "Çıkış Yapılmış"
    ) {
      setSgkError(
        "İşten çıkış PDF'i sadece çıkış yapmış personel için indirilebilir."
      );
      return;
    }

    if (!referansKodu) {
      setSgkError("Referans kodu bulunamadı. Önce SGK işlemi yapılmalı.");
      return;
    }

    setSgkLoading(true);
    setSgkError(null);
    setSgkSuccess(null);

    try {
      let pdfResult;
      if (islemTuru === "ise_giris") {
        pdfResult = await sgkService.iseGirisPdfDokum(referansKodu);
      } else {
        pdfResult = await sgkService.istenCikisPdfDokum(referansKodu);
      }

      if ((pdfResult as any).hatakodu === 0) {
        // PDF byte array'ini blob'a çevir ve indir
        let byteArray: Uint8Array;

        if (typeof pdfResult.pdfByteArray === "string") {
          // Eğer string ise base64 decode et
          const byteCharacters = atob(pdfResult.pdfByteArray);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          byteArray = new Uint8Array(byteNumbers);
        } else if (Array.isArray(pdfResult.pdfByteArray)) {
          // Eğer number array ise Uint8Array'e çevir
          byteArray = new Uint8Array(pdfResult.pdfByteArray);
        } else {
          // Fallback
          byteArray = new Uint8Array(0);
        }

        const blob = new Blob([byteArray as any], { type: "application/pdf" });

        // PDF'i indir
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SGK_${
          islemTuru === "ise_giris" ? "IseGiris" : "IstenCikis"
        }_${referansKodu}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSgkSuccess("PDF başarıyla indirildi!");

        // SGK işlem geçmişini güncelle
        const { error } = await supabase
          .from("personnel_sgk_islemleri")
          .update({
            pdf_indirildi: true,
            pdf_indirme_tarihi: new Date().toISOString(),
          })
          .eq("personnel_id", personnel?.id)
          .eq("sgk_referans_kodu", referansKodu);

        if (error) {
          console.error("PDF indirme durumu güncellenirken hata:", error);
        }

        await loadSgkIslemler();
      } else {
        setSgkError(
          `PDF indirme hatası: ${
            (pdfResult as any).hataAciklama || "Bilinmeyen hata"
          }`
        );
      }
    } catch (error: any) {
      console.error("PDF indirme hatası:", error);
      setSgkError("PDF indirilirken hata oluştu: " + error.message);
    } finally {
      setSgkLoading(false);
    }
  };

  // useEffect'ler
  useEffect(() => {
    if (tenant) {
      loadSgkCredentials();
    }
  }, [tenant]);

  useEffect(() => {
    if (personnel) {
      loadSgkIslemler();
    }
  }, [personnel]);

  // Personel bilgilerini yükle
  const fetchPersonnel = async () => {
    const personnelIdToUse = personnelId || id;
    if (!personnelIdToUse || !tenant) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("personnel")
        .select(
          `
          *,
          projects!inner(name)
        `
        )
        .eq("id", personnelIdToUse)
        .eq("tenant_id", tenant.id)
        .single();

      if (error) {
        console.error("Error fetching personnel:", error);
        setError(
          "Personel bilgileri yüklenirken hata oluştu: " + error.message
        );
        return;
      }

      if (data) {
        setPersonnel({
          ...data,
          project_name: data.projects?.name || null,
        });
      }
    } catch (err) {
      console.error("Error in fetchPersonnel:", err);
      setError("Personel bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [personnelId, id, tenant]);

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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchPersonnel}>
          Tekrar Dene
        </Button>
      </Box>
    );
  }

  if (!personnel) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Personel bulunamadı.</Alert>
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
            {personnel.first_name} {personnel.last_name}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ bgcolor: "#1976d2" }}
              onClick={handleEditClick}
            >
              DÜZENLE
            </Button>
            <Tooltip title="Yenile">
              <IconButton onClick={fetchPersonnel}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Geri Dön">
              <IconButton onClick={() => navigate("/personnel")}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Personel Bilgi Kartı */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: "#1976d2",
                      fontSize: "2rem",
                      mb: 2,
                    }}
                  >
                    {personnel.first_name[0]}
                    {personnel.last_name[0]}
                  </Avatar>
                  <Chip
                    label={personnel.status}
                    color={personnel.status === "Aktif" ? "success" : "default"}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {personnel.project_name}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ad Soyad
                    </Typography>
                    <Typography variant="h6">
                      {personnel.first_name} {personnel.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      TC Kimlik No
                    </Typography>
                    <Typography variant="h6">
                      {personnel.tc_kimlik_no || "Belirtilmemiş"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Telefon
                    </Typography>
                    <Typography variant="h6">
                      {personnel.phone || "Belirtilmemiş"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      E-posta
                    </Typography>
                    <Typography variant="h6">
                      {personnel.email || "Belirtilmemiş"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      SGK Durumu
                    </Typography>
                    <Chip
                      label={personnel.sgk_durum || "Giriş Yapılmamış"}
                      color={
                        personnel.sgk_durum === "Aktif"
                          ? "success"
                          : personnel.sgk_durum === "Çıkış Yapılmış"
                          ? "warning"
                          : "default"
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      SGK Sicil No
                    </Typography>
                    <Typography variant="h6">
                      {personnel.sgk_sicil_no || "Belirtilmemiş"}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Genel Bilgiler" />
            <Tab label="SGK İşlemleri" />
            <Tab label="Nöbet Çizelgesi" />
            <Tab label="Aile Bilgileri" />
            <Tab label="Güvenlik Kartı" />
            <Tab label="Zimmet" />
            <Tab label="İBAN Bilgileri" />
            <Tab label="İzin Yönetimi" />
            <Tab label="Zaman Tüneli" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Genel Bilgiler
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pozisyon
                  </Typography>
                  <Typography variant="body1">
                    {personnel.position || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Departman
                  </Typography>
                  <Typography variant="body1">
                    {personnel.department || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    İşe Giriş Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {personnel.hire_date || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    SGK Giriş Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {personnel.sgk_giris_tarihi || "Belirtilmemiş"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SGK İşlemleri
              </Typography>

              {/* SGK Error/Success Messages */}
              {sgkError && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setSgkError(null)}
                >
                  {sgkError}
                </Alert>
              )}

              {sgkSuccess && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  onClose={() => setSgkSuccess(null)}
                >
                  {sgkSuccess}
                </Alert>
              )}

              {/* SGK İşlem Butonları */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleIseGirisKaydet}
                      disabled={sgkLoading || personnel.sgk_durum === "Aktif"}
                      sx={{ mb: 1 }}
                    >
                      İşe Başlangıç
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      SGK'ya işe giriş bildirgesi gönder
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      startIcon={<StopIcon />}
                      onClick={handleIstenCikisKaydet}
                      disabled={sgkLoading || personnel.sgk_durum !== "Aktif"}
                      sx={{ mb: 1 }}
                    >
                      İşten Çıkış
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      SGK'ya işten çıkış bildirgesi gönder
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={handleSgkSorgula}
                      disabled={sgkLoading}
                      sx={{ mb: 1 }}
                    >
                      SGK Sorgula
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      SGK'dan personel bilgilerini sorgula
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        loadSgkCredentials();
                        loadSgkIslemler();
                      }}
                      disabled={sgkLoading}
                      sx={{ mb: 1 }}
                    >
                      Yenile
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      SGK bilgilerini yenile
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* SGK İşlem Geçmişi */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                SGK İşlem Geçmişi
              </Typography>

              {sgkIslemler.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>İşlem Türü</TableCell>
                        <TableCell>SGK Referans</TableCell>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sgkIslemler.map((islem, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={
                                islem.islem_turu === "ise_giris"
                                  ? "İşe Giriş"
                                  : "İşten Çıkış"
                              }
                              color={
                                islem.islem_turu === "ise_giris"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {islem.sgk_referans_kodu || "-"}
                          </TableCell>
                          <TableCell>{islem.sgk_tarih}</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                islem.sgk_islem_sonucu === 0
                                  ? "Başarılı"
                                  : "Hatalı"
                              }
                              color={
                                islem.sgk_islem_sonucu === 0
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {islem.sgk_referans_kodu && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  handlePdfIndir(
                                    islem.sgk_referans_kodu,
                                    islem.islem_turu
                                  )
                                }
                                disabled={sgkLoading}
                              >
                                <DownloadIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">Henüz SGK işlemi yapılmamış.</Alert>
              )}

              {/* SGK Sorgulama Sonucu */}
              {sgkSorgulamaSonuc && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    SGK Sorgulama Sonucu
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Hata Kodu: {sgkSorgulamaSonuc.hatakodu}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hata Açıklaması: {sgkSorgulamaSonuc.hataAciklama}
                      </Typography>
                      {sgkSorgulamaSonuc.iseGirisKayitlari &&
                        sgkSorgulamaSonuc.iseGirisKayitlari.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Kayıt Sayısı:{" "}
                            {sgkSorgulamaSonuc.iseGirisKayitlari.length}
                          </Typography>
                        )}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Diğer Tab'lar için detaylı içerik */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Nöbet Çizelgesi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nöbet çizelgesi bilgileri burada görüntülenecek.
              </Typography>
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aile Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Acil Durum İletişim
                  </Typography>
                  <Typography variant="body1">
                    {personnel.emergency_contact || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Acil Durum Telefon
                  </Typography>
                  <Typography variant="body1">
                    {personnel.emergency_phone || "Belirtilmemiş"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Güvenlik Kartı
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Kart Numarası
                  </Typography>
                  <Typography variant="body1">
                    {personnel.mobile_login_username || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    PIN Kodu
                  </Typography>
                  <Typography variant="body1">
                    {personnel.mobile_login_pin || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mobil Sistem
                  </Typography>
                  <Typography variant="body1">
                    {personnel.mobile_version_system || "Belirtilmemiş"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Mobil Versiyon
                  </Typography>
                  <Typography variant="body1">
                    {personnel.mobile_version_version || "Belirtilmemiş"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 5 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zimmet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Zimmet bilgileri burada görüntülenecek.
              </Typography>
            </CardContent>
          </Card>
        )}

        {activeTab === 6 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                İBAN Bilgileri
              </Typography>
              <Typography variant="body2" color="text.secondary">
                İBAN bilgileri burada görüntülenecek.
              </Typography>
            </CardContent>
          </Card>
        )}

        {activeTab === 7 && personnel && (
          <LeaveManagement
            personnel={personnel}
            onClose={() => setActiveTab(0)}
          />
        )}

        {activeTab === 8 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Zaman Tüneli
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Zaman tüneli bilgileri burada görüntülenecek.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Düzenleme Dialog'u */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Personel Bilgilerini Düzenle</Typography>
              <IconButton onClick={() => setEditDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Temel Bilgiler */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main" }}
                  >
                    👤 Temel Bilgiler
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ad"
                    value={editData.first_name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, first_name: e.target.value })
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Soyad"
                    value={editData.last_name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, last_name: e.target.value })
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={editData.phone || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    size="small"
                    placeholder="0555 123 45 67"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-posta"
                    type="email"
                    value={editData.email || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    size="small"
                    placeholder="ornek@email.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TC Kimlik No"
                    value={editData.id_number || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, id_number: e.target.value })
                    }
                    size="small"
                    placeholder="12345678901"
                    inputProps={{ maxLength: 11 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cinsiyet</InputLabel>
                    <Select
                      value={editData.gender || ""}
                      label="Cinsiyet"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          gender: e.target.value as "Erkek" | "Kadın",
                        })
                      }
                    >
                      <MenuItem value="Erkek">Erkek</MenuItem>
                      <MenuItem value="Kadın">Kadın</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Doğum Tarihi"
                    type="date"
                    value={editData.birth_date || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, birth_date: e.target.value })
                    }
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={editData.status || ""}
                      label="Durum"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          status: e.target.value as "Aktif" | "Pasif",
                        })
                      }
                    >
                      <MenuItem value="Aktif">Aktif</MenuItem>
                      <MenuItem value="Pasif">Pasif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={editData.address || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Tam adres bilgisi"
                  />
                </Grid>

                {/* SGK Bilgileri */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mt: 2 }}
                  >
                    🏛️ SGK Bilgileri
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TC Kimlik No (SGK)"
                    value={editData.tc_kimlik_no || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, tc_kimlik_no: e.target.value })
                    }
                    size="small"
                    placeholder="12345678901"
                    inputProps={{ maxLength: 11 }}
                    helperText="SGK işlemleri için gerekli"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sigorta Türü</InputLabel>
                    <Select
                      value={editData.sigorta_turu || 0}
                      label="Sigorta Türü"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          sigorta_turu: Number(e.target.value),
                        })
                      }
                    >
                      <MenuItem value={0}>Tüm Sigorta Kolları</MenuItem>
                      <MenuItem value={2}>
                        Yurtdışına işçi olarak gidenler
                      </MenuItem>
                      <MenuItem value={7}>Çırak</MenuItem>
                      <MenuItem value={8}>
                        Sosyal Güvenlik Destek Primi
                      </MenuItem>
                      <MenuItem value={12}>
                        U.Söz.Olmayan Yab.Uyrk.Sigortalı
                      </MenuItem>
                      <MenuItem value={14}>Cezaevi Çalışanları</MenuItem>
                      <MenuItem value={16}>İşkur Kursiyerleri</MenuItem>
                      <MenuItem value={17}>İş Kaybı Tazminatı Alanlar</MenuItem>
                      <MenuItem value={18}>Yök ve ÖSYM Kısmi Isdihdam</MenuItem>
                      <MenuItem value={19}>Stajyer</MenuItem>
                      <MenuItem value={24}>İntörn Öğrenci</MenuItem>
                      <MenuItem value={25}>
                        Harp m. Vazife m. 2330 ve 3713 SK göre aylık alan
                      </MenuItem>
                      <MenuItem value={32}>Bursiyer</MenuItem>
                      <MenuItem value={33}>Güvenlik Korucusu</MenuItem>
                      <MenuItem value={34}>
                        Gecici 20 kapsamında Zorunlu Sigortalı
                      </MenuItem>
                      <MenuItem value={35}>
                        Gecici 20 kapsamında Sosyal Güvenlik Destekleme Primi
                      </MenuItem>
                      <MenuItem value={37}>
                        Tamamlayıcı ya da Alan Eğitimi Gören Öğrenciler
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Görev Kodu"
                    value={editData.gorev_kodu || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, gorev_kodu: e.target.value })
                    }
                    size="small"
                    placeholder="02"
                    helperText="Varsayılan: 02"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Meslek Kodu"
                    value={editData.meslek_kodu || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, meslek_kodu: e.target.value })
                    }
                    size="small"
                    placeholder="Meslek kodu"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ÇSGB İş Kolu"
                    value={editData.csgb_iskolu || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, csgb_iskolu: e.target.value })
                    }
                    size="small"
                    placeholder="İş kolu kodu"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Eski Hükümlü</InputLabel>
                    <Select
                      value={editData.eskihukumlu || "H"}
                      label="Eski Hükümlü"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          eskihukumlu: e.target.value as "E" | "H",
                        })
                      }
                    >
                      <MenuItem value="H">Hayır</MenuItem>
                      <MenuItem value="E">Evet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Engelli</InputLabel>
                    <Select
                      value={editData.ozurlu || "H"}
                      label="Engelli"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          ozurlu: e.target.value as "E" | "H",
                        })
                      }
                    >
                      <MenuItem value="H">Hayır</MenuItem>
                      <MenuItem value="E">Evet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Öğrenim Kodu"
                    value={editData.ogrenim_kodu || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, ogrenim_kodu: e.target.value })
                    }
                    size="small"
                    placeholder="0"
                    helperText="Varsayılan: 0"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mezuniyet Bölümü"
                    value={editData.mezuniyet_bolumu || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        mezuniyet_bolumu: e.target.value,
                      })
                    }
                    size="small"
                    placeholder="Mezuniyet bölümü"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mezuniyet Yılı"
                    value={editData.mezuniyet_yili || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        mezuniyet_yili: Number(e.target.value),
                      })
                    }
                    size="small"
                    placeholder="2020"
                    type="number"
                    inputProps={{ min: 1950, max: new Date().getFullYear() }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kısmi Süreli Çalışıyor mu</InputLabel>
                    <Select
                      value={editData.kismi_sureli_calisiyormu || "H"}
                      label="Kısmi Süreli Çalışıyor mu"
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          kismi_sureli_calisiyormu: e.target.value as "E" | "H",
                        })
                      }
                    >
                      <MenuItem value="H">Hayır</MenuItem>
                      <MenuItem value="E">Evet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kısmi Süreli Çalışma Gün Sayısı"
                    value={editData.kismi_sureli_calisma_gun_sayisi || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        kismi_sureli_calisma_gun_sayisi: Number(e.target.value),
                      })
                    }
                    size="small"
                    placeholder="30"
                    type="number"
                    inputProps={{ min: 1, max: 30 }}
                    disabled={editData.kismi_sureli_calisiyormu === "H"}
                  />
                </Grid>

                {/* İletişim Bilgileri */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mt: 2 }}
                  >
                    📞 İletişim Bilgileri
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Acil Durum İletişim"
                    value={editData.emergency_contact || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        emergency_contact: e.target.value,
                      })
                    }
                    size="small"
                    placeholder="Anne, Baba, Eş vb."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Acil Durum Telefon"
                    value={editData.emergency_phone || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        emergency_phone: e.target.value,
                      })
                    }
                    size="small"
                    placeholder="0555 123 45 67"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Kan Grubu"
                    value={editData.blood_type || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, blood_type: e.target.value })
                    }
                    size="small"
                    placeholder="A Rh+"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tıbbi Notlar"
                    value={editData.medical_notes || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        medical_notes: e.target.value,
                      })
                    }
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Alerjiler, kronik hastalıklar vb."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notlar"
                    value={editData.notes || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, notes: e.target.value })
                    }
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Diğer önemli bilgiler"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveEdit}
              disabled={loading}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PersonnelCard;
