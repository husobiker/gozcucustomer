import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import { useTenant } from "../contexts/TenantContext";
import { supabase } from "../lib/supabase";

const NewPersonnel: React.FC = () => {
  const navigate = useNavigate();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useProject();
  const { tenant } = useTenant();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    project: "",
    status: "Aktif",
    formModuleActive: false,
    independentFormActive: false,
    // Kişisel Bilgiler
    phone: "",
    email: "",
    idNumber: "",
    address: "",
    birthDate: "",
    gender: "",
    // İletişim Bilgileri
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
    medicalNotes: "",
    notes: "",
    // SGK Alanları (sgk.txt spesifikasyonlarına uygun)
    tcKimlikNo: "",
    sigortaTuru: 0,
    gorevKodu: "02",
    meslekKodu: "",
    csgbIskolu: "",
    eskihukumlu: "H",
    ozurlu: "H",
    ogrenimKodu: "0",
    mezuniyetBolumu: "",
    mezuniyetYili: "",
    kismiSureliCalisiyormu: "H",
    kismiSureliCalismaGunSayisi: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personnelLimits, setPersonnelLimits] = useState<{
    current: number;
    max: number;
    canAdd: boolean;
    remaining: number;
  } | null>(null);

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

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!tenant) {
      setError("Tenant bilgisi bulunamadı");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.project) {
      setError("Lütfen Ad, Soyad ve Proje alanlarını doldurun");
      return;
    }

    // Personel limiti kontrolü
    if (personnelLimits && !personnelLimits.canAdd) {
      setError(
        `Paket limitiniz doldu! Mevcut: ${personnelLimits.current}/${
          personnelLimits.max === -1 ? "Sınırsız" : personnelLimits.max
        }`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      // Generate mobile login credentials - shorter and code-based
      const firstNameCode = formData.firstName.substring(0, 2).toLowerCase();
      const lastNameCode = formData.lastName.substring(0, 2).toLowerCase();
      const randomCode = Math.floor(10 + Math.random() * 90).toString(); // 2 digit random
      const mobileLoginUsername = `${firstNameCode}${lastNameCode}${randomCode}`;
      const mobileLoginPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit PIN

      const { data, error } = await supabase
        .from("personnel")
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          project_id: formData.project,
          status: formData.status,
          mobile_login_username: mobileLoginUsername,
          mobile_login_pin: mobileLoginPin,
          mobile_version_system: "android", // Default to android
          mobile_version_version: "1.0.0", // Default version
          tenant_id: tenant.id,
          // Kişisel bilgiler
          phone: formData.phone || null,
          email: formData.email || null,
          id_number: formData.idNumber || null,
          address: formData.address || null,
          birth_date: formData.birthDate || null,
          gender: formData.gender || null,
          // İletişim bilgileri
          emergency_contact: formData.emergencyContact || null,
          emergency_phone: formData.emergencyPhone || null,
          blood_type: formData.bloodType || null,
          medical_notes: formData.medicalNotes || null,
          notes: formData.notes || null,
          // SGK Alanları
          tc_kimlik_no: formData.tcKimlikNo || null,
          sigorta_turu: formData.sigortaTuru,
          gorev_kodu: formData.gorevKodu,
          meslek_kodu: formData.meslekKodu || null,
          csgb_iskolu: formData.csgbIskolu || null,
          eskihukumlu: formData.eskihukumlu,
          ozurlu: formData.ozurlu,
          ogrenim_kodu: formData.ogrenimKodu,
          mezuniyet_bolumu: formData.mezuniyetBolumu || null,
          mezuniyet_yili: formData.mezuniyetYili
            ? parseInt(formData.mezuniyetYili)
            : null,
          kismi_sureli_calisiyormu: formData.kismiSureliCalisiyormu,
          kismi_sureli_calisma_gun_sayisi: formData.kismiSureliCalismaGunSayisi
            ? parseInt(formData.kismiSureliCalismaGunSayisi)
            : null,
        })
        .select();

      if (error) {
        console.error("Error creating personnel:", error);
        setError("Personel oluşturulurken bir hata oluştu: " + error.message);
      } else {
        console.log("Personnel created successfully:", data);
        // Show success message with credentials
        alert(
          `Personel başarıyla oluşturuldu!\n\nGiriş Bilgileri:\nKullanıcı Adı: ${mobileLoginUsername}\nPIN: ${mobileLoginPin}`
        );
        // Navigate back to personnel list
        navigate("/personnel");
      }
    } catch (err) {
      console.error("Error in handleSave:", err);
      setError("Personel oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate("/personnel")} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Yeni Personel Oluştur
            </Typography>
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
              sx={{
                minWidth: 300,
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
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
        </Box>

        {/* Error Alerts */}
        {projectsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {projectsError}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content Panel */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          {/* Temel Bilgiler */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            📋 Temel Bilgiler
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Ad *"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Soyad *"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Proje *</InputLabel>
                <Select
                  value={formData.project}
                  label="Proje *"
                  onChange={(e) => handleInputChange("project", e.target.value)}
                  disabled={projectsLoading}
                >
                  {projectsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Projeler yükleniyor...
                    </MenuItem>
                  ) : projects.length === 0 ? (
                    <MenuItem disabled>Proje bulunamadı</MenuItem>
                  ) : (
                    projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Durum *</InputLabel>
                <Select
                  value={formData.status}
                  label="Durum *"
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <MenuItem value="Aktif">Aktif</MenuItem>
                  <MenuItem value="Pasif">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Kişisel Bilgiler */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            👤 Kişisel Bilgiler
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                size="small"
                placeholder="0555 123 45 67"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                size="small"
                placeholder="ornek@email.com"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                value={formData.idNumber}
                onChange={(e) => handleInputChange("idNumber", e.target.value)}
                size="small"
                placeholder="12345678901"
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cinsiyet</InputLabel>
                <Select
                  value={formData.gender}
                  label="Cinsiyet"
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <MenuItem value="Erkek">Erkek</MenuItem>
                  <MenuItem value="Kadın">Kadın</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Doğum Tarihi"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kan Grubu"
                value={formData.bloodType}
                onChange={(e) => handleInputChange("bloodType", e.target.value)}
                size="small"
                placeholder="A Rh+"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                size="small"
                multiline
                rows={2}
                placeholder="Tam adres bilgisi"
              />
            </Grid>
          </Grid>

          {/* SGK Bilgileri */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            🏛️ SGK Bilgileri
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                value={formData.tcKimlikNo}
                onChange={(e) =>
                  handleInputChange("tcKimlikNo", e.target.value)
                }
                size="small"
                placeholder="12345678901"
                inputProps={{ maxLength: 11 }}
                helperText="SGK işlemleri için gerekli"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Sigorta Türü</InputLabel>
                <Select
                  value={formData.sigortaTuru}
                  label="Sigorta Türü"
                  onChange={(e) =>
                    handleInputChange("sigortaTuru", e.target.value)
                  }
                >
                  <MenuItem value={0}>Tüm Sigorta Kolları</MenuItem>
                  <MenuItem value={2}>Yurtdışına işçi olarak gidenler</MenuItem>
                  <MenuItem value={7}>Çırak</MenuItem>
                  <MenuItem value={8}>Sosyal Güvenlik Destek Primi</MenuItem>
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Görev Kodu"
                value={formData.gorevKodu}
                onChange={(e) => handleInputChange("gorevKodu", e.target.value)}
                size="small"
                placeholder="02"
                helperText="Varsayılan: 02"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Meslek Kodu"
                value={formData.meslekKodu}
                onChange={(e) =>
                  handleInputChange("meslekKodu", e.target.value)
                }
                size="small"
                placeholder="Meslek kodu"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="ÇSGB İş Kolu"
                value={formData.csgbIskolu}
                onChange={(e) =>
                  handleInputChange("csgbIskolu", e.target.value)
                }
                size="small"
                placeholder="İş kolu kodu"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Eski Hükümlü</InputLabel>
                <Select
                  value={formData.eskihukumlu}
                  label="Eski Hükümlü"
                  onChange={(e) =>
                    handleInputChange("eskihukumlu", e.target.value)
                  }
                >
                  <MenuItem value="H">Hayır</MenuItem>
                  <MenuItem value="E">Evet</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Engelli</InputLabel>
                <Select
                  value={formData.ozurlu}
                  label="Engelli"
                  onChange={(e) => handleInputChange("ozurlu", e.target.value)}
                >
                  <MenuItem value="H">Hayır</MenuItem>
                  <MenuItem value="E">Evet</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Öğrenim Kodu"
                value={formData.ogrenimKodu}
                onChange={(e) =>
                  handleInputChange("ogrenimKodu", e.target.value)
                }
                size="small"
                placeholder="0"
                helperText="Varsayılan: 0"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Mezuniyet Bölümü"
                value={formData.mezuniyetBolumu}
                onChange={(e) =>
                  handleInputChange("mezuniyetBolumu", e.target.value)
                }
                size="small"
                placeholder="Mezuniyet bölümü"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Mezuniyet Yılı"
                value={formData.mezuniyetYili}
                onChange={(e) =>
                  handleInputChange("mezuniyetYili", e.target.value)
                }
                size="small"
                placeholder="2020"
                type="number"
                inputProps={{ min: 1950, max: new Date().getFullYear() }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Kısmi Süreli Çalışıyor mu</InputLabel>
                <Select
                  value={formData.kismiSureliCalisiyormu}
                  label="Kısmi Süreli Çalışıyor mu"
                  onChange={(e) =>
                    handleInputChange("kismiSureliCalisiyormu", e.target.value)
                  }
                >
                  <MenuItem value="H">Hayır</MenuItem>
                  <MenuItem value="E">Evet</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kısmi Süreli Çalışma Gün Sayısı"
                value={formData.kismiSureliCalismaGunSayisi}
                onChange={(e) =>
                  handleInputChange(
                    "kismiSureliCalismaGunSayisi",
                    e.target.value
                  )
                }
                size="small"
                placeholder="30"
                type="number"
                inputProps={{ min: 1, max: 30 }}
                disabled={formData.kismiSureliCalisiyormu === "H"}
              />
            </Grid>
          </Grid>

          {/* İletişim Bilgileri */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            📞 İletişim Bilgileri
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Acil Durum İletişim"
                value={formData.emergencyContact}
                onChange={(e) =>
                  handleInputChange("emergencyContact", e.target.value)
                }
                size="small"
                placeholder="Anne, Baba, Eş vb."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Acil Durum Telefon"
                value={formData.emergencyPhone}
                onChange={(e) =>
                  handleInputChange("emergencyPhone", e.target.value)
                }
                size="small"
                placeholder="0555 123 45 67"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tıbbi Notlar"
                value={formData.medicalNotes}
                onChange={(e) =>
                  handleInputChange("medicalNotes", e.target.value)
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
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                size="small"
                multiline
                rows={2}
                placeholder="Diğer önemli bilgiler"
              />
            </Grid>
          </Grid>

          {/* Divider */}
          <Divider sx={{ my: 3 }} />

          {/* Özlük Dosyası Belgeleri */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mb: 2, color: "primary.main" }}
          >
            📁 Özlük Dosyası Belgeleri
          </Typography>
          <Paper sx={{ p: 2, bgcolor: "#f8f9fa", mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              İşe alım sürecinde aşağıdaki belgelerin toplanması gerekmektedir:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 Nüfus cüzdanı fotokopisi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 SGK işe giriş bildirgesi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 İş sözleşmesi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📸 2 adet vesikalık fotoğraf
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🪖 Erkek çalışanlar için askerlik durum belgesi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 Adli sicil kaydı
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 İş başvuru formu
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📄 İkametgah belgesi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🏥 Sağlık raporu
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🎓 Diploma fotokopisi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  💍 Evli işçiler için evlilik cüzdanı fotokopisi
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  👨‍👩‍👧‍👦 Evli işçiler için eşinin ve varsa çocuklarının nüfus
                  cüzdanı fotokopisi
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Form Settings Section */}
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Form Ayarları
          </Typography>

          {/* Form Module Activation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Bu modülü aktifleştirerek personelin mobil uygulama üzerinden form
              doldurabilmesini sağlayabilirsiniz. Kontrol noktalarına atanan
              formlar için bu ayar zorunludur. Bu ayarı değiştirmeniz durumunda
              personelin tekrar giriş yapması gerekecektir.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.formModuleActive}
                  onChange={(e) =>
                    handleInputChange("formModuleActive", e.target.checked)
                  }
                />
              }
              label={`Form Modülü: ${
                formData.formModuleActive ? "Aktif" : "Pasif"
              }`}
            />
          </Box>

          {/* Independent Form Filling */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Bu ayar mobil uygulamadaki "+" menüsünde "Form Doldur" seçeneğinin
              görünürlüğünü kontrol eder. Aktif olduğunda personel gönüllü
              olarak form doldurabilir, pasif olduğunda sadece kontrol noktası
              okutulduğunda form doldurabilir.
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.independentFormActive}
                  onChange={(e) =>
                    handleInputChange("independentFormActive", e.target.checked)
                  }
                />
              }
              label={`Bağımsız Form: ${
                formData.independentFormActive ? "Aktif" : "Pasif"
              }`}
            />
          </Box>

          {/* Save Button */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSave}
              disabled={loading}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
                px: 4,
                py: 1.5,
              }}
            >
              {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewPersonnel;
