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
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Card,
  CardContent,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Euro as EuroIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import {
  quoteService,
  customerService,
  currencyService,
  Quote,
  QuoteItem,
  Customer,
} from "../services/salesService";
import { productService, Product } from "../services/inventoryService";
import { supabaseAdmin } from "../lib/supabase";
import { useTenant } from "../contexts/TenantContext";

// Remove duplicate interfaces - using imported types

const QuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { tenant } = useTenant();

  const [formData, setFormData] = useState<Partial<Quote>>({
    name: "",
    customer: "",
    customer_description: "",
    preparation_date: new Date().toISOString().split("T")[0],
    due_date: new Date().toISOString().split("T")[0],
    currency: "TRY",
    terms: "",
    items: [
      {
        id: "1",
        service: "",
        quantity: 1,
        unit: "Adet",
        unit_price: 0,
        tax: "KDV %20",
        total: 0,
        isRegistered: false, // Yeni alan: ürün kayıtlı mı?
        isNew: false, // Yeni alan: yeni oluşturulan ürün mü?
      },
    ],
  });

  const [subtotal, setSubtotal] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  // Currency exchange states
  const [exchangeRate, setExchangeRate] = useState(1);
  const [showTlEquivalent, setShowTlEquivalent] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<any>(null);

  // Order information states
  const [showOrderInfo, setShowOrderInfo] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Customer search states
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>(
    []
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);

  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [currentEditingItemId, setCurrentEditingItemId] = useState<
    string | null
  >(null);
  const [dropdownPosition, setDropdownPosition] = useState<"below" | "above">(
    "below"
  );

  // Firma bilgilerini yükle
  const loadCompanyInfo = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("corporate_settings")
        .select("*")
        .eq("tenant_id", tenant?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading company info:", error);
        return;
      }

      if (data) {
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error("Error in loadCompanyInfo:", error);
    }
  };

  // Döviz kurlarını yükle
  const loadExchangeRates = async () => {
    try {
      const rates = await currencyService.getExchangeRates();
      setExchangeRates(rates);

      // Varsayılan kur ayarla
      if (formData.currency === "USD") {
        setExchangeRate(rates.usd.try);
      } else if (formData.currency === "EUR") {
        setExchangeRate(rates.eur.try);
      } else {
        setExchangeRate(1);
      }
    } catch (error) {
      console.error("Error loading exchange rates:", error);
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      loadQuoteData();
    }
    loadCompanyInfo();
    loadExchangeRates();
  }, [id, isEdit]);

  // Customer search effect
  useEffect(() => {
    if (customerSearchTerm.length >= 2) {
      searchCustomers();
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  }, [customerSearchTerm]);

  const loadQuoteData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const quote = await quoteService.getQuote(id);
      setFormData({
        ...quote,
        preparation_date: quote.preparation_date?.split("T")[0] || "",
        due_date: quote.due_date?.split("T")[0] || "",
      });

      // Set customer search term for edit mode
      setCustomerSearchTerm(quote.customer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Teklif yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    try {
      const customers = await customerService.getCustomers({
        page: 1,
        limit: 10,
        search: customerSearchTerm,
      });
      setCustomerSuggestions(customers.data || []);
      setShowCustomerSuggestions(true);
    } catch (err) {
      console.error("Error searching customers:", err);
      setCustomerSuggestions([]);
    }
  };

  // Döviz değiştirme fonksiyonu
  const handleCurrencyChange = (newCurrency: string) => {
    setFormData((prev) => ({
      ...prev,
      currency: newCurrency as "TRY" | "USD" | "EUR",
    }));

    // Kur ayarla
    if (exchangeRates) {
      if (newCurrency === "USD") {
        setExchangeRate(exchangeRates.usd.try);
      } else if (newCurrency === "EUR") {
        setExchangeRate(exchangeRates.eur.try);
      } else {
        setExchangeRate(1);
      }
    }
  };

  // Kur değiştirme fonksiyonu
  const handleExchangeRateChange = (newRate: number) => {
    setExchangeRate(newRate);
  };

  const searchProducts = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
      return;
    }

    try {
      const products = await productService.getAllProducts();
      const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setProductSuggestions(filteredProducts.slice(0, 5)); // Limit to 5 suggestions
      setShowProductSuggestions(true);
    } catch (err) {
      console.error("Error searching products:", err);
      setProductSuggestions([]);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.company_name);
    setFormData((prev) => ({
      ...prev,
      customer: customer.company_name,
      customer_description: `${customer.company_name}\n${
        customer.email || ""
      }\n${customer.phone || ""}\n${customer.address || ""}`.trim(),
    }));
    setShowCustomerSuggestions(false);
    setIsCreatingNewCustomer(false);
  };

  const handleCustomerInputChange = (value: string) => {
    setCustomerSearchTerm(value);
    setFormData((prev) => ({ ...prev, customer: value }));
    setSelectedCustomer(null);
    setIsCreatingNewCustomer(true);
  };

  const createNewCustomer = async () => {
    if (!customerSearchTerm.trim()) return;

    try {
      const newCustomer = await customerService.createCustomer({
        company_name: customerSearchTerm,
        short_name: customerSearchTerm,
        category: "KATEGORİSİZ",
        type: "Tüzel Kişi",
        tax_number: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        district: "",
        balance: 0,
        status: "Aktif",
      });

      setSelectedCustomer(newCustomer);
      setIsCreatingNewCustomer(false);
      setSuccessMessage("Yeni müşteri oluşturuldu");
    } catch (err) {
      setError("Müşteri oluşturulurken hata oluştu");
      console.error("Error creating customer:", err);
    }
  };

  const handleProductSelect = (product: Product, itemId: string) => {
    // Auto-fill product data
    const item = formData.items?.find((item) => item.id === itemId);
    if (item) {
      handleItemChange(itemId, "service", product.name);
      handleItemChange(itemId, "unit", product.unit);
      handleItemChange(itemId, "unit_price", product.sale_price_excluding_tax);
      handleItemChange(itemId, "isRegistered", true); // Kayıtlı ürün olarak işaretle
      handleItemChange(itemId, "isNew", false); // Yeni değil

      // Set tax based on product VAT rate
      const vatRate = product.vat_rate;
      const taxLabel = `KDV %${vatRate}`;
      handleItemChange(itemId, "tax", taxLabel);
    }

    setShowProductSuggestions(false);
    setProductSearchTerm("");
    setCurrentEditingItemId(null);
  };

  const handleProductInputChange = (value: string, itemId: string) => {
    setProductSearchTerm(value);
    setCurrentEditingItemId(itemId);

    // Update the item service field
    handleItemChange(itemId, "service", value);

    // Reset etiketleri - kullanıcı manuel giriş yapıyorsa
    if (value.length < 2) {
      handleItemChange(itemId, "isRegistered", false);
      handleItemChange(itemId, "isNew", false);
    }

    // Search for products
    searchProducts(value);

    // Calculate dropdown position
    setTimeout(() => {
      const inputElement = document.querySelector(`[data-item-id="${itemId}"]`);
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If there's more space above or not enough space below, show above
        if (spaceAbove > spaceBelow && spaceBelow < 300) {
          setDropdownPosition("above");
        } else {
          setDropdownPosition("below");
        }
      }
    }, 0);
  };

  const createNewProduct = async (productName: string, itemId: string) => {
    try {
      const newProduct = await productService.createProduct({
        name: productName,
        product_code: null,
        barcode: null,
        category: "KATEGORİSİZ",
        type: "product" as const,
        unit: "Adet",
        description: null,
        stock_tracking: false,
        critical_stock_level: 0,
        purchase_price_excluding_tax: 0,
        sale_price_excluding_tax: 0,
        vat_rate: 20,
        purchase_price_including_tax: 0,
        sale_price_including_tax: 0,
        currency: "TRY",
        gtip_codes: [],
        status: "active" as const,
      });

      // Auto-fill the new product data
      const item = formData.items?.find((item) => item.id === itemId);
      if (item) {
        handleItemChange(itemId, "service", productName);
        handleItemChange(itemId, "unit", "Adet");
        handleItemChange(itemId, "unit_price", 0);
        handleItemChange(itemId, "isRegistered", true); // Artık kayıtlı
        handleItemChange(itemId, "isNew", true); // Yeni oluşturulan ürün
        handleItemChange(itemId, "tax", "KDV %20");
      }

      setShowProductSuggestions(false);
      setProductSearchTerm("");
      setCurrentEditingItemId(null);

      setSuccessMessage(
        `"${productName}" yeni ürün olarak eklendi ve hizmetlere kaydedildi.`
      );
    } catch (err) {
      console.error("Error creating product:", err);
      setError("Ürün oluşturulurken hata oluştu");
    }
  };

  useEffect(() => {
    // Calculate totals
    if (formData.items) {
      const subtotalValue = formData.items.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      );
      const taxRate = 0.2; // 20% KDV
      const taxValue = subtotalValue * taxRate;
      const grandTotalValue = subtotalValue + taxValue;

      setSubtotal(subtotalValue);
      setTotalTax(taxValue);
      setGrandTotal(grandTotalValue);
    }
  }, [formData.items, formData.currency, exchangeRate]);

  const handleInputChange = (field: keyof Quote, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (
    itemId: string,
    field: keyof QuoteItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items:
        prev.items?.map((item) => {
          if (item.id === itemId) {
            const updatedItem = { ...item, [field]: value };

            // Recalculate total for this item
            if (field === "quantity" || field === "unit_price") {
              const qty =
                typeof updatedItem.quantity === "string"
                  ? parseFloat(updatedItem.quantity) || 0
                  : updatedItem.quantity;
              const price =
                typeof updatedItem.unit_price === "string"
                  ? parseFloat(updatedItem.unit_price) || 0
                  : updatedItem.unit_price;
              updatedItem.total = qty * price;
            }

            return updatedItem;
          }
          return item;
        }) || [],
    }));
  };

  const addNewItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      service: "",
      quantity: 1,
      unit: "Adet",
      unit_price: 0,
      tax: "KDV %20",
      total: 0,
      isRegistered: false,
      isNew: false,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items && formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items?.filter((item) => item.id !== itemId) || [],
      }));
    }
  };

  const handleDueDateQuickSelect = (days: number) => {
    if (formData.preparation_date) {
      const dueDate = new Date(formData.preparation_date);
      dueDate.setDate(dueDate.getDate() + days);
      setFormData((prev) => ({
        ...prev,
        due_date: dueDate.toISOString().split("T")[0],
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.customer) {
        setError("Teklif adı ve müşteri bilgileri zorunludur");
        return;
      }

      const quoteData = {
        name: formData.name,
        customer: formData.customer,
        customer_description: formData.customer_description || "",
        preparation_date: formData.preparation_date || new Date().toISOString(),
        due_date: formData.due_date || new Date().toISOString(),
        currency: formData.currency || "TRY",
        terms: formData.terms || "",
        total_amount: grandTotal,
        invoiced_amount: 0,
        invoice_status: "not_created" as const,
        status: "awaiting_response" as const,
        edit_date: new Date().toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        items: formData.items || [],
      };

      if (isEdit && id) {
        await quoteService.updateQuote(id, quoteData);
        setSuccessMessage("Teklif başarıyla güncellendi");
      } else {
        await quoteService.createQuote(quoteData);
        setSuccessMessage("Teklif başarıyla oluşturuldu");
      }

      setTimeout(() => {
        navigate("/accounting/sales/quotes");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Teklif kaydedilirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/sales/quotes");
  };

  const formatCurrency = (
    amount: number,
    currency: string = formData.currency || "TRY"
  ) => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    } else if (currency === "EUR") {
      return `€${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  const formatCurrencyWithTl = (amount: number) => {
    const formatted = formatCurrency(amount);
    if (formData.currency !== "TRY" && showTlEquivalent) {
      const tlAmount = amount * exchangeRate;
      return `${formatted} (${tlAmount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
      })}₺)`;
    }
    return formatted;
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Teklif yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 0,
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Error/Success Messages */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, mx: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2, mx: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          mb: 2,
          p: 3,
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ color: "#1e293b" }}
        >
          {isEdit ? "Teklif Düzenle" : "Yeni Teklif Oluştur"}
        </Typography>
        <Typography variant="body1" color="#64748b">
          Müşteri teklifi oluşturun ve yönetin
        </Typography>
      </Box>

      <Box sx={{ p: 1.5 }}>
        {/* Header Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            mb: 2,
            p: 1.5,
            backgroundColor: "white",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
            size="small"
            sx={{
              px: 2,
              py: 1,
              borderColor: "#e2e8f0",
              color: "#64748b",
              fontSize: "0.875rem",
              "&:hover": {
                borderColor: "#cbd5e1",
                backgroundColor: "#f8fafc",
              },
            }}
          >
            VAZGEÇ
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            size="small"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "#3b82f6",
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: "#2563eb",
              },
            }}
          >
            {loading ? <CircularProgress size={16} /> : "KAYDET"}
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ width: "100%" }}>
          {/* Left Column */}
          <Grid item xs={12} lg={9}>
            {/* Quote Name */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ color: "#1e293b", fontWeight: 600, fontSize: "1rem" }}
              >
                TEKLİF İSMİ
              </Typography>
              <TextField
                fullWidth
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Teklif adını girin"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                  },
                }}
              />
            </Paper>

            {/* Customer */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ color: "#1e293b", fontWeight: 600, fontSize: "1rem" }}
              >
                MÜŞTERİ
              </Typography>
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  value={customerSearchTerm}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  placeholder="Müşteri adını girin veya arayın..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Customer Suggestions */}
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <Card
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      maxHeight: 300,
                      overflow: "auto",
                      mt: 1,
                    }}
                  >
                    <CardContent sx={{ p: 0 }}>
                      <List>
                        {customerSuggestions.map((customer) => (
                          <ListItemButton
                            key={customer.id}
                            onClick={() => handleCustomerSelect(customer)}
                            sx={{ py: 1 }}
                          >
                            <ListItemText
                              primary={customer.company_name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {customer.email && `📧 ${customer.email}`}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {customer.phone && `📞 ${customer.phone}`}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {customer.type === "Tüzel Kişi"
                                      ? "🏢 Tüzel Kişi"
                                      : "👤 Gerçek Kişi"}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}

                {/* Create New Customer Option */}
                {isCreatingNewCustomer && customerSearchTerm.length >= 2 && (
                  <Card
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 1000,
                      mt: 1,
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        "{customerSearchTerm}" müşterisi bulunamadı
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={createNewCustomer}
                        sx={{ mt: 1 }}
                      >
                        Yeni Müşteri Olarak Ekle
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Kayıtlı müşterileri arayabilir veya yeni müşteri
                oluşturabilirsiniz.
              </Typography>

              {/* Customer Info */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  MÜŞTERİ BİLGİLERİ
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.customer_description || ""}
                  onChange={(e) =>
                    handleInputChange("customer_description", e.target.value)
                  }
                  placeholder="Müşteri bilgilerini girin"
                />

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Seçilen Müşteri:
                    </Typography>
                    <Typography variant="body2">
                      <strong>Şirket:</strong> {selectedCustomer.company_name}
                    </Typography>
                    {selectedCustomer.email && (
                      <Typography variant="body2">
                        <strong>E-posta:</strong> {selectedCustomer.email}
                      </Typography>
                    )}
                    {selectedCustomer.phone && (
                      <Typography variant="body2">
                        <strong>Telefon:</strong> {selectedCustomer.phone}
                      </Typography>
                    )}
                    {selectedCustomer.address && (
                      <Typography variant="body2">
                        <strong>Adres:</strong> {selectedCustomer.address}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Tip:</strong> {selectedCustomer.type}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Kategori:</strong> {selectedCustomer.category}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Dates */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "#1e293b", fontWeight: 600, mb: 2 }}
              >
                TARİH BİLGİLERİ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ color: "#374151", fontWeight: 500 }}
                  >
                    DÜZENLEME TARİHİ
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.preparation_date || ""}
                    onChange={(e) =>
                      handleInputChange("preparation_date", e.target.value)
                    }
                    InputProps={{
                      endAdornment: <CalendarIcon />,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ color: "#374151", fontWeight: 500 }}
                  >
                    VADE TARİHİ
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.due_date || ""}
                    onChange={(e) =>
                      handleInputChange("due_date", e.target.value)
                    }
                    InputProps={{
                      endAdornment: <CalendarIcon />,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Quick Date Selection */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ color: "#6b7280", mb: 2 }}
                >
                  Hızlı Seçim
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label="AYNI GÜN"
                    onClick={() => handleDueDateQuickSelect(0)}
                    sx={{
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      "&:hover": { backgroundColor: "#dbeafe" },
                    }}
                  />
                  <Chip
                    label="7 GÜN"
                    onClick={() => handleDueDateQuickSelect(7)}
                    sx={{
                      backgroundColor: "#f0f9ff",
                      color: "#0369a1",
                      "&:hover": { backgroundColor: "#e0f2fe" },
                    }}
                  />
                  <Chip
                    label="14 GÜN"
                    onClick={() => handleDueDateQuickSelect(14)}
                    sx={{
                      backgroundColor: "#f0fdf4",
                      color: "#166534",
                      "&:hover": { backgroundColor: "#dcfce7" },
                    }}
                  />
                  <Chip
                    label="30 GÜN"
                    onClick={() => handleDueDateQuickSelect(30)}
                    sx={{
                      backgroundColor: "#fefce8",
                      color: "#a16207",
                      "&:hover": { backgroundColor: "#fef3c7" },
                    }}
                  />
                  <Chip
                    label="60 GÜN"
                    onClick={() => handleDueDateQuickSelect(60)}
                    sx={{
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      "&:hover": { backgroundColor: "#fee2e2" },
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Currency Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                DÖVİZ SEÇİMİ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DÖVİZ CİNSİ</InputLabel>
                    <Select
                      value={formData.currency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      label="DÖVİZ CİNSİ"
                    >
                      <MenuItem value="TRY">₺ - Türk Lirası</MenuItem>
                      <MenuItem value="USD">$ - ABD Doları</MenuItem>
                      <MenuItem value="EUR">€ - Euro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.currency !== "TRY" && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="KUR BİLGİSİ"
                      type="number"
                      value={exchangeRate}
                      onChange={(e) =>
                        handleExchangeRateChange(
                          parseFloat(e.target.value) || 0
                        )
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Typography variant="body2" color="text.secondary">
                              {formData.currency} / ₺
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
              </Grid>

              {formData.currency !== "TRY" && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Eğer sabit kur üzerinden ödeme alacaksanız döviz cinsi olarak
                  Türk Lirası seçmelisiniz.
                </Alert>
              )}

              <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="showTlEquivalent"
                  checked={showTlEquivalent}
                  onChange={(e) => setShowTlEquivalent(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor="showTlEquivalent">
                  PDF dosyasında Türk Lirası karşılığını da göster
                </label>
              </Box>
            </Box>

            {/* Order Info */}
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowOrderInfo(!showOrderInfo)}
              >
                SİPARİŞ BİLGİSİ EKLE
              </Button>
            </Box>

            {/* Order Information Form */}
            {showOrderInfo && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: "#f8fafc" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ReceiptIcon sx={{ color: "#6b7280", mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    SİPARİŞ BİLGİLERİ
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="NO"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Sipariş numarası giriniz"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="TARİH"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarIcon sx={{ color: "#6b7280" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Terms */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                TEKLİF KOŞULLARI
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.terms}
                onChange={(e) => handleInputChange("terms", e.target.value)}
                placeholder="Teklifin geçerli olduğu süre, ödeme şartları vb. bilgiler için bu alanı kullanabilirsiniz."
              />
            </Box>

            {/* Items Table */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "#1e293b", fontWeight: 600, mb: 2 }}
              >
                HİZMET / ÜRÜN
              </Typography>
              <TableContainer
                sx={{
                  overflowX: "visible",
                  width: "100%",
                  maxWidth: "100%",
                  minHeight: 250,
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                }}
              >
                <Table
                  sx={{
                    width: "100%",
                    tableLayout: "fixed",
                  }}
                >
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                      <TableCell
                        sx={{
                          width: "35%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        HİZMET/ÜRÜN
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "10%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        MİKTAR
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "10%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        BİRİM
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "12%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        BR. FİYAT
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "10%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        VERGİ
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "12%",
                          fontWeight: 600,
                          color: "#374151",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        TOPLAM
                      </TableCell>
                      <TableCell
                        sx={{
                          width: "11%",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      ></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(formData.items || []).map((item) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#f8fafc",
                          },
                          "&:last-child td": {
                            borderBottom: "none",
                          },
                        }}
                      >
                        <TableCell sx={{ position: "relative" }}>
                          <Box sx={{ position: "relative" }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.service}
                              onChange={(e) =>
                                handleProductInputChange(
                                  e.target.value,
                                  item.id
                                )
                              }
                              placeholder="Hizmet/Ürün adını girin veya arayın..."
                              data-item-id={item.id}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <SearchIcon sx={{ color: "#6b7280" }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                  backgroundColor: "white",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#3b82f6",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#3b82f6",
                                      borderWidth: 2,
                                    },
                                },
                              }}
                            />

                            {/* Ürün Etiketleri */}
                            {item.service && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -8,
                                  right: 8,
                                  zIndex: 1,
                                }}
                              >
                                {item.isRegistered && (
                                  <Chip
                                    label="KAYITLI"
                                    size="small"
                                    sx={{
                                      backgroundColor: "#e8f5e8",
                                      color: "#2e7d32",
                                      fontSize: "0.7rem",
                                      height: 20,
                                      "& .MuiChip-label": {
                                        px: 1,
                                      },
                                    }}
                                  />
                                )}
                                {item.isNew && (
                                  <Chip
                                    label="YENİ"
                                    size="small"
                                    sx={{
                                      backgroundColor: "#fff3e0",
                                      color: "#f57c00",
                                      fontSize: "0.7rem",
                                      height: 20,
                                      ml: item.isRegistered ? 0.5 : 0,
                                      "& .MuiChip-label": {
                                        px: 1,
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Product Suggestions - İyileştirilmiş stil */}
                          {showProductSuggestions &&
                            currentEditingItemId === item.id &&
                            productSuggestions.length > 0 && (
                              <Card
                                sx={{
                                  position: "absolute",
                                  top:
                                    dropdownPosition === "above"
                                      ? "auto"
                                      : "100%",
                                  bottom:
                                    dropdownPosition === "above"
                                      ? "100%"
                                      : "auto",
                                  left: 0,
                                  right: 0,
                                  zIndex: 1000,
                                  maxHeight: 300,
                                  overflow: "auto",
                                  mt: dropdownPosition === "above" ? 0 : 1,
                                  mb: dropdownPosition === "above" ? 1 : 0,
                                  minWidth: 400,
                                  width: "max-content",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <CardContent sx={{ p: 0 }}>
                                  <List sx={{ py: 0 }}>
                                    {productSuggestions.map(
                                      (product, index) => (
                                        <ListItemButton
                                          key={product.id}
                                          onClick={() =>
                                            handleProductSelect(
                                              product,
                                              item.id
                                            )
                                          }
                                          sx={{
                                            py: 1.5,
                                            px: 2,
                                            minHeight: 70,
                                            borderBottom:
                                              index <
                                              productSuggestions.length - 1
                                                ? "1px solid #f0f0f0"
                                                : "none",
                                            "&:hover": {
                                              backgroundColor: "#e8f5e8",
                                            },
                                            "&:last-child": {
                                              borderBottom: "none",
                                            },
                                          }}
                                        >
                                          <ListItemText
                                            primary={
                                              <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                                sx={{ mb: 0.5 }}
                                              >
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    flex: 1,
                                                    fontWeight: 500,
                                                    fontSize: "0.875rem",
                                                  }}
                                                >
                                                  {product.name}
                                                </Typography>
                                                <Chip
                                                  label="KAYITLI"
                                                  size="small"
                                                  sx={{
                                                    backgroundColor: "#e8f5e8",
                                                    color: "#2e7d32",
                                                    fontSize: "0.7rem",
                                                    height: 20,
                                                    fontWeight: 500,
                                                  }}
                                                />
                                              </Stack>
                                            }
                                            secondary={
                                              <Box sx={{ mt: 0.5 }}>
                                                <Typography
                                                  variant="caption"
                                                  display="block"
                                                  sx={{
                                                    color: "#666",
                                                    mb: 0.5,
                                                  }}
                                                >
                                                  💰{" "}
                                                  {
                                                    product.sale_price_excluding_tax
                                                  }{" "}
                                                  {product.currency} • 📦{" "}
                                                  {product.unit}
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  display="block"
                                                  sx={{ color: "#999" }}
                                                >
                                                  🏷️{" "}
                                                  {product.product_code ||
                                                    "Kod yok"}{" "}
                                                  • {product.category}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </ListItemButton>
                                      )
                                    )}
                                  </List>
                                </CardContent>
                              </Card>
                            )}

                          {/* Create New Product Option - İyileştirilmiş stil */}
                          {showProductSuggestions &&
                            currentEditingItemId === item.id &&
                            productSuggestions.length === 0 &&
                            productSearchTerm.length >= 2 && (
                              <Card
                                sx={{
                                  position: "absolute",
                                  top:
                                    dropdownPosition === "above"
                                      ? "auto"
                                      : "100%",
                                  bottom:
                                    dropdownPosition === "above"
                                      ? "100%"
                                      : "auto",
                                  left: 0,
                                  right: 0,
                                  zIndex: 1000,
                                  mt: dropdownPosition === "above" ? 0 : 1,
                                  mb: dropdownPosition === "above" ? 1 : 0,
                                  minWidth: 400,
                                  width: "max-content",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ mb: 2 }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        flex: 1,
                                        fontWeight: 500,
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      "{productSearchTerm}" ürünü bulunamadı
                                    </Typography>
                                    <Chip
                                      label="YENİ"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#fff3e0",
                                        color: "#f57c00",
                                        fontSize: "0.7rem",
                                        height: 20,
                                        fontWeight: 500,
                                      }}
                                    />
                                  </Stack>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                      createNewProduct(
                                        productSearchTerm,
                                        item.id
                                      )
                                    }
                                    sx={{
                                      mt: 1,
                                      backgroundColor: "#1976d2",
                                      "&:hover": {
                                        backgroundColor: "#1565c0",
                                      },
                                    }}
                                  >
                                    Hizmetlere Ekle
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleItemChange(
                                item.id,
                                "quantity",
                                value === "" ? "" : parseFloat(value) || 0
                              );
                            }}
                            sx={{ width: "100%" }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ width: "100%" }}>
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
                            value={item.unit_price}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleItemChange(
                                item.id,
                                "unit_price",
                                value === "" ? "" : parseFloat(value) || 0
                              );
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <MoneyIcon />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ width: "100%" }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ width: "100%" }}>
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
                            sx={{ width: "100%" }}
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
                              disabled={(formData.items || []).length === 1}
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
                size="small"
                sx={{
                  mt: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  borderColor: "#3b82f6",
                  color: "#3b82f6",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  "&:hover": {
                    borderColor: "#2563eb",
                    backgroundColor: "#eff6ff",
                  },
                }}
              >
                YENİ SATIR EKLE
              </Button>
            </Paper>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} lg={3}>
            <Paper
              sx={{
                p: 1.5,
                backgroundColor: "white",
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                position: "sticky",
                top: 20,
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ color: "#1e293b", fontWeight: 600, fontSize: "1rem" }}
              >
                ÖZET
              </Typography>

              <Box
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  backgroundColor: "#f8fafc",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="#64748b">
                  Toplam Kâr: -
                </Typography>
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              <Stack spacing={1.5}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    backgroundColor: "#f8fafc",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#374151", fontWeight: 500 }}
                  >
                    ARA TOPLAM
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: "#1e293b" }}
                    >
                      {formatCurrency(subtotal)}
                    </Typography>
                    <AddIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    backgroundColor: "#f8fafc",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#374151", fontWeight: 500 }}
                  >
                    TOPLAM KDV
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: "#1e293b" }}
                    >
                      {formatCurrency(totalTax)}
                    </Typography>
                    <AddIcon sx={{ fontSize: 16, color: "#6b7280" }} />
                  </Box>
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    backgroundColor: "#eff6ff",
                    borderRadius: 2,
                    border: "2px solid #3b82f6",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "#1e293b" }}
                  >
                    GENEL TOPLAM
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "#1e293b" }}
                  >
                    {formatCurrencyWithTl(grandTotal)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default QuoteForm;
