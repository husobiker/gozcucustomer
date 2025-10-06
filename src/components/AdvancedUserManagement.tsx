import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  tenant_id: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  admin_profile?: {
    admin_level: string;
    permissions: string[];
  };
  user_metadata?: {
    phone?: string;
    department?: string;
    position?: string;
    avatar_url?: string;
  };
}

interface Role {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  color: string;
}

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
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedUserManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Form states
  const [userForm, setUserForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "user",
    is_active: true,
    tenant_id: "",
    phone: "",
    department: "",
    position: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [roleForm, setRoleForm] = useState({
    role: "user",
    admin_level: "basic",
    permissions: [] as string[],
  });

  const roles: Role[] = [
    {
      name: "super_admin",
      displayName: "Süper Admin",
      description: "Tüm sistem yetkilerine sahip",
      permissions: ["all"],
      color: "#f44336",
    },
    {
      name: "admin",
      displayName: "Admin",
      description: "Tenant yönetim yetkilerine sahip",
      permissions: [
        "tenant_management",
        "user_management",
        "billing",
        "reports",
      ],
      color: "#ff9800",
    },
    {
      name: "manager",
      displayName: "Yönetici",
      description: "Sınırlı yönetim yetkilerine sahip",
      permissions: ["user_management", "reports"],
      color: "#2196f3",
    },
    {
      name: "user",
      displayName: "Kullanıcı",
      description: "Temel kullanıcı yetkileri",
      permissions: ["basic_access"],
      color: "#4caf50",
    },
  ];

  const permissions = [
    { key: "all", label: "Tüm Yetkiler" },
    { key: "tenant_management", label: "Tenant Yönetimi" },
    { key: "user_management", label: "Kullanıcı Yönetimi" },
    { key: "billing", label: "Faturalandırma" },
    { key: "reports", label: "Raporlar" },
    { key: "system_monitoring", label: "Sistem İzleme" },
    { key: "basic_access", label: "Temel Erişim" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadTenants()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        admin_profile:admin_profiles(admin_level, permissions)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
    } else {
      setUsers(data || []);
    }
  };

  const loadTenants = async () => {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, subdomain")
      .order("name");

    if (error) {
      console.error("Error loading tenants:", error);
    } else {
      setTenants(data || []);
    }
  };

  const getRoleColor = (role: string) => {
    const roleObj = roles.find((r) => r.name === role);
    return roleObj?.color || "#666";
  };

  const getRoleDisplayName = (role: string) => {
    const roleObj = roles.find((r) => r.name === role);
    return roleObj?.displayName || role;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "error";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircleIcon color="success" />
    ) : (
      <CancelIcon color="error" />
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesTenant =
      selectedTenant === "all" || user.tenant_id === selectedTenant;
    const matchesSearch =
      searchTerm === "" ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesTenant && matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    // Validate required fields
    if (
      !userForm.first_name ||
      !userForm.last_name ||
      !userForm.email ||
      !userForm.password
    ) {
      alert("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userForm.email)
        .single();

      if (existingUser) {
        alert("Bu email adresi zaten kullanılıyor!");
        return;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: userForm.email,
          password: userForm.password,
          email_confirm: true,
          user_metadata: {
            full_name: `${userForm.first_name} ${userForm.last_name}`,
            role: userForm.role,
          },
        });

      if (authError) {
        console.error("Error creating auth user:", authError);
        alert("Kullanıcı oluşturulurken hata oluştu: " + authError.message);
        return;
      }

      // Create user profile
      const { error: userError } = await supabaseAdmin.from("users").insert({
        id: authData.user.id,
        tenant_id: userForm.tenant_id,
        email: userForm.email,
        full_name: `${userForm.first_name} ${userForm.last_name}`,
        role: userForm.role,
        is_active: userForm.is_active,
        user_metadata: {
          phone: userForm.phone,
          department: userForm.department,
          position: userForm.position,
        },
      });

      if (userError) {
        console.error("Error creating user profile:", userError);
        alert(
          "Kullanıcı profili oluşturulurken hata oluştu: " + userError.message
        );
        return;
      }

      // Create admin profile if role is admin
      if (userForm.role === "admin") {
        const { error: adminError } = await supabaseAdmin
          .from("admin_profiles")
          .insert({
            id: authData.user.id,
            tenant_id: userForm.tenant_id,
            admin_level: "basic",
            permissions:
              roles.find((r) => r.name === userForm.role)?.permissions || [],
          });

        if (adminError) {
          console.error("Error creating admin profile:", adminError);
        }
      }

      await loadUsers();
      setOpenUserDialog(false);
      setUserForm({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "user",
        is_active: true,
        tenant_id: "",
        phone: "",
        department: "",
        position: "",
      });
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("id", userId);

      if (error) {
        console.error("Error updating user:", error);
        alert("Kullanıcı güncellenirken hata oluştu: " + error.message);
      } else {
        await loadUsers();
      }
    } catch (error) {
      console.error("Error in handleUpdateUser:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("Şifreler eşleşmiyor!");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert("Şifre en az 6 karakter olmalı!");
      return;
    }

    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        selectedUser.id,
        {
          password: passwordForm.new_password,
        }
      );

      if (error) {
        console.error("Error resetting password:", error);
        alert("Şifre sıfırlanırken hata oluştu: " + error.message);
      } else {
        alert("Şifre başarıyla sıfırlandı!");
        setOpenPasswordDialog(false);
        setPasswordForm({ new_password: "", confirm_password: "" });
      }
    } catch (error) {
      console.error("Error in handleResetPassword:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        selectedUser.id
      );

      if (authError) {
        console.error("Error deleting auth user:", authError);
        alert("Kullanıcı silinirken hata oluştu: " + authError.message);
        return;
      }

      // Delete from users table (cascade will handle related records)
      const { error: userError } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", selectedUser.id);

      if (userError) {
        console.error("Error deleting user profile:", userError);
        alert("Kullanıcı profili silinirken hata oluştu: " + userError.message);
        return;
      }

      await loadUsers();
      setOpenDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error in handleDeleteUser:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    await handleUpdateUser(userId, { is_active: !isActive });
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      // Update user role
      const { error: userError } = await supabaseAdmin
        .from("users")
        .update({ role: roleForm.role })
        .eq("id", selectedUser.id);

      if (userError) {
        console.error("Error updating user role:", userError);
        alert(
          "Kullanıcı rolü güncellenirken hata oluştu: " + userError.message
        );
        return;
      }

      // Update admin profile if role is admin
      if (roleForm.role === "admin") {
        const { error: adminError } = await supabaseAdmin
          .from("admin_profiles")
          .upsert({
            id: selectedUser.id,
            tenant_id: selectedUser.tenant_id,
            admin_level: roleForm.admin_level,
            permissions: roleForm.permissions,
          });

        if (adminError) {
          console.error("Error updating admin profile:", adminError);
        }
      } else {
        // Remove admin profile if role is not admin
        await supabaseAdmin
          .from("admin_profiles")
          .delete()
          .eq("id", selectedUser.id);
      }

      await loadUsers();
      setOpenRoleDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error in handleUpdateRole:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Kullanıcı verileri yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gelişmiş Kullanıcı Yönetimi
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#4caf50",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{users.length}</Typography>
                  <Typography color="textSecondary">
                    Toplam Kullanıcı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#2196f3",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {users.filter((u) => u.is_active).length}
                  </Typography>
                  <Typography color="textSecondary">Aktif Kullanıcı</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#ff9800",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <AdminIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {users.filter((u) => u.role === "admin").length}
                  </Typography>
                  <Typography color="textSecondary">Admin Kullanıcı</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "#f44336",
                    color: "white",
                    mr: 2,
                  }}
                >
                  <CancelIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    {users.filter((u) => !u.is_active).length}
                  </Typography>
                  <Typography color="textSecondary">Pasif Kullanıcı</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Kullanıcı Listesi" />
            <Tab label="Rol Yönetimi" />
            <Tab label="Yetki Matrisi" />
          </Tabs>
        </Box>

        {/* User List Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {/* Filters */}
            <Box
              sx={{
                mb: 3,
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                label="Ara"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tenant</InputLabel>
                <Select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  label="Tenant"
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  {tenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Rol"
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.name} value={role.name}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenUserDialog(true)}
                sx={{ bgcolor: "#1976d2" }}
              >
                Yeni Kullanıcı
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
              >
                Yenile
              </Button>
            </Box>

            {/* Users Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kullanıcı</TableCell>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Durum</TableCell>
                    <TableCell>Son Giriş</TableCell>
                    <TableCell>Oluşturulma</TableCell>
                    <TableCell>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar
                            src={user.user_metadata?.avatar_url}
                            sx={{ mr: 2, bgcolor: getRoleColor(user.role) }}
                          >
                            {user.full_name?.charAt(0) || user.email.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.full_name || "İsimsiz"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {user.email}
                            </Typography>
                            {user.user_metadata?.department && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {user.user_metadata.department}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.tenant?.name || "Bilinmeyen"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.tenant?.subdomain || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(user.role)}
                          size="small"
                          sx={{
                            bgcolor: getRoleColor(user.role),
                            color: "white",
                            fontWeight: "bold",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(user.is_active)}
                          label={user.is_active ? "Aktif" : "Pasif"}
                          color={getStatusColor(user.is_active) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.last_login ? (
                          <Typography variant="body2">
                            {format(
                              parseISO(user.last_login),
                              "dd/MM/yyyy HH:mm",
                              { locale: tr }
                            )}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Hiç giriş yapmamış
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(parseISO(user.created_at), "dd/MM/yyyy", {
                            locale: tr,
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Detaylar">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedUser(user)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Şifre Sıfırla">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenPasswordDialog(true);
                              }}
                            >
                              <LockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rol Değiştir">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleForm({
                                  role: user.role,
                                  admin_level:
                                    user.admin_profile?.admin_level || "basic",
                                  permissions:
                                    user.admin_profile?.permissions || [],
                                });
                                setOpenRoleDialog(true);
                              }}
                            >
                              <SecurityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Durum Değiştir">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleToggleUserStatus(user.id, user.is_active)
                              }
                            >
                              {user.is_active ? (
                                <LockOpenIcon fontSize="small" />
                              ) : (
                                <LockIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Daha Fazla">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, user)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Role Management Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rol Tanımları
            </Typography>
            <Grid container spacing={3}>
              {roles.map((role) => (
                <Grid item xs={12} md={6} lg={4} key={role.name}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: role.color,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mr: 2,
                          }}
                        >
                          <AdminIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6">
                            {role.displayName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {role.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {role.description}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        Yetkiler:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {role.permissions.map((permission) => (
                          <Chip
                            key={permission}
                            label={
                              permissions.find((p) => p.key === permission)
                                ?.label || permission
                            }
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Permission Matrix Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Yetki Matrisi
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Yetki</TableCell>
                    {roles.map((role) => (
                      <TableCell key={role.name} align="center">
                        {role.displayName}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.key}>
                      <TableCell>{permission.label}</TableCell>
                      {roles.map((role) => (
                        <TableCell key={role.name} align="center">
                          {role.permissions.includes(permission.key) ||
                          role.permissions.includes("all") ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <CancelIcon color="disabled" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
      </Paper>

      {/* Create User Dialog */}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Ad"
                  fullWidth
                  value={userForm.first_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, first_name: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Soyad"
                  fullWidth
                  value={userForm.last_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, last_name: e.target.value })
                  }
                  required
                />
              </Grid>
            </Grid>
            <TextField
              label="Şifre"
              fullWidth
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              helperText="En az 6 karakter olmalı"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={userForm.tenant_id}
                onChange={(e) =>
                  setUserForm({ ...userForm, tenant_id: e.target.value })
                }
                label="Tenant"
                required
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.subdomain})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value })
                }
                label="Rol"
              >
                {roles.map((role) => (
                  <MenuItem key={role.name} value={role.name}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Telefon"
              fullWidth
              value={userForm.phone}
              onChange={(e) =>
                setUserForm({ ...userForm, phone: e.target.value })
              }
            />
            <TextField
              label="Departman"
              fullWidth
              value={userForm.department}
              onChange={(e) =>
                setUserForm({ ...userForm, department: e.target.value })
              }
            />
            <TextField
              label="Pozisyon"
              fullWidth
              value={userForm.position}
              onChange={(e) =>
                setUserForm({ ...userForm, position: e.target.value })
              }
            />
            <Box display="flex" alignItems="center">
              <Switch
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm({ ...userForm, is_active: e.target.checked })
                }
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Aktif Kullanıcı
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={
              !userForm.email ||
              !userForm.first_name ||
              !userForm.last_name ||
              !userForm.password ||
              !userForm.tenant_id
            }
            sx={{ bgcolor: "#1976d2" }}
          >
            Kullanıcı Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Şifre Sıfırla - {selectedUser?.full_name || selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Yeni Şifre"
              fullWidth
              type="password"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  new_password: e.target.value,
                })
              }
              required
            />
            <TextField
              label="Şifre Tekrar"
              fullWidth
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirm_password: e.target.value,
                })
              }
              required
            />
            <Alert severity="warning">
              Bu işlem kullanıcının mevcut şifresini değiştirecektir.
              Kullanıcıya yeni şifreyi güvenli bir şekilde iletin.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={
              !passwordForm.new_password || !passwordForm.confirm_password
            }
            sx={{ bgcolor: "#1976d2" }}
          >
            Şifre Sıfırla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Update Dialog */}
      <Dialog
        open={openRoleDialog}
        onClose={() => setOpenRoleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Rol Güncelle - {selectedUser?.full_name || selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={roleForm.role}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, role: e.target.value })
                }
                label="Rol"
              >
                {roles.map((role) => (
                  <MenuItem key={role.name} value={role.name}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {roleForm.role === "admin" && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Admin Seviyesi</InputLabel>
                  <Select
                    value={roleForm.admin_level}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, admin_level: e.target.value })
                    }
                    label="Admin Seviyesi"
                  >
                    <MenuItem value="basic">Temel</MenuItem>
                    <MenuItem value="advanced">Gelişmiş</MenuItem>
                    <MenuItem value="super">Süper</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Yetkiler:
                  </Typography>
                  {permissions.map((permission) => (
                    <Box
                      key={permission.key}
                      display="flex"
                      alignItems="center"
                      mb={1}
                    >
                      <Switch
                        checked={roleForm.permissions.includes(permission.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissions: [
                                ...roleForm.permissions,
                                permission.key,
                              ],
                            });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissions: roleForm.permissions.filter(
                                (p) => p !== permission.key
                              ),
                            });
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {permission.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUpdateRole}
            sx={{ bgcolor: "#1976d2" }}
          >
            Rol Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Kullanıcıyı Sil - {selectedUser?.full_name || selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dikkat!
            </Typography>
            <Typography>
              Bu işlem kullanıcıyı kalıcı olarak silecektir. Bu işlem geri
              alınamaz! Kullanıcının tüm verileri, geçmişi ve ilişkili kayıtları
              silinecektir.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>İptal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>
            Kullanıcıyı Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setSelectedUser(selectedUser);
            setOpenPasswordDialog(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Şifre Sıfırla</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedUser(selectedUser);
            setRoleForm({
              role: selectedUser?.role || "user",
              admin_level: selectedUser?.admin_profile?.admin_level || "basic",
              permissions: selectedUser?.admin_profile?.permissions || [],
            });
            setOpenRoleDialog(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rol Değiştir</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedUser) {
              handleToggleUserStatus(selectedUser.id, selectedUser.is_active);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            {selectedUser?.is_active ? (
              <LockOpenIcon fontSize="small" />
            ) : (
              <LockIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.is_active
              ? "Kullanıcıyı Pasifleştir"
              : "Kullanıcıyı Aktifleştir"}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setSelectedUser(selectedUser);
            setOpenDeleteDialog(true);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Kullanıcıyı Sil</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdvancedUserManagement;
