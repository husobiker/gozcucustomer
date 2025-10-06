import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Logout,
  Settings as SettingsIcon,
  ArrowDropDown,
} from "@mui/icons-material";
import Dashboard from "./components/Dashboard";
import Users from "./components/Users";
import UserForm from "./components/UserForm";
import Personnel from "./components/Personnel";
import PersonnelCard from "./components/PersonnelCard";
import NewPersonnel from "./components/NewPersonnel";
import NewJokerPersonnel from "./components/NewJokerPersonnel";
import DutySchedules from "./components/DutySchedules";
import Payroll from "./components/Payroll";
import Checkpoints from "./components/Checkpoints";
import NewCheckpoint from "./components/NewCheckpoint";
import Patrols from "./components/Patrols";
import Incidents from "./components/Incidents";
import Forms from "./components/Forms";
import FormTemplates from "./components/FormTemplates";
import ScoreSettings from "./components/ScoreSettings";
import Reports from "./components/Reports";
import Projects from "./components/Projects";
import NewProject from "./components/NewProject";
import EditProject from "./components/EditProject";
import Settings from "./components/Settings";
import CorporateSettings from "./components/CorporateSettings";
import GibConfiguration from "./components/GibConfiguration";
import GibInvoiceNumbering from "./components/GibInvoiceNumbering";
import BankAccounts from "./components/BankAccounts";
import CashFlow from "./components/CashFlow";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import SgkSettings from "./pages/SgkSettings";
import DatabaseTest from "./components/DatabaseTest";
// SuperAdminDashboard import removed
import { createDemoData } from "./components/DemoData";
// New modules
import Contracts from "./components/Contracts";
import QuotesList from "./components/QuotesList";
import QuoteForm from "./components/QuoteForm";
import CustomersList from "./components/CustomersList";
import CustomerForm from "./components/CustomerForm";
import InvoicesList from "./components/InvoicesList";
import InvoiceForm from "./components/InvoiceForm";
import QuoteView from "./components/QuoteView";
import InvoiceView from "./components/InvoiceView";
import CustomerView from "./components/CustomerView";
import ProductsServices from "./components/ProductsServices";
import AddProductForm from "./components/AddProductForm";
import ProductDetail from "./components/ProductDetail";
import EditProductForm from "./components/EditProductForm";
import WarehousesList from "./components/WarehousesList";
import AddWarehouseForm from "./components/AddWarehouseForm";
import WarehouseTransfersList from "./components/WarehouseTransfersList";
import TransferForm from "./components/TransferForm";
import Authorities from "./components/Authorities";
import Assets from "./components/Assets";
import ShiftTypes from "./components/ShiftTypes";
import Documents from "./components/Documents";
import TemplateEditor from "./components/TemplateEditor";
import TemplateCreator from "./components/TemplateCreator";
import MonitoringCenter from "./components/MonitoringCenter";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { TenantProvider, useTenant } from "./contexts/TenantContext";
import { useCorporateSettings } from "./hooks/useCorporateSettings";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
      light: "#ff5983",
      dark: "#9a0036",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: "0.875rem",
          fontWeight: 500,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        },
        sizeSmall: {
          padding: "6px 12px",
          fontSize: "0.8125rem",
        },
        sizeLarge: {
          padding: "12px 24px",
          fontSize: "0.9375rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
        elevation2: {
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        },
        elevation3: {
          boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            padding: "12px 16px",
            fontSize: "0.875rem",
            borderBottom: "1px solid #e2e8f0",
          },
          "& .MuiTableHead-root .MuiTableCell-root": {
            fontWeight: 600,
            backgroundColor: "#f8fafc",
            fontSize: "0.8125rem",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
          height: 24,
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 25px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          backgroundColor: "#ffffff",
          color: "#1e293b",
        },
      },
    },
  },
});

