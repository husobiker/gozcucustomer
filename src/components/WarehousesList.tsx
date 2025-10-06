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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { warehouseService, Warehouse } from "../services/inventoryService";

const WarehousesList: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const warehousesData = await warehouseService.getAllWarehouses();
      setWarehouses(warehousesData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading warehouses:", err);
      setError("Depolar yüklenirken hata oluştu");
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddWarehouse = () => {
    navigate("/accounting/stock/warehouses/new");
  };

  const handleEditWarehouse = (warehouseId: string) => {
    navigate(`/accounting/stock/warehouses/edit/${warehouseId}`);
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await warehouseService.deleteWarehouse(warehouseId);
      setWarehouses((prev) =>
        prev.filter((warehouse) => warehouse.id !== warehouseId)
      );
      setSuccessMessage("Depo silindi");
    } catch (err) {
      console.error("Error deleting warehouse:", err);
      setError("Depo silinirken hata oluştu");
    }
  };

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warehouse.address &&
        warehouse.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (warehouse.city &&
        warehouse.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (warehouse.district &&
        warehouse.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Depolar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Depo bilgilerinizi yönetin ve yeni depolar ekleyin
        </Typography>
      </Box>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
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

          {/* Add Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddWarehouse}
            sx={{ minWidth: 140 }}
          >
            DEPO EKLE
          </Button>
        </Stack>
      </Paper>

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

      {/* Warehouses List */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              DEPO ↓
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.secondary"
            >
              ADRES
            </Typography>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Depolar yükleniyor...
            </Typography>
          </Box>
        ) : filteredWarehouses.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm
                ? "Arama kriterlerinize uygun depo bulunamadı"
                : "Henüz depo eklenmemiş"}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredWarehouses.map((warehouse, index) => (
              <React.Fragment key={warehouse.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon>
                    <LocationIcon sx={{ color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          variant="body1"
                          fontWeight={warehouse.is_default ? "bold" : "normal"}
                        >
                          {warehouse.name}
                          {warehouse.is_default && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ ml: 1, color: "primary.main" }}
                            >
                              (Varsayılan)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {warehouse.address}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {warehouse.district}, {warehouse.city}
                        {warehouse.is_abroad && " (Yurt Dışı)"}
                      </Typography>
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditWarehouse(warehouse.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    {!warehouse.is_default && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteWarehouse(warehouse.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>
                </ListItem>
                {index < filteredWarehouses.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Summary */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {filteredWarehouses.length} depo gösteriliyor
        </Typography>
      </Box>
    </Box>
  );
};

export default WarehousesList;
