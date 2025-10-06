// Vergi Hesaplama Test Bileşeni
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
  Alert,
  IconButton,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  TaxCalculationService,
  TaxCalculationItem,
  TaxCalculationResult,
} from "../services/taxCalculationService";

const TaxCalculationTest: React.FC = () => {
  const [items, setItems] = useState<TaxCalculationItem[]>([
    {
      description: "Güvenlik Hizmeti",
      quantity: 1,
      unitPrice: 1000,
      taxRate: 18,
      gtipCode: "8517120000",
    },
  ]);

  const [calculationResult, setCalculationResult] =
    useState<TaxCalculationResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleItemChange = (
    index: number,
    field: keyof TaxCalculationItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "Yeni Hizmet",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        gtipCode: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTax = () => {
    // Doğrulama
    const validation = TaxCalculationService.validateTaxCalculation(items);
    setValidationErrors(validation.errors);

    if (validation.isValid) {
      const result = TaxCalculationService.calculateTax(items);
      setCalculationResult(result);
    } else {
      setCalculationResult(null);
    }
  };

  const clearCalculation = () => {
    setCalculationResult(null);
    setValidationErrors([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vergi Hesaplama Testi
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Bu sayfa GİB uyumlu vergi hesaplamalarını test etmek için kullanılır.
        Farklı vergi oranları ve kalemlerle hesaplama yapabilirsiniz.
      </Alert>

      <Grid container spacing={3}>
        {/* Sol Panel - Kalem Girişi */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fatura Kalemleri
              </Typography>

              {/* Hata Mesajları */}
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Doğrulama Hataları:
                  </Typography>
                  {validationErrors.map((error, index) => (
                    <Typography key={index} variant="body2">
                      • {error}
                    </Typography>
                  ))}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Açıklama</TableCell>
                      <TableCell>Miktar</TableCell>
                      <TableCell>Birim Fiyat</TableCell>
                      <TableCell>KDV %</TableCell>
                      <TableCell>GTIP</TableCell>
                      <TableCell>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
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
                            placeholder="Açıklama"
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
                            inputProps={{ min: 0, step: 0.001 }}
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
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={item.taxRate}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "taxRate",
                                  Number(e.target.value)
                                )
                              }
                            >
                              <MenuItem value={0}>%0</MenuItem>
                              <MenuItem value={1}>%1</MenuItem>
                              <MenuItem value={8}>%8</MenuItem>
                              <MenuItem value={18}>%18</MenuItem>
                              <MenuItem value={20}>%20</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.gtipCode || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "gtipCode",
                                e.target.value
                              )
                            }
                            placeholder="GTIP"
                            inputProps={{ maxLength: 10 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outlined"
                >
                  Kalem Ekle
                </Button>
                <Button
                  startIcon={<CalculateIcon />}
                  onClick={calculateTax}
                  variant="contained"
                >
                  Hesapla
                </Button>
                <Button onClick={clearCalculation} variant="outlined">
                  Temizle
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Panel - Hesaplama Sonuçları */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hesaplama Sonuçları
              </Typography>

              {calculationResult ? (
                <Box>
                  {/* Özet Bilgiler */}
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Fatura Özeti
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Kalem Sayısı:
                          </Typography>
                          <Typography variant="h6">
                            {calculationResult.items.length}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Ara Toplam:
                          </Typography>
                          <Typography variant="h6">
                            {TaxCalculationService.formatCurrency(
                              calculationResult.subtotal
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Toplam KDV:
                          </Typography>
                          <Typography variant="h6" color="error">
                            {TaxCalculationService.formatCurrency(
                              calculationResult.totalTax
                            )}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Genel Toplam:
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {TaxCalculationService.formatCurrency(
                              calculationResult.totalAmount
                            )}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Vergi Dağılımı */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Vergi Dağılımı ({calculationResult.taxBreakdown.length}{" "}
                        farklı oran)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>KDV Oranı</TableCell>
                              <TableCell>Matrah</TableCell>
                              <TableCell>KDV Tutarı</TableCell>
                              <TableCell>Kalem Sayısı</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculationResult.taxBreakdown.map(
                              (breakdown, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Chip
                                      label={TaxCalculationService.formatPercentage(
                                        breakdown.taxRate
                                      )}
                                      color={
                                        breakdown.taxRate === 0
                                          ? "default"
                                          : "primary"
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {TaxCalculationService.formatCurrency(
                                      breakdown.taxableAmount
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {TaxCalculationService.formatCurrency(
                                      breakdown.taxAmount
                                    )}
                                  </TableCell>
                                  <TableCell>{breakdown.itemCount}</TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  <Divider sx={{ my: 2 }} />

                  {/* Detaylı Kalem Listesi */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Detaylı Kalem Listesi
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Açıklama</TableCell>
                              <TableCell>Miktar</TableCell>
                              <TableCell>Birim Fiyat</TableCell>
                              <TableCell>Kalem Toplam</TableCell>
                              <TableCell>KDV</TableCell>
                              <TableCell>Toplam</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculationResult.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  {TaxCalculationService.formatCurrency(
                                    item.unitPrice
                                  )}
                                </TableCell>
                                <TableCell>
                                  {TaxCalculationService.formatCurrency(
                                    item.lineTotal
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">
                                      {TaxCalculationService.formatCurrency(
                                        item.taxAmount
                                      )}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      (
                                      {TaxCalculationService.formatPercentage(
                                        item.taxRate
                                      )}
                                      )
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="subtitle2">
                                    {TaxCalculationService.formatCurrency(
                                      item.totalWithTax
                                    )}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ) : (
                <Alert severity="info">
                  Hesaplama yapmak için "Hesapla" butonuna tıklayın.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaxCalculationTest;


