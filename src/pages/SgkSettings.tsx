import React from "react";
import { Container, Typography, Box } from "@mui/material";
import SgkManagement from "../components/SgkManagement";

const SgkSettings: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          SGK Ayarları
        </Typography>
        <Typography variant="body1" color="text.secondary">
          SGK web servisleri entegrasyonu ve ayarları
        </Typography>
      </Box>

      <SgkManagement />
    </Container>
  );
};

export default SgkSettings;
