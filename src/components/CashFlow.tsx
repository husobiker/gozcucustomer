// Nakit Akışı Bileşeni
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  LocalAtm as AtmIcon,
  SwapHoriz as TransferIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface CashFlowTransaction {
  id: string;
  transaction_type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  bank_account_id: string;
  bank_account_name: string;
  category: string;
  subcategory: string;
  date: string;
  reference_number?: string;
  related_invoice_id?: string;
  related_customer_id?: string;
  related_supplier_id?: string;
  payment_method:
    | "BANK_TRANSFER"
    | "CASH"
    | "CREDIT_CARD"
    | "CHECK"
    | "BILL"
    | "OTHER";
  is_reconciled: boolean;
  created_at: string;
  updated_at: string;
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
      id={`cash-flow-tabpanel-${index}`}
      aria-labelledby={`cash-flow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CashFlow: React.FC = () => {
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedTransaction, setSelectedTransaction] =
    useState<CashFlowTransaction | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const [formData, setFormData] = useState<Partial<CashFlowTransaction>>({
    transaction_type: "INCOME",
    amount: 0,
    description: "",
    bank_account_id: "",
    category: "",
    subcategory: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "BANK_TRANSFER",
    is_reconciled: false,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Mock data - gerçek uygulamada API'den gelecek
      const mockTransactions: CashFlowTransaction[] = [
        {
          id: "1",
          transaction_type: "INCOME",
          amount: 15000.0,
          description: "Müşteri A'dan fatura tahsilatı",
          bank_account_id: "1",
          bank_account_name: "Ana Cari Hesap",
          category: "Satış Gelirleri",
          subcategory: "Fatura Tahsilatı",
          date: "2024-01-15",
          reference_number: "TXN001",
          related_invoice_id: "INV001",
          related_customer_id: "CUST001",
          payment_method: "BANK_TRANSFER",
          is_reconciled: true,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          transaction_type: "EXPENSE",
          amount: 5000.0,
          description: "Ofis kirası ödemesi",
          bank_account_id: "1",
          bank_account_name: "Ana Cari Hesap",
          category: "Operasyonel Giderler",
          subcategory: "Kira",
          date: "2024-01-10",
          reference_number: "TXN002",
          payment_method: "BANK_TRANSFER",
          is_reconciled: true,
          created_at: "2024-01-10T09:00:00Z",
          updated_at: "2024-01-10T09:00:00Z",
        },
        {
          id: "3",
          transaction_type: "INCOME",
          amount: 25000.0,
          description: "Proje ödemesi",
          bank_account_id: "2",
          bank_account_name: "Tasarruf Hesabı",
          category: "Proje Gelirleri",
          subcategory: "Yazılım Geliştirme",
          date: "2024-01-20",
          reference_number: "TXN003",
          related_invoice_id: "INV002",
          related_customer_id: "CUST002",
          payment_method: "BANK_TRANSFER",
          is_reconciled: false,
          created_at: "2024-01-20T14:30:00Z",
          updated_at: "2024-01-20T14:30:00Z",
        },
        {
          id: "4",
          transaction_type: "EXPENSE",
          amount: 1200.0,
          description: "Elektrik faturası",
          bank_account_id: "1",
          bank_account_name: "Ana Cari Hesap",
          category: "Operasyonel Giderler",
          subcategory: "Elektrik",
          date: "2024-01-18",
          reference_number: "TXN004",
          payment_method: "BANK_TRANSFER",
          is_reconciled: true,
          created_at: "2024-01-18T11:15:00Z",
          updated_at: "2024-01-18T11:15:00Z",
        },
        {
          id: "5",
          transaction_type: "TRANSFER",
          amount: 10000.0,
          description: "Tasarruf hesabına transfer",
          bank_account_id: "1",
          bank_account_name: "Ana Cari Hesap",
          category: "Transfer",
          subcategory: "Hesap Arası Transfer",
          date: "2024-01-22",
          reference_number: "TXN005",
          payment_method: "BANK_TRANSFER",
          is_reconciled: true,
          created_at: "2024-01-22T16:45:00Z",
          updated_at: "2024-01-22T16:45:00Z",
        },
        {
          id: "6",
          transaction_type: "EXPENSE",
          amount: 800.0,
          description: "Nakit ödeme - yemek",
          bank_account_id: "1",
          bank_account_name: "Ana Cari Hesap",
          category: "Operasyonel Giderler",
          subcategory: "Yemek",
          date: "2024-01-25",
          reference_number: "TXN006",
          payment_method: "CASH",
          is_reconciled: false,
          created_at: "2024-01-25T12:00:00Z",
          updated_at: "2024-01-25T12:00:00Z",
        },
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Nakit akışı verileri yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "INCOME":
        return "Gelir";
      case "EXPENSE":
        return "Gider";
      case "TRANSFER":
        return "Transfer";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "INCOME":
        return "success";
      case "EXPENSE":
        return "error";
      case "TRANSFER":
        return "info";
      default:
        return "default";
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "INCOME":
        return <TrendingUpIcon />;
      case "EXPENSE":
        return <TrendingDownIcon />;
      case "TRANSFER":
        return <TransferIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "Banka Transferi";
      case "CASH":
        return "Nakit";
      case "CREDIT_CARD":
        return "Kredi Kartı";
      case "CHECK":
        return "Çek";
      case "BILL":
        return "Senet";
      case "OTHER":
        return "Diğer";
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return <AccountBalanceIcon />;
      case "CASH":
        return <AtmIcon />;
      case "CREDIT_CARD":
        return <CreditCardIcon />;
      case "CHECK":
        return <ReceiptIcon />;
      case "BILL":
        return <ReceiptIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" || transaction.transaction_type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || transaction.category === categoryFilter;

    const matchesDateRange =
      (!dateRange.start || transaction.date >= dateRange.start) &&
      (!dateRange.end || transaction.date <= dateRange.end);

    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  });

  const handleViewTransaction = (transaction: CashFlowTransaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleEditTransaction = (transaction: CashFlowTransaction) => {
    setFormData(transaction);
    setEditDialogOpen(true);
  };

  const handleDeleteTransaction = (transaction: CashFlowTransaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleSaveTransaction = async () => {
    try {
      console.log("İşlem kaydediliyor:", formData);
      // API çağrısı burada yapılacak
      setEditDialogOpen(false);
      setFormData({
        transaction_type: "INCOME",
        amount: 0,
        description: "",
        bank_account_id: "",
        category: "",
        subcategory: "",
        date: new Date().toISOString().split("T")[0],
        payment_method: "BANK_TRANSFER",
        is_reconciled: false,
      });
      await loadTransactions();
    } catch (error) {
      console.error("İşlem kaydedilirken hata:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log("İşlem siliniyor:", selectedTransaction?.id);
      // API çağrısı burada yapılacak
      setDeleteDialogOpen(false);
      await loadTransactions();
    } catch (error) {
      console.error("İşlem silinirken hata:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  // İstatistikler
  const totalIncome = transactions
    .filter((t) => t.transaction_type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.transaction_type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  const reconciledCount = transactions.filter((t) => t.is_reconciled).length;
  const unreconciledCount = transactions.filter((t) => !t.is_reconciled).length;

  // Grafik verileri
  const chartData = transactions
    .filter((t) => t.transaction_type !== "TRANSFER")
    .reduce((acc, transaction) => {
      const date = transaction.date;
      const existing = acc.find((item) => item.date === date);

      if (existing) {
        if (transaction.transaction_type === "INCOME") {
          existing.income += transaction.amount;
        } else {
          existing.expense += transaction.amount;
        }
      } else {
        acc.push({
          date,
          income:
            transaction.transaction_type === "INCOME" ? transaction.amount : 0,
          expense:
            transaction.transaction_type === "EXPENSE" ? transaction.amount : 0,
        });
      }

      return acc;
    }, [] as any[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const categoryData = transactions
    .filter((t) => t.transaction_type !== "TRANSFER")
    .reduce((acc, transaction) => {
      const category = transaction.category;
      const existing = acc.find((item) => item.name === category);

      if (existing) {
        existing.value += Math.abs(transaction.amount);
      } else {
        acc.push({
          name: category,
          value: Math.abs(transaction.amount),
        });
      }

      return acc;
    }, [] as any[]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Nakit Akışı
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Nakit akışınızı takip edebilir, gelir ve giderlerinizi analiz
        edebilirsiniz.
      </Alert>

      {/* İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {formatCurrency(totalIncome)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Gelir
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {formatCurrency(totalExpense)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Gider
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                color={netCashFlow >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(netCashFlow)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net Nakit Akışı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {reconciledCount}/{transactions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mutabakat
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sekmeler */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label="İşlemler" />
          <Tab label="Grafikler" />
          <Tab label="Analiz" />
        </Tabs>
      </Paper>

      {/* İşlemler Sekmesi */}
      <TabPanel value={tabValue} index={0}>
        {/* Filtreler ve Arama */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Açıklama, referans no veya kategori ara..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tip</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="INCOME">Gelir</MenuItem>
                  <MenuItem value="EXPENSE">Gider</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="Satış Gelirleri">Satış Gelirleri</MenuItem>
                  <MenuItem value="Proje Gelirleri">Proje Gelirleri</MenuItem>
                  <MenuItem value="Operasyonel Giderler">
                    Operasyonel Giderler
                  </MenuItem>
                  <MenuItem value="Transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Başlangıç Tarihi"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Bitiş Tarihi"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadTransactions}
                >
                  Yenile
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEditDialogOpen(true)}
                >
                  Yeni
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* İşlem Listesi */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Hesap</TableCell>
                  <TableCell>Tutar</TableCell>
                  <TableCell>Ödeme Yöntemi</TableCell>
                  <TableCell>Mutabakat</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        İşlem bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getTransactionTypeIcon(
                            transaction.transaction_type
                          )}
                          label={getTransactionTypeLabel(
                            transaction.transaction_type
                          )}
                          color={
                            getTransactionTypeColor(
                              transaction.transaction_type
                            ) as any
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description}
                        </Typography>
                        {transaction.reference_number && (
                          <Typography variant="caption" color="text.secondary">
                            Ref: {transaction.reference_number}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.category}
                        </Typography>
                        {transaction.subcategory && (
                          <Typography variant="caption" color="text.secondary">
                            {transaction.subcategory}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.bank_account_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={
                            transaction.transaction_type === "INCOME"
                              ? "success.main"
                              : transaction.transaction_type === "EXPENSE"
                              ? "error.main"
                              : "text.primary"
                          }
                        >
                          {transaction.transaction_type === "EXPENSE"
                            ? "-"
                            : ""}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {getPaymentMethodIcon(transaction.payment_method)}
                          <Typography variant="body2">
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={
                            transaction.is_reconciled ? (
                              <CheckCircleIcon />
                            ) : (
                              <WarningIcon />
                            )
                          }
                          label={
                            transaction.is_reconciled
                              ? "Mutabakat"
                              : "Beklemede"
                          }
                          color={
                            transaction.is_reconciled ? "success" : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTransaction(transaction)}
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
      </TabPanel>

      {/* Grafikler Sekmesi */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Nakit Akışı Trendi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#4caf50"
                    fill="#4caf50"
                    name="Gelir"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stackId="2"
                    stroke="#f44336"
                    fill="#f44336"
                    name="Gider"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Kategori Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Analiz Sekmesi */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Mutabakat Durumu
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Mutabakat",
                        value: reconciledCount,
                        color: "#4caf50",
                      },
                      {
                        name: "Beklemede",
                        value: unreconciledCount,
                        color: "#ff9800",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      {
                        name: "Mutabakat",
                        value: reconciledCount,
                        color: "#4caf50",
                      },
                      {
                        name: "Beklemede",
                        value: unreconciledCount,
                        color: "#ff9800",
                      },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ödeme Yöntemi Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={transactions.reduce((acc, transaction) => {
                    const method = getPaymentMethodLabel(
                      transaction.payment_method
                    );
                    const existing = acc.find((item) => item.name === method);

                    if (existing) {
                      existing.value += 1;
                    } else {
                      acc.push({ name: method, value: 1 });
                    }

                    return acc;
                  }, [] as any[])}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* İşlem Detay Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>İşlem Detayları</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tarih
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedTransaction.date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tip
                  </Typography>
                  <Chip
                    icon={getTransactionTypeIcon(
                      selectedTransaction.transaction_type
                    )}
                    label={getTransactionTypeLabel(
                      selectedTransaction.transaction_type
                    )}
                    color={
                      getTransactionTypeColor(
                        selectedTransaction.transaction_type
                      ) as any
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Açıklama
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Kategori
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Alt Kategori
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.subcategory}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hesap
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.bank_account_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tutar
                  </Typography>
                  <Typography
                    variant="h6"
                    color={
                      selectedTransaction.transaction_type === "INCOME"
                        ? "success.main"
                        : selectedTransaction.transaction_type === "EXPENSE"
                        ? "error.main"
                        : "text.primary"
                    }
                  >
                    {selectedTransaction.transaction_type === "EXPENSE"
                      ? "-"
                      : ""}
                    {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ödeme Yöntemi
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getPaymentMethodIcon(selectedTransaction.payment_method)}
                    <Typography variant="body1">
                      {getPaymentMethodLabel(
                        selectedTransaction.payment_method
                      )}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mutabakat
                  </Typography>
                  <Chip
                    icon={
                      selectedTransaction.is_reconciled ? (
                        <CheckCircleIcon />
                      ) : (
                        <WarningIcon />
                      )
                    }
                    label={
                      selectedTransaction.is_reconciled
                        ? "Mutabakat"
                        : "Beklemede"
                    }
                    color={
                      selectedTransaction.is_reconciled ? "success" : "warning"
                    }
                    size="small"
                  />
                </Grid>
                {selectedTransaction.reference_number && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Referans No
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {selectedTransaction.reference_number}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Oluşturulma Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedTransaction.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* İşlem Ekleme/Düzenleme Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formData.id ? "İşlem Düzenle" : "Yeni İşlem Ekle"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>İşlem Tipi</InputLabel>
                <Select
                  value={formData.transaction_type || "INCOME"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transaction_type: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="INCOME">Gelir</MenuItem>
                  <MenuItem value="EXPENSE">Gider</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tutar"
                type="number"
                value={formData.amount || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₺</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kategori"
                value={formData.category || ""}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Alt Kategori"
                value={formData.subcategory || ""}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hesap</InputLabel>
                <Select
                  value={formData.bank_account_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bank_account_id: e.target.value,
                    })
                  }
                >
                  <MenuItem value="1">Ana Cari Hesap</MenuItem>
                  <MenuItem value="2">Tasarruf Hesabı</MenuItem>
                  <MenuItem value="3">Kredi Kartı Hesabı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Ödeme Yöntemi</InputLabel>
                <Select
                  value={formData.payment_method || "BANK_TRANSFER"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="BANK_TRANSFER">Banka Transferi</MenuItem>
                  <MenuItem value="CASH">Nakit</MenuItem>
                  <MenuItem value="CREDIT_CARD">Kredi Kartı</MenuItem>
                  <MenuItem value="CHECK">Çek</MenuItem>
                  <MenuItem value="BILL">Senet</MenuItem>
                  <MenuItem value="OTHER">Diğer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tarih"
                type="date"
                value={formData.date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Referans No"
                value={formData.reference_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, reference_number: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_reconciled || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_reconciled: e.target.checked,
                      })
                    }
                  />
                }
                label="Mutabakat Yapıldı"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSaveTransaction} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>İşlem Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{selectedTransaction?.description}" işlemini silmek istediğinizden
            emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashFlow;
