import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { keyframes } from "@mui/system";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  AttachMoney as DollarIcon,
  Euro as EuroIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface ExchangeRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

const ExchangeRates: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExchangeRates = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Türkiye Cumhuriyet Merkez Bankası API'sini kullanarak döviz kurlarını al
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );

      if (!response.ok) {
        throw new Error("Döviz kurları alınamadı");
      }

      const data = await response.json();

      // USD/TRY ve EUR/TRY kurlarını hesapla
      const usdTryRate = data.rates.TRY;
      const eurTryRate = data.rates.TRY / data.rates.EUR;

      // Mock data için değişim oranları (gerçek uygulamada geçmiş verilerle karşılaştırılmalı)
      const mockRates: ExchangeRate[] = [
        {
          currency: "USD/TRY",
          rate: usdTryRate,
          change: 0.15,
          changePercent: 0.45,
        },
        {
          currency: "EUR/TRY",
          rate: eurTryRate,
          change: -0.08,
          changePercent: -0.12,
        },
      ];

      setRates(mockRates);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Döviz kurları hatası:", err);
      setError("Döviz kurları yüklenirken hata oluştu");

      // Fallback mock data
      setRates([
        {
          currency: "USD/TRY",
          rate: 33.45,
          change: 0.15,
          changePercent: 0.45,
        },
        {
          currency: "EUR/TRY",
          rate: 36.2,
          change: -0.08,
          changePercent: -0.12,
        },
      ]);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();

    // Otomatik yenileme aktifse her 5 dakikada bir güncelle
    let interval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      interval = setInterval(() => fetchExchangeRates(), 5 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatRate = (rate: number) => {
    return rate.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? "success" : change < 0 ? "error" : "default";
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  if (loading && rates.length === 0) {
    return (
      <Box sx={{ display: "flex", gap: 2 }}>
        <Card sx={{ flex: 1, minHeight: 200 }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Döviz kurları yükleniyor...
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minHeight: 200 }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Döviz kurları yükleniyor...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="primary">
          Güncel Döviz Kurları
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">Otomatik</Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
          <Tooltip title="Manuel Yenile">
            <IconButton
              size="small"
              onClick={() => fetchExchangeRates(true)}
              disabled={refreshing}
              sx={{
                color: "primary.main",
                "&:hover": { backgroundColor: "primary.light", color: "white" },
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 18,
                  animation: refreshing ? `${spin} 1s linear infinite` : "none",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 1, fontSize: "0.75rem" }}>
          {error}
        </Alert>
      )}

      {/* Currency Cards */}
      <Box sx={{ display: "flex", gap: 2 }}>
        {rates.map((rate) => (
          <Card
            key={rate.currency}
            sx={{
              flex: 1,
              minHeight: 200,
              background: `linear-gradient(135deg, ${
                rate.currency.includes("USD") ? "#1976d2" : "#2e7d32"
              } 0%, ${
                rate.currency.includes("USD") ? "#42a5f5" : "#4caf50"
              } 100%)`,
              color: "white",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                transform: "translate(30px, -30px)",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {rate.currency.includes("USD") ? (
                    <DollarIcon sx={{ fontSize: 24 }} />
                  ) : (
                    <EuroIcon sx={{ fontSize: 24 }} />
                  )}
                  <Typography variant="h6" fontWeight="bold">
                    {rate.currency.split("/")[0]}
                  </Typography>
                </Box>
                <Chip
                  icon={getChangeIcon(rate.change)}
                  label={`${formatChange(rate.change)}`}
                  color={getChangeColor(rate.change)}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    "& .MuiChip-icon": {
                      fontSize: 14,
                    },
                  }}
                />
              </Box>

              <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                ₺{formatRate(rate.rate)}
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Türk Lirası
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Değişim: {rate.changePercent.toFixed(2)}%
                </Typography>
                {refreshing && (
                  <CircularProgress size={16} sx={{ color: "white" }} />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {lastUpdate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: "center",
            fontSize: "0.65rem",
          }}
        >
          Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")}
        </Typography>
      )}
    </Box>
  );
};

export default ExchangeRates;
