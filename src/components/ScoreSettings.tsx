import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const ScoreSettings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Puan Ayarları
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Puan ayarları yönetimi sayfası yakında eklenecek.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ScoreSettings;
