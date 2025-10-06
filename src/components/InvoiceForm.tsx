import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Stack,
  Chip,
  Alert,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  AddCard as AddCardIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { customerService } from "../services/salesService";

interface InvoiceItem {
  id: string;
  service: string;
  warehouse: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tax: string;
  total: number;
}

interface InvoiceFormData {
  invoiceName: string;
  customer: string;
  customerInfo: string;
  collectionStatus: "Tahsil Edilecek" | "Tahsil Edildi";
  issueDate: string;
  dueDate: string;
  invoiceNumber: string;
  currency: string;
  orderInfo: string;
  invoiceNote: string;
  addCustomerBalanceAsNote: boolean;
  stockTracking: "STOK ÇIKIŞI YAPILSIN" | "STOK ÇIKIŞI YAPILMASIN";
  items: InvoiceItem[];
  category: string;
  label: string;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  // GİB Alanları
  gibInvoiceType:
    | "E-Fatura"
    | "E-Arşiv"
    | "E-İrsaliye"
    | "E-Müstahsil"
    | "Normal Fatura";
  gibStatus:
    | "PENDING"
    | "SENT"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "PROCESSING";
  sendToGib: boolean;
  gibCustomerInfo: {
    tax_identification_number?: string;
    gib_identifier?: string;
    e_invoice_address?: string;
  };
}

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceName: "",
    customer: "",
    customerInfo: "",
    collectionStatus: "Tahsil Edilecek",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    currency: "TRY",
    orderInfo: "",
    invoiceNote: "",
    addCustomerBalanceAsNote: false,
    stockTracking: "STOK ÇIKIŞI YAPILSIN",
    // GİB Alanları
    gibInvoiceType: "Normal Fatura",
    gibStatus: "PENDING",
    sendToGib: false,
    gibCustomerInfo: {
      tax_identification_number: "",
      gib_identifier: "",
      e_invoice_address: "",
    },
    items: [
      {
        id: "1",
        service: "",
        warehouse: "Ana Depo",
        quantity: 1,
        unit: "Adet",
        unitPrice: 0,
        tax: "KDV %20",
        total: 0,
      },
    ],
    category: "KATEGORİSİZ",
    label: "ETİKETSİZ",
    subtotal: 0,
    totalTax: 0,
    grandTotal: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; taxNumber?: string }>
  >([]);
  const [customerLoading, setCustomerLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadInvoiceData();
    }
    loadCustomers();
  }, [id, isEdit]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const loadCustomers = async () => {
    setCustomerLoading(true);
    try {
      // Mock müşteri verisi - gerçek uygulamada API'den gelecek
      const mockCustomers = [
        { id: "1", name: "Mehmet Yılmaz", taxNumber: "1234567890" },
        { id: "2", name: "Ayşe Demir", taxNumber: "0987654321" },
        { id: "3", name: "Mustafa Kaya", taxNumber: "1122334455" },
        { id: "4", name: "Fatma Özkan", taxNumber: "5566778899" },
        { id: "5", name: "Ali Çelik", taxNumber: "9988776655" },
        { id: "6", name: "Zeynep Apartmanı Yönetimi", taxNumber: "1234567891" },
        { id: "7", name: "ABC Teknoloji A.Ş.", taxNumber: "1234567892" },
        { id: "8", name: "XYZ Hizmet Ltd.", taxNumber: "0987654322" },
        { id: "9", name: "DEF Malzeme A.Ş.", taxNumber: "1122334456" },
        { id: "10", name: "GHI Enerji Ltd.", taxNumber: "5566778900" },
        { id: "11", name: "Mehmet Ali Şirketi", taxNumber: "1111111111" },
        { id: "12", name: "Mehmetcan İnşaat", taxNumber: "2222222222" },
        { id: "13", name: "Mehmetoğlu Ticaret", taxNumber: "3333333333" },
        { id: "14", name: "Mert Yapı", taxNumber: "4444444444" },
        { id: "15", name: "Murat Tekstil", taxNumber: "5555555555" },
        { id: "16", name: "Müge Gıda", taxNumber: "6666666666" },
        { id: "17", name: "Merve Turizm", taxNumber: "7777777777" },
        { id: "18", name: "Mertcan Otomotiv", taxNumber: "8888888888" },
        { id: "19", name: "Müjde Eğitim", taxNumber: "9999999999" },
        { id: "20", name: "Mertcan Bilgisayar", taxNumber: "0000000000" },
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Müşteriler yüklenemedi:", error);
    } finally {
      setCustomerLoading(false);
    }
  };

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for editing
      setFormData({
        invoiceName: "ZEYNEP APARTMANI",
        customer: "Zeynep Apartmanı Yönetimi",
        customerInfo:
          "Zeynep Apartmanı Yönetim Şirketi\nAdres: İstanbul, Türkiye\nTel: +90 212 555 0123",
        collectionStatus: "Tahsil Edilecek",
        issueDate: "2025-03-13",
        // GİB Alanları
        gibInvoiceType: "Normal Fatura",
        gibStatus: "PENDING",
        sendToGib: false,
        gibCustomerInfo: {
          tax_identification_number: "",
          gib_identifier: "",
          e_invoice_address: "",
        },
        dueDate: "2025-03-14",
        invoiceNumber: "YS12025000000001",
        currency: "TRY",
        orderInfo: "KS1006998",
        invoiceNote: "Güvenlik hizmetleri için fatura",
        addCustomerBalanceAsNote: false,
        stockTracking: "STOK ÇIKIŞI YAPILSIN",
        items: [
          {
            id: "1",
            service: "Güvenlik Hizmeti",
            warehouse: "Ana Depo",
            quantity: 1,
            unit: "Ay",
            unitPrice: 16784.41,
            tax: "KDV %20",
            total: 20141.29,
          },
        ],
        category: "SITE",
        label: "Güvenlik",
        subtotal: 16784.41,
        totalTax: 3356.88,
        grandTotal: 20141.29,
      });
    } catch (err) {
      setError("Fatura bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Müşteri seçildiğinde GİB bilgilerini yükle
  const handleCustomerChange = async (customerName: string) => {
    setFormData((prev) => ({
      ...prev,
      customer: customerName,
    }));

    // Müşteri adı boşsa GİB bilgilerini temizle
    if (!customerName.trim()) {
      setFormData((prev) => ({
        ...prev,
        gibCustomerInfo: {
          tax_identification_number: "",
          gib_identifier: "",
          e_invoice_address: "",
        },
      }));
      return;
    }

    // Müşteri GİB bilgilerini yükle
    try {
      // Müşteri adına göre arama yap
      const customersResponse = await customerService.getCustomers();
      const customers = customersResponse.data || [];
      const selectedCustomer = customers.find(
        (customer: any) =>
          customer.company_name
            .toLowerCase()
            .includes(customerName.toLowerCase()) ||
          customer.short_name.toLowerCase().includes(customerName.toLowerCase())
      );

      if (selectedCustomer) {
        // Müşteri bulundu, GİB bilgilerini yükle
        setFormData((prev) => ({
          ...prev,
          gibCustomerInfo: {
            tax_identification_number:
              selectedCustomer.tax_identification_number || "",
            gib_identifier: selectedCustomer.gib_identifier || "",
            e_invoice_address: selectedCustomer.e_invoice_address || "",
          },
        }));
      } else {
        // Müşteri bulunamadı, GİB bilgilerini temizle
        setFormData((prev) => ({
          ...prev,
          gibCustomerInfo: {
            tax_identification_number: "",
            gib_identifier: "",
            e_invoice_address: "",
          },
        }));
      }
    } catch (error) {
      console.error("Müşteri GİB bilgileri yüklenemedi:", error);
      // Hata durumunda GİB bilgilerini temizle
      setFormData((prev) => ({
        ...prev,
        gibCustomerInfo: {
          tax_identification_number: "",
          gib_identifier: "",
          e_invoice_address: "",
        },
      }));
    }
  };

  const handleItemChange = (
    itemId: string,
    field: keyof InvoiceItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addNewItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      service: "",
      warehouse: "Ana Depo",
      quantity: 1,
      unit: "Adet",
      unitPrice: 0,
      tax: "KDV %20",
      total: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    formData.items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      // Calculate tax based on tax rate
      const taxRate = parseFloat(item.tax.replace("KDV %", "")) / 100;
      const itemTax = itemTotal * taxRate;
      totalTax += itemTax;

      // Update item total
      const newTotal = itemTotal + itemTax;
      if (item.total !== newTotal) {
        handleItemChange(item.id, "total", newTotal);
      }
    });

    const grandTotal = subtotal + totalTax;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      totalTax,
      grandTotal,
    }));
  };

  const handleDueDateQuickSelect = (days: number) => {
    const issueDate = new Date(formData.issueDate);
    const dueDate = new Date(issueDate);
    dueDate.setDate(issueDate.getDate() + days);
    handleInputChange("dueDate", dueDate.toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Saving invoice:", formData);
      navigate("/accounting/sales/invoices");
    } catch (err) {
      setError("Fatura kaydedilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/sales/invoices");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {isEdit ? "Fatura Düzenle" : "Yeni Fatura Oluştur"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEdit
            ? "Fatura bilgilerini güncelleyin"
            : "Yeni fatura oluşturun ve yönetin"}
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        {/* Header Actions */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3 }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            startIcon={<CancelIcon />}
          >
            VAZGEÇ
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={loading}
            sx={{ background: "linear-gradient(45deg, #d32f2f, #f44336)" }}
          >
            KAYDET
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Fatura Bilgileri */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                FATURA İSMİ
              </Typography>
              <TextField
                fullWidth
                value={formData.invoiceName}
                onChange={(e) =>
                  handleInputChange("invoiceName", e.target.value)
                }
                placeholder="Fatura adını girin"
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" gutterBottom>
                MÜŞTERİ
              </Typography>
              <Autocomplete
                freeSolo
                options={customers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.name;
                }}
                value={formData.customer}
                onChange={(event, newValue) => {
                  if (typeof newValue === "string") {
                    handleCustomerChange(newValue);
                  } else if (newValue) {
                    handleCustomerChange(newValue.name);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  handleCustomerChange(newInputValue);
                }}
                loading={customerLoading}
                filterOptions={(options, { inputValue }) => {
                  const filtered = options.filter((option) =>
                    option.name.toLowerCase().includes(inputValue.toLowerCase())
                  );
                  return filtered;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    placeholder="Müşteri adını girin"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {customerLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {option.name}
                      </Typography>
                      {option.taxNumber && (
                        <Typography variant="caption" color="text.secondary">
                          Vergi No: {option.taxNumber}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 2, display: "block" }}
              >
                Kayıtlı bir müşteri seçebilir veya yeni bir müşteri ismi
                yazabilirsiniz.
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.customerInfo}
                onChange={(e) =>
                  handleInputChange("customerInfo", e.target.value)
                }
                placeholder="Müşteri bilgilerini girin"
                sx={{ mb: 3 }}
              />
            </Box>

            {/* Tahsilat Durumu ve Tarihler */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                TAHŞİLAT DURUMU
              </Typography>
              <RadioGroup
                row
                value={formData.collectionStatus}
                onChange={(e) =>
                  handleInputChange("collectionStatus", e.target.value)
                }
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="Tahsil Edilecek"
                  control={<Radio />}
                  label="✔ TAHŞİL EDİLECEK"
                />
                <FormControlLabel
                  value="Tahsil Edildi"
                  control={<Radio />}
                  label="TAHŞİL EDİLDİ"
                />
              </RadioGroup>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    DÜZENLEME TARİHİ
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      handleInputChange("issueDate", e.target.value)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    VADE TARİHİ
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Quick Due Date Selection */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={
                      formData.dueDate === formData.issueDate
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => handleDueDateQuickSelect(0)}
                  >
                    AYNI GÜN
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDueDateQuickSelect(7)}
                  >
                    7 GÜN
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDueDateQuickSelect(14)}
                  >
                    14 GÜN
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDueDateQuickSelect(30)}
                  >
                    30 GÜN
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDueDateQuickSelect(60)}
                  >
                    60 GÜN
                  </Button>
                </Stack>
              </Box>

              {/* Additional Options */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddCardIcon />}
                  size="small"
                >
                  + FATURA NO EKLE
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CurrencyExchangeIcon />}
                  size="small"
                >
                  DÖVİZ DEĞİŞTİR
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShoppingCartIcon />}
                  size="small"
                >
                  + SİPARİŞ BİLGİSİ EKLE
                </Button>
              </Stack>
            </Box>

            {/* Fatura Notu ve IBAN */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                FATURA NOTU
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.invoiceNote}
                onChange={(e) =>
                  handleInputChange("invoiceNote", e.target.value)
                }
                placeholder="Fatura notlarını girin"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.addCustomerBalanceAsNote}
                    onChange={(e) =>
                      handleInputChange(
                        "addCustomerBalanceAsNote",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Müşteri bakiyesini not olarak ekle"
                sx={{ mb: 2 }}
              />

              <Button
                variant="outlined"
                startIcon={<AccountBalanceIcon />}
                size="small"
              >
                + IBAN BİLGİSİ EKLE
              </Button>
            </Box>

            {/* Stok Takibi */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                STOK TAKİBİ
              </Typography>
              <RadioGroup
                value={formData.stockTracking}
                onChange={(e) =>
                  handleInputChange("stockTracking", e.target.value)
                }
              >
                <FormControlLabel
                  value="STOK ÇIKIŞI YAPILSIN"
                  control={<Radio />}
                  label="STOK ÇIKIŞI YAPILSIN"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 4, mb: 2, display: "block" }}
                >
                  Stok çıkışı fatura ile yapılır. Daha sonra faturadan irsaliye
                  oluşturulamaz ve faturayla irsaliye eşleştirilemez.
                </Typography>
                <FormControlLabel
                  value="STOK ÇIKIŞI YAPILMASIN"
                  control={<Radio />}
                  label="STOK ÇIKIŞI YAPILMASIN"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 4, display: "block" }}
                >
                  Stok takibi gerektirmeyen hizmet/ürünler için kullanılır. Daha
                  sonra faturayla ilişkili irsaliye oluşturulabilir.
                </Typography>
              </RadioGroup>
            </Box>

            {/* Hizmet/Ürün Tablosu */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                HİZMET / ÜRÜN
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>HİZMET/ÜRÜN</TableCell>
                      <TableCell>ÇIKIŞ DEPOSU</TableCell>
                      <TableCell>MİKTAR</TableCell>
                      <TableCell>BİRİM</TableCell>
                      <TableCell>BR. FİYAT</TableCell>
                      <TableCell>VERGİ</TableCell>
                      <TableCell>TOPLAM</TableCell>
                      <TableCell width={100}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.service}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "service",
                                e.target.value
                              )
                            }
                            placeholder="Hizmet/Ürün adı"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={item.warehouse}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "warehouse",
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="Ana Depo">Ana Depo</MenuItem>
                              <MenuItem value="Yan Depo">Yan Depo</MenuItem>
                              <MenuItem value="Dış Depo">Dış Depo</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unit",
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="Adet">Adet</MenuItem>
                              <MenuItem value="Saat">Saat</MenuItem>
                              <MenuItem value="Gün">Gün</MenuItem>
                              <MenuItem value="Ay">Ay</MenuItem>
                              <MenuItem value="Yıl">Yıl</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <MoneyIcon />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={item.tax}
                              onChange={(e) =>
                                handleItemChange(item.id, "tax", e.target.value)
                              }
                            >
                              <MenuItem value="KDV %20">KDV %20</MenuItem>
                              <MenuItem value="KDV %18">KDV %18</MenuItem>
                              <MenuItem value="KDV %8">KDV %8</MenuItem>
                              <MenuItem value="KDV %1">KDV %1</MenuItem>
                              <MenuItem value="KDV %0">KDV %0</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={formatCurrency(item.total)}
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <MoneyIcon />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton size="small" onClick={addNewItem}>
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeItem(item.id)}
                              disabled={formData.items.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addNewItem}
                sx={{ mt: 1 }}
              >
                + YENİ SATIR EKLE
              </Button>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Toplam Kâr: -
                </Typography>
              </Box>
            </Box>

            {/* Özet */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    ARA TOPLAM
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(formData.subtotal)} +
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    TOPLAM KDV
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(formData.totalTax)} +
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" color="text.secondary">
                    GENEL TOPLAM
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {formatCurrency(formData.grandTotal)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Right Column - Kategoriler */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
              <Typography variant="h6" gutterBottom>
                FATURA KATEGORİSİ
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                >
                  <MenuItem value="KATEGORİSİZ">KATEGORİSİZ</MenuItem>
                  <MenuItem value="SITE">SITE</MenuItem>
                  <MenuItem value="GÜVENLİK">GÜVENLİK</MenuItem>
                  <MenuItem value="E-TİCARET">E-TİCARET</MenuItem>
                  <MenuItem value="HİZMET">HİZMET</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 3, display: "block" }}
              >
                Faturaların kategorilere göre dağılımını satışlar raporunda
                takip edebilirsiniz.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="h6" gutterBottom>
                ETİKETLERİ
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Etiket</InputLabel>
                <Select
                  value={formData.label}
                  onChange={(e) => handleInputChange("label", e.target.value)}
                >
                  <MenuItem value="ETİKETSİZ">ETİKETSİZ</MenuItem>
                  <MenuItem value="Güvenlik">Güvenlik</MenuItem>
                  <MenuItem value="Bakım">Bakım</MenuItem>
                  <MenuItem value="Sistem">Sistem</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Etiketler Gelir Gider Raporunda etiket bazında karlılığınızı
                görmenizi sağlar.
              </Typography>
            </Paper>

            {/* GİB Entegrasyon Bölümü */}
            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5", mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                GİB ENTEGRASYON
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendToGib}
                      onChange={(e) =>
                        handleInputChange("sendToGib", e.target.checked)
                      }
                    />
                  }
                  label="GİB'e Gönder"
                />

                {formData.sendToGib && (
                  <>
                    {/* Müşteri GİB Bilgileri Durumu */}
                    {formData.customer && (
                      <Alert
                        severity={
                          formData.gibCustomerInfo.tax_identification_number
                            ? "success"
                            : "warning"
                        }
                        sx={{ mb: 2 }}
                      >
                        {formData.gibCustomerInfo.tax_identification_number
                          ? `Müşteri GİB bilgileri yüklendi: ${formData.customer}`
                          : `Müşteri GİB bilgileri bulunamadı: ${formData.customer}. Lütfen müşteri kaydında GİB bilgilerini kontrol edin.`}
                      </Alert>
                    )}

                    <FormControl fullWidth>
                      <InputLabel>Fatura Tipi</InputLabel>
                      <Select
                        value={formData.gibInvoiceType}
                        onChange={(e) =>
                          handleInputChange("gibInvoiceType", e.target.value)
                        }
                      >
                        <MenuItem value="Normal Fatura">Normal Fatura</MenuItem>
                        <MenuItem value="E-Fatura">E-Fatura</MenuItem>
                        <MenuItem value="E-Arşiv">E-Arşiv</MenuItem>
                        <MenuItem value="E-İrsaliye">E-İrsaliye</MenuItem>
                        <MenuItem value="E-Müstahsil">E-Müstahsil</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Müşteri Vergi Numarası"
                      value={
                        formData.gibCustomerInfo.tax_identification_number || ""
                      }
                      placeholder="Müşteri seçildiğinde otomatik doldurulur"
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Müşteri seçildiğinde otomatik olarak doldurulur"
                    />

                    <TextField
                      fullWidth
                      label="GİB Tanımlayıcı"
                      value={formData.gibCustomerInfo.gib_identifier || ""}
                      placeholder="Müşteri seçildiğinde otomatik doldurulur"
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Müşteri seçildiğinde otomatik olarak doldurulur"
                    />

                    <TextField
                      fullWidth
                      label="E-Fatura Adresi"
                      value={formData.gibCustomerInfo.e_invoice_address || ""}
                      placeholder="Müşteri seçildiğinde otomatik doldurulur"
                      InputProps={{
                        readOnly: true,
                      }}
                      helperText="Müşteri seçildiğinde otomatik olarak doldurulur"
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Durum:
                      </Typography>
                      <Chip
                        label={
                          formData.gibStatus === "PENDING"
                            ? "Beklemede"
                            : formData.gibStatus === "SENT"
                            ? "Gönderildi"
                            : formData.gibStatus === "ACCEPTED"
                            ? "Kabul Edildi"
                            : formData.gibStatus === "REJECTED"
                            ? "Reddedildi"
                            : formData.gibStatus === "CANCELLED"
                            ? "İptal Edildi"
                            : "İşleniyor"
                        }
                        color={
                          formData.gibStatus === "ACCEPTED"
                            ? "success"
                            : formData.gibStatus === "REJECTED"
                            ? "error"
                            : formData.gibStatus === "SENT"
                            ? "info"
                            : "default"
                        }
                        size="small"
                      />
                    </Box>
                  </>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  GİB entegrasyonu için müşteri bilgilerinin doğru olduğundan
                  emin olun.
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default InvoiceForm;
