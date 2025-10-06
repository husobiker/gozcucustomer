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
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useProject } from "../contexts/ProjectContext";

interface Asset {
  id: string;
  projectId: string;
  assetCode: string;
  assetName: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  status: "active" | "maintenance" | "retired" | "lost";
  purchaseDate: string;
  purchasePrice: number;
  currency: string;
  supplier: string;
  warrantyEndDate: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const Assets: React.FC = () => {
  const { selectedProject } = useProject();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    const mockAssets: Asset[] = [
      {
        id: "1",
        projectId: selectedProject?.id || "",
        assetCode: "DEM-001",
        assetName: "Güvenlik Kamerası",
        category: "Elektronik",
        brand: "Hikvision",
        model: "DS-2CD2143G0-I",
        serialNumber: "HK123456789",
        location: "Ana Giriş",
        status: "active",
        purchaseDate: "2024-01-15",
        purchasePrice: 2500,
        currency: "TRY",
        supplier: "Teknoloji A.Ş.",
        warrantyEndDate: "2025-01-15",
        assignedTo: "Güvenlik Ekibi",
        notes: "4K çözünürlük, gece görüş özellikli",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      },
      {
        id: "2",
        projectId: selectedProject?.id || "",
        assetCode: "DEM-002",
        assetName: "Metal Dedektörü",
        category: "Güvenlik Ekipmanı",
        brand: "Garrett",
        model: "ACE 300",
        serialNumber: "GT987654321",
        location: "Güvenlik Noktası 1",
        status: "active",
        purchaseDate: "2024-02-01",
        purchasePrice: 1800,
        currency: "TRY",
        supplier: "Güvenlik Sistemleri Ltd.",
        warrantyEndDate: "2025-02-01",
        assignedTo: "Güvenlik Ekibi",
        notes: "Hassas metal tespit cihazı",
        createdAt: "2024-02-01T00:00:00Z",
        updatedAt: "2024-02-01T00:00:00Z",
      },
      {
        id: "3",
        projectId: selectedProject?.id || "",
        assetCode: "DEM-003",
        assetName: "Bilgisayar",
        category: "Bilgisayar",
        brand: "Dell",
        model: "OptiPlex 7090",
        serialNumber: "DL456789123",
        location: "Güvenlik Ofisi",
        status: "maintenance",
        purchaseDate: "2023-12-01",
        purchasePrice: 8500,
        currency: "TRY",
        supplier: "Bilgisayar Dünyası",
        warrantyEndDate: "2024-12-01",
        assignedTo: "Sistem Yöneticisi",
        notes: "Bakımda - hard disk değişimi",
        createdAt: "2023-12-01T00:00:00Z",
        updatedAt: "2024-01-20T00:00:00Z",
      },
    ];

    setTimeout(() => {
      setAssets(mockAssets);
      setLoading(false);
    }, 1000);
  }, [selectedProject]);

  const handleOpenDialog = (asset?: Asset) => {
    setEditingAsset(asset || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAsset(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    asset: Asset
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAsset(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "maintenance":
        return "warning";
      case "retired":
        return "error";
      case "lost":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "maintenance":
        return "Bakımda";
      case "retired":
        return "Emekli";
      case "lost":
        return "Kayıp";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const categories = [
    "Elektronik",
    "Güvenlik Ekipmanı",
    "Bilgisayar",
    "Mobilya",
    "Araç",
    "Diğer",
  ];
  const locations = [
    "Ana Giriş",
    "Güvenlik Noktası 1",
    "Güvenlik Noktası 2",
    "Güvenlik Ofisi",
    "Depo",
    "Diğer",
  ];

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
            Demirbaşlar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Demirbaşlarınızın takibini kolaylaştırın
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Yeni Demirbaş
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
                    Toplam Demirbaş
                  </Typography>
                  <Typography variant="h4">{assets.length}</Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: "primary.main" }} />
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
                    Aktif Demirbaş
                  </Typography>
                  <Typography variant="h4">
                    {assets.filter((a) => a.status === "active").length}
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, color: "success.main" }} />
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
                    Bakımda
                  </Typography>
                  <Typography variant="h4">
                    {assets.filter((a) => a.status === "maintenance").length}
                  </Typography>
                </Box>
                <LocationIcon sx={{ fontSize: 40, color: "warning.main" }} />
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
                    Toplam Değer
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(
                      assets.reduce((sum, a) => sum + a.purchasePrice, 0),
                      "TRY"
                    ).replace("₺", "")}
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: "info.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assets Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Demirbaş Kodu</TableCell>
                  <TableCell>Demirbaş Adı</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Marka/Model</TableCell>
                  <TableCell>Seri No</TableCell>
                  <TableCell>Konum</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Değer</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {asset.assetCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{asset.assetName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.category}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {asset.brand} {asset.model}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {asset.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {asset.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(asset.status)}
                        color={getStatusColor(asset.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(asset.purchasePrice, asset.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, asset)}
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
            <QrCodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>QR Kod Oluştur</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Etiket Yazdır</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Atama Yap</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Asset Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAsset ? "Demirbaş Düzenle" : "Yeni Demirbaş"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Demirbaş Kodu"
                defaultValue={editingAsset?.assetCode || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Demirbaş Adı"
                defaultValue={editingAsset?.assetName || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={categories}
                defaultValue={editingAsset?.category || ""}
                renderInput={(params) => (
                  <TextField {...params} label="Kategori" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marka"
                defaultValue={editingAsset?.brand || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                defaultValue={editingAsset?.model || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seri Numarası"
                defaultValue={editingAsset?.serialNumber || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={locations}
                defaultValue={editingAsset?.location || ""}
                renderInput={(params) => (
                  <TextField {...params} label="Konum" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  defaultValue={editingAsset?.status || "active"}
                  label="Durum"
                >
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="maintenance">Bakımda</MenuItem>
                  <MenuItem value="retired">Emekli</MenuItem>
                  <MenuItem value="lost">Kayıp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alım Tarihi"
                type="date"
                defaultValue={editingAsset?.purchaseDate || ""}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alım Fiyatı"
                type="number"
                defaultValue={editingAsset?.purchasePrice || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tedarikçi"
                defaultValue={editingAsset?.supplier || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Garanti Bitiş Tarihi"
                type="date"
                defaultValue={editingAsset?.warrantyEndDate || ""}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Atanan Kişi/Birim"
                defaultValue={editingAsset?.assignedTo || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                multiline
                rows={3}
                defaultValue={editingAsset?.notes || ""}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {editingAsset ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;
