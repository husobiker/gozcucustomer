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
  Alert,
  CircularProgress,
  Tooltip,
  Fab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useProject } from "../contexts/ProjectContext";

interface Contract {
  id: string;
  projectId: string;
  contractNumber: string;
  contractName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  status: "active" | "expired" | "terminated" | "pending";
  description: string;
  createdAt: string;
  updatedAt: string;
}

const Contracts: React.FC = () => {
  const { selectedProject } = useProject();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    const mockContracts: Contract[] = [
      {
        id: "1",
        projectId: selectedProject?.id || "",
        contractNumber: "K-2024-001",
        contractName: "Güvenlik Hizmetleri Sözleşmesi",
        clientName: "ABC Şirketi A.Ş.",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        amount: 500000,
        currency: "TRY",
        status: "active",
        description: "24 saat güvenlik hizmetleri sözleşmesi",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        projectId: selectedProject?.id || "",
        contractNumber: "K-2024-002",
        contractName: "Geçici Güvenlik Hizmetleri",
        clientName: "XYZ Holding",
        startDate: "2024-06-01",
        endDate: "2024-08-31",
        amount: 150000,
        currency: "TRY",
        status: "expired",
        description: "3 aylık geçici güvenlik hizmetleri",
        createdAt: "2024-06-01T00:00:00Z",
        updatedAt: "2024-06-01T00:00:00Z",
      },
    ];

    setTimeout(() => {
      setContracts(mockContracts);
      setLoading(false);
    }, 1000);
  }, [selectedProject]);

  const handleOpenDialog = (contract?: Contract) => {
    setEditingContract(contract || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    contract: Contract
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedContract(contract);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContract(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "expired":
        return "error";
      case "terminated":
        return "warning";
      case "pending":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "expired":
        return "Süresi Dolmuş";
      case "terminated":
        return "Feshedilmiş";
      case "pending":
        return "Beklemede";
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
            Sözleşmeler
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Proje sözleşmelerinizi yönetin, takip edin ve hatırlatmalarla
            yönetin
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Yeni Sözleşme
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
                    Toplam Sözleşme
                  </Typography>
                  <Typography variant="h4">{contracts.length}</Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: "primary.main" }} />
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
                    Aktif Sözleşme
                  </Typography>
                  <Typography variant="h4">
                    {contracts.filter((c) => c.status === "active").length}
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 40, color: "success.main" }} />
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
                      contracts.reduce((sum, c) => sum + c.amount, 0),
                      "TRY"
                    ).replace("₺", "")}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: "warning.main" }} />
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
                    Süresi Dolan
                  </Typography>
                  <Typography variant="h4">
                    {contracts.filter((c) => c.status === "expired").length}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: "error.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contracts Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sözleşme No</TableCell>
                  <TableCell>Sözleşme Adı</TableCell>
                  <TableCell>Müşteri</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {contract.contractNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {contract.contractName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {contract.clientName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(contract.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(contract.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(contract.amount, contract.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(contract.status)}
                        color={getStatusColor(contract.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, contract)}
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
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>İndir</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Paylaş</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Contract Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContract ? "Sözleşme Düzenle" : "Yeni Sözleşme"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sözleşme Numarası"
                defaultValue={editingContract?.contractNumber || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sözleşme Adı"
                defaultValue={editingContract?.contractName || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Müşteri Adı"
                defaultValue={editingContract?.clientName || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Başlangıç Tarihi"
                type="date"
                defaultValue={editingContract?.startDate || ""}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bitiş Tarihi"
                type="date"
                defaultValue={editingContract?.endDate || ""}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tutar"
                type="number"
                defaultValue={editingContract?.amount || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                defaultValue={editingContract?.description || ""}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {editingContract ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contracts;
