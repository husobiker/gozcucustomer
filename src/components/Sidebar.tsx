import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Button,
  Divider,
  Collapse,
  ListSubheader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Description as FormIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  AttachMoney as PayrollIcon,
  WatchLater as DutyIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  ArrowForward as ArrowForwardIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  AccessTime as TimeIcon,
  Folder as FolderIcon,
  Notifications as NotificationIcon,
  TrendingUp as AnalyticsIcon,
  School as EducationIcon,
  Assessment as RiskIcon,
  AccountBalance as FinanceIcon,
  LocalShipping as LogisticsIcon,
  Search as AuditIcon,
  DirectionsWalk as PatrolIcon,
  Description as DocumentModuleIcon,
  Person as UserModuleIcon,
  Public as PortalIcon,
  Message as MessageIcon,
  Help as HelpIcon,
  ShoppingCart as SalesIcon,
  Checkroom as ClothingIcon,
  PersonAdd as CandidateIcon,
  DynamicForm as DigitalFormIcon,
  Phone as PhoneIcon,
  AccountBalance as AccountBalanceIcon,
  Work as WorkIcon,
  Checkroom as CheckroomIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
  ExitToApp as ExitToAppIcon,
  CreditCard as CreditCardIcon,
  Email as EmailIcon,
  Send as SendIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  NotificationsActive as NotificationsActiveIcon,
  ReportProblem as ReportProblemIcon,
  CardMembership as CardMembershipIcon,
  School as SchoolIcon,
  Mail as MailIcon,
  CalendarToday as CalendarTodayIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  ContentCopy as ContentCopyIcon,
  Webhook as WebhookIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  LocalAtm as AtmIcon,
  AccountBalanceWallet as WalletIcon,
  Upload as UploadIcon,
  Storage as StorageIcon,
  BugReport as BugReportIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  GroupAdd as GroupAddIcon,
  GroupRemove as GroupRemoveIcon,
  GroupWork as GroupWorkIcon,
  Groups as GroupsIcon,
  Groups2 as Groups2Icon,
  Groups3 as Groups3Icon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  PersonSearch as PersonSearchIcon,
  PersonPin as PersonPinIcon,
  PersonPinCircle as PersonPinCircleIcon,
  PersonPinCircleOutlined as PersonPinCircleOutlinedIcon,
  PersonPinCircleRounded as PersonPinCircleRoundedIcon,
  PersonPinCircleSharp as PersonPinCircleSharpIcon,
  PersonPinCircleTwoTone as PersonPinCircleTwoToneIcon,
  PersonPinOutlined as PersonPinOutlinedIcon,
  PersonPinRounded as PersonPinRoundedIcon,
  PersonPinSharp as PersonPinSharpIcon,
  PersonPinTwoTone as PersonPinTwoToneIcon,
  PersonSearchOutlined as PersonSearchOutlinedIcon,
  PersonSearchRounded as PersonSearchRoundedIcon,
  PersonSearchSharp as PersonSearchSharpIcon,
  PersonSearchTwoTone as PersonSearchTwoToneIcon,
  PersonRemoveOutlined as PersonRemoveOutlinedIcon,
  PersonRemoveRounded as PersonRemoveRoundedIcon,
  PersonRemoveSharp as PersonRemoveSharpIcon,
  PersonRemoveTwoTone as PersonRemoveTwoToneIcon,
  PersonAddOutlined as PersonAddOutlinedIcon,
  PersonAddRounded as PersonAddRoundedIcon,
  PersonAddSharp as PersonAddSharpIcon,
  PersonAddTwoTone as PersonAddTwoToneIcon,
  GroupsOutlined as GroupsOutlinedIcon,
  GroupsRounded as GroupsRoundedIcon,
  GroupsSharp as GroupsSharpIcon,
  GroupsTwoTone as GroupsTwoToneIcon,
  Groups2Outlined as Groups2OutlinedIcon,
  Groups2Rounded as Groups2RoundedIcon,
  Groups2Sharp as Groups2SharpIcon,
  Groups2TwoTone as Groups2TwoToneIcon,
  Groups3Outlined as Groups3OutlinedIcon,
  Groups3Rounded as Groups3RoundedIcon,
  Groups3Sharp as Groups3SharpIcon,
  Groups3TwoTone as Groups3TwoToneIcon,
  GroupWorkOutlined as GroupWorkOutlinedIcon,
  GroupWorkRounded as GroupWorkRoundedIcon,
  GroupWorkSharp as GroupWorkSharpIcon,
  GroupWorkTwoTone as GroupWorkTwoToneIcon,
  GroupRemoveOutlined as GroupRemoveOutlinedIcon,
  GroupRemoveRounded as GroupRemoveRoundedIcon,
  GroupRemoveSharp as GroupRemoveSharpIcon,
  GroupRemoveTwoTone as GroupRemoveTwoToneIcon,
  GroupAddOutlined as GroupAddOutlinedIcon,
  GroupAddRounded as GroupAddRoundedIcon,
  GroupAddSharp as GroupAddSharpIcon,
  GroupAddTwoTone as GroupAddTwoToneIcon,
  GroupOutlined as GroupOutlinedIcon,
  GroupRounded as GroupRoundedIcon,
  GroupSharp as GroupSharpIcon,
  GroupTwoTone as GroupTwoToneIcon,
  PersonOutlined as PersonOutlinedIcon,
  PersonRounded as PersonRoundedIcon,
  PersonSharp as PersonSharpIcon,
  PersonTwoTone as PersonTwoToneIcon,
  Description as DescriptionIcon,
  DirectionsWalk as DirectionsWalkIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Weekend as WeekendIcon,
  ChildCare as ChildCareIcon,
  PersonOff as PersonOffIcon,
  Bloodtype as BloodtypeIcon,
  Badge as BadgeIcon,
  ContactPhone as ContactPhoneIcon,
  List as ListIcon,
  CalendarMonth as CalendarMonthIcon,
  Cancel as CancelIcon,
  TrackChanges as TrackChangesIcon,
  LocationOn as LocationOnIcon,
  Login as LoginIcon,
  ContactMail as ContactMailIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Announcement as AnnouncementIcon,
  History as HistoryIcon,
  Warehouse as WarehouseIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  DynamicForm as DynamicFormIcon,
  Inventory2 as StockInventoryIcon,
  LocationOn as LocationPinIcon,
  SwapHoriz as TransferIcon,
  LocalShipping as TruckIcon,
  List as PriceListIcon,
  History as StockHistoryIcon,
  BarChart as StockReportIcon,
  Monitor as MonitorIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useProject } from "../contexts/ProjectContext";
