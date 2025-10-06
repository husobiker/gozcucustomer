import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Call as CallIcon,
} from "@mui/icons-material";
import { useProject } from "../contexts/ProjectContext";

interface Authority {
  id: string;
  projectId: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  department: string;
  isPrimary: boolean;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const Authorities: React.FC = () => {
  const { selectedProject } = useProject();
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<Authority | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(
    null
  );

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    const mockAuthorities: Authority[] = [
      {
        id: "1",
        projectId: selectedProject?.id || "",
        name: "Ahmet Yılmaz",
        title: "Güvenlik Müdürü",
        company: "ABC Şirketi A.Ş.",
        email: "ahmet.yilmaz@abc.com",
        phone: "0212 555 0101",
        mobile: "0532 555 0101",
        department: "Güvenlik",
        isPrimary: true,
        isActive: true,
        notes: "Ana yetkili kişi",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        projectId: selectedProject?.id || "",
        name: "Fatma Demir",
        title: "İnsan Kaynakları Müdürü",
        company: "ABC Şirketi A.Ş.",
        email: "fatma.demir@abc.com",
        phone: "0212 555 0102",
        mobile: "0532 555 0102",
        department: "İnsan Kaynakları",
        isPrimary: false,
        isActive: true,
        notes: "Personel işlemleri için yetkili",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "3",
        projectId: selectedProject?.id || "",
        name: "Mehmet Kaya",
        title: "Mali İşler Müdürü",
        company: "ABC Şirketi A.Ş.",
        email: "mehmet.kaya@abc.com",
        phone: "0212 555 0103",
        mobile: "0532 555 0103",
        department: "Mali İşler",
        isPrimary: false,
        isActive: false,
        notes: "Mali işlemler için yetkili",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    setTimeout(() => {
      setAuthorities(mockAuthorities);
      setLoading(false);
    }, 1000);
  }, [selectedProject]);

  const handleOpenDialog = (authority?: Authority) => {
    setEditingAuthority(authority || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAuthority(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    authority: Authority
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAuthority(authority);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAuthority(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Yetkililer
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Projenizin yetkililerini yönetin, iletişimi güçlendirin
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Yeni Yetkili
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Toplam Yetkili
                  </Typography>
                  <Typography variant="h4">{authorities.length}</Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Aktif Yetkili
                  </Typography>
                  <Typography variant="h4">
                    {authorities.filter((a) => a.isActive).length}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Ana Yetkili
                  </Typography>
                  <Typography variant="h4">
                    {authorities.filter((a) => a.isPrimary).length}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: "warning.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Departman Sayısı
                  </Typography>
                  <Typography variant="h4">
                    {new Set(authorities.map((a) => a.department)).size}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: "info.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Authorities Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Yetkili</TableCell>
                  <TableCell>Ünvan</TableCell>
                  <TableCell>Şirket</TableCell>
                  <TableCell>Departman</TableCell>
                  <TableCell>İletişim</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {authorities.map((authority) => (
                  <TableRow key={authority.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {getInitials(authority.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {authority.name}
                          </Typography>
                          {authority.isPrimary && (
                            <Chip
                              label="Ana Yetkili"
                              color="warning"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{authority.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {authority.company}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {authority.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="caption">
                            {authority.email}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="caption">
                            {authority.mobile}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={authority.isActive ? "Aktif" : "Pasif"}
                        color={authority.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, authority)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Görüntüle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <MessageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mesaj Gönder</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <CallIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Telefon Et</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Authority Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAuthority ? "Yetkili Düzenle" : "Yeni Yetkili"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                defaultValue={editingAuthority?.name || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ünvan"
                defaultValue={editingAuthority?.title || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şirket"
                defaultValue={editingAuthority?.company || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Departman"
                defaultValue={editingAuthority?.department || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                defaultValue={editingAuthority?.email || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                defaultValue={editingAuthority?.phone || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cep Telefonu"
                defaultValue={editingAuthority?.mobile || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      defaultChecked={editingAuthority?.isPrimary || false}
                    />
                  }
                  label="Ana Yetkili"
                />
                <FormControlLabel
                  control={
                    <Switch
                      defaultChecked={editingAuthority?.isActive || true}
                    />
                  }
                  label="Aktif"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                defaultValue={editingAuthority?.notes || ""}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {editingAuthority ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Authorities;
