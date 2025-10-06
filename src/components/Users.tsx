import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Report as ReportIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useProject } from "../contexts/ProjectContext";
import { useTenant } from "../contexts/TenantContext";
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

interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  is_active: boolean;
  phone?: string;
  tenant_id: string;
  permissions?: any;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

const Users: React.FC = () => {
  const { tenant, loading: tenantLoading } = useTenant();
  const { selectedProject } = useProject();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [nameFilter, setNameFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState<{
    current: number;
    max: number;
    canAdd: boolean;
    remaining: number;
  } | null>(null);
  const [dialogFormData, setDialogFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "user" as "admin" | "user" | "moderator",
    isActive: true,
  });
  const [tabValue, setTabValue] = useState(0);
  const [userPermissions, setUserPermissions] = useState({
    // Ana Sayfalar
    "Ana Sayfa": { read: false, add: false, update: false, delete: false },
    "Sistem Kullanıcıları": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },

    // Personel İşlemleri
    "Personel Listesi": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Puantaj İşlemleri": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Nöbet Çizelgeleri": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },

    // Operasyon İşlemleri
    "Denetim Kayıtları": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Proje Ziyaretleri": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },

    // Devriye İşlemleri
    "Kontrol Noktaları": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Devriye Çizelgeleri": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Olay Kayıtları": { read: false, add: false, update: false, delete: false },

    // Form İşlemleri
    Formlar: { read: false, add: false, update: false, delete: false },
    "Form Şablonları": {
      read: false,
      add: false,
      update: false,
      delete: false,
    },
    "Puan Ayarları": { read: false, add: false, update: false, delete: false },

    // Proje İşlemleri
    Projeler: { read: false, add: false, update: false, delete: false },

    // Raporlar ve Ayarlar
    Raporlar: { read: false, add: false, update: false, delete: false },
    Ayarlar: { read: false, add: false, update: false, delete: false },
  });

  // Permission categories for better organization
  const permissionCategories = {
    "Ana Sayfalar": {
      icon: <DashboardIcon />,
      color: "#1976d2",
      modules: ["Ana Sayfa", "Sistem Kullanıcıları"],
    },
    "Personel Yönetimi": {
      icon: <PeopleIcon />,
      color: "#2e7d32",
      modules: ["Personel Listesi", "Puantaj İşlemleri", "Nöbet Çizelgeleri"],
    },
    "Operasyon İşlemleri": {
      icon: <SecurityIcon />,
      color: "#f57c00",
      modules: ["Denetim Kayıtları", "Proje Ziyaretleri"],
    },
    "Devriye ve Güvenlik": {
      icon: <AssignmentIcon />,
      color: "#d32f2f",
      modules: ["Kontrol Noktaları", "Devriye Çizelgeleri", "Olay Kayıtları"],
    },
    "Form ve Dokümantasyon": {
      icon: <AssignmentIcon />,
      color: "#7b1fa2",
      modules: ["Formlar", "Form Şablonları", "Puan Ayarları"],
    },
    "Proje ve Raporlar": {
      icon: <ReportIcon />,
      color: "#388e3c",
      modules: ["Projeler", "Raporlar", "Ayarlar"],
    },
  };
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);

  // Debug userPermissions state changes
  useEffect(() => {
    console.log("🔄 userPermissions state changed:", userPermissions);
    console.log(
      "🔄 Object.entries length:",
      Object.entries(userPermissions).length
    );
  }, [userPermissions]);

  // Fetch available projects for the tenant
  const fetchAvailableProjects = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("name");

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      setAvailableProjects(data || []);
    } catch (err) {
      console.error("Error in fetchAvailableProjects:", err);
    }
  };

  // Fetch user's assigned projects
  const fetchUserProjects = async (userId: string) => {
    if (!tenant) return;

    console.log(
      "🔍 fetchUserProjects called for user:",
      userId,
      "tenant:",
      tenant.id
    );

    try {
      const { data, error } = await supabase
        .from("project_users")
        .select(
          `
          project_id,
          projects (
            id,
            name
          )
        `
        )
        .eq("user_id", userId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("❌ Error fetching user projects:", error);
        return;
      }

      console.log("📊 Raw project_users data:", data);
      const projects = data?.map((item) => item.projects) || [];
      console.log("📋 Processed projects:", projects);
      setUserProjects(projects);
    } catch (err) {
      console.error("❌ Error in fetchUserProjects:", err);
    }
  };

  // Fetch users from database based on selected project
  const fetchUsers = async () => {
    if (!tenant) {
      console.log("No tenant found, skipping fetchUsers");
      setLoading(false);
      return;
    }

    // Remove selectedProject requirement for now
    console.log("Fetching users for tenant:", tenant.id);

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching users for tenant:", tenant.id);

      // Get users directly from users table for this tenant
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("tenant_id", tenant.id);

      console.log("Users query result:", { data, error });

      if (error) {
        console.error("Error fetching users:", error);
        setError("Kullanıcılar yüklenirken bir hata oluştu: " + error.message);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error("Error in fetchUsers:", err);
      setError("Kullanıcılar yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Load users when tenant and selected project are available
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchUsers();
    }
  }, [tenant, tenantLoading]);

  // Kullanıcı limitlerini çek
  useEffect(() => {
    const fetchUserLimits = async () => {
      if (!tenant?.id) return;

      try {
        const response = await fetch(
          `http://localhost:3000/api/tenant-limits?tenantId=${tenant.id}`
        );
        const data = await response.json();

        if (response.ok) {
          // Kullanıcı limitlerini doğru şekilde hesapla
          const currentUsers = users.length;
          // API'den kullanıcı limitini çek, yoksa tenant'tan al
          const maxUsers = data.limits?.users?.max || tenant.max_users || -1;
          const canAdd = maxUsers === -1 || currentUsers < maxUsers;
          const remaining =
            maxUsers === -1 ? -1 : Math.max(0, maxUsers - currentUsers);

          setUserLimits({
            current: currentUsers,
            max: maxUsers,
            canAdd: canAdd,
            remaining: remaining,
          });
        } else {
          console.error("Error fetching user limits:", data.error);
          // API hatası durumunda tenant'tan direkt al
          const currentUsers = users.length;
          const maxUsers = tenant.max_users || -1;
          const canAdd = maxUsers === -1 || currentUsers < maxUsers;
          const remaining =
            maxUsers === -1 ? -1 : Math.max(0, maxUsers - currentUsers);

          setUserLimits({
            current: currentUsers,
            max: maxUsers,
            canAdd: canAdd,
            remaining: remaining,
          });
        }
      } catch (error) {
        console.error("Error fetching user limits:", error);
        // Hata durumunda tenant'tan direkt al
        const currentUsers = users.length;
        const maxUsers = tenant.max_users || -1;
        const canAdd = maxUsers === -1 || currentUsers < maxUsers;
        const remaining =
          maxUsers === -1 ? -1 : Math.max(0, maxUsers - currentUsers);

        setUserLimits({
          current: currentUsers,
          max: maxUsers,
          canAdd: canAdd,
          remaining: remaining,
        });
      }
    };

    fetchUserLimits();
  }, [tenant?.id, tenant?.max_users, users.length]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Name filter
    if (nameFilter) {
      filtered = filtered.filter((user) =>
        user.full_name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "Tümü") {
      const isActive = statusFilter === "Aktif";
      filtered = filtered.filter((user) => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, nameFilter, statusFilter]);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "error";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Sistem Admini";
      case "user":
        return "Kullanıcı";
      case "moderator":
        return "Moderatör";
      default:
        return role;
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "user",
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleEditUser = async (user: User) => {
    setEditingUser(user);
    setDialogFormData({
      firstName: user.full_name.split(" ")[0] || "",
      lastName: user.full_name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      isActive: user.is_active,
    });

    // Load user's existing permissions
    console.log("👤 Loading user permissions for:", user.full_name);
    console.log("🔐 User permissions from DB:", user.permissions);
    console.log("🔍 Type of permissions:", typeof user.permissions);
    console.log(
      "🔍 Is permissions object?",
      user.permissions && typeof user.permissions === "object"
    );

    // Set default permissions first
    const defaultPermissions = {
      // Ana Sayfalar
      "Ana Sayfa": { read: true, add: false, update: false, delete: false },
      "Sistem Kullanıcıları": {
        read: true,
        add: false,
        update: true,
        delete: false,
      },

      // Personel İşlemleri
      "Personel Listesi": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },
      "Puantaj İşlemleri": {
        read: true,
        add: false,
        update: false,
        delete: false,
      },
      "Nöbet Çizelgeleri": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },

      // Operasyon İşlemleri
      "Denetim Kayıtları": {
        read: true,
        add: false,
        update: false,
        delete: false,
      },
      "Proje Ziyaretleri": {
        read: true,
        add: false,
        update: false,
        delete: false,
      },

      // Devriye İşlemleri
      "Kontrol Noktaları": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },
      "Devriye Çizelgeleri": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },
      "Olay Kayıtları": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },

      // Form İşlemleri
      Formlar: { read: true, add: false, update: true, delete: false },
      "Form Şablonları": {
        read: true,
        add: true,
        update: true,
        delete: false,
      },
      "Puan Ayarları": {
        read: true,
        add: false,
        update: true,
        delete: false,
      },

      // Proje İşlemleri
      Projeler: { read: true, add: true, update: true, delete: false },

      // Raporlar ve Ayarlar
      Raporlar: { read: true, add: false, update: false, delete: false },
      Ayarlar: { read: false, add: false, update: false, delete: false },
    };

    // Always set permissions to ensure state is populated
    if (user.permissions && typeof user.permissions === "object") {
      console.log("✅ Setting user permissions:", user.permissions);
      console.log("🔍 DB permissions keys:", Object.keys(user.permissions));
      console.log("🔍 DB permissions values:", Object.values(user.permissions));

      // Map old keys to new keys
      const keyMapping: { [key: string]: string } = {
        projects: "Projeler",
        users: "Sistem Kullanıcıları",
        personnel: "Personel Listesi",
        payroll: "Puantaj İşlemleri",
        dutySchedules: "Nöbet Çizelgeleri",
        auditRecords: "Denetim Kayıtları",
        projectVisits: "Proje Ziyaretleri",
        checkpoints: "Kontrol Noktaları",
        patrols: "Devriye Çizelgeleri",
        incidents: "Olay Kayıtları",
        forms: "Formlar",
        formTemplates: "Form Şablonları",
        scoreSettings: "Puan Ayarları",
        reports: "Raporlar",
        settings: "Ayarlar",
        dashboard: "Ana Sayfa",
      };

      // Convert old permissions to new format
      const convertedPermissions: any = {};
      Object.entries(user.permissions).forEach(([oldKey, value]) => {
        const newKey = keyMapping[oldKey] || oldKey;
        convertedPermissions[newKey] = value;
      });

      console.log("🔄 Converted permissions:", convertedPermissions);

      // Merge with default permissions to ensure all modules exist
      const mergedPermissions = {
        ...defaultPermissions,
        ...convertedPermissions,
      };
      console.log("✅ Merged permissions:", mergedPermissions);
      console.log(
        "🔍 Merged permissions keys:",
        Object.keys(mergedPermissions)
      );
      console.log(
        "🔍 Merged permissions values:",
        Object.values(mergedPermissions)
      );

      setUserPermissions(mergedPermissions);
      console.log("✅ Loaded existing permissions");
    } else {
      console.log("⚠️ No permissions found, setting default permissions");
      console.log("✅ Default permissions:", defaultPermissions);
      setUserPermissions(defaultPermissions);
      console.log("✅ Set default permissions");
    }

    // Fetch user's projects and available projects
    await fetchUserProjects(user.id);
    await fetchAvailableProjects();

    setTabValue(0); // Reset to first tab
    setOpenDialog(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handlePermissionChange = (
    module: string,
    action: string,
    checked: boolean
  ) => {
    console.log(`🔧 Permission change: ${module}.${action} = ${checked}`);
    console.log(`🔧 Current userPermissions:`, userPermissions);
    console.log(
      `🔧 Current userPermissions keys:`,
      Object.keys(userPermissions)
    );

    setUserPermissions((prev) => {
      console.log(`🔧 Previous state:`, prev);
      console.log(
        `🔧 Module ${module} in prev:`,
        prev[module as keyof typeof prev]
      );

      const newPermissions = {
        ...prev,
        [module]: {
          ...prev[module as keyof typeof prev],
          [action]: checked,
        },
      };

      console.log("📝 New permissions:", newPermissions);
      console.log(
        `📝 Updated ${module}.${action}:`,
        newPermissions[module as keyof typeof newPermissions]
      );
      console.log(`📝 New permissions keys:`, Object.keys(newPermissions));

      return newPermissions;
    });
  };

  const handleProjectToggle = async (
    projectId: string,
    isAssigned: boolean
  ) => {
    if (!editingUser || !tenant) {
      console.error("❌ Missing editingUser or tenant:", {
        editingUser,
        tenant,
      });
      return;
    }

    console.log("🔄 handleProjectToggle called:", {
      projectId,
      isAssigned,
      editingUser: editingUser.id,
      tenant: tenant.id,
    });

    try {
      if (isAssigned) {
        // Remove project assignment
        console.log("🗑️ Removing project assignment...");
        const { error } = await supabase
          .from("project_users")
          .delete()
          .eq("user_id", editingUser.id)
          .eq("project_id", projectId)
          .eq("tenant_id", tenant.id);

        if (error) {
          console.error("❌ Error removing project assignment:", error);
          return;
        }

        console.log("✅ Project assignment removed successfully");
        setUserProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        // Add project assignment
        console.log("➕ Adding project assignment...");
        console.log("📋 Insert data:", {
          user_id: editingUser.id,
          project_id: projectId,
          tenant_id: tenant.id,
        });

        const insertData = {
          user_id: editingUser.id,
          project_id: projectId,
          tenant_id: tenant.id,
        };

        console.log("📋 Attempting to insert:", insertData);

        const { data: insertResult, error } = await supabase
          .from("project_users")
          .insert(insertData)
          .select();

        if (error) {
          console.error("❌ Error adding project assignment:", error);
          console.error("❌ Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          return;
        }

        console.log("✅ Insert result:", insertResult);

        console.log("✅ Project assignment added successfully");
        const project = availableProjects.find((p) => p.id === projectId);
        console.log("🔍 Found project:", project);
        if (project) {
          setUserProjects((prev) => {
            const newProjects = [...prev, project];
            console.log("📝 Updated userProjects:", newProjects);
            return newProjects;
          });
        } else {
          console.error(
            "❌ Project not found in availableProjects:",
            projectId
          );
        }
      }
    } catch (err) {
      console.error("❌ Error in handleProjectToggle:", err);
    }
  };

  // Save user permissions to database
  const saveUserPermissions = async (userId: string) => {
    if (!tenant) return;

    try {
      console.log("💾 Saving user permissions for user:", userId);
      console.log("🔐 Permissions to save:", userPermissions);

      // Convert new keys back to old keys for database storage
      const keyMapping: { [key: string]: string } = {
        Projeler: "projects",
        "Sistem Kullanıcıları": "users",
        "Personel Listesi": "personnel",
        "Puantaj İşlemleri": "payroll",
        "Nöbet Çizelgeleri": "dutySchedules",
        "Denetim Kayıtları": "auditRecords",
        "Proje Ziyaretleri": "projectVisits",
        "Kontrol Noktaları": "checkpoints",
        "Devriye Çizelgeleri": "patrols",
        "Olay Kayıtları": "incidents",
        Formlar: "forms",
        "Form Şablonları": "formTemplates",
        "Puan Ayarları": "scoreSettings",
        Raporlar: "reports",
        Ayarlar: "settings",
        "Ana Sayfa": "dashboard",
      };

      // Convert new permissions back to old format for database
      const dbPermissions: any = {};
      Object.entries(userPermissions).forEach(([newKey, value]) => {
        const oldKey = keyMapping[newKey] || newKey;
        dbPermissions[oldKey] = value;
      });

      console.log("🔄 Converting to DB format:", dbPermissions);

      const { error } = await supabase
        .from("users")
        .update({
          permissions: dbPermissions,
        })
        .eq("id", userId)
        .eq("tenant_id", tenant.id);

      if (error) {
        console.error("❌ Error saving user permissions:", error);
        return;
      }

      console.log("✅ User permissions saved successfully");
    } catch (err) {
      console.error("❌ Error in saveUserPermissions:", err);
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!tenant || !selectedProject) {
      setError("Tenant veya proje bilgisi bulunamadı");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // RLS policies now work directly with auth.uid()

      if (editingUser) {
        // Edit existing user - update in database
        const { error } = await supabase
          .from("users")
          .update({
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
            is_active: userData.is_active,
            phone: userData.phone,
          })
          .eq("id", editingUser.id)
          .eq("tenant_id", tenant.id);

        if (error) {
          console.error("Error updating user:", error);
          setError(
            "Kullanıcı güncellenirken bir hata oluştu: " + error.message
          );
          return;
        }

        // Update local state
        setUsers(
          users.map((user) =>
            user.id === editingUser.id ? { ...user, ...userData } : user
          )
        );

        // Save user permissions if editing
        if (editingUser) {
          console.log(
            "🔄 Saving permissions for editing user:",
            editingUser.id
          );
          console.log("🔐 Current userPermissions state:", userPermissions);
          await saveUserPermissions(editingUser.id);
        }
      } else {
        // Add new user - create in auth.users first, then in public.users
        console.log("🔍 Starting user creation process...");
        console.log("📧 Email:", userData.email);
        console.log("👤 Full name:", userData.full_name);
        console.log("🏢 Tenant ID:", tenant.id);
        console.log("📋 Project ID:", selectedProject.id);

        // For now, let's try a different approach - create user directly in public.users
        // This is a temporary solution until we fix admin permissions
        const newUserId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );

        console.log("🆔 Generated user ID:", newUserId);
        console.log(
          "⚠️ Note: This is a temporary solution. Admin permissions need to be fixed."
        );

        // Create user record in users table
        const fullName = userData.full_name || "İsimsiz Kullanıcı";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "İsimsiz";
        const lastName = nameParts.slice(1).join(" ") || "Kullanıcı";

        console.log("📝 Creating user record in public.users...");
        console.log("🆔 User ID:", newUserId);
        console.log("🏢 Tenant ID:", tenant.id);
        console.log("📧 Email:", userData.email);
        console.log("👤 Full name:", fullName);
        console.log("👤 First name:", firstName);
        console.log("👤 Last name:", lastName);

        const { data, error } = await supabase
          .from("users")
          .insert({
            id: newUserId,
            tenant_id: tenant.id,
            email: userData.email || "",
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: "admin", // Sistem kullanıcıları otomatik olarak admin olur
            phone: userData.phone || null,
            is_active: userData.is_active || true,
          })
          .select();

        console.log("📊 Users table insert result:", { data, error });

        if (error) {
          console.error("❌ Error creating user record:", error);
          setError(
            "Kullanıcı kaydı oluşturulurken bir hata oluştu: " + error.message
          );
          return;
        }

        console.log("✅ User record created successfully");

        // Add user to project_users table
        console.log("🔗 Adding user to project_users table...");
        console.log("👤 User ID:", newUserId);
        console.log("📋 Project ID:", selectedProject.id);
        console.log("🏢 Tenant ID:", tenant.id);

        const { error: projectUserError } = await supabase
          .from("project_users")
          .insert({
            user_id: newUserId,
            project_id: selectedProject.id,
            tenant_id: tenant.id,
          });

        console.log("📊 Project_users insert result:", { projectUserError });

        if (projectUserError) {
          console.error("❌ Error adding user to project:", projectUserError);
          setError(
            "Kullanıcı projeye eklenirken bir hata oluştu: " +
              projectUserError.message
          );
          return;
        }

        console.log("✅ User added to project successfully");

        // Refresh users list
        console.log("🔄 Refreshing users list...");
        await fetchUsers();
        console.log("✅ User creation process completed successfully!");
      }

      setOpenDialog(false);
      setEditingUser(null);
    } catch (err) {
      console.error("Error in handleSaveUser:", err);
      setError("Kullanıcı işlemi sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setNameFilter("");
    setStatusFilter("Tümü");
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  // Show loading state
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

  // Show error if no tenant
  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Tenant bilgisi bulunamadı. Lütfen doğru domain üzerinden giriş yapın.
        </Alert>
      </Box>
    );
  }

  // Show warning if no project selected
  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Lütfen sidebar'dan bir proje seçiniz. Proje seçilmeden kullanıcılar
          görüntülenemez.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight="bold">
            Sistem Kullanıcıları - {selectedProject?.name || "Proje Seçiniz"}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
              sx={{ bgcolor: "#1976d2" }}
            >
              YENİ KULLANICI
            </Button>
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Kullanıcı Limiti Gösterimi */}
        {userLimits && (
          <Alert
            severity={
              userLimits.max === -1
                ? "info"
                : userLimits.canAdd
                ? "success"
                : "warning"
            }
            sx={{ mb: 3 }}
          >
            <Box sx={{ textAlign: "center", width: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  mb: 1,
                }}
              >
                👥 Kullanıcı Limiti: {userLimits.current}/
                {userLimits.max === -1 ? "∞" : userLimits.max}
              </Typography>
              <Typography variant="body2">
                {userLimits.max === -1
                  ? "Sınırsız kullanıcı eklenebilir"
                  : userLimits.canAdd
                  ? `${userLimits.remaining} kullanıcı daha eklenebilir`
                  : "Paket limiti doldu!"}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Genel arama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ad Soyad Filtresi"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Durum</InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="Tümü">Tümü</MenuItem>
                  <MenuItem value="Aktif">Aktif</MenuItem>
                  <MenuItem value="Pasif">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1}>
                <Tooltip title="Filtreleri Temizle">
                  <IconButton onClick={clearFilters}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filtreler">
                  <IconButton>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Liste Görünümü">
                  <IconButton>
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Ad Soyad</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>E-posta</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Son Giriş</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={user.role === "admin" ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? "Aktif" : "Pasif"}
                        color={getStatusColor(user.is_active) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.75rem">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString(
                              "tr-TR"
                            )
                          : "Hiç giriş yapmamış"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit User Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {editingUser
              ? `Kullanıcı Düzenle - ${editingUser.full_name}`
              : "Yeni Kullanıcı Ekle"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Left Column - User Information */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Kullanıcı Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Ad"
                        placeholder="Ad"
                        value={dialogFormData.firstName}
                        onChange={(e) =>
                          setDialogFormData((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Soyad"
                        placeholder="Soyad"
                        value={dialogFormData.lastName}
                        onChange={(e) =>
                          setDialogFormData((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="E-posta"
                        type="email"
                        value={dialogFormData.email}
                        onChange={(e) =>
                          setDialogFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Telefon"
                        placeholder="Telefon"
                        value={dialogFormData.phone}
                        onChange={(e) =>
                          setDialogFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Durum</InputLabel>
                        <Select
                          value={dialogFormData.isActive ? "Aktif" : "Pasif"}
                          onChange={(e) =>
                            setDialogFormData((prev) => ({
                              ...prev,
                              isActive: e.target.value === "Aktif",
                            }))
                          }
                          label="Durum"
                        >
                          <MenuItem value="Aktif">Aktif</MenuItem>
                          <MenuItem value="Pasif">Pasif</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right Column - Permissions and Projects */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                      value={tabValue}
                      onChange={(e, newValue) => setTabValue(newValue)}
                    >
                      <Tab label="Yetkiler" />
                      <Tab label="Projeler" />
                    </Tabs>
                  </Box>

                  {/* Permissions Tab */}
                  <TabPanel value={tabValue} index={0}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                        Modül Yetkileri
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => {
                            console.log("🔘 Full Access button clicked");
                            const fullAccessPermissions = Object.keys(
                              userPermissions
                            ).reduce((acc, module) => {
                              acc[module] = {
                                read: true,
                                add:
                                  module !== "Ayarlar" &&
                                  module !== "Ana Sayfa",
                                update:
                                  module !== "Ayarlar" &&
                                  module !== "Ana Sayfa",
                                delete:
                                  module !== "Ayarlar" &&
                                  module !== "Ana Sayfa",
                              };
                              return acc;
                            }, {} as any);
                            setUserPermissions(fullAccessPermissions);
                            console.log(
                              "✅ Set full access permissions:",
                              fullAccessPermissions
                            );
                          }}
                          sx={{
                            bgcolor: "#2e7d32",
                            "&:hover": { bgcolor: "#1b5e20" },
                          }}
                        >
                          Tüm Yetkileri Ver
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CancelIcon />}
                          color="error"
                          onClick={() => {
                            console.log("🔘 Clear All button clicked");
                            const clearPermissions = Object.keys(
                              userPermissions
                            ).reduce((acc, module) => {
                              acc[module] = {
                                read: false,
                                add: false,
                                update: false,
                                delete: false,
                              };
                              return acc;
                            }, {} as any);
                            setUserPermissions(clearPermissions);
                            console.log(
                              "✅ Cleared all permissions:",
                              clearPermissions
                            );
                          }}
                        >
                          Tümünü Temizle
                        </Button>
                      </Stack>
                    </Box>

                    {/* Permission Categories - Ultra Compact Design */}
                    <Box sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  width: "25%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Kategori
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: 600,
                                  width: "20%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Modül
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  width: "12%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Oku
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  width: "12%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Ekle
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  width: "12%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Güncelle
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  width: "12%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Sil
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  width: "7%",
                                  fontSize: "0.75rem",
                                }}
                              >
                                İşlem
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(permissionCategories).map(
                              ([categoryName, category]) =>
                                category.modules.map((module, index) => {
                                  const permissions =
                                    userPermissions[
                                      module as keyof typeof userPermissions
                                    ];
                                  const isReadOnly =
                                    module === "Ayarlar" ||
                                    module === "Ana Sayfa";

                                  return (
                                    <TableRow
                                      key={`${categoryName}-${module}`}
                                      hover
                                    >
                                      {index === 0 && (
                                        <TableCell
                                          rowSpan={category.modules.length}
                                          sx={{
                                            fontWeight: 600,
                                            color: category.color,
                                            fontSize: "0.75rem",
                                            verticalAlign: "top",
                                            py: 1,
                                          }}
                                        >
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                          >
                                            <Box
                                              sx={{
                                                p: 0.3,
                                                borderRadius: "50%",
                                                bgcolor: category.color + "20",
                                                color: category.color,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.7rem",
                                              }}
                                            >
                                              {category.icon}
                                            </Box>
                                            {categoryName}
                                          </Box>
                                        </TableCell>
                                      )}
                                      <TableCell sx={{ fontSize: "0.75rem" }}>
                                        {module}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Switch
                                          checked={permissions.read}
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              module,
                                              "read",
                                              e.target.checked
                                            )
                                          }
                                          size="small"
                                          color="primary"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Switch
                                          checked={
                                            !isReadOnly &&
                                            (permissions as any).add
                                          }
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              module,
                                              "add",
                                              e.target.checked
                                            )
                                          }
                                          size="small"
                                          color="success"
                                          disabled={isReadOnly}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Switch
                                          checked={
                                            !isReadOnly &&
                                            (permissions as any).update
                                          }
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              module,
                                              "update",
                                              e.target.checked
                                            )
                                          }
                                          size="small"
                                          color="warning"
                                          disabled={isReadOnly}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Switch
                                          checked={
                                            !isReadOnly &&
                                            (permissions as any).delete
                                          }
                                          onChange={(e) =>
                                            handlePermissionChange(
                                              module,
                                              "delete",
                                              e.target.checked
                                            )
                                          }
                                          size="small"
                                          color="error"
                                          disabled={isReadOnly}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={() => {
                                            setUserPermissions((prev) => ({
                                              ...prev,
                                              [module]: {
                                                read: true,
                                                add: !isReadOnly,
                                                update: !isReadOnly,
                                                delete: !isReadOnly,
                                              },
                                            }));
                                          }}
                                          sx={{
                                            fontSize: "0.6rem",
                                            py: 0.2,
                                            px: 0.5,
                                            minWidth: "auto",
                                            borderColor: category.color,
                                            color: category.color,
                                            "&:hover": {
                                              borderColor: category.color,
                                              bgcolor: category.color + "10",
                                            },
                                          }}
                                        >
                                          Tümü
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </TabPanel>

                  {/* Projects Tab */}
                  <TabPanel value={tabValue} index={1}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">Proje Yetkileri</Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setOpenProjectDialog(true);
                        }}
                        size="small"
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#1565c0" },
                        }}
                      >
                        PROJE EKLE
                      </Button>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Kullanıcının ekli olduğu projeleri tabloda görebilirsiniz
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Proje</TableCell>
                            <TableCell align="center">İşlemler</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userProjects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>{project.name}</TableCell>
                              <TableCell align="center">
                                <Tooltip title="Projeyi Kaldır">
                                  <IconButton
                                    onClick={() =>
                                      handleProjectToggle(project.id, true)
                                    }
                                    color="error"
                                    size="small"
                                  >
                                    <LinkOffIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                          {userProjects.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={2} align="center">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Kullanıcının atanmış projesi bulunmuyor
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button
              variant="contained"
              onClick={() => {
                const formData = {
                  email: dialogFormData.email,
                  phone: dialogFormData.phone,
                  is_active: dialogFormData.isActive,
                };
                handleSaveUser({
                  ...formData,
                  full_name:
                    `${dialogFormData.firstName} ${dialogFormData.lastName}`.trim() ||
                    "İsimsiz Kullanıcı",
                });
              }}
            >
              {editingUser ? "Güncelle" : "Ekle"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Project Dialog */}
        <Dialog
          open={openProjectDialog}
          onClose={() => setOpenProjectDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Proje Ekle</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Kullanıcıya eklemek istediğiniz projeyi seçin
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Proje Adı</TableCell>
                    <TableCell align="center">İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableProjects
                    .filter(
                      (project) =>
                        !userProjects.some((up) => up.id === project.id)
                    )
                    .map((project) => {
                      const isAlreadyAdded = userProjects.some(
                        (up) => up.id === project.id
                      );
                      return (
                        <TableRow key={project.id}>
                          <TableCell>{project.name}</TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={async () => {
                                console.log(
                                  "🔘 Ekle button clicked for project:",
                                  project
                                );
                                await handleProjectToggle(project.id, false);
                                // Dialog'u kapatma, birden fazla proje seçilebilsin
                              }}
                              disabled={isAlreadyAdded}
                              sx={{
                                bgcolor: isAlreadyAdded ? "#9e9e9e" : "#1976d2",
                                "&:hover": {
                                  bgcolor: isAlreadyAdded
                                    ? "#9e9e9e"
                                    : "#1565c0",
                                },
                              }}
                            >
                              {isAlreadyAdded ? "Eklendi" : "Ekle"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            {availableProjects.filter(
              (project) => !userProjects.some((up) => up.id === project.id)
            ).length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: "center" }}
              >
                Eklenebilecek proje bulunmuyor
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProjectDialog(false)}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Users;
