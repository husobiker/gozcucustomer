import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const Reports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Raporlar
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Raporlar sayfası yakında eklenecek.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Reports;
