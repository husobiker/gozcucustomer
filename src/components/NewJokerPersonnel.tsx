import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";

const NewJokerPersonnel: React.FC = () => {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    id_number: "",
    company_name: "",
    status: "Aktif" as "Aktif" | "Pasif",
    // SGK Alanları
    tc_kimlik_no: "",
    sigorta_turu: 0,
    gorev_kodu: "02",
    meslek_kodu: "",
    csgb_iskolu: "",
    eskihukumlu: "H",
    ozurlu: "H",
    ogrenim_kodu: "0",
    mezuniyet_bolumu: "",
    mezuniyet_yili: "",
    kismi_sureli_calisiyormu: "H",
    kismi_sureli_calisma_gun_sayisi: "",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submitted!");
    console.log("Tenant:", JSON.stringify(tenant, null, 2));
    console.log("Selected Project:", JSON.stringify(selectedProject, null, 2));

    if (!tenant || !selectedProject) {
      setError("Tenant veya proje bilgisi bulunamadı");
      return;
    }

    // Form validasyonu
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError("Ad ve soyad alanları zorunludur");
      return;
    }

    if (!formData.id_number.trim()) {
      setError("TC Kimlik No alanı zorunludur");
      return;
    }

    if (formData.id_number.length !== 11) {
      setError("TC Kimlik No 11 haneli olmalıdır");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const insertData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        id_number: formData.id_number.trim(),
        company_name: formData.company_name.trim(),
        status: formData.status,
        // SGK Alanları
        tc_kimlik_no: formData.tc_kimlik_no,
        sigorta_turu: formData.sigorta_turu,
        gorev_kodu: formData.gorev_kodu,
        meslek_kodu: formData.meslek_kodu,
        csgb_iskolu: formData.csgb_iskolu,
        eskihukumlu: formData.eskihukumlu,
        ozurlu: formData.ozurlu,
        ogrenim_kodu: formData.ogrenim_kodu,
        mezuniyet_bolumu: formData.mezuniyet_bolumu,
        mezuniyet_yili: formData.mezuniyet_yili
          ? parseInt(formData.mezuniyet_yili)
          : null,
        kismi_sureli_calisiyormu: formData.kismi_sureli_calisiyormu,
        kismi_sureli_calisma_gun_sayisi:
          formData.kismi_sureli_calisma_gun_sayisi
            ? parseInt(formData.kismi_sureli_calisma_gun_sayisi)
            : null,
        tenant_id: tenant.id,
        project_id: selectedProject.id,
      };

      console.log("Insert data:", JSON.stringify(insertData, null, 2));

      // Try the insert - the RLS policy should handle tenant isolation
      const { data, error } = await supabase
        .from("joker_personnel")
        .insert([insertData])
        .select();

      if (error) {
        console.error(
          "Error creating joker personnel:",
          JSON.stringify(error, null, 2)
        );
        console.error("Error details:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        console.error("Error hint:", error.hint);

        if (error.message.includes("duplicate key value")) {
          setError("Bu TC Kimlik No ile zaten kayıtlı bir joker personel var");
        } else if (
          error.message.includes('relation "joker_personnel" does not exist')
        ) {
          setError(
            "Joker personel tablosu henüz oluşturulmamış. Lütfen veritabanı yöneticisi ile iletişime geçin."
          );
        } else if (
          error.message.includes("invalid input syntax for type uuid")
        ) {
          setError(
            "Veritabanı bağlantı hatası. Lütfen sayfayı yenileyin ve tekrar deneyin."
          );
        } else if (error.code === "42501") {
          setError(
            "Yetki hatası: Bu işlem için gerekli izinleriniz bulunmuyor. Lütfen yönetici ile iletişime geçin."
          );
        } else if (error.code === "PGRST301") {
          setError(
            "RLS hatası: Veri güvenlik politikası nedeniyle işlem gerçekleştirilemedi. Lütfen yönetici ile iletişime geçin."
          );
        } else if (error.code === "22P02") {
          setError(
            "UUID format hatası: Kullanıcı bilgilerinde geçersiz format. Lütfen çıkış yapıp tekrar giriş yapın."
          );
        } else {
          setError(
            `Joker personel oluşturulurken hata oluştu (${error.code}): ${error.message}`
          );
        }
      } else {
        setSuccess(true);
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          id_number: "",
          company_name: "",
          status: "Aktif",
          // SGK Alanları
          tc_kimlik_no: "",
          sigorta_turu: 0,
          gorev_kodu: "02",
          meslek_kodu: "",
          csgb_iskolu: "",
          eskihukumlu: "H",
          ozurlu: "H",
          ogrenim_kodu: "0",
          mezuniyet_bolumu: "",
          mezuniyet_yili: "",
          kismi_sureli_calisiyormu: "H",
          kismi_sureli_calisma_gun_sayisi: "",
        });

        // 2 saniye sonra personel sayfasına yönlendir
        setTimeout(() => {
          navigate("/personnel");
        }, 2000);
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("Joker personel oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Yeni Joker Personel Ekle
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedProject?.name} - {tenant.name}
          </Typography>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Joker personel başarıyla oluşturuldu! Personel sayfasına
            yönlendiriliyorsunuz...
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ad *"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Soyad *"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefon"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  fullWidth
                  placeholder="0555 123 45 67"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="TC Kimlik No *"
                  value={formData.id_number}
                  onChange={(e) =>
                    handleInputChange("id_number", e.target.value)
                  }
                  fullWidth
                  required
                  inputProps={{ maxLength: 11 }}
                  placeholder="12345678901"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Firma Adı"
                  value={formData.company_name}
                  onChange={(e) =>
                    handleInputChange("company_name", e.target.value)
                  }
                  fullWidth
                  placeholder="ABC Güvenlik Şirketi"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    label="Durum"
                  >
                    <MenuItem value="Aktif">Aktif</MenuItem>
                    <MenuItem value="Pasif">Pasif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* SGK Bilgileri */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                  🏛️ SGK Bilgileri
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="TC Kimlik No (SGK)"
                  value={formData.tc_kimlik_no}
                  onChange={(e) =>
                    handleInputChange("tc_kimlik_no", e.target.value)
                  }
                  fullWidth
                  inputProps={{ maxLength: 11 }}
                  placeholder="12345678901"
                  helperText="SGK işlemleri için gerekli"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sigorta Türü</InputLabel>
                  <Select
                    value={formData.sigorta_turu}
                    onChange={(e) =>
                      handleInputChange("sigorta_turu", e.target.value)
                    }
                    label="Sigorta Türü"
                  >
                    <MenuItem value={0}>Tüm Sigorta Kolları</MenuItem>
                    <MenuItem value={2}>
                      Yurtdışına işçi olarak gidenler
                    </MenuItem>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Görev Kodu"
                  value={formData.gorev_kodu}
                  onChange={(e) =>
                    handleInputChange("gorev_kodu", e.target.value)
                  }
                  fullWidth
                  placeholder="02"
                  helperText="Varsayılan: 02"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Meslek Kodu"
                  value={formData.meslek_kodu}
                  onChange={(e) =>
                    handleInputChange("meslek_kodu", e.target.value)
                  }
                  fullWidth
                  placeholder="Meslek kodu"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ÇSGB İş Kolu"
                  value={formData.csgb_iskolu}
                  onChange={(e) =>
                    handleInputChange("csgb_iskolu", e.target.value)
                  }
                  fullWidth
                  placeholder="İş kolu kodu"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Eski Hükümlü</InputLabel>
                  <Select
                    value={formData.eskihukumlu}
                    onChange={(e) =>
                      handleInputChange("eskihukumlu", e.target.value)
                    }
                    label="Eski Hükümlü"
                  >
                    <MenuItem value="H">Hayır</MenuItem>
                    <MenuItem value="E">Evet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Engelli</InputLabel>
                  <Select
                    value={formData.ozurlu}
                    onChange={(e) =>
                      handleInputChange("ozurlu", e.target.value)
                    }
                    label="Engelli"
                  >
                    <MenuItem value="H">Hayır</MenuItem>
                    <MenuItem value="E">Evet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Öğrenim Kodu"
                  value={formData.ogrenim_kodu}
                  onChange={(e) =>
                    handleInputChange("ogrenim_kodu", e.target.value)
                  }
                  fullWidth
                  placeholder="0"
                  helperText="Varsayılan: 0"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mezuniyet Bölümü"
                  value={formData.mezuniyet_bolumu}
                  onChange={(e) =>
                    handleInputChange("mezuniyet_bolumu", e.target.value)
                  }
                  fullWidth
                  placeholder="Mezuniyet bölümü"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mezuniyet Yılı"
                  value={formData.mezuniyet_yili}
                  onChange={(e) =>
                    handleInputChange("mezuniyet_yili", e.target.value)
                  }
                  fullWidth
                  placeholder="2020"
                  type="number"
                  inputProps={{ min: 1950, max: new Date().getFullYear() }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Kısmi Süreli Çalışıyor mu</InputLabel>
                  <Select
                    value={formData.kismi_sureli_calisiyormu}
                    onChange={(e) =>
                      handleInputChange(
                        "kismi_sureli_calisiyormu",
                        e.target.value
                      )
                    }
                    label="Kısmi Süreli Çalışıyor mu"
                  >
                    <MenuItem value="H">Hayır</MenuItem>
                    <MenuItem value="E">Evet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kısmi Süreli Çalışma Gün Sayısı"
                  value={formData.kismi_sureli_calisma_gun_sayisi}
                  onChange={(e) =>
                    handleInputChange(
                      "kismi_sureli_calisma_gun_sayisi",
                      e.target.value
                    )
                  }
                  fullWidth
                  placeholder="30"
                  type="number"
                  inputProps={{ min: 1, max: 30 }}
                  disabled={formData.kismi_sureli_calisiyormu === "H"}
                />
              </Grid>
            </Grid>

            {/* Buttons */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/personnel")}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ bgcolor: "#1976d2" }}
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewJokerPersonnel;
