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
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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

interface Permission {
  module: string;
  read: boolean;
  add: boolean;
  update: boolean;
  delete: boolean;
}

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    status: "Aktif",
    sendPasswordEmail: "Evet",
  });

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      module: "Projeler",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Kullanıcılar",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Personel",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Kontrol Noktaları",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Devriye Çizelgesi",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Olay Kayıtları",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Form Şablonları",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Form Şablonu Soru Grupları",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Formlar",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Form Puan Ayarları",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Raporlar",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Raporlar (Zamanlanmış Raporlar)",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    {
      module: "Ayarlar (Faturalar ve Ödemeler)",
      read: false,
      add: false,
      update: false,
      delete: false,
    },
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermissionChange = (
    moduleIndex: number,
    permissionType: keyof Omit<Permission, "module">,
    checked: boolean
  ) => {
    setPermissions((prev) =>
      prev.map((perm, index) =>
        index === moduleIndex ? { ...perm, [permissionType]: checked } : perm
      )
    );
  };

  const handleSave = () => {
    console.log("Form Data:", formData);
    console.log("Permissions:", permissions);
    // Here you would save the user data
    navigate("/users");
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/users")}
          sx={{ mr: 2 }}
        >
          Geri
        </Button>
        <Typography variant="h4">Yeni Kullanıcı Oluştur</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - User Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Bilgileri
            </Typography>
            <Divider sx={{ mb: 3 }} />

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
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Şifre Güncelleme"
                  type="password"
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

        {/* Right Column - Permissions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Yetkiler" />
                <Tab label="Projeler" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Modül Yetkileri
              </Typography>

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
                    {permissions.map((permission, index) => (
                      <TableRow key={permission.module}>
                        <TableCell>
                          <Typography variant="body2">
                            {permission.module}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={permission.read}
                            onChange={(e) =>
                              handlePermissionChange(
                                index,
                                "read",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={permission.add}
                            onChange={(e) =>
                              handlePermissionChange(
                                index,
                                "add",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={permission.update}
                            onChange={(e) =>
                              handlePermissionChange(
                                index,
                                "update",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={permission.delete}
                            onChange={(e) =>
                              handlePermissionChange(
                                index,
                                "delete",
                                e.target.checked
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Proje Yetkileri
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Proje yetkileri burada yönetilecek.
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          size="large"
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
          }}
        >
          KAYDET
        </Button>
      </Box>
    </Box>
  );
};

export default UserForm;
