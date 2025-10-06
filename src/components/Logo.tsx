import React from "react";
import { Box, Typography } from "@mui/material";
import logoImage from "../assets/logo.png";
import { useCorporateSettings } from "../hooks/useCorporateSettings";

const Logo: React.FC = () => {
  const { settings, loading } = useCorporateSettings();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          mb: 2,
        }}
      >
        <Box sx={{ width: 120, height: 50 }} />
      </Box>
    );
  }

  const logoUrl = settings?.logo_url || logoImage;
  const logoAlt = settings?.logo_alt_text || "Gözcü360° Logo";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        mb: 2,
      }}
    >
      {/* Logo Image Only */}
      <Box
        sx={{
          width: 120,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img
          src={logoUrl}
          alt={logoAlt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Box>
    </Box>
  );
};

export default Logo;
