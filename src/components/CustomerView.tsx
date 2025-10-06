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
  Tooltip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  customerService,
  Customer,
  AuthorizedPerson,
} from "../services/salesService";
import { supabase } from "../lib/supabase";

interface OpenItem {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  isOverdue: boolean;
  overdueDays: number;
  type: "invoice" | "check";
}

interface CustomerData extends Customer {
  openItems: OpenItem[];
  totalOverdue: number;
  totalCollection: number;
  ibanNumbers: Array<{
    id: string;
    name: string;
    iban: string;
  }>;
  authorizedPersons: AuthorizedPerson[];
  history: Array<{
    id: string;
    action: string;
    date: string;
    time: string;
    user: string;
    type: "transaction" | "message" | "note";
  }>;
  invoices: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    remaining_amount: number;
    status: string;
    due_date: string;
    is_overdue: boolean;
  }>;
}

const CustomerView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Müşteri temel bilgilerini al
      const customer = await customerService.getCustomer(id);

      // Yetkili kişileri al
      const authorizedPersons = await getAuthorizedPersons(id);

      // Faturaları al
      const invoices = await getCustomerInvoices(id);

      // Açık kalemleri hesapla
      const openItems = invoices
        .filter((inv) => inv.remaining_amount > 0)
        .map((inv) => ({
          id: inv.id,
          name: inv.invoice_number,
          dueDate: new Date(inv.due_date).toLocaleDateString("tr-TR"),
          amount: inv.remaining_amount,
          isOverdue: inv.is_overdue,
          overdueDays: inv.is_overdue
            ? Math.ceil(
                (new Date().getTime() - new Date(inv.due_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          type: "invoice" as const,
        }));

      // Toplam gecikmiş tutarı hesapla
      const totalOverdue = invoices
        .filter((inv) => inv.is_overdue)
        .reduce((sum, inv) => sum + inv.remaining_amount, 0);

      // Toplam tahsilat tutarını hesapla
      const totalCollection = invoices
        .filter((inv) => inv.status === "Tahsil Edildi")
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      // Müşteri geçmişini al
      const history = await getCustomerHistory(id);

      setCustomerData({
        ...customer,
        openItems,
        totalOverdue,
        totalCollection,
        ibanNumbers: [], // TODO: IBAN bilgileri için ayrı tablo gerekli
        authorizedPersons,
        history,
        invoices,
      });
    } catch (err) {
      console.error("Error loading customer data:", err);
      setError("Müşteri bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Yetkili kişileri al
  const getAuthorizedPersons = async (
    customerId: string
  ): Promise<AuthorizedPerson[]> => {
    try {
      const { data, error } = await supabase
        .from("authorized_persons")
        .select("*")
        .eq("customer_id", customerId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading authorized persons:", error);
      return [];
    }
  };

  // Müşteri faturalarını al
  const getCustomerInvoices = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading customer invoices:", error);
      return [];
    }
  };

  // Müşteri geçmişini al
  const getCustomerHistory = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_history")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        action: item.action,
        date: new Date(item.created_at).toLocaleDateString("tr-TR"),
        time: new Date(item.created_at).toLocaleTimeString("tr-TR"),
        user: item.user_name || "Sistem",
        type: item.type || "note",
      }));
    } catch (error) {
      console.error("Error loading customer history:", error);
      return [];
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const handleAddCollection = async () => {
    try {
      // Tahsilat ekleme modal'ı açılabilir
      console.log("Add collection for customer:", id);
      // TODO: Tahsilat ekleme modal'ı implement et
    } catch (error) {
      console.error("Error adding collection:", error);
    }
  };

  const handleSendStatement = async () => {
    try {
      // Ekstre gönderme işlemi
      console.log("Send statement to customer:", id);
      // TODO: Email ile ekstre gönderme implement et
    } catch (error) {
      console.error("Error sending statement:", error);
    }
  };

  const handleEdit = () => {
    navigate(`/accounting/sales/customers/edit/${id}`);
  };

  const handleDelete = async () => {
    if (
      !customerData ||
      !window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")
    ) {
      return;
    }

    try {
      await customerService.deleteCustomer(id!);
      navigate("/accounting/sales/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      setError("Müşteri silinirken hata oluştu");
    }
  };

  const handlePaymentReminder = async () => {
    try {
      // Ödeme hatırlatması gönderme
      console.log("Send payment reminder to customer:", id);
      // TODO: Email ile ödeme hatırlatması implement et
    } catch (error) {
      console.error("Error sending payment reminder:", error);
    }
  };

  const handleOnlineCollection = async () => {
    try {
      // Online tahsilat kurulumu
      console.log("Setup online collection for customer:", id);
      // TODO: Online tahsilat kurulumu implement et
    } catch (error) {
      console.error("Error setting up online collection:", error);
    }
  };

  const handleRecommend = async () => {
    try {
      // Platform önerisi gönderme
      console.log("Recommend platform to customer:", id);
      // TODO: Platform önerisi gönderme implement et
    } catch (error) {
      console.error("Error recommending platform:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  if (error || !customerData) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">{error || "Müşteri bulunamadı"}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Left Panel */}
        <Grid item xs={12} lg={4}>
          {/* Customer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {customerData.company_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customerData.email}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{customerData.email}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{customerData.phone}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {customerData.address}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                AÇIK FATURALAR / ÇEKLER
              </Typography>
              {customerData.openItems.map((item) => (
                <Box key={item.id} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      VADE TARİHİ
                    </Typography>
                    <Typography
                      variant="caption"
                      color={item.isOverdue ? "error" : "text.secondary"}
                    >
                      {item.isOverdue
                        ? `${item.overdueDays} gün gecikti`
                        : item.dueDate}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      MEBLAĞ
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.amount)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                İŞLEM GEÇMİŞİNİ GÖSTER
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Content */}
        <Grid item xs={12} lg={4}>
          {/* Financial Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Finansal Özet
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  GECİKMİŞ TAHSİLAT
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error">
                  {formatCurrency(customerData.totalOverdue)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  TOPLAM TAHSİLAT
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatCurrency(customerData.totalCollection)}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                onClick={handleSendStatement}
              >
                EKSTRE GÖNDER
              </Button>
            </CardContent>
          </Card>

          {/* Customer Features */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Müşteri Özellikleri
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">Müşteri Ekranı açık</Typography>
                  <IconButton size="small">
                    <SettingsIcon />
                  </IconButton>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    ÖDEME HATIRLAT
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fatura ödemeleri için otomatik e-posta hatırlatmaları
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handlePaymentReminder}
                    sx={{ mt: 1 }}
                  >
                    Başvurmak için tıklayın
                  </Button>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    ONLINE TAHSİLAT
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Kredi kartı ile ödeme toplama imkanı
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleOnlineCollection}
                    sx={{ mt: 1 }}
                  >
                    Başvurmak için tıklayın
                  </Button>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    TAVSİYE ET
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Müşteri/tedarikçilerinizi platforma davet edin, 3 ay
                    ücretsiz kullanım
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleRecommend}
                    sx={{ mt: 1 }}
                  >
                    Başvurmak için tıklayın
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Action Buttons */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddCollection}
                  fullWidth
                  sx={{ bgcolor: "primary.main" }}
                >
                  TAHSİLAT EKLE
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  fullWidth
                >
                  DÜZENLE
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  fullWidth
                  sx={{ color: "error.main" }}
                >
                  SİL
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* IBAN Numbers */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                IBAN NUMARALARINIZ
              </Typography>
              {customerData.ibanNumbers.map((iban) => (
                <Box key={iban.id} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {iban.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {iban.iban}
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ShareIcon />}
                    sx={{ mt: 1 }}
                  >
                    Paylaş
                  </Button>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Authorized Persons */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ERİŞİMİ OLAN KİŞİLER
              </Typography>
              {customerData.authorizedPersons.map((person) => (
                <Box key={person.id} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {person.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {person.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {person.phone}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Customer History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                MÜŞTERİ / TEDARİKÇİ GEÇMİŞİ
              </Typography>

              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Genel Bilgiler" />
                <Tab label="Faturalar" />
                <Tab label="Yetkili Kişiler" />
                <Tab label="Geçmiş" />
              </Tabs>

              {/* Tab Content */}
              {tabValue === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Şirket Adı
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.company_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Kısa Ad
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.short_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Vergi Numarası
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.tax_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Kategori
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.category}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Tip
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.type}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Durum
                      </Typography>
                      <Chip
                        label={customerData.status}
                        color={
                          customerData.status === "Aktif"
                            ? "success"
                            : "default"
                        }
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Adres
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {customerData.address}, {customerData.district},{" "}
                        {customerData.city}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fatura No</TableCell>
                          <TableCell>Tutar</TableCell>
                          <TableCell>Kalan</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell>Vade</TableCell>
                          <TableCell>İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerData.invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoice_number}</TableCell>
                            <TableCell>
                              {formatCurrency(invoice.total_amount)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.remaining_amount)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={invoice.status}
                                color={
                                  invoice.status === "Tahsil Edildi"
                                    ? "success"
                                    : "warning"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.due_date).toLocaleDateString(
                                "tr-TR"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">
                                Görüntüle
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {customerData.invoices.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bu müşteriye ait fatura bulunmuyor.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <List>
                    {customerData.authorizedPersons.map((person) => (
                      <ListItem key={person.id} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={person.name}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {person.email}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {person.phone}
                              </Typography>
                              {person.notes && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {person.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  {customerData.authorizedPersons.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bu müşteriye ait yetkili kişi bulunmuyor.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <List>
                    {customerData.history.map((item) => (
                      <ListItem key={item.id} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: "grey.100" }}>
                            <AccessTimeIcon />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.action}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.date} - {item.time}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {item.user}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  {customerData.history.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bu müşteriye ait geçmiş işlem bulunmuyor.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerView;
