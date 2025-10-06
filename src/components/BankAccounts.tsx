// Banka Hesapları Bileşeni
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AccountBalance as AccountBalanceIcon,
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
} from "@mui/icons-material";

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  account_type: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
  currency: string;
  balance: number;
  iban: string;
  swift_code?: string;
  branch_code?: string;
  branch_name?: string;
  is_active: boolean;
  opening_date: string;
  created_at: string;
  updated_at: string;
}

const BankAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bank_name: "",
    account_name: "",
    account_number: "",
    account_type: "CHECKING",
    currency: "TRY",
    balance: 0,
    iban: "",
    swift_code: "",
    branch_code: "",
    branch_name: "",
    is_active: true,
    opening_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // Mock data - gerçek uygulamada API'den gelecek
      const mockAccounts: BankAccount[] = [
        {
          id: "1",
          bank_name: "Türkiye İş Bankası",
          account_name: "Ana Cari Hesap",
          account_number: "1234567890",
          account_type: "CHECKING",
          currency: "TRY",
          balance: 125000.5,
          iban: "TR12 0006 4000 0011 2345 6789 01",
          swift_code: "ISBKTRIS",
          branch_code: "0640",
          branch_name: "Merkez Şube",
          is_active: true,
          opening_date: "2023-01-15",
          created_at: "2023-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          bank_name: "Garanti BBVA",
          account_name: "Tasarruf Hesabı",
          account_number: "9876543210",
          account_type: "SAVINGS",
          currency: "TRY",
          balance: 75000.25,
          iban: "TR33 0006 2000 0019 8765 4321 02",
          swift_code: "TGBATRIS",
          branch_code: "0620",
          branch_name: "Kadıköy Şubesi",
          is_active: true,
          opening_date: "2023-03-20",
          created_at: "2023-03-20T14:30:00Z",
          updated_at: "2024-01-10T14:30:00Z",
        },
        {
          id: "3",
          bank_name: "Akbank",
          account_name: "Kredi Kartı Hesabı",
          account_number: "5555666677",
          account_type: "CREDIT",
          currency: "TRY",
          balance: -15000.0,
          iban: "TR64 0004 6000 0005 5556 6666 77",
          swift_code: "AKBKTRIS",
          branch_code: "0460",
          branch_name: "Beşiktaş Şubesi",
          is_active: true,
          opening_date: "2023-06-10",
          created_at: "2023-06-10T09:15:00Z",
          updated_at: "2024-01-05T09:15:00Z",
        },
        {
          id: "4",
          bank_name: "Yapı Kredi",
          account_name: "USD Hesap",
          account_number: "1111222233",
          account_type: "CHECKING",
          currency: "USD",
          balance: 5000.0,
          iban: "TR12 0006 7010 0001 1112 2222 33",
          swift_code: "YAPITRIS",
          branch_code: "0670",
          branch_name: "Şişli Şubesi",
          is_active: true,
          opening_date: "2023-09-05",
          created_at: "2023-09-05T11:45:00Z",
          updated_at: "2024-01-12T11:45:00Z",
        },
        {
          id: "5",
          bank_name: "Ziraat Bankası",
          account_name: "Eski Hesap",
          account_number: "4444555566",
          account_type: "CHECKING",
          currency: "TRY",
          balance: 0.0,
          iban: "TR33 0001 0000 0004 4445 5555 66",
          swift_code: "TCZBTR2A",
          branch_code: "0001",
          branch_name: "Merkez Şube",
          is_active: false,
          opening_date: "2022-01-01",
          created_at: "2022-01-01T08:00:00Z",
          updated_at: "2023-12-31T08:00:00Z",
        },
      ];
      setAccounts(mockAccounts);
    } catch (error) {
      console.error("Banka hesapları yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "CHECKING":
        return "Vadesiz Mevduat";
      case "SAVINGS":
        return "Vadeli Mevduat";
      case "CREDIT":
        return "Kredi Hesabı";
      case "INVESTMENT":
        return "Yatırım Hesabı";
      default:
        return type;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "CHECKING":
        return "primary";
      case "SAVINGS":
        return "success";
      case "CREDIT":
        return "warning";
      case "INVESTMENT":
        return "info";
      default:
        return "default";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "success.main";
    if (balance < 0) return "error.main";
    return "text.secondary";
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUpIcon />;
    if (balance < 0) return <TrendingDownIcon />;
    return <MoneyIcon />;
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_number.includes(searchTerm) ||
      account.iban.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      accountTypeFilter === "all" || account.account_type === accountTypeFilter;
    const matchesCurrency =
      currencyFilter === "all" || account.currency === currencyFilter;

    return matchesSearch && matchesType && matchesCurrency;
  });

  const handleViewAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setViewDialogOpen(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setFormData(account);
    setEditDialogOpen(true);
  };

  const handleDeleteAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    try {
      console.log("Hesap kaydediliyor:", formData);
      // API çağrısı burada yapılacak
      setEditDialogOpen(false);
      setFormData({
        bank_name: "",
        account_name: "",
        account_number: "",
        account_type: "CHECKING",
        currency: "TRY",
        balance: 0,
        iban: "",
        swift_code: "",
        branch_code: "",
        branch_name: "",
        is_active: true,
        opening_date: new Date().toISOString().split("T")[0],
      });
      await loadAccounts();
    } catch (error) {
      console.error("Hesap kaydedilirken hata:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log("Hesap siliniyor:", selectedAccount?.id);
      // API çağrısı burada yapılacak
      setDeleteDialogOpen(false);
      await loadAccounts();
    } catch (error) {
      console.error("Hesap silinirken hata:", error);
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

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  const activeAccounts = accounts.filter((account) => account.is_active).length;
  const totalAccounts = accounts.length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Banka Hesapları
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Banka hesaplarınızı yönetebilir, bakiye takibi yapabilir ve hesap
        hareketlerini görüntüleyebilirsiniz.
      </Alert>

      {/* İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {totalAccounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Hesap
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {activeAccounts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aktif Hesap
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {formatCurrency(totalBalance, "TRY")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Bakiye
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {accounts.filter((a) => a.balance < 0).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Negatif Bakiye
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler ve Arama */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Banka, hesap adı, hesap no veya IBAN ara..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Hesap Tipi</InputLabel>
              <Select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="CHECKING">Vadesiz Mevduat</MenuItem>
                <MenuItem value="SAVINGS">Vadeli Mevduat</MenuItem>
                <MenuItem value="CREDIT">Kredi Hesabı</MenuItem>
                <MenuItem value="INVESTMENT">Yatırım Hesabı</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Para Birimi</InputLabel>
              <Select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="TRY">TRY</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAccounts}
              >
                Yenile
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditDialogOpen(true)}
              >
                Yeni Hesap
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Hesap Listesi */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Banka</TableCell>
                <TableCell>Hesap Adı</TableCell>
                <TableCell>Hesap No</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Para Birimi</TableCell>
                <TableCell>Bakiye</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Açılış Tarihi</TableCell>
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
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Hesap bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {account.bank_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {account.account_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {account.account_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getAccountTypeLabel(account.account_type)}
                        color={getAccountTypeColor(account.account_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {account.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getBalanceIcon(account.balance)}
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={getBalanceColor(account.balance)}
                        >
                          {formatCurrency(account.balance, account.currency)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          account.is_active ? (
                            <CheckCircleIcon />
                          ) : (
                            <WarningIcon />
                          )
                        }
                        label={account.is_active ? "Aktif" : "Pasif"}
                        color={account.is_active ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(account.opening_date)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewAccount(account)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditAccount(account)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAccount(account)}
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

      {/* Hesap Detay Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Hesap Detayları</DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Banka Adı
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.bank_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hesap Adı
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.account_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hesap Numarası
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedAccount.account_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    IBAN
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedAccount.iban}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hesap Tipi
                  </Typography>
                  <Typography variant="body1">
                    {getAccountTypeLabel(selectedAccount.account_type)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Para Birimi
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.currency}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bakiye
                  </Typography>
                  <Typography
                    variant="h6"
                    color={getBalanceColor(selectedAccount.balance)}
                  >
                    {formatCurrency(
                      selectedAccount.balance,
                      selectedAccount.currency
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Durum
                  </Typography>
                  <Chip
                    icon={
                      selectedAccount.is_active ? (
                        <CheckCircleIcon />
                      ) : (
                        <WarningIcon />
                      )
                    }
                    label={selectedAccount.is_active ? "Aktif" : "Pasif"}
                    color={selectedAccount.is_active ? "success" : "warning"}
                    size="small"
                  />
                </Grid>
                {selectedAccount.swift_code && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      SWIFT Kodu
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {selectedAccount.swift_code}
                    </Typography>
                  </Grid>
                )}
                {selectedAccount.branch_name && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Şube
                    </Typography>
                    <Typography variant="body1">
                      {selectedAccount.branch_name}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Açılış Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedAccount.opening_date)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Son Güncelleme
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedAccount.updated_at)}
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

      {/* Hesap Ekleme/Düzenleme Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formData.id ? "Hesap Düzenle" : "Yeni Hesap Ekle"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Banka Adı"
                value={formData.bank_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hesap Adı"
                value={formData.account_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hesap Numarası"
                value={formData.account_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IBAN"
                value={formData.iban || ""}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hesap Tipi</InputLabel>
                <Select
                  value={formData.account_type || "CHECKING"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_type: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="CHECKING">Vadesiz Mevduat</MenuItem>
                  <MenuItem value="SAVINGS">Vadeli Mevduat</MenuItem>
                  <MenuItem value="CREDIT">Kredi Hesabı</MenuItem>
                  <MenuItem value="INVESTMENT">Yatırım Hesabı</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Para Birimi</InputLabel>
                <Select
                  value={formData.currency || "TRY"}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                >
                  <MenuItem value="TRY">TRY</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bakiye"
                type="number"
                value={formData.balance || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.currency}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Açılış Tarihi"
                type="date"
                value={formData.opening_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, opening_date: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SWIFT Kodu"
                value={formData.swift_code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, swift_code: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Şube Adı"
                value={formData.branch_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, branch_name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active || false}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                }
                label="Aktif Hesap"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSaveAccount} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Hesap Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{selectedAccount?.account_name}" hesabını silmek istediğinizden
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

export default BankAccounts;


