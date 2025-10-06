// src/components/UBLTemplateTest.tsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { UBLTemplateService, UBLInvoiceData } from "../services/ublTemplates";

const UBLTemplateTest: React.FC = () => {
  const [testData, setTestData] = useState<UBLInvoiceData>({
    invoiceNumber: "EF2024000001",
    issueDate: "2024-01-15",
    dueDate: "2024-02-15",
    invoiceType: "E-Fatura",
    sender: {
      name: "SafeBase Teknoloji A.Ş.",
      taxNumber: "1234567890",
      address: "Teknoloji Mahallesi, Yazılım Caddesi No:123",
      city: "İstanbul",
      country: "Türkiye",
    },
    receiver: {
      name: "Test Müşteri Ltd. Şti.",
      taxNumber: "0987654321",
      address: "Test Mahallesi, Test Caddesi No:456",
      city: "Ankara",
      country: "Türkiye",
    },
    items: [
      {
        description: "Güvenlik Hizmeti",
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        taxRate: 18,
        taxAmount: 180,
        gtipCode: "8517120000",
      },
    ],
    subtotal: 1000,
    totalTax: 180,
    totalAmount: 1180,
  });

  const [generatedXML, setGeneratedXML] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("E-Fatura");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setTestData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSenderChange = (field: string, value: string) => {
    setTestData((prev) => ({
      ...prev,
      sender: {
        ...prev.sender,
        [field]: value,
      },
    }));
  };

  const handleReceiverChange = (field: string, value: string) => {
    setTestData((prev) => ({
      ...prev,
      receiver: {
        ...prev.receiver,
        [field]: value,
      },
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setTestData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setTestData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "Yeni Hizmet",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          taxRate: 18,
          taxAmount: 0,
          gtipCode: "",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setTestData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const generateXML = () => {
    let xml = "";
    switch (selectedTemplate) {
      case "E-Fatura":
        xml = UBLTemplateService.generateEInvoiceXML(testData);
        break;
      case "E-Arşiv":
        xml = UBLTemplateService.generateEArchiveXML(testData);
        break;
      case "E-İrsaliye":
        xml = UBLTemplateService.generateEWaybillXML(testData);
        break;
      case "E-Müstahsil":
        xml = UBLTemplateService.generateEMusteriXML(testData);
        break;
    }
    setGeneratedXML(xml);

    // XML doğrulama
    const validation = UBLTemplateService.validateXML(xml);
    setValidationResult(validation);
  };

  const downloadXML = () => {
    const blob = new Blob([generatedXML], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testData.invoiceNumber}_${selectedTemplate}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedXML);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        UBL-TR XML Şablon Testi
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Bu sayfa GİB UBL-TR XML şablonlarını test etmek için kullanılır. Farklı
        fatura tiplerinin XML çıktılarını görebilir ve indirebilirsiniz.
      </Alert>

      <Grid container spacing={3}>
        {/* Sol Panel - Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Verileri
              </Typography>

              {/* Fatura Bilgileri */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Fatura Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Fatura Numarası"
                    value={testData.invoiceNumber}
                    onChange={(e) =>
                      handleInputChange("invoiceNumber", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Fatura Tipi</InputLabel>
                    <Select
                      value={testData.invoiceType}
                      onChange={(e) =>
                        handleInputChange("invoiceType", e.target.value)
                      }
                    >
                      <MenuItem value="E-Fatura">E-Fatura</MenuItem>
                      <MenuItem value="E-Arşiv">E-Arşiv</MenuItem>
                      <MenuItem value="E-İrsaliye">E-İrsaliye</MenuItem>
                      <MenuItem value="E-Müstahsil">E-Müstahsil</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Fatura Tarihi"
                    type="date"
                    value={testData.issueDate}
                    onChange={(e) =>
                      handleInputChange("issueDate", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vade Tarihi"
                    type="date"
                    value={testData.dueDate}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* Gönderen Bilgileri */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Gönderen Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Şirket Adı"
                    value={testData.sender.name}
                    onChange={(e) => handleSenderChange("name", e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vergi Numarası"
                    value={testData.sender.taxNumber}
                    onChange={(e) =>
                      handleSenderChange("taxNumber", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Şehir"
                    value={testData.sender.city}
                    onChange={(e) => handleSenderChange("city", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={testData.sender.address}
                    onChange={(e) =>
                      handleSenderChange("address", e.target.value)
                    }
                  />
                </Grid>
              </Grid>

              {/* Alıcı Bilgileri */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Alıcı Bilgileri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Müşteri Adı"
                    value={testData.receiver.name}
                    onChange={(e) =>
                      handleReceiverChange("name", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vergi Numarası"
                    value={testData.receiver.taxNumber}
                    onChange={(e) =>
                      handleReceiverChange("taxNumber", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Şehir"
                    value={testData.receiver.city}
                    onChange={(e) =>
                      handleReceiverChange("city", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adres"
                    value={testData.receiver.address}
                    onChange={(e) =>
                      handleReceiverChange("address", e.target.value)
                    }
                  />
                </Grid>
              </Grid>

              {/* Fatura Kalemleri */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Fatura Kalemleri
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Açıklama</TableCell>
                      <TableCell>Miktar</TableCell>
                      <TableCell>Birim Fiyat</TableCell>
                      <TableCell>KDV %</TableCell>
                      <TableCell>Toplam</TableCell>
                      <TableCell>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "taxRate",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.totalPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "totalPrice",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 1 }}>
                Kalem Ekle
              </Button>

              {/* XML Üret Butonu */}
              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Şablon Tipi</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <MenuItem value="E-Fatura">E-Fatura</MenuItem>
                    <MenuItem value="E-Arşiv">E-Arşiv</MenuItem>
                    <MenuItem value="E-İrsaliye">E-İrsaliye</MenuItem>
                    <MenuItem value="E-Müstahsil">E-Müstahsil</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<CodeIcon />}
                  onClick={generateXML}
                >
                  XML Üret
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Panel - XML Çıktısı */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">XML Çıktısı</Typography>
                {generatedXML && (
                  <Box>
                    <Tooltip title="Kopyala">
                      <IconButton onClick={copyToClipboard}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="İndir">
                      <IconButton onClick={downloadXML}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* Doğrulama Sonucu */}
              {validationResult && (
                <Alert
                  severity={validationResult.isValid ? "success" : "error"}
                  sx={{ mb: 2 }}
                >
                  {validationResult.isValid ? (
                    "XML geçerli ve GİB formatına uygun"
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        XML doğrulama hataları:
                      </Typography>
                      {validationResult.errors.map((error, index) => (
                        <Typography key={index} variant="body2">
                          • {error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}

              {generatedXML ? (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2">
                        {selectedTemplate} XML - {testData.invoiceNumber}
                      </Typography>
                      {validationResult && (
                        <Chip
                          size="small"
                          label={
                            validationResult.isValid ? "Geçerli" : "Hatalı"
                          }
                          color={validationResult.isValid ? "success" : "error"}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      component="pre"
                      sx={{
                        backgroundColor: "#f5f5f5",
                        p: 2,
                        borderRadius: 1,
                        overflow: "auto",
                        maxHeight: 400,
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {generatedXML}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ) : (
                <Alert severity="info">
                  XML üretmek için "XML Üret" butonuna tıklayın.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UBLTemplateTest;


