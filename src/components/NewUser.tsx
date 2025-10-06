import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../contexts/TenantContext";
import { useProject } from "../contexts/ProjectContext";
import { supabase } from "../lib/supabase";

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

const NewUser: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { selectedProject } = useProject();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    status: "Aktif",
    sendPasswordEmail: "Evet",
  });

  const [permissions, setPermissions] = useState({
    projects: { read: false, add: false, update: false, delete: false },
    users: { read: false, add: false, update: false, delete: false },
    personnel: { read: false, add: false, update: false, delete: false },
    checkpoints: { read: false, add: false, update: false, delete: false },
    patrols: { read: false, add: false, update: false, delete: false },
    incidents: { read: false, delete: false },
    formTemplates: { read: false, add: false, update: false, delete: false },
    formTemplateGroups: {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    forms: { read: false, delete: false },
    formScoreSettings: { read: false, update: false },
    reports: { read: false, add: false, update: false, delete: false },
    scheduledReports: { read: false, add: false, update: false, delete: false },
    settings: { read: false },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermissionChange = (
    module: string,
    action: string,
    checked: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module as keyof typeof prev],
        [action]: checked,
      },
    }));
  };

  const handleSave = async () => {
    if (!tenant) {
      setError("Tenant bilgisi bulunamadı");
      return;
    }

    if (!selectedProject) {
      setError("Lütfen sidebar'dan bir proje seçiniz");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Lütfen Ad, Soyad ve E-posta alanlarını doldurun");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      // Create user in auth.users first
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password || Math.random().toString(36).slice(-8), // Random password if not provided
          email_confirm: true,
          user_metadata: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        });

      if (authError) {
        console.error("Error creating auth user:", authError);
        setError(
          "Kullanıcı oluşturulurken bir hata oluştu: " + authError.message
        );
        return;
      }

      // Create user record in users table
      const { data, error } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          tenant_id: tenant.id,
          email: formData.email,
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: "admin", // Default to admin for now
          phone: formData.phone || null,
          is_active: formData.status === "Aktif",
        })
        .select();

      if (error) {
        console.error("Error creating user record:", error);
        setError(
          "Kullanıcı kaydı oluşturulurken bir hata oluştu: " + error.message
        );
        return;
      }

      // Add user to project_users table
      const { error: projectUserError } = await supabase
        .from("project_users")
        .insert({
          user_id: authData.user.id,
          project_id: selectedProject.id,
          tenant_id: tenant.id,
        });

      if (projectUserError) {
        console.error("Error adding user to project:", projectUserError);
        setError(
          "Kullanıcı projeye eklenirken bir hata oluştu: " +
            projectUserError.message
        );
        return;
      }

      console.log("User created successfully:", data);
      alert("Kullanıcı başarıyla oluşturuldu!");
      navigate("/users");
    } catch (err) {
      console.error("Error in handleSave:", err);
      setError("Kullanıcı oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const permissionModules = [
    { key: "projects", label: "Projeler" },
    { key: "users", label: "Kullanıcılar" },
    { key: "personnel", label: "Personel" },
    { key: "checkpoints", label: "Kontrol Noktaları" },
    { key: "patrols", label: "Devriye Çizelgesi" },
    { key: "incidents", label: "Olay Kayıtları" },
    { key: "formTemplates", label: "Form Şablonları" },
    { key: "formTemplateGroups", label: "Form Şablonu Soru Grupları" },
    { key: "forms", label: "Formlar" },
    { key: "formScoreSettings", label: "Form Puan Ayarları" },
    { key: "reports", label: "Raporlar" },
    { key: "scheduledReports", label: "Raporlar (Zamanlanmış Raporlar)" },
    { key: "settings", label: "Ayarlar (Faturalar ve Ödemeler)" },
  ];

  const getAvailableActions = (module: string) => {
    const modulePermissions = permissions[module as keyof typeof permissions];
    const actions = [];

    if ("read" in modulePermissions && modulePermissions.read !== undefined)
      actions.push({ key: "read", label: "Oku" });
    if ("add" in modulePermissions && modulePermissions.add !== undefined)
      actions.push({ key: "add", label: "Ekle" });
    if ("update" in modulePermissions && modulePermissions.update !== undefined)
      actions.push({ key: "update", label: "Güncelle" });
    if ("delete" in modulePermissions && modulePermissions.delete !== undefined)
      actions.push({ key: "delete", label: "Sil" });

    return actions;
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate("/users")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Yeni Kullanıcı Oluştur
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Section - User Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "fit-content" }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Kullanıcı Bilgileri
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ad"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Soyad"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-Posta"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Şifre Güncelleme"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    size="small"
                    helperText="Yeni şifreyi belirlemek istiyorsanız bu alanı doldurunuz."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={formData.status}
                      label="Durum"
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                    >
                      <MenuItem value="Aktif">Aktif</MenuItem>
                      <MenuItem value="Pasif">Pasif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>
                      Şifre oluşturma e-postası gönderilsin mi?
                    </InputLabel>
                    <Select
                      value={formData.sendPasswordEmail}
                      label="Şifre oluşturma e-postası gönderilsin mi?"
                      onChange={(e) =>
                        handleInputChange("sendPasswordEmail", e.target.value)
                      }
                    >
                      <MenuItem value="Evet">Evet</MenuItem>
                      <MenuItem value="Hayır">Hayır</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Section - Permissions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ height: "fit-content" }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                >
                  <Tab label="Yetkiler" />
                  <Tab label="Projeler" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Modül Adı</TableCell>
                        <TableCell align="center">Oku</TableCell>
                        <TableCell align="center">Ekle</TableCell>
                        <TableCell align="center">Güncelle</TableCell>
                        <TableCell align="center">Sil</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissionModules.map((module) => {
                        const modulePermissions =
                          permissions[module.key as keyof typeof permissions];
                        const availableActions = getAvailableActions(
                          module.key
                        );

                        return (
                          <TableRow key={module.key}>
                            <TableCell>{module.label}</TableCell>
                            {["read", "add", "update", "delete"].map(
                              (action) => {
                                const actionExists = availableActions.some(
                                  (a) => a.key === action
                                );
                                const actionLabel =
                                  availableActions.find((a) => a.key === action)
                                    ?.label || "";

                                return (
                                  <TableCell key={action} align="center">
                                    {actionExists ? (
                                      <Checkbox
                                        checked={
                                          (modulePermissions as any)[action] ||
                                          false
                                        }
                                        onChange={(e) =>
                                          handlePermissionChange(
                                            module.key,
                                            action,
                                            e.target.checked
                                          )
                                        }
                                        size="small"
                                      />
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </TableCell>
                                );
                              }
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="body2" color="text.secondary">
                  Projeler sekmesi içeriği burada olacak
                </Typography>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end" mt={3}>
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
      </Box>
    </Box>
  );
};

export default NewUser;
