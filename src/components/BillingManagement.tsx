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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { supabaseAdmin } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_date?: string;
  created_at: string;
  billing_period_start: string;
  billing_period_end: string;
  subscription_plan: string;
  notes?: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
  items?: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference?: string;
  status: string;
  processed_at: string;
  created_at: string;
  notes?: string;
}

interface SubscriptionHistory {
  id: string;
  tenant_id: string;
  old_plan?: string;
  new_plan: string;
  change_type: string;
  effective_date: string;
  created_at: string;
  notes?: string;
  tenant?: {
    name: string;
    subdomain: string;
  };
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
      id={`billing-tabpanel-${index}`}
      aria-labelledby={`billing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BillingManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<
    SubscriptionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0,
  });

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    tenant_id: "",
    amount: "",
    due_date: "",
    billing_period_start: "",
    billing_period_end: "",
    subscription_plan: "basic",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    amount: "",
    payment_method: "credit_card",
    payment_reference: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadInvoices(),
        loadPayments(),
        loadSubscriptionHistory(),
        loadTenants(),
      ]);
      calculateStats();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        tenant:tenants(name, subdomain),
        items:invoice_items(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invoices:", error);
    } else {
      setInvoices(data || []);
    }
  };

  const loadPayments = async () => {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("processed_at", { ascending: false });

    if (error) {
      console.error("Error loading payments:", error);
    } else {
      setPayments(data || []);
    }
  };

  const loadSubscriptionHistory = async () => {
    const { data, error } = await supabaseAdmin
      .from("subscription_history")
      .select(
        `
        *,
        tenant:tenants(name, subdomain)
      `
      )
      .order("effective_date", { ascending: false });

    if (error) {
      console.error("Error loading subscription history:", error);
    } else {
      setSubscriptionHistory(data || []);
    }
  };

  const loadTenants = async () => {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, subdomain, subscription_plan")
      .order("name");

    if (error) {
      console.error("Error loading tenants:", error);
    } else {
      setTenants(data || []);
    }
  };

  const calculateStats = () => {
    const totalRevenue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const pendingInvoices = invoices.filter(
      (i) => i.status === "pending"
    ).length;
    const overdueInvoices = invoices.filter(
      (i) =>
        i.status === "overdue" ||
        (i.status === "pending" && new Date(i.due_date) < new Date())
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
      .filter(
        (p) =>
          p.status === "completed" &&
          new Date(p.processed_at).getMonth() === currentMonth &&
          new Date(p.processed_at).getFullYear() === currentYear
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    setStats({
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      monthlyRevenue,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "overdue":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircleIcon color="success" />;
      case "pending":
        return <WarningIcon color="warning" />;
      case "overdue":
        return <ErrorIcon color="error" />;
      case "cancelled":
        return <ErrorIcon color="disabled" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const { error } = await supabaseAdmin.from("invoices").insert({
        tenant_id: invoiceForm.tenant_id,
        invoice_number: `INV-${Date.now()}`,
        amount: parseFloat(invoiceForm.amount),
        due_date: invoiceForm.due_date,
        billing_period_start: invoiceForm.billing_period_start,
        billing_period_end: invoiceForm.billing_period_end,
        subscription_plan: invoiceForm.subscription_plan,
        notes: invoiceForm.notes,
      });

      if (error) {
        console.error("Error creating invoice:", error);
        alert("Fatura oluşturulurken hata oluştu: " + error.message);
      } else {
        await loadInvoices();
        setOpenInvoiceDialog(false);
        setInvoiceForm({
          tenant_id: "",
          amount: "",
          due_date: "",
          billing_period_start: "",
          billing_period_end: "",
          subscription_plan: "basic",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error in handleCreateInvoice:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleCreatePayment = async () => {
    try {
      const { error } = await supabaseAdmin.from("payments").insert({
        invoice_id: paymentForm.invoice_id,
        tenant_id: selectedInvoice?.tenant_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference,
        notes: paymentForm.notes,
      });

      if (error) {
        console.error("Error creating payment:", error);
        alert("Ödeme kaydedilirken hata oluştu: " + error.message);
      } else {
        // Fatura durumunu güncelle
        await supabaseAdmin
          .from("invoices")
          .update({
            status: "paid",
            paid_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", paymentForm.invoice_id);

        await loadInvoices();
        await loadPayments();
        setOpenPaymentDialog(false);
        setPaymentForm({
          invoice_id: "",
          amount: "",
          payment_method: "credit_card",
          payment_reference: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error in handleCreatePayment:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleMarkOverdue = async (invoiceId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", invoiceId);

      if (error) {
        console.error("Error updating invoice:", error);
        alert("Fatura durumu güncellenirken hata oluştu: " + error.message);
      } else {
        await loadInvoices();
      }
    } catch (error) {
      console.error("Error in handleMarkOverdue:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    // Bu fonksiyon email gönderme servisi ile entegre edilecek
    alert("Fatura gönderme özelliği yakında eklenecek!");
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    // Bu fonksiyon PDF oluşturma servisi ile entegre edilecek
    alert("Fatura indirme özelliği yakında eklenecek!");
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Veriler yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Faturalandırma Yönetimi
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
                  <ReceiptIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    ₺{stats.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">Toplam Gelir</Typography>
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
                  <WarningIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.pendingInvoices}</Typography>
                  <Typography color="textSecondary">Bekleyen Fatura</Typography>
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
                  <ErrorIcon />
                </Box>
                <Box>
                  <Typography variant="h6">{stats.overdueInvoices}</Typography>
                  <Typography color="textSecondary">Vadesi Geçen</Typography>
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
                  <PaymentIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    ₺{stats.monthlyRevenue.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">Bu Ay Gelir</Typography>
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
            <Tab label="Faturalar" />
            <Tab label="Ödemeler" />
            <Tab label="Abonelik Geçmişi" />
          </Tabs>
        </Box>

        {/* Invoices Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Fatura Listesi</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenInvoiceDialog(true)}
              sx={{ bgcolor: "#1976d2" }}
            >
              Yeni Fatura
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fatura No</TableCell>
                  <TableCell>Müşteri</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Vade Tarihi</TableCell>
                  <TableCell>Ödeme Tarihi</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.tenant?.name || "Bilinmeyen"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.tenant?.subdomain || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>₺{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(invoice.status)}
                        label={invoice.status.toUpperCase()}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(parseISO(invoice.due_date), "dd/MM/yyyy", {
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell>
                      {invoice.paid_date
                        ? format(parseISO(invoice.paid_date), "dd/MM/yyyy", {
                            locale: tr,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.subscription_plan.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          title="Görüntüle"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="İndir"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Gönder"
                          onClick={() => handleSendInvoice(invoice.id)}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                        {invoice.status === "pending" && (
                          <IconButton
                            size="small"
                            title="Vadesi Geçmiş Olarak İşaretle"
                            color="error"
                            onClick={() => handleMarkOverdue(invoice.id)}
                          >
                            <ErrorIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Ödeme Listesi</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenPaymentDialog(true)}
              sx={{ bgcolor: "#1976d2" }}
            >
              Yeni Ödeme
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ödeme No</TableCell>
                  <TableCell>Fatura No</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Ödeme Yöntemi</TableCell>
                  <TableCell>Referans</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>İşlem Tarihi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      {invoices.find((i) => i.id === payment.invoice_id)
                        ?.invoice_number || "Bilinmeyen"}
                    </TableCell>
                    <TableCell>₺{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.payment_method.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{payment.payment_reference || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={payment.status.toUpperCase()}
                        color={getStatusColor(payment.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(
                        parseISO(payment.processed_at),
                        "dd/MM/yyyy HH:mm",
                        { locale: tr }
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Subscription History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Abonelik Değişiklik Geçmişi
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Müşteri</TableCell>
                  <TableCell>Eski Plan</TableCell>
                  <TableCell>Yeni Plan</TableCell>
                  <TableCell>Değişiklik Türü</TableCell>
                  <TableCell>Geçerlilik Tarihi</TableCell>
                  <TableCell>Notlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptionHistory.map((history) => (
                  <TableRow key={history.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {history.tenant?.name || "Bilinmeyen"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {history.tenant?.subdomain || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {history.old_plan ? (
                        <Chip
                          label={history.old_plan.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={history.new_plan.toUpperCase()}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={history.change_type.toUpperCase()}
                        size="small"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      {format(parseISO(history.effective_date), "dd/MM/yyyy", {
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell>{history.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Create Invoice Dialog */}
      <Dialog
        open={openInvoiceDialog}
        onClose={() => setOpenInvoiceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yeni Fatura Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Müşteri</InputLabel>
              <Select
                value={invoiceForm.tenant_id}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, tenant_id: e.target.value })
                }
                label="Müşteri"
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.subdomain})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Tutar"
              fullWidth
              type="number"
              value={invoiceForm.amount}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, amount: e.target.value })
              }
              required
            />

            <TextField
              label="Vade Tarihi"
              fullWidth
              type="date"
              value={invoiceForm.due_date}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, due_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Faturalandırma Dönemi Başlangıcı"
              fullWidth
              type="date"
              value={invoiceForm.billing_period_start}
              onChange={(e) =>
                setInvoiceForm({
                  ...invoiceForm,
                  billing_period_start: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Faturalandırma Dönemi Bitişi"
              fullWidth
              type="date"
              value={invoiceForm.billing_period_end}
              onChange={(e) =>
                setInvoiceForm({
                  ...invoiceForm,
                  billing_period_end: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Abonelik Planı</InputLabel>
              <Select
                value={invoiceForm.subscription_plan}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    subscription_plan: e.target.value,
                  })
                }
                label="Abonelik Planı"
              >
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notlar"
              fullWidth
              multiline
              rows={3}
              value={invoiceForm.notes}
              onChange={(e) =>
                setInvoiceForm({ ...invoiceForm, notes: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvoiceDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreateInvoice}
            disabled={
              !invoiceForm.tenant_id ||
              !invoiceForm.amount ||
              !invoiceForm.due_date
            }
            sx={{ bgcolor: "#1976d2" }}
          >
            Fatura Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Ödeme Kaydet</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Fatura</InputLabel>
              <Select
                value={paymentForm.invoice_id}
                onChange={(e) => {
                  const invoice = invoices.find((i) => i.id === e.target.value);
                  setSelectedInvoice(invoice || null);
                  setPaymentForm({
                    ...paymentForm,
                    invoice_id: e.target.value,
                    amount: invoice?.amount.toString() || "",
                  });
                }}
                label="Fatura"
              >
                {invoices
                  .filter((i) => i.status !== "paid")
                  .map((invoice) => (
                    <MenuItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.tenant?.name} - ₺
                      {invoice.amount}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Tutar"
              fullWidth
              type="number"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              required
            />

            <FormControl fullWidth>
              <InputLabel>Ödeme Yöntemi</InputLabel>
              <Select
                value={paymentForm.payment_method}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_method: e.target.value,
                  })
                }
                label="Ödeme Yöntemi"
              >
                <MenuItem value="credit_card">Kredi Kartı</MenuItem>
                <MenuItem value="bank_transfer">Banka Havalesi</MenuItem>
                <MenuItem value="cash">Nakit</MenuItem>
                <MenuItem value="other">Diğer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Ödeme Referansı"
              fullWidth
              value={paymentForm.payment_reference}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  payment_reference: e.target.value,
                })
              }
              placeholder="Örn: TR1234567890"
            />

            <TextField
              label="Notlar"
              fullWidth
              multiline
              rows={3}
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreatePayment}
            disabled={!paymentForm.invoice_id || !paymentForm.amount}
            sx={{ bgcolor: "#1976d2" }}
          >
            Ödeme Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Fatura Detayları - {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Müşteri
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.tenant?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fatura No
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.invoice_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tutar
                  </Typography>
                  <Typography variant="h6">
                    ₺{selectedInvoice.amount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Durum
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedInvoice.status)}
                    label={selectedInvoice.status.toUpperCase()}
                    color={getStatusColor(selectedInvoice.status) as any}
                    size="small"
                  />
                </Grid>
              </Grid>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Fatura Kalemleri
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Açıklama</TableCell>
                          <TableCell>Miktar</TableCell>
                          <TableCell>Birim Fiyat</TableCell>
                          <TableCell>Toplam</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              ₺{item.unit_price.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              ₺{item.total_price.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvoice(null)}>Kapat</Button>
          {selectedInvoice && selectedInvoice.status !== "paid" && (
            <Button
              variant="contained"
              onClick={() => {
                setPaymentForm({
                  invoice_id: selectedInvoice.id,
                  amount: selectedInvoice.amount.toString(),
                  payment_method: "credit_card",
                  payment_reference: "",
                  notes: "",
                });
                setOpenPaymentDialog(true);
                setSelectedInvoice(null);
              }}
              sx={{ bgcolor: "#1976d2" }}
            >
              Ödeme Kaydet
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingManagement;