import { useTenant } from "../contexts/TenantContext";
import { usePermissions } from "../hooks/usePermissions";
import { useCorporateSettings } from "../hooks/useCorporateSettings";
import Logo from "./Logo";

const drawerWidth = 260;
const collapsedWidth = 64;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { selectedProject, projects, setSelectedProject } = useProject();
  const { tenant } = useTenant();
  const { canRead } = usePermissions();
  const { settings: corporateSettings } = useCorporateSettings();
  const [formOpen, setFormOpen] = useState(false);
  const [patrolOpen, setPatrolOpen] = useState(false);
  const [personnelOpen, setPersonnelOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [personnelModuleOpen, setPersonnelModuleOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [patrolModuleOpen, setPatrolModuleOpen] = useState(false);
  const [documentModuleOpen, setDocumentModuleOpen] = useState(false);
  const [userModuleOpen, setUserModuleOpen] = useState(false);
  const [reportModuleOpen, setReportModuleOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [settingsModuleOpen, setSettingsModuleOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [costAnalysisOpen, setCostAnalysisOpen] = useState(false);
  const [clothingOpen, setClothingOpen] = useState(false);
  const [riskAnalysisOpen, setRiskAnalysisOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [digitalFormOpen, setDigitalFormOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [reportingOpen, setReportingOpen] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mainMenuItems = [
    {
      text: "Ana Sayfa",
      icon: <DashboardIcon />,
      path: "/",
      module: "Ana Sayfa",
    },
    {
      text: "Sistem Kullanıcıları",
      icon: <PeopleIcon />,
      path: "/users",
      module: "Sistem Kullanıcıları",
    },
  ];

  const personnelSubItems = [
    {
      text: "Personel Listesi",
      icon: <SecurityIcon />,
      path: "/personnel",
      module: "Personel Listesi",
    },
    {
      text: "Vardiya Tipleri",
      icon: <TimeIcon />,
      path: "/shift-types",
      module: "Vardiya Tipleri",
    },
    {
      text: "Nöbet Çizelgeleri",
      icon: <DutyIcon />,
      path: "/duty-schedules",
      module: "Nöbet Çizelgeleri",
    },
  ];

  const projectSubItems: any[] = [];

  const patrolSubItems = [
    {
      text: "Kontrol Noktaları",
      icon: <LocationIcon />,
      path: "/checkpoints",
      module: "Kontrol Noktaları",
    },
    {
      text: "Devriye Çizelgeleri",
      icon: <ScheduleIcon />,
      path: "/patrols",
      module: "Devriye Çizelgeleri",
    },
    {
      text: "Olay Kayıtları",
      icon: <WarningIcon />,
      path: "/incidents",
      module: "Olay Kayıtları",
    },
  ];

  const formSubItems = [
    { text: "Formlar", path: "/forms", module: "Formlar" },
    {
      text: "Form Şablonları",
      path: "/form-templates",
      module: "Form Şablonları",
    },
    { text: "Puan Ayarları", path: "/score-settings", module: "Puan Ayarları" },
  ];

  // Görevlendirme Modülleri

  // Vardiya Modülleri
  const shiftSubItems: any[] = [];

  // Bildirim Modülleri
  const notificationSubItems = [
    {
      text: "Personel Sertifika Bitiş Bildirimi",
      icon: <SchoolIcon />,
      path: "/notifications/certificate-expiry",
      module: "Personel Sertifika Bitiş Bildirimi",
    },
    {
      text: "Proje Sözleşme Bitiş Bildirimi",
      icon: <DescriptionIcon />,
      path: "/notifications/contract-expiry",
      module: "Proje Sözleşme Bitiş Bildirimi",
    },
    {
      text: "Proje Koruma Planı Bildirimi",
      icon: <SecurityIcon />,
      path: "/notifications/protection-plan",
      module: "Proje Koruma Planı Bildirimi",
    },
  ];

  // Denetleme Modülleri
  const auditSubItems = [
    {
      text: "Proje ve personellerin denetimi",
      icon: <SearchIcon />,
      path: "/audit/inspection",
      module: "Proje ve personellerin denetimi",
    },
  ];

  // Devriye Modülleri

  // Doküman Modülleri
  const documentSubItems = [
    {
      text: "Doküman yönetimi",
      icon: <FolderIcon />,
      path: "/documents/management",
      module: "Doküman yönetimi",
    },
  ];

  // Raporlama Modülleri
  const reportingSubItems = [
    {
      text: "Maaş Hakediş Raporu",
      icon: <AttachMoneyIcon />,
      path: "/reports/salary",
      module: "Maaş Hakediş Raporu",
    },
    {
      text: "Eksik Çalışma Gün Raporu",
      icon: <EventIcon />,
      path: "/reports/missing-work-days",
      module: "Eksik Çalışma Gün Raporu",
    },
    {
      text: "Hafta Tatili Raporu",
      icon: <WeekendIcon />,
      path: "/reports/weekend",
      module: "Hafta Tatili Raporu",
    },
    {
      text: "AGİ Raporu",
      icon: <ChildCareIcon />,
      path: "/reports/agi",
      module: "AGİ Raporu",
    },
    {
      text: "Maaş",
      icon: <AttachMoneyIcon />,
      path: "/reports/payroll",
      module: "Maaş",
    },
    {
      text: "Görevi Olmayanlar",
      icon: <PersonOffIcon />,
      path: "/reports/no-assignment",
      module: "Görevi Olmayanlar",
    },
    {
      text: "Kıyafet Sipariş Raporu",
      icon: <ShoppingCartIcon />,
      path: "/reports/clothing-order",
      module: "Kıyafet Sipariş Raporu",
    },
    {
      text: "Ek Görev Yapanlar",
      icon: <WorkIcon />,
      path: "/reports/extra-duty",
      module: "Ek Görev Yapanlar",
    },
    {
      text: "Demografi",
      icon: <PeopleIcon />,
      path: "/reports/demographics",
      module: "Demografi",
    },
    {
      text: "Maliyet Analizi",
      icon: <AnalyticsIcon />,
      path: "/reports/cost-analysis",
      module: "Maliyet Analizi",
    },
    {
      text: "Personel Filtre (BES)",
      icon: <FilterListIcon />,
      path: "/reports/personnel-filter-bes",
      module: "Personel Filtre (BES)",
    },
    {
      text: "Form Rapor",
      icon: <FormIcon />,
      path: "/reports/form",
      module: "Form Rapor",
    },
    {
      text: "Kan Grubu",
      icon: <BloodtypeIcon />,
      path: "/reports/blood-type",
      module: "Kan Grubu",
    },
    {
      text: "Personel Kimlik",
      icon: <BadgeIcon />,
      path: "/reports/personnel-identity",
      module: "Personel Kimlik",
    },
    {
      text: "Personel BES Kesinti",
      icon: <AccountBalanceIcon />,
      path: "/reports/personnel-bes-deduction",
      module: "Personel BES Kesinti",
    },
    {
      text: "Devriye Raporu",
      icon: <DirectionsWalkIcon />,
      path: "/reports/patrol",
      module: "Devriye Raporu",
    },
    {
      text: "Kıyafet Teslimat",
      icon: <LocalShippingIcon />,
      path: "/reports/clothing-delivery",
      module: "Kıyafet Teslimat",
    },
    {
      text: "Proje İletişim Bilgileri",
      icon: <ContactPhoneIcon />,
      path: "/reports/project-contact",
      module: "Proje İletişim Bilgileri",
    },
    {
      text: "Personel Listesi",
      icon: <ListIcon />,
      path: "/reports/personnel-list",
      module: "Personel Listesi",
    },
    {
      text: "Vardiya Raporu",
      icon: <ScheduleIcon />,
      path: "/reports/shift",
      module: "Vardiya Raporu",
    },
    {
      text: "Form Aylık Rapor",
      icon: <CalendarMonthIcon />,
      path: "/reports/form-monthly",
      module: "Form Aylık Rapor",
    },
    {
      text: "Yapılmayan Kontroller",
      icon: <CancelIcon />,
      path: "/reports/missed-checks",
      module: "Yapılmayan Kontroller",
    },
    {
      text: "Personel Geçiş Takip Sistemi",
      icon: <TrackChangesIcon />,
      path: "/reports/personnel-transition",
      module: "Personel Geçiş Takip Sistemi",
    },
    {
      text: "Proje Segment Raporu",
      icon: <PieChartIcon />,
      path: "/reports/project-segment",
      module: "Proje Segment Raporu",
    },
    {
      text: "Kıyafet Depo Stok Raporu",
      icon: <InventoryIcon />,
      path: "/reports/clothing-warehouse-stock",
      module: "Kıyafet Depo Stok Raporu",
    },
    {
      text: "İşe Giriş/Çıkış Raporu",
      icon: <LoginIcon />,
      path: "/reports/entry-exit",
      module: "İşe Giriş/Çıkış Raporu",
    },
    {
      text: "Konsolide Rapor",
      icon: <AssessmentIcon />,
      path: "/reports/consolidated",
      module: "Konsolide Rapor",
    },
    {
      text: "Personel İletişim Bilgileri",
      icon: <ContactMailIcon />,
      path: "/reports/personnel-contact",
      module: "Personel İletişim Bilgileri",
    },
    {
      text: "Demirbaş Malzeme Raporu",
      icon: <InventoryIcon />,
      path: "/reports/asset-material",
      module: "Demirbaş Malzeme Raporu",
    },
    {
      text: "Devriye Tanımlı Projeler",
      icon: <LocationOnIcon />,
      path: "/reports/patrol-defined-projects",
      module: "Devriye Tanımlı Projeler",
    },
    {
      text: "5188 Kimlik Raporu",
      icon: <BadgeIcon />,
      path: "/reports/5188-identity",
      module: "5188 Kimlik Raporu",
    },
    {
      text: "Resmi Tatil Çalışma Raporu",
      icon: <EventIcon />,
      path: "/reports/holiday-work",
      module: "Resmi Tatil Çalışma Raporu",
    },
    {
      text: "Planlanan / Gerçekleşen Gün Raporu",
      icon: <CalendarTodayIcon />,
      path: "/reports/planned-actual-days",
      module: "Planlanan / Gerçekleşen Gün Raporu",
    },
    {
      text: "Personel Kart Bilgileri",
      icon: <CreditCardIcon />,
      path: "/reports/personnel-card",
      module: "Personel Kart Bilgileri",
    },
    {
      text: "Personel Banka Hesap Bilgileri",
      icon: <AccountBalanceIcon />,
      path: "/reports/personnel-bank-account",
      module: "Personel Banka Hesap Bilgileri",
    },
    {
      text: "Personel Özlük Hakları Raporu",
      icon: <WorkIcon />,
      path: "/reports/personnel-rights",
      module: "Personel Özlük Hakları Raporu",
    },
    {
      text: "Detaylı Devriye Raporu",
      icon: <DirectionsWalkIcon />,
      path: "/reports/detailed-patrol",
      module: "Detaylı Devriye Raporu",
    },
    {
      text: "Yıllık İzin Raporu",
      icon: <EventIcon />,
      path: "/reports/annual-leave",
      module: "Yıllık İzin Raporu",
    },
    {
      text: "Proje Sözleşme Raporu",
      icon: <DescriptionIcon />,
      path: "/reports/project-contract",
      module: "Proje Sözleşme Raporu",
    },
    {
      text: "GSM Hat Raporu",
      icon: <PhoneIcon />,
      path: "/reports/gsm-line",
      module: "GSM Hat Raporu",
    },
    {
      text: "Personel Eksik Veri Takibi",
      icon: <WarningIcon />,
      path: "/reports/personnel-missing-data",
      module: "Personel Eksik Veri Takibi",
    },
    {
      text: "Personel Eğitim Katılım Raporu",
      icon: <SchoolIcon />,
      path: "/reports/personnel-education-participation",
      module: "Personel Eğitim Katılım Raporu",
    },
  ];

  // Portal Modülleri
  const portalSubItems = [
    {
      text: "Yetkili Portal",
      icon: <AdminPanelSettingsIcon />,
      path: "/portal/authority",
      module: "Yetkili Portal",
    },
    {
      text: "Personel Portal",
      icon: <PersonIcon />,
      path: "/portal/personnel",
      module: "Personel Portal",
    },
  ];

  // Ayarlar Modülleri
  const settingsSubItems = [
    {
      text: "Genel",
      icon: <SettingsIcon />,
      path: "/settings/general",
      module: "Genel",
    },
    {
      text: "SGK Ayarları",
      icon: <AccountBalanceIcon />,
      path: "/settings/sgk",
      module: "SGK Ayarları",
    },
    {
      text: "Vardiya Tipleri",
      icon: <ScheduleIcon />,
      path: "/settings/shift-types",
      module: "Vardiya Tipleri",
    },
    {
      text: "Ceza",
      icon: <WarningIcon />,
      path: "/settings/penalty",
      module: "Ceza",
    },
    {
      text: "Kıyafet Türleri",
      icon: <CheckroomIcon />,
      path: "/settings/clothing-types",
      module: "Kıyafet Türleri",
    },
    {
      text: "Kıyafet Depo",
      icon: <InventoryIcon />,
      path: "/settings/clothing-warehouse",
      module: "Kıyafet Depo",
    },
    {
      text: "Rol",
      icon: <SecurityIcon />,
      path: "/settings/roles",
      module: "Rol",
    },
    {
      text: "Bildirim Tipleri",
      icon: <NotificationsIcon />,
      path: "/settings/notification-types",
      module: "Bildirim Tipleri",
    },
    {
      text: "Doküman Türleri",
      icon: <FolderIcon />,
      path: "/settings/document-types",
      module: "Doküman Türleri",
    },
    {
      text: "Maaş Parametreleri",
      icon: <AttachMoneyIcon />,
      path: "/settings/salary-parameters",
      module: "Maaş Parametreleri",
    },
    {
      text: "Şablon Yönetimi",
      icon: <DescriptionIcon />,
      path: "/settings/template-management",
      module: "Şablon Yönetimi",
    },
    {
      text: "Yetkili Bilgileri",
      icon: <AdminPanelSettingsIcon />,
      path: "/settings/authority-info",
      module: "Yetkili Bilgileri",
    },
    {
      text: "Duyuru",
      icon: <AnnouncementIcon />,
      path: "/settings/announcements",
      module: "Duyuru",
    },
    {
      text: "İşlem Kayıtları",
      icon: <HistoryIcon />,
      path: "/settings/transaction-logs",
      module: "İşlem Kayıtları",
    },
    {
      text: "Unvan",
      icon: <WorkIcon />,
      path: "/settings/titles",
      module: "Unvan",
    },
    {
      text: "Firma",
      icon: <BusinessIcon />,
      path: "/settings/company",
      module: "Firma",
    },
    {
      text: "Eğitimler",
      icon: <SchoolIcon />,
      path: "/settings/educations",
      module: "Eğitimler",
    },
    {
      text: "Depolar",
      icon: <WarehouseIcon />,
      path: "/settings/warehouses",
      module: "Depolar",
    },
    {
      text: "Resmi Tatiller",
      icon: <EventIcon />,
      path: "/settings/holidays",
      module: "Resmi Tatiller",
    },
    {
      text: "Demirbaş Depo Yönetimi",
      icon: <InventoryIcon />,
      path: "/settings/asset-warehouse",
      module: "Demirbaş Depo Yönetimi",
    },
    {
      text: "Demirbaş Türleri",
      icon: <CategoryIcon />,
      path: "/settings/asset-types",
      module: "Demirbaş Türleri",
    },
    {
      text: "Gelir/Gider Tipleri",
      icon: <TrendingUpIcon />,
      path: "/settings/income-expense-types",
      module: "Gelir/Gider Tipleri",
    },
  ];

  // Mesajlar Modülleri
  const messageSubItems = [
    {
      text: "Proje",
      icon: <BusinessIcon />,
      path: "/messages/project",
      module: "Proje",
    },
    {
      text: "Personel",
      icon: <PeopleIcon />,
      path: "/messages/personnel",
      module: "Personel",
    },
  ];

  // Yardım Modülleri
  const helpSubItems = [
    {
      text: "Rehberlik ve kullanım desteği",
      icon: <HelpIcon />,
      path: "/help/guide",
      module: "Rehberlik ve kullanım desteği",
    },
  ];

  // Demirbaş Modülleri
  const assetSubItems = [
    {
      text: "Demirbaş yönetimi",
      icon: <InventoryIcon />,
      path: "/assets/management",
      module: "Demirbaş yönetimi",
    },
  ];

  // İzin Modülleri
  const leaveSubItems = [
    {
      text: "Personel izinleri",
      icon: <EventIcon />,
      path: "/leave/personnel",
      module: "Personel izinleri",
    },
  ];

  // Olay Raporu Modülleri
  const incidentSubItems = [
    {
      text: "Olay kayıtları",
      icon: <ReportProblemIcon />,
      path: "/incidents/records",
      module: "Olay kayıtları",
    },
  ];

  // Satış Modülleri
  const salesTrackingSubItems = [
    {
      text: "Potansiyel müşteri ve satış takibi",
      icon: <TrendingUpIcon />,
      path: "/sales/tracking",
      module: "Potansiyel müşteri ve satış takibi",
    },
  ];

  // Maliyet Analizi Modülleri
  const costAnalysisSubItems = [
    {
      text: "Gelir-gider ve karlılık takibi",
      icon: <AnalyticsIcon />,
      path: "/cost-analysis/tracking",
      module: "Gelir-gider ve karlılık takibi",
    },
  ];

  // Kıyafet Modülleri
  const clothingSubItems = [
    {
      text: "Türler ve beden yönetimi",
      icon: <CheckroomIcon />,
      path: "/clothing/management",
      module: "Türler ve beden yönetimi",
    },
  ];

  // Risk Analizi Modülleri
  const riskAnalysisSubItems = [
    {
      text: "Risk raporları",
      icon: <WarningIcon />,
      path: "/risk-analysis/reports",
      module: "Risk raporları",
    },
  ];

  // Aday Personel Modülleri
  const candidateSubItems = [
    {
      text: "İşe alım süreci yönetimi",
      icon: <PersonAddIcon />,
      path: "/candidates/recruitment",
      module: "İşe alım süreci yönetimi",
    },
  ];

  // Dijital Formlar Modülleri
  const digitalFormSubItems = [
    {
      text: "Operasyon formları",
      icon: <DynamicFormIcon />,
      path: "/digital-forms/operation",
      module: "Operasyon formları",
    },
  ];

  // Eğitim Modülleri
  const educationSubItems = [
    {
      text: "Personel eğitim süreçleri",
      icon: <SchoolIcon />,
      path: "/education/processes",
      module: "Personel eğitim süreçleri",
    },
  ];

  // Muhasebe Alt Menüleri
  const salesSubItems = [
    {
      text: "Teklifler",
      icon: <DescriptionIcon />,
      path: "/accounting/sales/quotes",
      module: "Teklifler",
    },
    {
      text: "Faturalar",
      icon: <ReceiptIcon />,
      path: "/accounting/sales/invoices",
      module: "Faturalar",
    },
    {
      text: "Müşteriler",
      icon: <BusinessIcon />,
      path: "/accounting/sales/customers",
      module: "Müşteriler",
    },
    {
      text: "Satışlar Raporu",
      icon: <BarChartIcon />,
      path: "/accounting/sales/report",
      module: "Satışlar Raporu",
    },
    {
      text: "Tahsilatlar Raporu",
      icon: <BarChartIcon />,
      path: "/accounting/sales/collections-report",
      module: "Tahsilatlar Raporu",
    },
    {
      text: "Gelir Gider Raporu",
      icon: <BarChartIcon />,
      path: "/accounting/sales/income-expense-report",
      module: "Gelir Gider Raporu",
    },
  ];

  // STOK Alt Menüleri
  const stockSubItems = [
    {
      text: "Hizmet ve Ürünler",
      icon: <CategoryIcon />,
      path: "/accounting/stock/products",
      module: "Hizmet ve Ürünler",
    },
    {
      text: "Depolar",
      icon: <LocationPinIcon />,
      path: "/accounting/stock/warehouses",
      module: "Depolar",
    },
    {
      text: "Depolar Arası Transfer",
      icon: <TransferIcon />,
      path: "/accounting/stock/transfers",
      module: "Depolar Arası Transfer",
    },
    {
      text: "Giden İrsaliyeler",
      icon: <TruckIcon />,
      path: "/accounting/stock/outgoing-deliveries",
      module: "Giden İrsaliyeler",
    },
    {
      text: "Gelen İrsaliyeler",
      icon: <TruckIcon />,
      path: "/accounting/stock/incoming-deliveries",
      module: "Gelen İrsaliyeler",
    },
    {
      text: "Fiyat Listeleri",
      icon: <PriceListIcon />,
      path: "/accounting/stock/price-lists",
      module: "Fiyat Listeleri",
    },
    {
      text: "Stok Geçmişi",
      icon: <StockHistoryIcon />,
      path: "/accounting/stock/history",
      module: "Stok Geçmişi",
    },
    {
      text: "Stoktaki Ürünler Raporu",
      icon: <StockReportIcon />,
      path: "/accounting/stock/products-report",
      module: "Stoktaki Ürünler Raporu",
    },
  ];

  const expensesSubItems = [
    {
      text: "Gider Listesi",
      icon: <ReceiptIcon />,
      path: "/accounting/expenses/list",
      module: "Gider Listesi",
    },
    {
      text: "Gelen E-Faturalar",
      icon: <ReceiptIcon />,
      path: "/accounting/expenses/incoming-e-invoices",
      module: "Gelen E-Faturalar",
    },
    {
      text: "Tedarikçiler",
      icon: <BusinessIcon />,
      path: "/accounting/expenses/suppliers",
      module: "Tedarikçiler",
    },
    {
      text: "Giderler Raporu",
      icon: <AssessmentIcon />,
      path: "/accounting/expenses/report",
      module: "Giderler Raporu",
    },
    {
      text: "Ödemeler Raporu",
      icon: <PaymentIcon />,
      path: "/accounting/expenses/payments-report",
      module: "Ödemeler Raporu",
    },
    {
      text: "KDV Raporu",
      icon: <AtmIcon />,
      path: "/accounting/expenses/vat-report",
      module: "KDV Raporu",
    },
  ];

  const payrollSubItems = [
    {
      text: "Puantaj İşlemleri",
      icon: <PayrollIcon />,
      path: "/accounting/payroll",
      module: "Puantaj İşlemleri",
    },
  ];

  // Banka ve Nakit Alt Menüleri
  const bankSubItems = [
    {
      text: "Banka Hesapları",
      icon: <AccountBalanceIcon />,
      path: "/accounting/bank/accounts",
      module: "Banka Hesapları",
    },
    {
      text: "Nakit Akışı",
      icon: <AttachMoneyIcon />,
      path: "/accounting/bank/cash-flow",
      module: "Nakit Akışı",
    },
    {
      text: "Tahsilatlar",
      icon: <PaymentIcon />,
      path: "/accounting/bank/collections",
      module: "Tahsilatlar",
    },
    {
      text: "Ödemeler",
      icon: <CreditCardIcon />,
      path: "/accounting/bank/payments",
      module: "Ödemeler",
    },
    {
      text: "Çek ve Senetler",
      icon: <DescriptionIcon />,
      path: "/accounting/bank/checks-bills",
      module: "Çek ve Senetler",
    },
    {
      text: "Banka Raporları",
      icon: <AssessmentIcon />,
      path: "/accounting/bank/reports",
      module: "Banka Raporları",
    },
  ];

  const otherMenuItems = [
    {
      text: "Raporlar",
      icon: <ReportIcon />,
      path: "/reports",
      module: "Raporlar",
    },
    {
      text: "Ayarlar",
      icon: <SettingsIcon />,
      path: "/settings",
      module: "Ayarlar",
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const handleFormToggle = () => {
    setFormOpen(!formOpen);
  };

  const handlePatrolToggle = () => {
    setPatrolOpen(!patrolOpen);
  };

  const handlePersonnelToggle = () => {
    setPersonnelOpen(!personnelOpen);
  };

  const handleOperationToggle = () => {
    setOperationOpen(!operationOpen);
  };

  const handleProjectToggle = () => {
    setProjectOpen(!projectOpen);
  };

  const handlePersonnelModuleToggle = () => {
    setPersonnelModuleOpen(!personnelModuleOpen);
  };

  const handleShiftToggle = () => {
    setShiftOpen(!shiftOpen);
  };

  const handleNotificationToggle = () => {
    setNotificationOpen(!notificationOpen);
  };

  const handleAuditToggle = () => {
    setAuditOpen(!auditOpen);
  };

  const handlePatrolModuleToggle = () => {
    setPatrolModuleOpen(!patrolModuleOpen);
  };

  const handleDocumentModuleToggle = () => {
    setDocumentModuleOpen(!documentModuleOpen);
  };

  const handleUserModuleToggle = () => {
    setUserModuleOpen(!userModuleOpen);
  };

  const handleReportModuleToggle = () => {
    setReportModuleOpen(!reportModuleOpen);
  };

  const handlePortalToggle = () => {
    setPortalOpen(!portalOpen);
  };

  const handleSettingsModuleToggle = () => {
    setSettingsModuleOpen(!settingsModuleOpen);
  };

  const handleMessageToggle = () => {
    setMessageOpen(!messageOpen);
  };

  const handleHelpToggle = () => {
    setHelpOpen(!helpOpen);
  };

  const handleAssetToggle = () => {
    setAssetOpen(!assetOpen);
  };

  const handleSalesToggle = () => {
    setSalesOpen(!salesOpen);
  };

  const handleCostAnalysisToggle = () => {
    setCostAnalysisOpen(!costAnalysisOpen);
  };

  const handleClothingToggle = () => {
    setClothingOpen(!clothingOpen);
  };

  const handleRiskAnalysisToggle = () => {
    setRiskAnalysisOpen(!riskAnalysisOpen);
  };

  const handleCandidateToggle = () => {
    setCandidateOpen(!candidateOpen);
  };

  const handleDigitalFormToggle = () => {
    setDigitalFormOpen(!digitalFormOpen);
  };

  const handleEducationToggle = () => {
    setEducationOpen(!educationOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        transition: "width 0.3s ease",
        "& .MuiDrawer-paper": {
          width: sidebarOpen ? drawerWidth : collapsedWidth,
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          transition: "width 0.3s ease",
          overflowX: "hidden",
          overflowY: "auto",
          height: "100vh",
        },
      }}
    >
      {/* Toggle Button */}
      <Box
        sx={{
          p: 0.75,
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-end" : "center",
          minHeight: 40,
        }}
      >
        <IconButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              backgroundColor: "primary.light",
              color: "white",
            },
          }}
        >
          {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Logo */}
      <Box
        sx={{
          p: sidebarOpen ? 2 : 1,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          minHeight: 80,
          position: "relative",
          mb: 1, // Add margin bottom to provide space after badge
        }}
      >
        {sidebarOpen ? (
          <>
            {tenant?.branding.logo ? (
              <img
                src={tenant.branding.logo}
                alt={tenant.name}
                style={{ maxHeight: 60, maxWidth: 200 }}
              />
            ) : (
              <Logo />
            )}
            <Typography
              variant="h6"
              sx={{ mt: 1, fontWeight: 600, fontSize: "0.9rem" }}
            >
              {corporateSettings?.company_name || "SafeBase"}
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                px: 1.5,
                py: 0.5,
                backgroundColor:
                  tenant?.subscription_plan === "enterprise"
                    ? "#1976d2"
                    : tenant?.subscription_plan === "pro"
                    ? "#42a5f5"
                    : "#9e9e9e",
                borderRadius: 1,
                display: "inline-block",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {tenant?.subscription_plan === "enterprise"
                  ? "Enterprise"
                  : tenant?.subscription_plan === "pro"
                  ? "Pro"
                  : "Basic"}{" "}
                Plan
              </Typography>
            </Box>
          </>
        ) : (
          <Tooltip
            title={`${
              corporateSettings?.company_name || "SafeBase"
            } - ${tenant?.subscription_plan?.toUpperCase()} Plan`}
            placement="right"
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              {tenant?.branding.logo ? (
                <img
                  src={tenant.branding.logo}
                  alt={tenant.name}
                  style={{ maxHeight: 48, maxWidth: 48, borderRadius: 4 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "primary.main",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                  }}
                >
                  S
                </Box>
              )}
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor:
                    tenant?.subscription_plan === "enterprise"
                      ? "#1976d2"
                      : tenant?.subscription_plan === "pro"
                      ? "#42a5f5"
                      : "#9e9e9e",
                  borderRadius: 1,
                  minWidth: 40,
                  maxWidth: 48,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: "white",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    display: "block",
                    textAlign: "center",
                    lineHeight: 1,
                  }}
                >
                  {tenant?.subscription_plan === "enterprise"
                    ? "ENT"
                    : tenant?.subscription_plan === "pro"
                    ? "PRO"
                    : "BAS"}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Divider after logo */}
      <Box
        sx={{
          height: "1px",
          backgroundColor: "#e2e8f0",
          mx: 1,
        }}
      />

      {/* Project Selector */}
      {sidebarOpen && (
        <Box
          sx={{ px: 1.5, pb: 1.5, pt: 5, borderBottom: "1px solid #e2e8f0" }}
        >
          <FormControl fullWidth size="small">
            <InputLabel id="project-select-label" sx={{ fontSize: "0.875rem" }}>
              Proje
            </InputLabel>
            <Select
              labelId="project-select-label"
              value={selectedProject?.id || ""}
              label="Proje"
              onChange={(e) => {
                const project = projects.find((p) => p.id === e.target.value);
                setSelectedProject(project || null);
              }}
              sx={{
                backgroundColor: "#f8fafc",
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e2e8f0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              {projects.map((project) => (
                <MenuItem
                  key={project.id}
                  value={project.id}
                  sx={{ fontSize: "0.875rem" }}
                >
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Projects Link */}
          <Box sx={{ mt: 1, textAlign: "right" }}>
            <Button
              component={Link}
              to="/projects"
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                fontSize: "0.75rem",
                "&:hover": {
                  color: "primary.main",
                  backgroundColor: "transparent",
                },
              }}
            >
              Projeler
            </Button>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Main Menu */}
      <List>
        <ListSubheader
          sx={{
            backgroundColor: "transparent",
            color: "text.secondary",
            fontWeight: 600,
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            px: 1.5,
            py: 0.25,
            mt: 0.25,
          }}
        >
          Menü
        </ListSubheader>

        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={sidebarOpen ? "" : item.text} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  my: 0.125,
                  borderRadius: 1,
                  minHeight: 32,
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  px: sidebarOpen ? 1 : 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "primary.light",
                    color: "white",
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen ? 28 : "auto",
                    fontSize: "1rem",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        {/* Muhasebe Modülleri */}
        <ListItem disablePadding>
          <Tooltip title={sidebarOpen ? "" : "MUHASEBE"} placement="right">
            <ListItemButton
              onClick={() => setAccountingOpen(!accountingOpen)}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <AccountBalanceIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="MUHASEBE"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {accountingOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={accountingOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {/* Satışlar */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setSalesOpen(!salesOpen)}
                  sx={{
                    pl: 2,
                    mx: 1,
                    my: 0.125,
                    borderRadius: 1,
                    minHeight: 32,
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                    <SalesIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Satışlar"
                    primaryTypographyProps={{
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}
                  />
                  {salesOpen ? (
                    <ExpandLess sx={{ fontSize: "0.8rem" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: "0.8rem" }} />
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={salesOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {salesSubItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                          pl: 4,
                          mx: 1,
                          my: 0.0625,
                          borderRadius: 1,
                          minHeight: 28,
                          "&.Mui-selected": {
                            backgroundColor: "primary.main",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "primary.light",
                            color: "white",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.6875rem",
                            fontWeight:
                              location.pathname === item.path ? 600 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>

              {/* Şablonlar */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/settings/template-management"
                  selected={
                    location.pathname === "/settings/template-management"
                  }
                  sx={{
                    pl: 2,
                    mx: 1,
                    my: 0.125,
                    borderRadius: 1,
                    minHeight: 32,
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Şablonlar"
                    primaryTypographyProps={{
                      fontSize: "0.6875rem",
                      fontWeight:
                        location.pathname === "/settings/template-management"
                          ? 600
                          : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Giderler */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setExpensesOpen(!expensesOpen)}
                  sx={{
                    pl: 2,
                    mx: 1,
                    my: 0.125,
                    borderRadius: 1,
                    minHeight: 32,
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                    <ReceiptIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Giderler"
                    primaryTypographyProps={{
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}
                  />
                  {expensesOpen ? (
                    <ExpandLess sx={{ fontSize: "0.8rem" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: "0.8rem" }} />
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={expensesOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {expensesSubItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                          pl: 4,
                          mx: 1,
                          my: 0.0625,
                          borderRadius: 1,
                          minHeight: 28,
                          "&.Mui-selected": {
                            backgroundColor: "primary.main",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "primary.light",
                            color: "white",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.6875rem",
                            fontWeight:
                              location.pathname === item.path ? 600 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>

              {/* STOK */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setStockOpen(!stockOpen)}
                  sx={{
                    pl: 2,
                    mx: 1,
                    my: 0.125,
                    borderRadius: 1,
                    minHeight: 32,
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                    <StockInventoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="STOK"
                    primaryTypographyProps={{
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}
                  />
                  {stockOpen ? (
                    <ExpandLess sx={{ fontSize: "0.8rem" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: "0.8rem" }} />
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={stockOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {stockSubItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                          pl: 4,
                          mx: 1,
                          my: 0.0625,
                          borderRadius: 1,
                          minHeight: 28,
                          "&.Mui-selected": {
                            backgroundColor: "primary.main",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "primary.light",
                            color: "white",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.6875rem",
                            fontWeight:
                              location.pathname === item.path ? 600 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>

              {/* Banka ve Nakit */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setBankOpen(!bankOpen)}
                  sx={{
                    pl: 2,
                    mx: 1,
                    my: 0.125,
                    borderRadius: 1,
                    minHeight: 32,
                    "&:hover": {
                      backgroundColor: "primary.light",
                      color: "white",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                    <AccountBalanceIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Banka ve Nakit"
                    primaryTypographyProps={{
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}
                  />
                  {bankOpen ? (
                    <ExpandLess sx={{ fontSize: "0.8rem" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: "0.8rem" }} />
                  )}
                </ListItemButton>
              </ListItem>
              <Collapse in={bankOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {bankSubItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                          pl: 4,
                          mx: 1,
                          my: 0.0625,
                          borderRadius: 1,
                          minHeight: 28,
                          "&.Mui-selected": {
                            backgroundColor: "primary.main",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "primary.dark",
                            },
                          },
                          "&:hover": {
                            backgroundColor: "primary.light",
                            color: "white",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: "0.6875rem",
                            fontWeight:
                              location.pathname === item.path ? 600 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>

              {/* Puantaj */}
              {payrollSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 2,
                      mx: 1,
                      my: 0.125,
                      borderRadius: 1,
                      minHeight: 32,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 24, ml: 0.5 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Personel İşlemleri Submenu */}
        <ListItem disablePadding>
          <Tooltip
            title={sidebarOpen ? "" : "Personel İşlemleri"}
            placement="right"
          >
            <ListItemButton
              onClick={handlePersonnelToggle}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <SecurityIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="Personel İşlemleri"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {personnelOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={personnelOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {personnelSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Operasyon İşlemleri Submenu */}
        <ListItem disablePadding>
          <Tooltip
            title={sidebarOpen ? "" : "Operasyon İşlemleri"}
            placement="right"
          >
            <ListItemButton
              onClick={handleOperationToggle}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <ReportIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="Operasyon İşlemleri"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {operationOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={operationOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {projectSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Devriye İşlemleri Submenu */}
        <ListItem disablePadding>
          <Tooltip
            title={sidebarOpen ? "" : "Devriye İşlemleri"}
            placement="right"
          >
            <ListItemButton
              onClick={handlePatrolToggle}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <ScheduleIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="Devriye İşlemleri"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {patrolOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={patrolOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {patrolSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Form Submenu */}
        <ListItem disablePadding>
          <Tooltip title={sidebarOpen ? "" : "Form"} placement="right">
            <ListItemButton
              onClick={handleFormToggle}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <FormIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="Form"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {formOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={formOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {formSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* PROJE Submenu */}
        <ListItem disablePadding>
          <Tooltip title={sidebarOpen ? "" : "PROJE"} placement="right">
            <ListItemButton
              onClick={handleProjectToggle}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="PROJE"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {projectOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={projectOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {projectSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Vardiya Modülleri */}
        <ListItem disablePadding>
          <Tooltip title={sidebarOpen ? "" : "VARDİYA"} placement="right">
            <ListItemButton
              onClick={() => setShiftOpen(!shiftOpen)}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <ScheduleIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="VARDİYA"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {shiftOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={shiftOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {shiftSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* Raporlama Modülleri */}
        <ListItem disablePadding>
          <Tooltip title={sidebarOpen ? "" : "RAPORLAMA"} placement="right">
            <ListItemButton
              onClick={() => setReportingOpen(!reportingOpen)}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                minHeight: 40,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 2 : 1,
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 36 : "auto",
                  fontSize: "1.2rem",
                  justifyContent: "center",
                }}
              >
                <ReportIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText
                    primary="RAPORLAMA"
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  />
                  {reportingOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {sidebarOpen && (
          <Collapse in={reportingOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {reportingSubItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      mx: 1,
                      my: 0.0625,
                      borderRadius: 1,
                      minHeight: 28,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                      "&:hover": {
                        backgroundColor: "primary.light",
                        color: "white",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 24, ml: 0.5, fontSize: "0.9rem" }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: "0.6875rem",
                        fontWeight: location.pathname === item.path ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}

        {/* İzleme Merkezi */}
        <ListItem disablePadding>
          <Tooltip
            title={sidebarOpen ? "" : "İzleme Merkezi"}
            placement="right"
          >
            <ListItemButton
              component={Link}
              to="/monitoring-center"
              selected={location.pathname === "/monitoring-center"}
              sx={{
                mx: 1,
                my: 0.125,
                borderRadius: 1,
                minHeight: 32,
                justifyContent: sidebarOpen ? "flex-start" : "center",
                px: sidebarOpen ? 1 : 0.5,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
                "&:hover": {
                  backgroundColor: "primary.light",
                  color: "white",
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: sidebarOpen ? 28 : "auto",
                  fontSize: "1rem",
                  justifyContent: "center",
                }}
              >
                <MonitorIcon />
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary="İzleme Merkezi"
                  primaryTypographyProps={{
                    fontSize: "0.75rem",
                    fontWeight:
                      location.pathname === "/monitoring-center" ? 600 : 500,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {otherMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={sidebarOpen ? "" : item.text} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  my: 0.125,
                  borderRadius: 1,
                  minHeight: 32,
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  px: sidebarOpen ? 1 : 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "primary.light",
                    color: "white",
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen ? 28 : "auto",
                    fontSize: "1rem",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.75rem",
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: "auto" }} />

      {/* Logout Button */}
      <Box sx={{ p: 1.5, borderTop: "1px solid #e2e8f0" }}>
        <Tooltip title={sidebarOpen ? "" : "Çıkış Yap"} placement="right">
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            color="error"
            size="small"
            sx={{
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              px: sidebarOpen ? 2 : 1,
            }}
          >
            {sidebarOpen && "Çıkış Yap"}
          </Button>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
