import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  Alert,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  warehouseTransferService,
  WarehouseTransfer,
} from "../services/inventoryService";

interface TransferWithDetails extends WarehouseTransfer {
  source_warehouse: { id: string; name: string; code?: string | null };
  destination_warehouse: { id: string; name: string; code?: string | null };
  transfer_items: any[];
}

const WarehouseTransfersList: React.FC = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const transfersData = await warehouseTransferService.getAllTransfers();
      setTransfers(transfersData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading transfers:", err);
      setError("Transferler yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleCreateTransfer = () => {
    navigate("/accounting/stock/transfers/new");
  };

  const handleEditTransfer = (transferId: string) => {
    navigate(`/accounting/stock/transfers/edit/${transferId}`);
  };

  const handleDeleteTransfer = async (transferId: string) => {
    try {
      await warehouseTransferService.deleteTransfer(transferId);
      setTransfers((prev) =>
        prev.filter((transfer) => transfer.id !== transferId)
      );
      setSuccessMessage("Transfer silindi");
    } catch (err) {
      console.error("Error deleting transfer:", err);
      setError("Transfer silinirken hata oluştu");
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.movement_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.source_warehouse.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transfer.destination_warehouse.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (transfer.delivering_person &&
        transfer.delivering_person
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (transfer.receiving_person &&
        transfer.receiving_person
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || transfer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Depolar Arası Transfer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Depolar arası ürün transferlerini yönetin
        </Typography>
      </Box>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Filter Button */}
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterMenuOpen}
            sx={{ minWidth: 120 }}
          >
            FİLTRELE
          </Button>

          {/* Search */}
          <TextField
            placeholder="Ara..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />

          {/* Create Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateTransfer}
            sx={{ minWidth: 200 }}
          >
            YENİ TRANSFER FİŞİ OLUŞTUR
          </Button>
        </Stack>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Durum</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Durum"
            >
              <MenuItem value="all">Tüm Durumlar</MenuItem>
              <MenuItem value="pending">Beklemede</MenuItem>
              <MenuItem value="completed">Tamamlandı</MenuItem>
              <MenuItem value="cancelled">İptal Edildi</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Transfers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  HAREKET İSMİ
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  ÇIKIŞ DEPOSU
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  GİRİŞ DEPOSU
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "primary.main" }}>
                  DÜZENLEME TARİHİ
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  İŞLEMLER
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Transferler yükleniyor...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm
                        ? "Arama kriterlerinize uygun transfer bulunamadı"
                        : "Henüz transfer eklenmemiş"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ShareIcon
                          sx={{ color: "text.secondary", fontSize: 20 }}
                        />
                        <Typography variant="body2">
                          {transfer.movement_name}
                        </Typography>
                        <Chip
                          label={transfer.status}
                          size="small"
                          color={
                            transfer.status === "completed"
                              ? "success"
                              : transfer.status === "pending"
                              ? "warning"
                              : "error"
                          }
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transfer.source_warehouse.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transfer.destination_warehouse.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(transfer.preparation_date).toLocaleDateString(
                          "tr-TR"
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditTransfer(transfer.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTransfer(transfer.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {filteredTransfers.length} transfer gösteriliyor
        </Typography>
      </Box>
    </Box>
  );
};

export default WarehouseTransfersList;
