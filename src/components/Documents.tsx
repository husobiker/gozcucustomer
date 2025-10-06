import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Description as DocumentIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Folder as FolderIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { useProject } from "../contexts/ProjectContext";

interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  category: string;
  fileSize: number; // bytes
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  version: string;
  isPublic: boolean;
  tags: string[];
  description: string;
  downloadCount: number;
  isActive: boolean;
}

const Documents: React.FC = () => {
  const { selectedProject } = useProject();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Mock data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: "1",
        projectId: selectedProject?.id || "",
        name: "Güvenlik Prosedürleri.pdf",
        type: "PDF",
        category: "Prosedürler",
        fileSize: 2048576, // 2MB
        fileType: "application/pdf",
        uploadedBy: "Ahmet Yılmaz",
        uploadedAt: "2024-01-15T10:30:00Z",
        lastModified: "2024-01-15T10:30:00Z",
        version: "1.0",
        isPublic: true,
        tags: ["güvenlik", "prosedür", "pdf"],
        description: "Güvenlik prosedürleri ve kuralları",
        downloadCount: 15,
        isActive: true,
      },
      {
        id: "2",
        projectId: selectedProject?.id || "",
        name: "Personel Listesi.xlsx",
        type: "Excel",
        category: "Personel",
        fileSize: 512000, // 512KB
        fileType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadedBy: "Fatma Demir",
        uploadedAt: "2024-01-20T14:15:00Z",
        lastModified: "2024-01-25T09:45:00Z",
        version: "2.1",
        isPublic: false,
        tags: ["personel", "liste", "excel"],
        description: "Aktif personel listesi ve bilgileri",
        downloadCount: 8,
        isActive: true,
      },
      {
        id: "3",
        projectId: selectedProject?.id || "",
        name: "Vardiya Çizelgesi.docx",
        type: "Word",
        category: "Vardiya",
        fileSize: 1024000, // 1MB
        fileType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedBy: "Mehmet Kaya",
        uploadedAt: "2024-02-01T08:00:00Z",
        lastModified: "2024-02-01T08:00:00Z",
        version: "1.0",
        isPublic: true,
        tags: ["vardiya", "çizelge", "word"],
        description: "Aylık vardiya çizelgesi",
        downloadCount: 12,
        isActive: true,
      },
      {
        id: "4",
        projectId: selectedProject?.id || "",
        name: "Eğitim Materyali.pptx",
        type: "PowerPoint",
        category: "Eğitim",
        fileSize: 5242880, // 5MB
        fileType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        uploadedBy: "Ayşe Özkan",
        uploadedAt: "2024-02-10T16:20:00Z",
        lastModified: "2024-02-10T16:20:00Z",
        version: "1.0",
        isPublic: true,
        tags: ["eğitim", "sunum", "powerpoint"],
        description: "Personel eğitim sunumu",
        downloadCount: 25,
        isActive: true,
      },
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, [selectedProject]);

  const handleOpenDialog = (document?: Document) => {
    setEditingDocument(document || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDocument(null);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    document: Document
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "📽️";
    if (fileType.includes("image")) return "🖼️";
    return "📁";
  };

  const categories = [
    "Prosedürler",
    "Personel",
    "Vardiya",
    "Eğitim",
    "Raporlar",
    "Sözleşmeler",
    "Diğer",
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Dokümanlar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Projenize ait dokümanlarınızı düzenlemek artık daha kolay
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Yeni Doküman
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Toplam Doküman
                  </Typography>
                  <Typography variant="h4">{documents.length}</Typography>
                </Box>
                <DocumentIcon sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Toplam Boyut
                  </Typography>
                  <Typography variant="h4">
                    {formatFileSize(
                      documents.reduce((sum, d) => sum + d.fileSize, 0)
                    )}
                  </Typography>
                </Box>
                <FolderIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Kategori Sayısı
                  </Typography>
                  <Typography variant="h4">
                    {new Set(documents.map((d) => d.category)).size}
                  </Typography>
                </Box>
                <DocumentIcon sx={{ fontSize: 40, color: "info.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Toplam İndirme
                  </Typography>
                  <Typography variant="h4">
                    {documents.reduce((sum, d) => sum + d.downloadCount, 0)}
                  </Typography>
                </Box>
                <DownloadIcon sx={{ fontSize: 40, color: "warning.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Doküman ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={filterCategory}
                  label="Kategori"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">Tüm Kategoriler</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={5}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  Toplu Yükle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  size="small"
                >
                  Filtrele
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doküman</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Boyut</TableCell>
                  <TableCell>Yükleyen</TableCell>
                  <TableCell>Yüklenme Tarihi</TableCell>
                  <TableCell>Versiyon</TableCell>
                  <TableCell>İndirme</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography variant="h6">
                          {getFileIcon(document.fileType)}
                        </Typography>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {document.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {document.description}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                            {document.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.65rem", height: 20 }}
                              />
                            ))}
                            {document.tags.length > 2 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                +{document.tags.length - 2}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={document.category}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(document.fileSize)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {document.uploadedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(document.uploadedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={document.version}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {document.downloadCount} kez
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          label={document.isActive ? "Aktif" : "Pasif"}
                          color={document.isActive ? "success" : "default"}
                          size="small"
                        />
                        {document.isPublic && (
                          <Chip
                            label="Herkese Açık"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, document)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Görüntüle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>İndir</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Paylaş</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Yazdır</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* Document Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingDocument ? "Doküman Düzenle" : "Yeni Doküman"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Dosya yüklemek için "Dosya Seç" butonunu kullanın veya
                sürükle-bırak yapın.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ py: 2, borderStyle: "dashed" }}
              >
                Dosya Seç veya Sürükle-Bırak
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => {
                    // Handle file upload
                    setUploadProgress(0);
                    const interval = setInterval(() => {
                      setUploadProgress((prev) => {
                        if (prev >= 100) {
                          clearInterval(interval);
                          return 100;
                        }
                        return prev + 10;
                      });
                    }, 100);
                  }}
                />
              </Button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Yükleniyor... %{uploadProgress}
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Doküman Adı"
                defaultValue={editingDocument?.name || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={categories}
                defaultValue={editingDocument?.category || ""}
                renderInput={(params) => (
                  <TextField {...params} label="Kategori" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                multiline
                rows={3}
                defaultValue={editingDocument?.description || ""}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Etiketler (virgülle ayırın)"
                defaultValue={editingDocument?.tags?.join(", ") || ""}
                variant="outlined"
                placeholder="güvenlik, prosedür, pdf"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {editingDocument ? "Güncelle" : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;
