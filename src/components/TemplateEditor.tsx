import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TemplateService, PrintTemplate } from "../services/templateService";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Description as DocumentIcon,
  Print as PrintIcon,
} from "@mui/icons-material";

export default function TemplateEditor() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await TemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      // Fallback to mock data if database is not available
      setTemplates([
        {
          id: "1",
          tenant_id: "mock-tenant",
          name: "Elektronik Fatura",
          type: "invoice",
          description: "Elektronik Fatura Şablonu",
          elements: [],
          is_active: true,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          tenant_id: "mock-tenant",
          name: "Başlıksız Şablon",
          type: "quote",
          description: "Yazdırma Şablonu",
          elements: [],
          is_active: true,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    navigate("/settings/template-management/new");
  };

  const handleTemplateClick = (templateId: string) => {
    navigate(`/settings/template-management/edit/${templateId}`);
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case "invoice":
        return (
          <Typography sx={{ fontSize: "1rem", fontWeight: "bold" }}>
            e
          </Typography>
        );
      case "quote":
        return <PrintIcon sx={{ fontSize: "1rem" }} />;
      case "receipt":
        return <DocumentIcon sx={{ fontSize: "1rem" }} />;
      default:
        return <DocumentIcon sx={{ fontSize: "1rem" }} />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1e293b" }}>
          Yazdırma Şablonları
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
          sx={{
            backgroundColor: "#64748b",
            color: "white",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "0.875rem",
            "&:hover": {
              backgroundColor: "#475569",
            },
          }}
        >
          YENİ YAZDIRMA ŞABLONU OLUŞTUR
        </Button>
      </Box>

      <Paper
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#64748b",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  ŞABLON İSMİ
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#64748b",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  ŞABLON TÜRÜ
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#64748b",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  SON KULLANILDIĞI TARİH
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  sx={{
                    "&:hover": { backgroundColor: "#f8fafc" },
                    cursor: "pointer",
                  }}
                >
                  <TableCell sx={{ borderBottom: "1px solid #e2e8f0", py: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#e2e8f0",
                          color: "#64748b",
                          fontSize: "0.875rem",
                        }}
                      >
                        {getIcon(template.type)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#1e293b" }}
                      >
                        {template.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #e2e8f0", py: 2 }}>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {template.type === "quote"
                        ? "Teklif Şablonu"
                        : template.type === "invoice"
                        ? "Fatura Şablonu"
                        : template.type === "receipt"
                        ? "Makbuz Şablonu"
                        : template.type}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #e2e8f0", py: 2 }}>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {new Date(template.updated_at).toLocaleDateString(
                        "tr-TR"
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