const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { tenant, loading } = useTenant();
  const { settings: corporateSettings } = useCorporateSettings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut();
    handleClose();
  };

  const handleProfileEdit = () => {
    // TODO: Navigate to profile edit page
    console.log("Profile edit clicked");
    handleClose();
  };

  // Generate initials from email or user metadata
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(" ");
      return names
        .map((name: string) => name.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2);
    }
    if (user?.email) {
      const emailName = user.email.split("@")[0];
      return (
        emailName.charAt(0).toUpperCase() +
        (emailName.charAt(1) || "").toUpperCase()
      );
    }
    return "U";
  };

  // SuperAdmin dashboard removed - only subdomain.localhost access

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Typography variant="h1" sx={{ fontSize: "6rem", fontWeight: "bold" }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: "medium" }}>
          Sayfa Bulunamadı
        </Typography>
        <Typography
          variant="body1"
          sx={{ textAlign: "center", maxWidth: "400px" }}
        >
          Bu subdomain kayıtlı değil veya mevcut değil. Lütfen doğru subdomain
          ile erişmeyi deneyin.
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Örnek: http://[subdomain].localhost:3006
        </Typography>
      </Box>
    );
  }

  // Tenant varsa user kontrolü yap
  if (!user) {
    return <Login />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <AppBar
          position="static"
          sx={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        >
          <Toolbar sx={{ minHeight: "56px !important", px: 3 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontSize: "1.125rem", fontWeight: 600 }}
            >
              {corporateSettings?.company_name || "SafeBase"} Yönetim Paneli
            </Typography>

            {/* User Dropdown Menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.9)",
                  mr: 1,
                  fontWeight: 500,
                }}
              >
                {user.email}
              </Typography>
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                  }}
                >
                  {getInitials()}
                </Avatar>
                <ArrowDropDown sx={{ ml: 0.5 }} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "&:before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem onClick={handleProfileEdit}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  Profilimi Düzenle
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  Çıkış Yap
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ flexGrow: 1, p: 2, backgroundColor: "#f8fafc" }}>
          <Container maxWidth="xl" sx={{ p: 0 }}>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/new"
                element={
                  <ProtectedRoute>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel"
                element={
                  <ProtectedRoute>
                    <Personnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/:id"
                element={
                  <ProtectedRoute>
                    <PersonnelCard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/new"
                element={
                  <ProtectedRoute>
                    <NewPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/joker-personnel/new"
                element={
                  <ProtectedRoute>
                    <NewJokerPersonnel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/duty-schedules"
                element={
                  <ProtectedRoute>
                    <DutySchedules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <ProtectedRoute>
                    <Payroll />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkpoints"
                element={
                  <ProtectedRoute>
                    <Checkpoints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkpoints/new"
                element={
                  <ProtectedRoute>
                    <NewCheckpoint />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patrols"
                element={
                  <ProtectedRoute>
                    <Patrols />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents"
                element={
                  <ProtectedRoute>
                    <Incidents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms"
                element={
                  <ProtectedRoute>
                    <Forms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/form-templates"
                element={
                  <ProtectedRoute>
                    <FormTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/score-settings"
                element={
                  <ProtectedRoute>
                    <ScoreSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <NewProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/edit"
                element={
                  <ProtectedRoute>
                    <EditProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/corporate"
                element={
                  <ProtectedRoute>
                    <CorporateSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/database"
                element={
                  <ProtectedRoute>
                    <DatabaseTest />
                  </ProtectedRoute>
                }
              />
              {/* New module routes */}
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <Contracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authorities"
                element={
                  <ProtectedRoute>
                    <Authorities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <Assets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shift-types"
                element={
                  <ProtectedRoute>
                    <ShiftTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                }
              />

              {/* Yeni modül route'ları */}
              <Route
                path="/shift/form"
                element={
                  <ProtectedRoute>
                    <div>Vardiya Formu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shift/mail"
                element={
                  <ProtectedRoute>
                    <div>Mail Gönder - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shift/plan"
                element={
                  <ProtectedRoute>
                    <div>Vardiya Planla - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications/certificate-expiry"
                element={
                  <ProtectedRoute>
                    <div>
                      Personel Sertifika Bitiş Bildirimi - Geliştiriliyor
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications/contract-expiry"
                element={
                  <ProtectedRoute>
                    <div>Proje Sözleşme Bitiş Bildirimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications/protection-plan"
                element={
                  <ProtectedRoute>
                    <div>Proje Koruma Planı Bildirimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit/inspection"
                element={
                  <ProtectedRoute>
                    <div>Proje ve personellerin denetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patrol/daily-report"
                element={
                  <ProtectedRoute>
                    <div>Günlük Rapor - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patrol/bulk-mail"
                element={
                  <ProtectedRoute>
                    <div>Toplu Mail Gönderimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/management"
                element={
                  <ProtectedRoute>
                    <div>Doküman yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Raporlama route'ları */}
              <Route
                path="/reports/salary"
                element={
                  <ProtectedRoute>
                    <div>Maaş Hakediş Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/missing-work-days"
                element={
                  <ProtectedRoute>
                    <div>Eksik Çalışma Gün Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/weekend"
                element={
                  <ProtectedRoute>
                    <div>Hafta Tatili Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/agi"
                element={
                  <ProtectedRoute>
                    <div>AGİ Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/payroll"
                element={
                  <ProtectedRoute>
                    <div>Maaş - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/no-assignment"
                element={
                  <ProtectedRoute>
                    <div>Görevi Olmayanlar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/clothing-order"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Sipariş Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/extra-duty"
                element={
                  <ProtectedRoute>
                    <div>Ek Görev Yapanlar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/demographics"
                element={
                  <ProtectedRoute>
                    <div>Demografi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/cost-analysis"
                element={
                  <ProtectedRoute>
                    <div>Maliyet Analizi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-filter-bes"
                element={
                  <ProtectedRoute>
                    <div>Personel Filtre (BES) - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/form"
                element={
                  <ProtectedRoute>
                    <div>Form Rapor - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/blood-type"
                element={
                  <ProtectedRoute>
                    <div>Kan Grubu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-identity"
                element={
                  <ProtectedRoute>
                    <div>Personel Kimlik - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-bes-deduction"
                element={
                  <ProtectedRoute>
                    <div>Personel BES Kesinti - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/patrol"
                element={
                  <ProtectedRoute>
                    <div>Devriye Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/clothing-delivery"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Teslimat - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/project-contact"
                element={
                  <ProtectedRoute>
                    <div>Proje İletişim Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-list"
                element={
                  <ProtectedRoute>
                    <div>Personel Listesi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/shift"
                element={
                  <ProtectedRoute>
                    <div>Vardiya Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/form-monthly"
                element={
                  <ProtectedRoute>
                    <div>Form Aylık Rapor - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/missed-checks"
                element={
                  <ProtectedRoute>
                    <div>Yapılmayan Kontroller - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-transition"
                element={
                  <ProtectedRoute>
                    <div>Personel Geçiş Takip Sistemi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/project-segment"
                element={
                  <ProtectedRoute>
                    <div>Proje Segment Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/clothing-warehouse-stock"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Depo Stok Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/entry-exit"
                element={
                  <ProtectedRoute>
                    <div>İşe Giriş/Çıkış Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/consolidated"
                element={
                  <ProtectedRoute>
                    <div>Konsolide Rapor - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-contact"
                element={
                  <ProtectedRoute>
                    <div>Personel İletişim Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/asset-material"
                element={
                  <ProtectedRoute>
                    <div>Demirbaş Malzeme Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/patrol-defined-projects"
                element={
                  <ProtectedRoute>
                    <div>Devriye Tanımlı Projeler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/5188-identity"
                element={
                  <ProtectedRoute>
                    <div>5188 Kimlik Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/holiday-work"
                element={
                  <ProtectedRoute>
                    <div>Resmi Tatil Çalışma Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/planned-actual-days"
                element={
                  <ProtectedRoute>
                    <div>
                      Planlanan / Gerçekleşen Gün Raporu - Geliştiriliyor
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-card"
                element={
                  <ProtectedRoute>
                    <div>Personel Kart Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-bank-account"
                element={
                  <ProtectedRoute>
                    <div>Personel Banka Hesap Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-rights"
                element={
                  <ProtectedRoute>
                    <div>Personel Özlük Hakları Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/detailed-patrol"
                element={
                  <ProtectedRoute>
                    <div>Detaylı Devriye Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/annual-leave"
                element={
                  <ProtectedRoute>
                    <div>Yıllık İzin Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/project-contract"
                element={
                  <ProtectedRoute>
                    <div>Proje Sözleşme Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/gsm-line"
                element={
                  <ProtectedRoute>
                    <div>GSM Hat Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-missing-data"
                element={
                  <ProtectedRoute>
                    <div>Personel Eksik Veri Takibi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/personnel-education-participation"
                element={
                  <ProtectedRoute>
                    <div>Personel Eğitim Katılım Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Portal route'ları */}
              <Route
                path="/portal/authority"
                element={
                  <ProtectedRoute>
                    <div>Yetkili Portal - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal/personnel"
                element={
                  <ProtectedRoute>
                    <div>Personel Portal - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Ayarlar route'ları */}
              <Route
                path="/settings/general"
                element={
                  <ProtectedRoute>
                    <div>Genel Ayarlar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/sgk"
                element={
                  <ProtectedRoute>
                    <SgkSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/shift-types"
                element={
                  <ProtectedRoute>
                    <ShiftTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/penalty"
                element={
                  <ProtectedRoute>
                    <div>Ceza - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/clothing-types"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Türleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/clothing-warehouse"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Depo - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/roles"
                element={
                  <ProtectedRoute>
                    <div>Rol - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/notification-types"
                element={
                  <ProtectedRoute>
                    <div>Bildirim Tipleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/document-types"
                element={
                  <ProtectedRoute>
                    <div>Doküman Türleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/salary-parameters"
                element={
                  <ProtectedRoute>
                    <div>Maaş Parametreleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/template-management"
                element={
                  <ProtectedRoute>
                    <TemplateEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/template-management/new"
                element={
                  <ProtectedRoute>
                    <TemplateCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/template-management/edit/:id"
                element={
                  <ProtectedRoute>
                    <TemplateCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitoring-center"
                element={
                  <ProtectedRoute>
                    <MonitoringCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/authority-info"
                element={
                  <ProtectedRoute>
                    <div>Yetkili Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/announcements"
                element={
                  <ProtectedRoute>
                    <div>Duyuru - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/transaction-logs"
                element={
                  <ProtectedRoute>
                    <div>İşlem Kayıtları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/titles"
                element={
                  <ProtectedRoute>
                    <div>Unvan - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/company"
                element={
                  <ProtectedRoute>
                    <div>Firma - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/educations"
                element={
                  <ProtectedRoute>
                    <div>Eğitimler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/warehouses"
                element={
                  <ProtectedRoute>
                    <div>Depolar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/holidays"
                element={
                  <ProtectedRoute>
                    <div>Resmi Tatiller - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/asset-warehouse"
                element={
                  <ProtectedRoute>
                    <div>Demirbaş Depo Yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/asset-types"
                element={
                  <ProtectedRoute>
                    <div>Demirbaş Türleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/income-expense-types"
                element={
                  <ProtectedRoute>
                    <div>Gelir/Gider Tipleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Mesajlar route'ları */}
              <Route
                path="/messages/project"
                element={
                  <ProtectedRoute>
                    <div>Proje Mesajları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/personnel"
                element={
                  <ProtectedRoute>
                    <div>Personel Mesajları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Yardım route'ları */}
              <Route
                path="/help/guide"
                element={
                  <ProtectedRoute>
                    <div>Rehberlik ve kullanım desteği - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Demirbaş route'ları */}
              <Route
                path="/assets/management"
                element={
                  <ProtectedRoute>
                    <div>Demirbaş yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* İzin route'ları */}
              <Route
                path="/leave/personnel"
                element={
                  <ProtectedRoute>
                    <div>Personel izinleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Olay Raporu route'ları */}
              <Route
                path="/incidents/records"
                element={
                  <ProtectedRoute>
                    <div>Olay kayıtları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Satış route'ları */}
              <Route
                path="/sales/tracking"
                element={
                  <ProtectedRoute>
                    <div>
                      Potansiyel müşteri ve satış takibi - Geliştiriliyor
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Maliyet Analizi route'ları */}
              <Route
                path="/cost-analysis/tracking"
                element={
                  <ProtectedRoute>
                    <div>Gelir-gider ve karlılık takibi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Kıyafet route'ları */}
              <Route
                path="/clothing/management"
                element={
                  <ProtectedRoute>
                    <div>Türler ve beden yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Risk Analizi route'ları */}
              <Route
                path="/risk-analysis/reports"
                element={
                  <ProtectedRoute>
                    <div>Risk raporları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Aday Personel route'ları */}
              <Route
                path="/candidates/recruitment"
                element={
                  <ProtectedRoute>
                    <div>İşe alım süreci yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Dijital Formlar route'ları */}
              <Route
                path="/digital-forms/operation"
                element={
                  <ProtectedRoute>
                    <div>Operasyon formları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Muhasebe route'ları */}
              {/* Satışlar */}
              <Route
                path="/accounting/sales/quotes"
                element={
                  <ProtectedRoute>
                    <QuotesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/customers"
                element={
                  <ProtectedRoute>
                    <CustomersList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/customers/new"
                element={
                  <ProtectedRoute>
                    <CustomerForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/customers/edit/:id"
                element={
                  <ProtectedRoute>
                    <CustomerForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/customers/view/:id"
                element={
                  <ProtectedRoute>
                    <CustomerView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/invoices"
                element={
                  <ProtectedRoute>
                    <InvoicesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/invoices/new"
                element={
                  <ProtectedRoute>
                    <InvoiceForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/invoices/edit/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/invoices/view/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/report"
                element={
                  <ProtectedRoute>
                    <div>Satışlar Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/collections-report"
                element={
                  <ProtectedRoute>
                    <div>Tahsilatlar Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/income-expense-report"
                element={
                  <ProtectedRoute>
                    <div>Gelir Gider Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              {/* GİB Routes */}
              <Route
                path="/accounting/gib"
                element={
                  <ProtectedRoute>
                    <GibConfiguration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/gib/e-invoices"
                element={
                  <ProtectedRoute>
                    <div>E-Fatura Yönetimi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/gib/reports"
                element={
                  <ProtectedRoute>
                    <div>GİB Raporları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/gib/numbering"
                element={
                  <ProtectedRoute>
                    <GibInvoiceNumbering />
                  </ProtectedRoute>
                }
              />

              {/* Banka ve Nakit Routes */}
              <Route
                path="/accounting/bank/accounts"
                element={
                  <ProtectedRoute>
                    <BankAccounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/bank/cash-flow"
                element={
                  <ProtectedRoute>
                    <CashFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/bank/collections"
                element={
                  <ProtectedRoute>
                    <div>Tahsilatlar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/bank/payments"
                element={
                  <ProtectedRoute>
                    <div>Ödemeler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/bank/checks-bills"
                element={
                  <ProtectedRoute>
                    <div>Çek ve Senetler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/bank/reports"
                element={
                  <ProtectedRoute>
                    <div>Banka Raporları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* STOK Routes */}
              <Route
                path="/accounting/stock/products"
                element={
                  <ProtectedRoute>
                    <ProductsServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/products/new"
                element={
                  <ProtectedRoute>
                    <AddProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/products/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/products/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/warehouses"
                element={
                  <ProtectedRoute>
                    <WarehousesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/warehouses/new"
                element={
                  <ProtectedRoute>
                    <AddWarehouseForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/warehouses/edit/:id"
                element={
                  <ProtectedRoute>
                    <AddWarehouseForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/transfers"
                element={
                  <ProtectedRoute>
                    <WarehouseTransfersList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/transfers/new"
                element={
                  <ProtectedRoute>
                    <TransferForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/transfers/edit/:id"
                element={
                  <ProtectedRoute>
                    <TransferForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/outgoing-deliveries"
                element={
                  <ProtectedRoute>
                    <div>Giden İrsaliyeler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/incoming-deliveries"
                element={
                  <ProtectedRoute>
                    <div>Gelen İrsaliyeler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/price-lists"
                element={
                  <ProtectedRoute>
                    <div>Fiyat Listeleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/history"
                element={
                  <ProtectedRoute>
                    <div>Stok Geçmişi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/stock/products-report"
                element={
                  <ProtectedRoute>
                    <div>Stoktaki Ürünler Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Giderler */}
              <Route
                path="/accounting/expenses/list"
                element={
                  <ProtectedRoute>
                    <div>Gider Listesi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/expenses/e-invoices"
                element={
                  <ProtectedRoute>
                    <div>Gelen e-faturalar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/expenses/suppliers"
                element={
                  <ProtectedRoute>
                    <div>Tedarikçiler - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/expenses/report"
                element={
                  <ProtectedRoute>
                    <div>Giderler Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/expenses/payments-report"
                element={
                  <ProtectedRoute>
                    <div>Ödemeler Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/expenses/vat-report"
                element={
                  <ProtectedRoute>
                    <div>KDV Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Puantaj */}
              <Route
                path="/accounting/payroll"
                element={
                  <ProtectedRoute>
                    <div>Puantaj İşlemleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Eğitim route'ları */}
              <Route
                path="/education/processes"
                element={
                  <ProtectedRoute>
                    <div>Personel eğitim süreçleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />

              {/* Personel detay route'ları */}
              <Route
                path="/personnel/family"
                element={
                  <ProtectedRoute>
                    <div>Aile Bilgisi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/account"
                element={
                  <ProtectedRoute>
                    <div>Hesap Bilgisi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/rights"
                element={
                  <ProtectedRoute>
                    <div>Özlük Hakları - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/penalty"
                element={
                  <ProtectedRoute>
                    <div>Ceza - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/clothing"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet (ölçüler) - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/contact"
                element={
                  <ProtectedRoute>
                    <div>İletişim Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/experience"
                element={
                  <ProtectedRoute>
                    <div>İş Deneyimleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/certificate"
                element={
                  <ProtectedRoute>
                    <div>Sertifika - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/leave"
                element={
                  <ProtectedRoute>
                    <div>İzin - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/forms"
                element={
                  <ProtectedRoute>
                    <div>Form - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/documents"
                element={
                  <ProtectedRoute>
                    <div>Dokümanlar - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/timeline"
                element={
                  <ProtectedRoute>
                    <div>Zaman Tüneli - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/exit"
                element={
                  <ProtectedRoute>
                    <div>İşten Çıkış İşlemleri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/assignment"
                element={
                  <ProtectedRoute>
                    <div>Görevlendirme Formu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/security"
                element={
                  <ProtectedRoute>
                    <div>Emniyet Bildirim Bilgileri - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/clothing-delivery"
                element={
                  <ProtectedRoute>
                    <div>Kıyafet Teslim - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/incident"
                element={
                  <ProtectedRoute>
                    <div>Olay Raporu - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/card"
                element={
                  <ProtectedRoute>
                    <div>Kart Bilgisi - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/education"
                element={
                  <ProtectedRoute>
                    <div>Eğitim - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/shift"
                element={
                  <ProtectedRoute>
                    <div>Vardiya - Geliştiriliyor</div>
                  </ProtectedRoute>
                }
              />
              {/* Accounting Routes */}
              <Route
                path="/accounting/sales/quotes"
                element={
                  <ProtectedRoute>
                    <QuotesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/quotes/new"
                element={
                  <ProtectedRoute>
                    <QuoteForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/quotes/edit/:id"
                element={
                  <ProtectedRoute>
                    <QuoteForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/sales/quotes/view/:id"
                element={
                  <ProtectedRoute>
                    <QuoteView />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  // Create demo data on first load
  React.useEffect(() => {
    createDemoData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TenantProvider>
          <ProjectProvider>
            <Router>
              <AppContent />
            </Router>
          </ProjectProvider>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
