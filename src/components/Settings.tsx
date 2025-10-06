import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  TextField,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  List as ListIcon,
  AccountBalanceWallet as WalletIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CloudUpload as UploadIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTenant } from "../contexts/TenantContext";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { useCorporateSettings } from "../hooks/useCorporateSettings";
import GibSettings from "./GibSettings";
import GibInvoiceManagement from "./GibInvoiceManagement";
import GibReports from "./GibReports";
import IncomingEInvoices from "./IncomingEInvoices";
import SgkManagement from "./SgkManagement";

const Settings: React.FC = () => {
  const { tenant, updateTenantLogo } = useTenant();
  const {
    settings: corporateSettings,
    loading: corporateLoading,
    refetch: refetchCorporate,
  } = useCorporateSettings();
  const [activeTab, setActiveTab] = useState("summary");
  const [gibSubTab, setGibSubTab] = useState("settings");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firma bilgileri state'leri
  const [companyInfo, setCompanyInfo] = useState({
    company_name: "",
    company_full_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    tax_number: "",
    tax_office: "",
  });
  const [savingCompanyInfo, setSavingCompanyInfo] = useState(false);
  const [companyInfoSuccess, setCompanyInfoSuccess] = useState<string | null>(
    null
  );

  const sidebarItems = [
    { id: "summary", label: "Özet", icon: <PersonIcon /> },
    { id: "company", label: "Firma Bilgileri", icon: <BusinessIcon /> },
    { id: "gib", label: "GİB Entegrasyonu", icon: <ReceiptIcon /> },
    { id: "sgk", label: "SGK Ayarları", icon: <BusinessIcon /> },
    { id: "plans", label: "Planlar", icon: <ListIcon /> },
    { id: "payments", label: "Ödemeler & Bakiye", icon: <WalletIcon /> },
  ];

  const handleCopyId = () => {
    if (tenant?.id) {
      navigator.clipboard.writeText(tenant.id);
    }
  };

  // Plan bilgilerini formatla
  const getPlanInfo = () => {
    if (!tenant) return { name: "MAX_SEAT_80", maxUsers: 80, type: "basic" };

    const planMap = {
      basic: { name: "BASIC", maxUsers: tenant.max_users || 10, type: "basic" },
      pro: { name: "PRO", maxUsers: tenant.max_users || 50, type: "pro" },
      enterprise: {
        name: "ENTERPRISE",
        maxUsers: tenant.max_users || 200,
        type: "enterprise",
      },
    };

    return (
      planMap[tenant.subscription_plan] || {
        name: "MAX_SEAT_80",
        maxUsers: 80,
        type: "basic",
      }
    );
  };

  const planInfo = getPlanInfo();

  // Personel ve kullanıcı sayılarını hesapla
  const [personnelStats, setPersonnelStats] = useState({
    active: 0,
    inactive: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchPersonnelStats = async () => {
      try {
        const { data: personnel, error } = await supabaseAdmin
          .from("personnel")
          .select("status")
          .eq("tenant_id", tenant?.id);

        if (error) {
          console.error("Error fetching personnel stats:", error);
          return;
        }

        const active =
          personnel?.filter((p: any) => p.status === "active").length || 0;
        const inactive =
          personnel?.filter((p: any) => p.status === "inactive").length || 0;
        const total = personnel?.length || 0;

        setPersonnelStats({ active, inactive, total });
      } catch (error) {
        console.error("Error in fetchPersonnelStats:", error);
      }
    };

    if (tenant?.id) {
      fetchPersonnelStats();
    }
  }, [tenant?.id]);

  const getUsersStats = () => {
    // Bu veriler gerçek API'den gelecek
    return {
      active: 5,
      inactive: 1,
      total: 6,
    };
  };

  const usersStats = getUsersStats();

  // Logo upload fonksiyonları
  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);
      try {
        // Önce preview göster
        const reader = new FileReader();
        reader.onload = async (e) => {
          const logoUrl = e.target?.result as string;
          setLogoPreview(logoUrl);

          // Otomatik kaydet
          try {
            await updateTenantLogo(logoUrl);
            console.log("Logo başarıyla kaydedildi!");
          } catch (error) {
            console.error("Logo kaydedilirken hata:", error);
            // Hata durumunda preview'ı temizle
            setLogoPreview(null);
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Dosya okuma hatası:", error);
        setIsUploading(false);
      }
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteLogo = async () => {
    try {
      setIsUploading(true);
      await updateTenantLogo("");
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      console.log("Logo başarıyla silindi!");
    } catch (error) {
      console.error("Logo silinirken hata:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Hook'tan gelen veriyi companyInfo state'ine aktar
  useEffect(() => {
    if (corporateSettings) {
      setCompanyInfo({
        company_name: corporateSettings.company_name || "",
        company_full_name: corporateSettings.company_full_name || "",
        company_address: corporateSettings.company_address || "",
        company_phone: corporateSettings.company_phone || "",
        company_email: corporateSettings.company_email || "",
        company_website: corporateSettings.company_website || "",
        tax_number: corporateSettings.tax_number || "",
        tax_office: corporateSettings.tax_office || "",
      });
    }
  }, [corporateSettings, tenant]);

  // Firma bilgilerini kaydet
  const saveCompanyInfo = async () => {
    if (!tenant?.id) {
      console.error("No tenant ID found");
      return;
    }

    setSavingCompanyInfo(true);
    try {
      console.log("Saving company info:", companyInfo);
      console.log("Tenant ID:", tenant.id);

      const { data, error } = await supabase
        .from("corporate_settings")
        .upsert(
          {
            tenant_id: tenant.id,
            company_name: companyInfo.company_name,
            company_full_name: companyInfo.company_full_name,
            company_address: companyInfo.company_address,
            company_phone: companyInfo.company_phone,
            company_email: companyInfo.company_email,
            company_website: companyInfo.company_website,
            tax_number: companyInfo.tax_number,
            tax_office: companyInfo.tax_office,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "tenant_id",
          }
        )
        .select();

      if (error) {
        console.error("Error saving company info:", error);
        setCompanyInfoSuccess(`Hata: ${error.message}`);
        setTimeout(() => setCompanyInfoSuccess(null), 5000);
        return;
      }

      console.log("Company info saved successfully:", data);
      setCompanyInfoSuccess("Firma bilgileri başarıyla kaydedildi!");
      setTimeout(() => setCompanyInfoSuccess(null), 3000);

      // Hook'u yeniden yükle
      refetchCorporate();
    } catch (error) {
      console.error("Error in saveCompanyInfo:", error);
      setCompanyInfoSuccess(`Hata: ${error}`);
      setTimeout(() => setCompanyInfoSuccess(null), 5000);
    } finally {
      setSavingCompanyInfo(false);
    }
  };

  // Mevcut logo veya preview'ı göster
  const currentLogo = logoPreview || tenant?.branding?.logo;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Paper
        sx={{
          width: 280,
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          borderRadius: 0,
          borderRight: "1px solid #e2e8f0",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 2,
            }}
          >
            ŞİRKET
          </Typography>
          <List>
            {sidebarItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: "primary.light",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.main",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: activeTab === item.id ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mr: 1 }}>
            Ayarlar
          </Typography>
          <StarIcon sx={{ color: "#fbbf24", fontSize: "1.5rem" }} />
          <StarIcon sx={{ color: "#fbbf24", fontSize: "1.5rem" }} />
        </Box>

        {/* Payment Warning Banner - Temporarily commented out */}
        {/* <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <AlertTitle>Gecikmiş Ödeme</AlertTitle>
          Gecikmiş ödemeniz bulunuyor.{" "}
          <Button
            variant="text"
            sx={{
              color: "white",
              textDecoration: "underline",
              p: 0,
              minWidth: "auto",
              textTransform: "none",
            }}
          >
            Bakiye yüklemek için tıklayınız
          </Button>
        </Alert> */}

        {/* Summary Tab Content */}
        {activeTab === "summary" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Özet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Hesap özetinizi bu sayfadan görüntüleyebilirsiniz.
            </Typography>

            {/* Company Logo Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Şirket Logosu
              </Typography>

              {currentLogo ? (
                // Logo varsa göster
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Paper
                    sx={{
                      width: 400,
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={currentLogo}
                      alt="Company Logo"
                      style={{
                        width: "380px",
                        height: "180px",
                        objectFit: "contain",
                      }}
                    />
                  </Paper>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={handleUploadClick}
                      size="small"
                      disabled={isUploading}
                    >
                      {isUploading ? "Yükleniyor..." : "Değiştir"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteLogo}
                      size="small"
                      disabled={isUploading}
                    >
                      {isUploading ? "Siliniyor..." : "Sil"}
                    </Button>
                  </Box>
                </Box>
              ) : (
                // Logo yoksa upload alanı göster
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={!isUploading ? handleUploadClick : undefined}
                  sx={{
                    width: 600,
                    height: 250,
                    border: `2px dashed ${
                      isDragOver ? "primary.main" : "#e2e8f0"
                    }`,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDragOver ? "primary.light" : "#f8fafc",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isUploading ? 0.6 : 1,
                    "&:hover": {
                      borderColor: isUploading ? "#e2e8f0" : "primary.main",
                      backgroundColor: isUploading
                        ? "#f8fafc"
                        : "primary.light",
                    },
                  }}
                >
                  <UploadIcon
                    sx={{
                      fontSize: 48,
                      color: isDragOver ? "primary.main" : "text.secondary",
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      color: isDragOver ? "primary.main" : "text.primary",
                    }}
                  >
                    {isUploading
                      ? "Logo yükleniyor..."
                      : "Logo dosyasını buraya sürükleyin veya seçmek için tıklayın"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isUploading
                      ? "Lütfen bekleyin..."
                      : "PNG, JPG, JPEG dosyaları kabul edilir"}
                  </Typography>
                </Box>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpg,image/jpeg"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />
            </Paper>

            {/* Company Info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Şirket Adı
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {tenant?.branding?.company_name ||
                      tenant?.name ||
                      "GÖZCÜ360° ÖZEL GÜVENLİK HİZMETLERİ LTD. ŞTİ."}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Şirket ID
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {tenant?.id || "a569e383-03ef-424c-ae02-c51330499680"}
                    </Typography>
                    <Tooltip title="Kopyala">
                      <IconButton size="small" onClick={handleCopyId}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bilgi">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Summary Cards */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Özet
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Mevcut Plan
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          backgroundColor:
                            planInfo.type === "enterprise"
                              ? "primary.main"
                              : planInfo.type === "pro"
                              ? "secondary.main"
                              : "grey.300",
                        }}
                      >
                        <Typography variant="h6" color="white">
                          {planInfo.type === "enterprise"
                            ? "E"
                            : planInfo.type === "pro"
                            ? "P"
                            : "B"}
                        </Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {planInfo.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Max {planInfo.maxUsers} kullanıcı
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="text"
                      endIcon="→"
                      sx={{ textTransform: "none", p: 0 }}
                    >
                      İncele
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Personel
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {personnelStats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktif / {personnelStats.inactive} Pasif
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Toplam: {personnelStats.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Sistem Kullanıcıları
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {usersStats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktif / {usersStats.inactive} Pasif
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Toplam: {usersStats.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Company Info Tab Content */}
        {activeTab === "company" && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Firma Bilgileri
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Teklif ve belgelerde kullanılacak firma bilgilerinizi buradan
              düzenleyebilirsiniz.
            </Typography>

            {companyInfoSuccess && (
              <Alert
                severity="success"
                sx={{ mb: 3 }}
                onClose={() => setCompanyInfoSuccess(null)}
              >
                {companyInfoSuccess}
              </Alert>
            )}

            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Şirket Adı"
                    value={companyInfo.company_name || ""}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_name: e.target.value,
                      }))
                    }
                    placeholder="Örn: ABC Güvenlik Hizmetleri"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tam Şirket Unvanı"
                    value={companyInfo.company_full_name}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_full_name: e.target.value,
                      }))
                    }
                    placeholder="Örn: ABC Güvenlik Hizmetleri Ltd. Şti."
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={companyInfo.company_address}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_address: e.target.value,
                      }))
                    }
                    placeholder="Tam adres bilgisi"
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={companyInfo.company_phone}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_phone: e.target.value,
                      }))
                    }
                    placeholder="Örn: +90 216 123 45 67"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="E-posta"
                    value={companyInfo.company_email}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_email: e.target.value,
                      }))
                    }
                    placeholder="Örn: info@abcguvenlik.com"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Web Sitesi"
                    value={companyInfo.company_website}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        company_website: e.target.value,
                      }))
                    }
                    placeholder="Örn: www.abcguvenlik.com"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vergi Numarası"
                    value={companyInfo.tax_number}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        tax_number: e.target.value,
                      }))
                    }
                    placeholder="Örn: 1234567890"
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vergi Dairesi"
                    value={companyInfo.tax_office}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        tax_office: e.target.value,
                      }))
                    }
                    placeholder="Örn: Pendik Vergi Dairesi"
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={saveCompanyInfo}
                  disabled={savingCompanyInfo}
                  startIcon={
                    savingCompanyInfo ? <CircularProgress size={20} /> : null
                  }
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: "#3b82f6",
                    "&:hover": {
                      backgroundColor: "#2563eb",
                    },
                  }}
                >
                  {savingCompanyInfo ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </Box>
            </Paper>
          </Box>
        )}

        {/* GİB Entegrasyonu Sekmesi */}
        {activeTab === "gib" && (
          <Box>
            {/* GİB Alt Sekmeleri */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={gibSubTab === "settings" ? "contained" : "outlined"}
                  onClick={() => setGibSubTab("settings")}
                  startIcon={<BusinessIcon />}
                >
                  GİB Ayarları
                </Button>
                <Button
                  variant={gibSubTab === "invoices" ? "contained" : "outlined"}
                  onClick={() => setGibSubTab("invoices")}
                  startIcon={<ReceiptIcon />}
                >
                  E-Fatura Yönetimi
                </Button>
                <Button
                  variant={gibSubTab === "reports" ? "contained" : "outlined"}
                  onClick={() => setGibSubTab("reports")}
                  startIcon={<AssessmentIcon />}
                >
                  GİB Raporları
                </Button>
                <Button
                  variant={gibSubTab === "incoming" ? "contained" : "outlined"}
                  onClick={() => setGibSubTab("incoming")}
                  startIcon={<ReceiptIcon />}
                >
                  Gelen E-Faturalar
                </Button>
              </Stack>
            </Box>

            {/* GİB Alt Sekme İçerikleri */}
            {gibSubTab === "settings" && <GibSettings />}
            {gibSubTab === "invoices" && <GibInvoiceManagement />}
            {gibSubTab === "reports" && <GibReports />}
            {gibSubTab === "incoming" && <IncomingEInvoices />}
          </Box>
        )}

        {/* SGK Ayarları Sekmesi */}
        {activeTab === "sgk" && (
          <Box>
            <SgkManagement />
          </Box>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== "summary" &&
          activeTab !== "company" &&
          activeTab !== "gib" &&
          activeTab !== "sgk" && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {activeTab === "plans" && "Planlar bölümü yakında eklenecek"}
                {activeTab === "payments" &&
                  "Ödemeler & Bakiye bölümü yakında eklenecek"}
              </Typography>
            </Box>
          )}
      </Box>
    </Box>
  );
};

export default Settings;
