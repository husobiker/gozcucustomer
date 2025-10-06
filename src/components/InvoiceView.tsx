import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Checkbox,
  Alert,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
} from "@mui/material";
import {
  Share as ShareIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";

interface InvoiceItem {
  id: string;
  service: string;
  quantity: number;
  unitPrice: number;
  tax: string;
  total: number;
}

interface InvoiceHistory {
  id: string;
  action: string;
  message?: string;
  date: string;
  time: string;
  user: string;
  type: "share" | "create" | "update" | "message" | "note";
}

interface InvoiceData {
  id: string;
  name: string;
  customer: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  category: string;
  label: string;
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  remainingAmount: number;
  status: string;
  isOverdue: boolean;
  overdueDays: number;
  sharedWith: Array<{
    email: string;
    status: "Ulaştı" | "Beklemede" | "Hata";
  }>;
  history: InvoiceHistory[];
}

const InvoiceView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [labelAnchorEl, setLabelAnchorEl] = useState<null | HTMLElement>(null);
  const [editAnchorEl, setEditAnchorEl] = useState<null | HTMLElement>(null);
  const [addReminder, setAddReminder] = useState(false);

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data based on the image
      setInvoiceData({
        id: id || "1",
        name: "ZEYNEP APARTMANI",
        customer: "Zeynep Apartmanı Yönetimi",
        customerEmail: "sedat@yasanenerji.com",
        issueDate: "13 Mart 2025",
        dueDate: "13 Mart 2025",
        category: "KATEGORİSİZ",
        label: "ETİKETSİZ",
        items: [
          {
            id: "1",
            service:
              "Hikvision DS-2CD1023G0-IUF 2MP 2.8mm H.265+ Dahili Sesli IR IP Bullet",
            quantity: 4,
            unitPrice: 1540,
            tax: "KDV %20",
            total: 7392,
          },
          {
            id: "2",
            service:
              "DAHUA PFS3010-8ET-96 8 PORT 10/100+ 2 PORT GIGABIT UPLINK 250 METRE 96W POE",
            quantity: 1,
            unitPrice: 1827,
            tax: "KDV %20",
            total: 2192.41,
          },
          {
            id: "3",
            service: "İŞÇİLİK VE DEVREYE ALMA BEDELİ",
            quantity: 1,
            unitPrice: 6000,
            tax: "KDV %20",
            total: 7200,
          },
        ],
        subtotal: 13987.01,
        totalTax: 2797.4,
        grandTotal: 16784.41,
        remainingAmount: 16784.41,
        status: "Tahsil Edilecek",
        isOverdue: true,
        overdueDays: 194,
        sharedWith: [
          {
            email: "sedat@yasanenerji.com",
            status: "Ulaştı",
          },
        ],
        history: [
          {
            id: "1",
            action: "Fatura paylaşıldı",
            message:
              "Merhaba, Fatura detaylarını aşağıdaki bağlantıya tıklayarak inceleyebilirsiniz. İyi çalışmalar, SEDAT GÜZEL",
            date: "13 Mart 2025",
            time: "12:19",
            user: "SEDAT GÜZEL",
            type: "share",
          },
          {
            id: "2",
            action: "Fatura oluşturuldu",
            date: "13 Mart 2025",
            time: "12:07",
            user: "SEDAT GÜZEL",
            type: "create",
          },
        ],
      });
    } catch (err) {
      setError("Fatura bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const handleCategoryClick = (event: React.MouseEvent<HTMLElement>) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
  };

  const handleLabelClick = (event: React.MouseEvent<HTMLElement>) => {
    setLabelAnchorEl(event.currentTarget);
  };

  const handleLabelClose = () => {
    setLabelAnchorEl(null);
  };

  const handleEditClick = (event: React.MouseEvent<HTMLElement>) => {
    setEditAnchorEl(event.currentTarget);
  };

  const handleEditClose = () => {
    setEditAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/accounting/sales/invoices/edit/${id}`);
    handleEditClose();
  };

  const handleDelete = () => {
    // Delete logic here
    console.log("Delete invoice:", id);
    handleEditClose();
  };

  const handleConvertToInvoice = () => {
    // Convert logic here
    console.log("Convert to invoice:", id);
  };

  const handleRequestCollection = () => {
    // Request collection logic here
    console.log("Request collection:", id);
  };

  const handleAddCollection = () => {
    // Add collection logic here
    console.log("Add collection:", id);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (error || !invoiceData) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">{error || "Fatura bulunamadı"}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {invoiceData.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fatura detayları ve geçmişi
            </Typography>
          </Box>

          {/* Invoice Document */}
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Document Header */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Button
                    variant="outlined"
                    onClick={handleCategoryClick}
                    endIcon={<ArrowDropDownIcon />}
                    sx={{ mb: 1 }}
                  >
                    {invoiceData.category}
                  </Button>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      {invoiceData.customer}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {invoiceData.issueDate}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Button
                    variant="outlined"
                    onClick={handleEditClick}
                    endIcon={<ArrowDropDownIcon />}
                    sx={{ mb: 1 }}
                  >
                    DÜZENLE
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleLabelClick}
                    endIcon={<ArrowDropDownIcon />}
                  >
                    {invoiceData.label}
                  </Button>
                </Box>
              </Box>

              {/* Menus */}
              <Menu
                anchorEl={categoryAnchorEl}
                open={Boolean(categoryAnchorEl)}
                onClose={handleCategoryClose}
              >
                <MenuItem onClick={handleCategoryClose}>KATEGORİSİZ</MenuItem>
                <MenuItem onClick={handleCategoryClose}>SITE</MenuItem>
                <MenuItem onClick={handleCategoryClose}>GÜVENLİK</MenuItem>
                <MenuItem onClick={handleCategoryClose}>E-TİCARET</MenuItem>
              </Menu>

              <Menu
                anchorEl={labelAnchorEl}
                open={Boolean(labelAnchorEl)}
                onClose={handleLabelClose}
              >
                <MenuItem onClick={handleLabelClose}>ETİKETSİZ</MenuItem>
                <MenuItem onClick={handleLabelClose}>Güvenlik</MenuItem>
                <MenuItem onClick={handleLabelClose}>Bakım</MenuItem>
                <MenuItem onClick={handleLabelClose}>Sistem</MenuItem>
              </Menu>

              <Menu
                anchorEl={editAnchorEl}
                open={Boolean(editAnchorEl)}
                onClose={handleEditClose}
              >
                <MenuItem onClick={handleEdit}>
                  <EditIcon sx={{ mr: 1 }} />
                  Düzenle
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
                  <DeleteIcon sx={{ mr: 1 }} />
                  Sil
                </MenuItem>
              </Menu>
            </Box>

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      HİZMET/ÜRÜN
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>MİKTAR</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>BR. FİYAT</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>VERGİ</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>TOPLAM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.service}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.quantity.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          Adet
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(item.unitPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.tax}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Stack spacing={1} alignItems="flex-end">
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ARA TOPLAM:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(invoiceData.subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    TOPLAM KDV:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(invoiceData.totalTax)}
                  </Typography>
                </Box>
                <Divider sx={{ width: "100%", my: 1 }} />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    GENEL TOPLAM:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(invoiceData.grandTotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    KALAN:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(invoiceData.remainingAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Sharing Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paylaşım Bilgileri
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {invoiceData.sharedWith.length} kişi ile paylaşıldı
              </Typography>
              {invoiceData.sharedWith.map((share, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <EmailIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{share.email}</Typography>
                  <Chip
                    label={share.status}
                    size="small"
                    color={share.status === "Ulaştı" ? "success" : "warning"}
                    variant="outlined"
                  />
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                PAYLAŞ
              </Button>
            </CardContent>
          </Card>

          {/* Balance and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                KALAN
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary"
                sx={{ mb: 2 }}
              >
                {formatCurrency(invoiceData.remainingAmount)}
              </Typography>

              <Stack spacing={2}>
                <Button
                  variant="text"
                  onClick={handleConvertToInvoice}
                  sx={{ justifyContent: "flex-start" }}
                >
                  Faturaya Çevir
                </Button>

                {invoiceData.isOverdue && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Tahsilat {invoiceData.overdueDays} gün gecikti
                  </Alert>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addReminder}
                      onChange={(e) => setAddReminder(e.target.checked)}
                    />
                  }
                  label="Müşteri hatırlatma ekle"
                />

                <Button
                  variant="outlined"
                  onClick={handleRequestCollection}
                  fullWidth
                >
                  Tahsilat talep et
                </Button>

                <Button
                  variant="contained"
                  onClick={handleAddCollection}
                  fullWidth
                  sx={{ bgcolor: "primary.main" }}
                >
                  TAHSİLAT EKLE
                </Button>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}
                >
                  <Typography variant="body2">Müşteri Ekranı açık</Typography>
                  <IconButton size="small">
                    <PersonIcon />
                  </IconButton>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                FATURA GEÇMİŞİ
              </Typography>

              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Tümü" />
                <Tab label="Mesajlar" />
                <Tab label="Notlar" />
              </Tabs>

              <List>
                {invoiceData.history.map((entry) => (
                  <ListItem key={entry.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                      >
                        {entry.type === "share" ? (
                          <ShareIcon sx={{ fontSize: 16 }} />
                        ) : entry.type === "create" ? (
                          <ReceiptIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <AccessTimeIcon sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {entry.action}
                            {entry.type === "share" &&
                              ` → ${invoiceData.customerEmail}`}
                          </Typography>
                          {entry.message && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: "block" }}
                            >
                              {entry.message}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {entry.date} - {entry.time} / {entry.user}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceView;
