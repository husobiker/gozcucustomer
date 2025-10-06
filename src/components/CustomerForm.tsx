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
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { customerService, Customer } from "../services/salesService";

interface CustomerFormData {
  company_name: string;
  short_name: string;
  category: string;
  type: "Tüzel Kişi" | "Gerçek Kişi";
  tax_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  balance: number;
  status: "Aktif" | "Pasif";
  // GİB Alanları
  tax_identification_number?: string;
  gib_identifier?: string;
  e_invoice_address?: string;
  e_archive_address?: string;
  e_waybill_address?: string;
  e_musteri_address?: string;
  is_e_invoice_enabled: boolean;
  is_e_archive_enabled: boolean;
  is_e_waybill_enabled: boolean;
  is_e_musteri_enabled: boolean;
  gtip_code?: string;
  company_type?: string;
  authorizedPersons: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
  }>;
}

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<CustomerFormData>({
    company_name: "",
    short_name: "",
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
    // GİB Alanları
    tax_identification_number: "",
    gib_identifier: "",
    e_invoice_address: "",
    e_archive_address: "",
    e_waybill_address: "",
    e_musteri_address: "",
    is_e_invoice_enabled: false,
    is_e_archive_enabled: false,
    is_e_waybill_enabled: false,
    is_e_musteri_enabled: false,
    gtip_code: "",
    company_type: "LTD_STI",
    authorizedPersons: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      loadCustomerData();
    }
  }, [id, isEdit]);

  const loadCustomerData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const customer = await customerService.getCustomer(id);
      setFormData({
        company_name: customer.company_name,
        short_name: customer.short_name,
        category: customer.category,
        type: customer.type,
        tax_number: customer.tax_number,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        district: customer.district,
        balance: customer.balance,
        status: customer.status,
        // GİB Alanları
        tax_identification_number: customer.tax_identification_number || "",
        gib_identifier: customer.gib_identifier || "",
        e_invoice_address: customer.e_invoice_address || "",
        e_archive_address: customer.e_archive_address || "",
        e_waybill_address: customer.e_waybill_address || "",
        e_musteri_address: customer.e_musteri_address || "",
        is_e_invoice_enabled: customer.is_e_invoice_enabled || false,
        is_e_archive_enabled: customer.is_e_archive_enabled || false,
        is_e_waybill_enabled: customer.is_e_waybill_enabled || false,
        is_e_musteri_enabled: customer.is_e_musteri_enabled || false,
        gtip_code: customer.gtip_code || "",
        company_type: customer.company_type || "LTD_STI",
        authorizedPersons: customer.authorized_persons || [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Müşteri bilgileri yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuthorizedPersonChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      authorizedPersons: prev.authorizedPersons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      ),
    }));
  };

  const addAuthorizedPerson = () => {
    setFormData((prev) => ({
      ...prev,
      authorizedPersons: [
        ...prev.authorizedPersons,
        {
          id: Date.now().toString(),
          name: "",
          email: "",
          phone: "",
          notes: "",
        },
      ],
    }));
  };

  const removeAuthorizedPerson = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      authorizedPersons: prev.authorizedPersons.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.company_name || !formData.email) {
        setError("Firma adı ve e-posta adresi zorunludur");
        return;
      }

      const customerData = {
        company_name: formData.company_name,
        short_name: formData.short_name,
        category: formData.category,
        type: formData.type,
        tax_number: formData.tax_number,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        balance: formData.balance,
        status: formData.status,
      };

      if (isEdit && id) {
        await customerService.updateCustomer(id, customerData);
        setSuccessMessage("Müşteri başarıyla güncellendi");
      } else {
        await customerService.createCustomer(customerData);
        setSuccessMessage("Müşteri başarıyla oluşturuldu");
      }

      setTimeout(() => {
        navigate("/accounting/sales/customers");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Müşteri kaydedilirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/accounting/sales/customers");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}₺`;
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Müşteri yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {isEdit ? "Müşteri Düzenle" : "Yeni Müşteri/Firma Ekle"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEdit
            ? "Müşteri bilgilerini güncelleyin"
            : "Yeni müşteri veya firma bilgilerini girin"}
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
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading}
            sx={{ background: "linear-gradient(45deg, #1976d2, #42a5f5)" }}
          >
            {loading ? "KAYDEDİLİYOR..." : "KAYDET"}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Firma Bilgileri */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <BusinessIcon color="primary" />
                Firma Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="FİRMA UNVANI"
                    value={formData.company_name}
                    onChange={(e) =>
                      handleInputChange("company_name", e.target.value)
                    }
                    placeholder="Firma unvanını girin"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="KISA İSİM"
                    value={formData.short_name}
                    onChange={(e) =>
                      handleInputChange("short_name", e.target.value)
                    }
                    placeholder="Kısa isim girin"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>KATEGORİ</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                    >
                      <MenuItem value="KATEGORİSİZ">KATEGORİSİZ</MenuItem>
                      <MenuItem value="SITE">SITE</MenuItem>
                      <MenuItem value="ŞAHIS">ŞAHIS</MenuItem>
                      <MenuItem value="KURUMSAL">KURUMSAL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="E-POSTA ADRESİ"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="TELEFON NUMARASI"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+90 212 555 0123"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Adres Bilgileri */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Adres Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="AÇIK ADRESİ"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Tam adres bilgilerini girin"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="İLÇE"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    placeholder="Şişli"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="İL"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="İstanbul"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Yasal ve Finansal Bilgiler */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Yasal ve Finansal Bilgiler
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormLabel component="legend">TÜRÜ</FormLabel>
                  <RadioGroup
                    row
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                  >
                    <FormControlLabel
                      value="Tüzel Kişi"
                      control={<Radio />}
                      label="Tüzel Kişi"
                    />
                    <FormControlLabel
                      value="Gerçek Kişi"
                      control={<Radio />}
                      label="Gerçek Kişi"
                    />
                  </RadioGroup>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Şahıs şirketleri dahil LTD, AŞ, vb. tüm şirketler Tüzel Kişi
                    kapsamındadır.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="VKN / TCKN"
                    value={formData.tax_number}
                    onChange={(e) =>
                      handleInputChange("tax_number", e.target.value)
                    }
                    placeholder="Vergi Kimlik Numarası"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="BAKİYE"
                    type="number"
                    value={formData.balance}
                    onChange={(e) =>
                      handleInputChange(
                        "balance",
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
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>DURUM</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                    >
                      <MenuItem value="Aktif">Aktif</MenuItem>
                      <MenuItem value="Pasif">Pasif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Yetkili Kişi Bilgileri */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Yetkili Kişi Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>YETKİLİ KİŞİNİN ADI</TableCell>
                      <TableCell>E-POSTA</TableCell>
                      <TableCell>TELEFON</TableCell>
                      <TableCell>NOTLAR</TableCell>
                      <TableCell width={100}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.authorizedPersons.map((person, index) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={person.name}
                            onChange={(e) =>
                              handleAuthorizedPersonChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Ad Soyad"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            type="email"
                            value={person.email}
                            onChange={(e) =>
                              handleAuthorizedPersonChange(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                            placeholder="email@example.com"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={person.phone}
                            onChange={(e) =>
                              handleAuthorizedPersonChange(
                                index,
                                "phone",
                                e.target.value
                              )
                            }
                            placeholder="+90 532 555 0123"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={person.notes}
                            onChange={(e) =>
                              handleAuthorizedPersonChange(
                                index,
                                "notes",
                                e.target.value
                              )
                            }
                            placeholder="Notlar"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeAuthorizedPerson(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addAuthorizedPerson}
                sx={{ mt: 1 }}
              >
                BİR YETKİLİ EKLE
              </Button>
            </Box>

            {/* GİB Bilgileri */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                GİB BİLGİLERİ
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vergi Kimlik Numarası"
                    value={formData.tax_identification_number || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "tax_identification_number",
                        e.target.value
                      )
                    }
                    placeholder="1234567890"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GİB Tanımlayıcı"
                    value={formData.gib_identifier || ""}
                    onChange={(e) =>
                      handleInputChange("gib_identifier", e.target.value)
                    }
                    placeholder="GIB123456789"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-Fatura Adresi"
                    value={formData.e_invoice_address || ""}
                    onChange={(e) =>
                      handleInputChange("e_invoice_address", e.target.value)
                    }
                    placeholder="efatura@example.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-Arşiv Adresi"
                    value={formData.e_archive_address || ""}
                    onChange={(e) =>
                      handleInputChange("e_archive_address", e.target.value)
                    }
                    placeholder="earsiv@example.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-İrsaliye Adresi"
                    value={formData.e_waybill_address || ""}
                    onChange={(e) =>
                      handleInputChange("e_waybill_address", e.target.value)
                    }
                    placeholder="eirsaliye@example.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-Müşteri Adresi"
                    value={formData.e_musteri_address || ""}
                    onChange={(e) =>
                      handleInputChange("e_musteri_address", e.target.value)
                    }
                    placeholder="emusteri@example.com"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GTIP Kodu"
                    value={formData.gtip_code || ""}
                    onChange={(e) =>
                      handleInputChange("gtip_code", e.target.value)
                    }
                    placeholder="8517120000"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Şirket Türü</InputLabel>
                    <Select
                      value={formData.company_type || "LTD_STI"}
                      onChange={(e) =>
                        handleInputChange("company_type", e.target.value)
                      }
                    >
                      <MenuItem value="LTD_STI">Limited Şirketi</MenuItem>
                      <MenuItem value="ANONIM_SIRKET">Anonim Şirket</MenuItem>
                      <MenuItem value="KOMANDIT_SIRKET">
                        Komandit Şirket
                      </MenuItem>
                      <MenuItem value="KOLEKTIF_SIRKET">
                        Kolektif Şirket
                      </MenuItem>
                      <MenuItem value="SERBEST_MESLEK">Serbest Meslek</MenuItem>
                      <MenuItem value="GERCEK_KISI">Gerçek Kişi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* E-Fatura Seçenekleri */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
                E-Fatura Seçenekleri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_e_invoice_enabled}
                        onChange={(e) =>
                          handleInputChange(
                            "is_e_invoice_enabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="E-Fatura"
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_e_archive_enabled}
                        onChange={(e) =>
                          handleInputChange(
                            "is_e_archive_enabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="E-Arşiv"
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_e_waybill_enabled}
                        onChange={(e) =>
                          handleInputChange(
                            "is_e_waybill_enabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="E-İrsaliye"
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_e_musteri_enabled}
                        onChange={(e) =>
                          handleInputChange(
                            "is_e_musteri_enabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="E-Müşteri"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
              <Typography variant="h6" gutterBottom>
                ÖZET
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Firma Türü
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.type}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Kategori
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.category}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Durum
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.status}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Bakiye
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(formData.balance)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Yetkili Kişi Sayısı
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.authorizedPersons.length}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CustomerForm;
