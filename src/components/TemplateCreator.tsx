import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCorporateSettings } from "../hooks/useCorporateSettings";
import { useTenant } from "../contexts/TenantContext";
import {
  TemplateService,
  TemplateElement,
  TemplateElementType,
} from "../services/templateService";
import logoImage from "../assets/logo.png";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Calculate as CalculateIcon,
  Note as NoteIcon,
  ArrowBack as ArrowBackIcon,
  DragIndicator as DragIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  CalendarToday as DateIcon,
  Euro as CurrencyIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

// TemplateElementType and TemplateElement are now imported from templateService.ts

// Draggable Page Element Component for A4 Page Layout
function DraggablePageElement({
  element,
  onDelete,
  onPositionChange,
  onElementUpdate,
  corporateSettings,
  tenant,
  onElementSelect,
  selectedElementId,
}: {
  element: TemplateElement;
  onDelete: (id: string) => void;
  onPositionChange: (
    elementId: string,
    newPosition: { x: number; y: number }
  ) => void;
  onElementUpdate: (
    elementId: string,
    updates: Partial<TemplateElement>
  ) => void;
  corporateSettings?: any;
  tenant?: any;
  onElementSelect?: (elementId: string | null) => void;
  selectedElementId?: string | null;
}) {
  const [position, setPosition] = React.useState({
    x: element.position?.x || 0,
    y: element.position?.y || 0,
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(element.content || "");

  // Sync position state with element.position changes
  React.useEffect(() => {
    if (element.position) {
      console.log(
        `Syncing position for element ${element.id}:`,
        element.position
      );
      setPosition({
        x: element.position.x || 0,
        y: element.position.y || 0,
      });
    }
  }, [element.position, element.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("Mouse down event triggered!", e);
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onElementSelect) {
      onElementSelect(element.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const editableTypes = ["header", "subheader", "text"];
    if (editableTypes.includes(element.type)) {
      setIsEditing(true);
      setEditContent(element.content || "");
    }
  };

  const handleSaveEdit = () => {
    if (onElementUpdate) {
      onElementUpdate(element.id, { content: editContent });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(element.content || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    console.log(`Moving element ${element.id} to position:`, {
      x: newX,
      y: newY,
    });
    setPosition({ x: newX, y: newY });
    onPositionChange(element.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, handleMouseMove, handleMouseUp]);

  const style = {
    position: "absolute" as const,
    left: position.x,
    top: position.y,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const getElementIcon = (type: TemplateElementType) => {
    switch (type) {
      case "header":
        return <DescriptionIcon />;
      case "subheader":
        return <TextIcon />;
      case "text":
        return <TextIcon />;
      case "image":
        return <ImageIcon />;
      case "customer_info":
        return <BusinessIcon />;
      case "company_info":
        return <BusinessIcon />;
      case "date":
        return <DateIcon />;
      case "items_table":
        return <TableIcon />;
      case "totals":
        return <CalculateIcon />;
      case "terms":
        return <NoteIcon />;
      case "divider":
        return <DragIcon />;
      case "spacer":
        return <DragIcon />;
      case "signature":
        return <DescriptionIcon />;
      case "footer":
        return <DescriptionIcon />;
      // Şirket bilgileri parça parça
      case "company_name":
        return <BusinessIcon />;
      case "company_address":
        return <BusinessIcon />;
      case "company_contact":
        return <PhoneIcon />;
      case "company_logo":
        return <ImageIcon />;
      // Müşteri bilgileri parça parça
      case "customer_name":
        return <BusinessIcon />;
      case "customer_full_name":
        return <BusinessIcon />;
      case "customer_address":
        return <BusinessIcon />;
      case "customer_full_info":
        return <BusinessIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Element content renderer for A4 page layout
  const renderElementContent = (element: TemplateElement) => {
    console.log(
      "Rendering element:",
      element.type,
      "content:",
      element.content
    );

    // If element has content, show it as simple text (except for special elements)
    if (
      element.content &&
      !["items_table", "totals", "customer_info", "company_info"].includes(
        element.type
      )
    ) {
      console.log("Showing content:", element.content);
      return (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            ...element.styles,
          }}
        >
          {element.content}
        </Typography>
      );
    }

    const elementStyles = {
      ...element.styles,
      padding: element.styles?.padding
        ? `${element.styles.padding}px`
        : undefined,
      margin: element.styles?.margin ? `${element.styles.margin}px` : undefined,
      fontSize: element.styles?.fontSize
        ? `${element.styles.fontSize}px`
        : undefined,
      borderRadius: element.styles?.borderRadius
        ? `${element.styles.borderRadius}px`
        : undefined,
    };

    switch (element.type) {
      case "header":
        return (
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mb: 2,
              textAlign: "center",
              ...elementStyles,
            }}
          >
            {element.content || element.data?.placeholder || "TEKLİF"}
          </Typography>
        );

      case "items_table":
        return (
          <Box sx={{ mb: 3, ...elementStyles }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 100px 60px 120px",
                gap: 1,
                borderBottom: "2px solid #1976d2",
                pb: 1,
                mb: 2,
                fontWeight: "bold",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Hizmet veya ürünün tanımı
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                Miktar
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "right" }}
              >
                Birim Fiyat
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                İndirim
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                KDV
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "right" }}
              >
                Toplam
              </Typography>
            </Box>
            {Array.from({ length: 10 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 100px 60px 60px 120px",
                  gap: 1,
                  py: 1,
                  borderBottom: i < 9 ? "1px solid #e2e8f0" : "none",
                }}
              >
                <Typography variant="body2">
                  Hizmet veya ürünün tanımı
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  1
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  1.000,00 ₺
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  0,00 ₺
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  %20
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  1.000,00 ₺
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case "totals":
        return (
          <Box sx={{ textAlign: "right", mb: 3, ...elementStyles }}>
            <Box sx={{ display: "inline-block", minWidth: 300 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Ara Toplam:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  10.000,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">İndirim:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  0,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">KDV:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  2.000,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "2px solid #1976d2",
                  pt: 1,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  Genel Toplam:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  12.000,00 ₺
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case "customer_info":
        return (
          <Box sx={{ mb: 3, ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Müşteri Unvanı Tasarım Reklam LTD. ŞTİ.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Herhangi Mah. Örnek Sok. Güzel Apt. No:5 Daire:7 34435 Beyoğlu,
              İstanbul
            </Typography>
            <Typography variant="body2">Beyoğlu V.D. 1234567890</Typography>
            <Typography variant="body2">Tel: +90 212 555 0123</Typography>
          </Box>
        );

      case "company_info":
        return (
          <Box sx={{ mb: 3, textAlign: "left", ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              {corporateSettings?.company_name ||
                corporateSettings?.company_full_name ||
                "Şirket Unvanı"}
            </Typography>
            {corporateSettings?.company_address && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {corporateSettings.company_address}
              </Typography>
            )}
            {corporateSettings?.tax_office && (
              <Typography variant="body2">
                Vergi Dairesi: {corporateSettings.tax_office}
              </Typography>
            )}
            {corporateSettings?.tax_number && (
              <Typography variant="body2">
                Vergi No: {corporateSettings.tax_number}
              </Typography>
            )}
            {corporateSettings?.company_phone && (
              <Typography variant="body2">
                Tel: {corporateSettings.company_phone}
              </Typography>
            )}
            {corporateSettings?.company_email && (
              <Typography variant="body2">
                E-posta: {corporateSettings.company_email}
              </Typography>
            )}
          </Box>
        );

      // Şirket bilgileri parça parça
      case "company_name":
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
              mb: 2,
              textAlign: "left",
              ...elementStyles,
            }}
          >
            {corporateSettings?.company_name ||
              corporateSettings?.company_full_name ||
              "Şirket Unvanı"}
          </Typography>
        );

      case "company_address":
        return (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              textAlign: "left",
              ...elementStyles,
            }}
          >
            {corporateSettings?.company_address || "Şirket Adresi"}
          </Typography>
        );

      case "company_contact":
        return (
          <Box sx={{ mb: 2, textAlign: "left", ...elementStyles }}>
            {corporateSettings?.tax_office && (
              <Typography variant="body2">
                Vergi Dairesi: {corporateSettings.tax_office}
              </Typography>
            )}
            {corporateSettings?.tax_number && (
              <Typography variant="body2">
                Vergi No: {corporateSettings.tax_number}
              </Typography>
            )}
            {corporateSettings?.company_phone && (
              <Typography variant="body2">
                Tel: {corporateSettings.company_phone}
              </Typography>
            )}
            {corporateSettings?.company_email && (
              <Typography variant="body2">
                E-posta: {corporateSettings.company_email}
              </Typography>
            )}
            {!corporateSettings?.tax_office &&
              !corporateSettings?.tax_number &&
              !corporateSettings?.company_phone &&
              !corporateSettings?.company_email && (
                <Typography variant="body2" color="text.secondary">
                  İletişim bilgileri bulunamadı
                </Typography>
              )}
          </Box>
        );

      case "company_logo":
        console.log(
          "DraggablePageElement - Rendering company_logo with settings:",
          corporateSettings
        );
        console.log("Logo URL check:", corporateSettings?.logo_url);
        console.log(
          "Logo URL null check:",
          corporateSettings?.logo_url === null
        );
        console.log(
          "Logo URL undefined check:",
          corporateSettings?.logo_url === undefined
        );
        console.log(
          "Logo URL trim check:",
          corporateSettings?.logo_url?.trim()
        );
        console.log(
          "Logo URL empty check:",
          corporateSettings?.logo_url?.trim() === ""
        );
        return (
          <Box sx={{ mb: 2, textAlign: "left", ...elementStyles }}>
            {(() => {
              // Sidebar'daki mantığı kullan: tenant.branding.logo varsa onu kullan, yoksa corporateSettings.logo_url, yoksa default logo
              const logoUrl =
                tenant?.branding?.logo ||
                corporateSettings?.logo_url ||
                logoImage;
              const logoAlt =
                corporateSettings?.logo_alt_text || "Şirket Logosu";

              console.log("Final logo URL:", logoUrl);
              console.log("Final logo alt:", logoAlt);
              console.log(
                "Logo source:",
                tenant?.branding?.logo
                  ? "tenant.branding.logo"
                  : corporateSettings?.logo_url
                  ? "corporateSettings.logo_url"
                  : "default logo"
              );

              return (
                <Box
                  sx={{
                    width: "120px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <img
                    src={logoUrl}
                    alt={logoAlt}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    onLoad={() => {
                      console.log(
                        "DraggablePageElement - Logo başarıyla yüklendi:",
                        logoUrl
                      );
                    }}
                    onError={(e) => {
                      console.error(
                        "DraggablePageElement - Logo yüklenemedi:",
                        logoUrl
                      );
                      console.error("Error event:", e);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </Box>
              );
            })()}
          </Box>
        );

      // Müşteri bilgileri parça parça
      case "customer_name":
        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
              mb: 2,
              ...elementStyles,
            }}
          >
            Müşteri Unvanı Tasarım Reklam LTD. ŞTİ.
          </Typography>
        );

      case "customer_full_name":
        return (
          <Box sx={{ mb: 2, ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Müşteri Unvanı Tasarım Reklam LTD. ŞTİ.
            </Typography>
            <Typography variant="body2">Ad Soyad: Ahmet Yılmaz</Typography>
          </Box>
        );

      case "customer_address":
        return (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              ...elementStyles,
            }}
          >
            Herhangi Mah. Örnek Sok. Güzel Apt. No:5 Daire:7
            <br />
            34435 Beyoğlu, İstanbul
          </Typography>
        );

      case "customer_full_info":
        return (
          <Box sx={{ mb: 3, ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Müşteri Unvanı Tasarım Reklam LTD. ŞTİ.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Herhangi Mah. Örnek Sok. Güzel Apt. No:5 Daire:7 34435 Beyoğlu,
              İstanbul
            </Typography>
            <Typography variant="body2">Beyoğlu V.D. 1234567890</Typography>
            <Typography variant="body2">Tel: +90 212 555 0123</Typography>
          </Box>
        );

      case "date":
        return (
          <Typography
            variant="body2"
            sx={{
              textAlign: "right",
              mb: 2,
              fontStyle: "italic",
              ...elementStyles,
            }}
          >
            {element.data?.defaultValue || "10.12.2014"}
          </Typography>
        );

      case "text":
        return (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              ...elementStyles,
            }}
          >
            {element.content ||
              element.data?.placeholder ||
              "Metin içeriği buraya yazılacak..."}
          </Typography>
        );

      default:
        return (
          <Box sx={{ p: 1, border: "1px dashed #e2e8f0", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {element.type} elementi
            </Typography>
          </Box>
        );
    }
  };

  const isSelected = selectedElementId === element.id;

  return (
    <Box
      style={style}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      sx={{
        minWidth: "100px",
        minHeight: "30px",
        border: isSelected
          ? "2px solid #1976d2"
          : isDragging
          ? "2px solid #1976d2"
          : "1px solid transparent",
        borderRadius: 1,
        p: 1,
        backgroundColor: isSelected
          ? "rgba(25, 118, 210, 0.1)"
          : isDragging
          ? "rgba(25, 118, 210, 0.05)"
          : "transparent",
        "&:hover": {
          border: isSelected ? "2px solid #1976d2" : "1px solid #1976d2",
          backgroundColor: isSelected
            ? "rgba(25, 118, 210, 0.1)"
            : "rgba(25, 118, 210, 0.02)",
        },
        cursor: "pointer",
      }}
    >
      {/* Element Content */}
      <Box sx={{ position: "relative" }}>
        {/* Drag Handle */}
        <Box
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 24,
            height: 24,
            backgroundColor: "#1976d2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            zIndex: 1000,
            opacity: 1,
            border: "2px solid white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            "&:hover": {
              backgroundColor: "#1565c0",
              transform: "scale(1.1)",
              transition: "all 0.2s",
            },
            "&:active": {
              cursor: "grabbing",
              transform: "scale(0.95)",
            },
          }}
        >
          <DragIcon sx={{ fontSize: 14, color: "white" }} />
        </Box>

        {/* Delete Button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(element.id);
          }}
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            backgroundColor: "error.main",
            color: "white",
            width: 24,
            height: 24,
            fontSize: "12px",
            "&:hover": {
              backgroundColor: "error.dark",
            },
            zIndex: 1000,
          }}
        >
          <DeleteIcon sx={{ fontSize: "14px" }} />
        </IconButton>

        {/* Delete Button */}
        {!element.required && !element.locked && (
          <Box
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              backgroundColor: "#f44336",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              opacity: isDragging ? 1 : 0,
              transition: "opacity 0.2s",
              "&:hover": { opacity: 1 },
            }}
            onClick={() => onDelete(element.id)}
          >
            <DeleteIcon sx={{ fontSize: 12, color: "white" }} />
          </Box>
        )}

        {/* Element Label */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: -20,
            left: 0,
            backgroundColor: "#1976d2",
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: "10px",
            opacity: isDragging ? 1 : 0,
            transition: "opacity 0.2s",
            "&:hover": { opacity: 1 },
          }}
        >
          {getElementIcon(element.type)} {element.label}
        </Typography>

        {/* Actual Element Content */}
        <Box
          sx={{ pointerEvents: isDragging ? "none" : "auto" }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <Box sx={{ position: "relative" }}>
              <TextField
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                multiline
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    padding: 0,
                    fontSize: element.styles?.fontSize || 12,
                    fontWeight: element.styles?.fontWeight || "normal",
                    color: element.styles?.color || "inherit",
                  },
                  "& .MuiOutlinedInput-input": {
                    padding: "4px 8px",
                  },
                }}
                autoFocus
              />
              <Box
                sx={{
                  position: "absolute",
                  top: -30,
                  right: 0,
                  display: "flex",
                  gap: 1,
                  backgroundColor: "white",
                  padding: "2px 4px",
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Button size="small" onClick={handleSaveEdit} color="primary">
                  ✓
                </Button>
                <Button
                  size="small"
                  onClick={handleCancelEdit}
                  color="secondary"
                >
                  ✕
                </Button>
              </Box>
            </Box>
          ) : (
            renderElementContent(element)
          )}
        </Box>
      </Box>
    </Box>
  );
}

// Draggable Template Element Component (for sidebar preview)
function DraggableTemplateElement({
  element,
  onDelete,
}: {
  element: TemplateElement;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getElementIcon = (type: TemplateElementType) => {
    switch (type) {
      case "header":
        return <DescriptionIcon />;
      case "subheader":
        return <TextIcon />;
      case "text":
        return <TextIcon />;
      case "image":
        return <ImageIcon />;
      case "customer_info":
        return <BusinessIcon />;
      case "company_info":
        return <BusinessIcon />;
      case "date":
        return <DateIcon />;
      case "items_table":
        return <TableIcon />;
      case "totals":
        return <CalculateIcon />;
      case "terms":
        return <NoteIcon />;
      case "divider":
        return <DragIcon />;
      case "spacer":
        return <DragIcon />;
      case "signature":
        return <DescriptionIcon />;
      case "footer":
        return <DescriptionIcon />;
      // Şirket bilgileri parça parça
      case "company_name":
        return <BusinessIcon />;
      case "company_address":
        return <BusinessIcon />;
      case "company_contact":
        return <PhoneIcon />;
      case "company_logo":
        return <ImageIcon />;
      // Müşteri bilgileri parça parça
      case "customer_name":
        return <BusinessIcon />;
      case "customer_full_name":
        return <BusinessIcon />;
      case "customer_address":
        return <BusinessIcon />;
      case "customer_full_info":
        return <BusinessIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        cursor: isDragging ? "grabbing" : "grab",
        "&:hover": { boxShadow: 2, bgcolor: "grey.50" },
        border: isDragging ? "2px dashed #1976d2" : "1px solid #e2e8f0",
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            size="small"
            {...attributes}
            {...listeners}
            sx={{ cursor: "grab" }}
          >
            <DragIcon />
          </IconButton>

          {getElementIcon(element.type)}

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {element.label}
            </Typography>
            {element.content && (
              <Typography variant="caption" color="text.secondary">
                {element.content.substring(0, 50)}...
              </Typography>
            )}
          </Box>

          {element.required && (
            <Chip
              label="Zorunlu"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}

          {!element.required && (
            <IconButton size="small" onClick={() => onDelete(element.id)}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Draggable Element for Sidebar
function SidebarElement({ element }: { element: Omit<TemplateElement, "id"> }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `sidebar-${element.type}`,
      data: element,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getElementIcon = (type: TemplateElementType) => {
    switch (type) {
      case "header":
        return <DescriptionIcon />;
      case "subheader":
        return <TextIcon />;
      case "text":
        return <TextIcon />;
      case "image":
        return <ImageIcon />;
      case "customer_info":
        return <BusinessIcon />;
      case "company_info":
        return <BusinessIcon />;
      case "date":
        return <DateIcon />;
      case "items_table":
        return <TableIcon />;
      case "totals":
        return <CalculateIcon />;
      case "terms":
        return <NoteIcon />;
      case "divider":
        return <DragIcon />;
      case "spacer":
        return <DragIcon />;
      case "signature":
        return <DescriptionIcon />;
      case "footer":
        return <DescriptionIcon />;
      // Şirket bilgileri parça parça
      case "company_name":
        return <BusinessIcon />;
      case "company_address":
        return <BusinessIcon />;
      case "company_contact":
        return <PhoneIcon />;
      case "company_logo":
        return <ImageIcon />;
      // Müşteri bilgileri parça parça
      case "customer_name":
        return <BusinessIcon />;
      case "customer_full_name":
        return <BusinessIcon />;
      case "customer_address":
        return <BusinessIcon />;
      case "customer_full_info":
        return <BusinessIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        mb: 1,
        cursor: isDragging ? "grabbing" : "grab",
        "&:hover": { bgcolor: "primary.light", color: "white" },
      }}
    >
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {getElementIcon(element.type)}
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {element.label}
          </Typography>
          <AddIcon sx={{ fontSize: "1rem" }} />
        </Box>
      </CardContent>
    </Card>
  );
}

// A4 Page Template Preview Component with Real Page Layout
function TemplatePreview({
  elements,
  onElementsChange,
  corporateSettings,
  onDelete,
  tenant,
  onElementSelect,
  selectedElementId,
}: {
  elements: TemplateElement[];
  onElementsChange: (elements: TemplateElement[]) => void;
  corporateSettings?: any;
  onDelete: (elementId: string) => void;
  tenant?: any;
  onElementSelect?: (elementId: string | null) => void;
  selectedElementId?: string | null;
}) {
  const { setNodeRef } = useDroppable({
    id: "template-preview",
  });

  const handleElementPositionChange = (
    elementId: string,
    newPosition: { x: number; y: number }
  ) => {
    console.log(`Updating element ${elementId} position to:`, newPosition);
    const updatedElements = elements.map((element) =>
      element.id === elementId ? { ...element, position: newPosition } : element
    );
    console.log("Updated elements:", updatedElements);
    onElementsChange(updatedElements);
  };

  const handleDelete = (id: string) => {
    onElementsChange(elements.filter((el) => el.id !== id));
  };

  const handleElementUpdate = (
    elementId: string,
    updates: Partial<TemplateElement>
  ) => {
    const updatedElements = elements.map((element) =>
      element.id === elementId ? { ...element, ...updates } : element
    );
    onElementsChange(updatedElements);
  };

  // Element content renderer for A4 page layout
  const renderElementContent = (element: TemplateElement) => {
    console.log(
      "Rendering element:",
      element.type,
      "content:",
      element.content
    );

    // If element has content, show it as simple text (except for special elements)
    if (
      element.content &&
      !["items_table", "totals", "customer_info", "company_info"].includes(
        element.type
      )
    ) {
      console.log("Showing content:", element.content);
      return (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            ...element.styles,
          }}
        >
          {element.content}
        </Typography>
      );
    }

    const elementStyles = {
      ...element.styles,
      padding: element.styles?.padding
        ? `${element.styles.padding}px`
        : undefined,
      margin: element.styles?.margin ? `${element.styles.margin}px` : undefined,
      fontSize: element.styles?.fontSize
        ? `${element.styles.fontSize}px`
        : undefined,
      borderRadius: element.styles?.borderRadius
        ? `${element.styles.borderRadius}px`
        : undefined,
    };

    switch (element.type) {
      case "header":
        return (
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mb: 2,
              textAlign: "center",
              ...elementStyles,
            }}
          >
            {element.content || element.data?.placeholder || "TEKLİF"}
          </Typography>
        );

      case "subheader":
        return (
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              mb: 1.5,
              ...elementStyles,
            }}
          >
            {element.content || element.data?.placeholder || "Alt Başlık"}
          </Typography>
        );

      case "text":
        return (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              ...elementStyles,
            }}
          >
            {element.content ||
              element.data?.placeholder ||
              "Metin içeriği buraya yazılacak..."}
          </Typography>
        );

      case "date":
        return (
          <Typography
            variant="body2"
            sx={{
              textAlign: "right",
              mb: 2,
              fontStyle: "italic",
              ...elementStyles,
            }}
          >
            {element.data?.defaultValue || "10.12.2014"}
          </Typography>
        );

      case "customer_info":
        return (
          <Box sx={{ mb: 3, ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Müşteri Unvanı Tasarım Reklam LTD. ŞTİ.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Herhangi Mah. Örnek Sok. Güzel Apt. No:5 Daire:7 34435 Beyoğlu,
              İstanbul
            </Typography>
            <Typography variant="body2">Beyoğlu V.D. 1234567890</Typography>
            <Typography variant="body2">Tel: +90 212 555 0123</Typography>
          </Box>
        );

      case "company_info":
        return (
          <Box sx={{ mb: 3, textAlign: "left", ...elementStyles }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              {corporateSettings?.company_name ||
                corporateSettings?.company_full_name ||
                "Şirket Adı"}
            </Typography>
            {corporateSettings?.company_address && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {corporateSettings.company_address}
              </Typography>
            )}
            {corporateSettings?.tax_office && (
              <Typography variant="body2">
                VD: {corporateSettings.tax_office}
              </Typography>
            )}
            {corporateSettings?.tax_number && (
              <Typography variant="body2">
                VN: {corporateSettings.tax_number}
              </Typography>
            )}
            {corporateSettings?.company_phone && (
              <Typography variant="body2">
                Tel: {corporateSettings.company_phone}
              </Typography>
            )}
            {corporateSettings?.company_email && (
              <Typography variant="body2">
                E-posta: {corporateSettings.company_email}
              </Typography>
            )}
          </Box>
        );

      case "company_logo":
        return (
          <Box sx={{ mb: 2, textAlign: "left", ...elementStyles }}>
            {(() => {
              // Sidebar'daki mantığı kullan: tenant.branding.logo varsa onu kullan, yoksa corporateSettings.logo_url, yoksa default logo
              const logoUrl =
                tenant?.branding?.logo ||
                corporateSettings?.logo_url ||
                logoImage;
              const logoAlt =
                corporateSettings?.logo_alt_text || "Şirket Logosu";

              return (
                <Box
                  sx={{
                    width: "120px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <img
                    src={logoUrl}
                    alt={logoAlt}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    onLoad={() => {
                      console.log(
                        "TemplatePreview - Logo başarıyla yüklendi:",
                        logoUrl
                      );
                    }}
                    onError={(e) => {
                      console.error(
                        "TemplatePreview - Logo yüklenemedi:",
                        logoUrl
                      );
                      console.error("Error event:", e);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </Box>
              );
            })()}
          </Box>
        );

      case "items_table":
        return (
          <Box sx={{ mb: 3, ...elementStyles }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 100px 60px 120px",
                gap: 1,
                borderBottom: "2px solid #1976d2",
                pb: 1,
                mb: 2,
                fontWeight: "bold",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Hizmet veya ürünün tanımı
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                Miktar
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "right" }}
              >
                Birim Fiyat
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                İndirim
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "center" }}
              >
                KDV
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", textAlign: "right" }}
              >
                Toplam
              </Typography>
            </Box>
            {Array.from({ length: 10 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 100px 60px 60px 120px",
                  gap: 1,
                  py: 1,
                  borderBottom: i < 9 ? "1px solid #e2e8f0" : "none",
                }}
              >
                <Typography variant="body2">
                  Hizmet veya ürünün tanımı
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  1
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  1.000,00 ₺
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  0,00 ₺
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                  %20
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "right" }}>
                  1.000,00 ₺
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case "totals":
        return (
          <Box sx={{ textAlign: "right", mb: 3, ...elementStyles }}>
            <Box sx={{ display: "inline-block", minWidth: 300 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Ara Toplam:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  10.000,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">İndirim:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  0,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">KDV:</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  2.000,00 ₺
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "2px solid #1976d2",
                  pt: 1,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  Genel Toplam:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  12.000,00 ₺
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case "divider":
        return (
          <Box
            sx={{
              borderTop: "1px solid #e2e8f0",
              my: 2,
              ...elementStyles,
            }}
          />
        );

      case "spacer":
        return (
          <Box
            sx={{
              height: element.styles?.height || 20,
              ...elementStyles,
            }}
          />
        );

      case "image":
        return (
          <Box sx={{ textAlign: "center", mb: 2, ...elementStyles }}>
            <Box
              sx={{
                width: "200px",
                height: "100px",
                border: "2px dashed #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {element.data?.placeholder || "Resim alanı"}
              </Typography>
            </Box>
          </Box>
        );

      case "terms":
        return (
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              ...elementStyles,
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              {element.content ||
                "Bu teklif 30 gün geçerlidir. Tüm fiyatlar KDV dahildir."}
            </Typography>
          </Box>
        );

      case "signature":
        return (
          <Box sx={{ textAlign: "right", mt: 4, mb: 2, ...elementStyles }}>
            <Box
              sx={{
                display: "inline-block",
                textAlign: "center",
                minWidth: 200,
              }}
            >
              <Box sx={{ height: 60, borderBottom: "1px solid #333", mb: 1 }} />
              <Typography variant="caption">İmza</Typography>
            </Box>
          </Box>
        );

      case "footer":
        return (
          <Box sx={{ textAlign: "center", mt: 4, ...elementStyles }}>
            <Typography variant="caption" color="text.secondary">
              {element.content ||
                "Bu belge elektronik ortamda oluşturulmuştur."}
            </Typography>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 2, border: "1px dashed #e2e8f0", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Bilinmeyen element tipi: {element.type}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: 3,
        backgroundColor: "#f5f5f5",
        minHeight: "100%",
        overflow: "auto",
      }}
    >
      {/* A4 Page Container */}
      <Paper
        ref={setNodeRef}
        sx={{
          // Real A4 dimensions: 210mm x 297mm
          width: "210mm",
          height: "297mm",
          backgroundColor: "white",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: elements.length === 0 ? "default" : "crosshair",
          // Print margins (20mm on all sides)
          "&::before": {
            content: '""',
            position: "absolute",
            top: "20mm",
            left: "20mm",
            right: "20mm",
            bottom: "20mm",
            border: "1px dashed #e0e0e0",
            pointerEvents: "none",
            zIndex: 0,
          },
        }}
      >
        {/* Page Content Area */}
        <Box
          sx={{
            position: "absolute",
            top: "20mm",
            left: "20mm",
            right: "20mm",
            bottom: "20mm",
            zIndex: 1,
          }}
          onClick={(e) => {
            // If clicking on the page background (not on an element), deselect
            if (e.target === e.currentTarget && onElementSelect) {
              onElementSelect(null);
            }
          }}
        >
          {elements.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                📄 A4 Şablon Sayfası
              </Typography>
              <Typography variant="body1">
                Elementleri buraya sürükleyip bırakın
              </Typography>
              <Typography variant="caption" color="text.disabled">
                210mm × 297mm (Gerçek A4 Boyutu)
              </Typography>
            </Box>
          ) : (
            <>
              {elements.map((element) => (
                <DraggablePageElement
                  key={element.id}
                  element={element}
                  onDelete={handleDelete}
                  onPositionChange={handleElementPositionChange}
                  onElementUpdate={handleElementUpdate}
                  corporateSettings={corporateSettings}
                  tenant={tenant}
                  onElementSelect={onElementSelect}
                  selectedElementId={selectedElementId}
                />
              ))}
            </>
          )}
        </Box>

        {/* Page Rulers/Guidelines */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "20mm",
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#666",
            zIndex: 2,
          }}
        >
          Üst Kenar (20mm)
        </Box>

        {/* Left Margin Indicator */}
        <Box
          sx={{
            position: "absolute",
            top: "20mm",
            left: 0,
            width: "20mm",
            height: "calc(100% - 40mm)",
            backgroundColor: "#f8f9fa",
            borderRight: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#666",
            zIndex: 2,
            writingMode: "vertical-lr",
            textOrientation: "mixed",
          }}
        >
          Sol Kenar
        </Box>
      </Paper>
    </Box>
  );
}

export default function TemplateCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { settings: corporateSettings, loading: corporateLoading } =
    useCorporateSettings();
  const { tenant } = useTenant();
  const [templateName, setTemplateName] = useState("Başlıksız Şablon");
  const [loading, setLoading] = useState(false);

  // Load template if editing
  React.useEffect(() => {
    if (id && id !== "new") {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      console.log("Loading template with ID:", templateId);
      const template = await TemplateService.getTemplate(templateId);
      if (template) {
        console.log("Template loaded from database:", template);
        console.log("Template elements:", template.elements);
        setTemplateName(template.name);
        setTemplateElements(template.elements);
        console.log("Template state updated");
      } else {
        console.log("No template found with ID:", templateId);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Şablon yüklenirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // Debug log for corporate settings
  React.useEffect(() => {
    console.log("=== CORPORATE SETTINGS DEBUG ===");
    console.log("Corporate Settings:", corporateSettings);
    console.log("Corporate Loading:", corporateLoading);
    console.log("Tenant:", tenant);
    console.log("Tenant Branding Logo:", tenant?.branding?.logo);
    if (corporateSettings) {
      console.log("Logo URL:", corporateSettings.logo_url);
      console.log("Logo URL Type:", typeof corporateSettings.logo_url);
      console.log("Logo URL Length:", corporateSettings.logo_url?.length);
      console.log("Logo URL Trimmed:", corporateSettings.logo_url?.trim());
      console.log(
        "Logo URL Empty Check:",
        corporateSettings.logo_url?.trim() === ""
      );
      console.log("Logo URL Truthy Check:", !!corporateSettings.logo_url);
      console.log("Company Name:", corporateSettings.company_name);
      console.log("Company Full Name:", corporateSettings.company_full_name);
      console.log("Company Address:", corporateSettings.company_address);
      console.log("Tax Office:", corporateSettings.tax_office);
      console.log("Tax Number:", corporateSettings.tax_number);
      console.log("Company Phone:", corporateSettings.company_phone);
      console.log("Company Email:", corporateSettings.company_email);

      // Test logo URL if it exists
      if (
        corporateSettings.logo_url &&
        corporateSettings.logo_url.trim() !== ""
      ) {
        console.log("Testing logo URL:", corporateSettings.logo_url);
        const img = new Image();
        img.onload = () => console.log("Logo loaded successfully!");
        img.onerror = () => console.error("Logo failed to load!");
        img.src = corporateSettings.logo_url;
      }
    } else {
      console.log("Corporate Settings is null/undefined");
    }
    console.log("=== END DEBUG ===");
  }, [corporateSettings, corporateLoading]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Delete element handler
  const handleDeleteElement = (elementId: string) => {
    setTemplateElements((prev) => prev.filter((el) => el.id !== elementId));
    if (activeId === elementId) {
      setActiveId(null);
    }
  };

  const [templateElements, setTemplateElements] = useState<TemplateElement[]>([
    {
      id: "1",
      type: "date",
      label: "Tarih",
      content: "10.12.2014",
      required: true,
    },
    {
      id: "2",
      type: "customer_info",
      label: "Müşteri Bilgileri",
      content: "Müşteri Bilgileri",
      required: true,
    },
    {
      id: "3",
      type: "items_table",
      label: "Ürün/Hizmet Tablosu",
      content: "Ürün/Hizmet Tablosu",
      required: true,
    },
    {
      id: "4",
      type: "totals",
      label: "Toplam Bilgileri",
      content: "Toplam Bilgileri",
      required: true,
    },
  ]);

  // HubSpot style comprehensive element library
  const availableElements: Omit<TemplateElement, "id">[] = [
    // Text Elements
    {
      type: "header",
      label: "Ana Başlık",
      content: "TEKLİF",
      styles: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
      data: { placeholder: "Başlık metni girin..." },
    },
    {
      type: "subheader",
      label: "Alt Başlık",
      content: "Alt Başlık",
      styles: { fontSize: 18, fontWeight: "bold" },
      data: { placeholder: "Alt başlık metni girin..." },
    },
    {
      type: "text",
      label: "Metin Bloğu",
      content: "Özel metin buraya yazılacak...",
      styles: { fontSize: 12, textAlign: "left" },
      data: { placeholder: "Metin içeriği girin..." },
    },

    // Information Elements
    {
      type: "customer_info",
      label: "Müşteri Bilgileri",
      locked: true,
      styles: { backgroundColor: "#f8fafc", padding: 16, borderRadius: 8 },
    },
    {
      type: "company_info",
      label: "Şirket Bilgileri",
      styles: { textAlign: "right", fontSize: 10 },
    },
    {
      type: "date",
      label: "Tarih",
      styles: { textAlign: "right", fontSize: 12 },
      data: { defaultValue: "10.12.2014" },
    },

    // Şirket Bilgileri Parça Parça
    {
      type: "company_name",
      label: "Şirket Ünvanı",
      styles: { textAlign: "right", fontSize: 12, fontWeight: "bold" },
    },
    {
      type: "company_address",
      label: "Şirket Adresi",
      styles: { textAlign: "right", fontSize: 10 },
    },
    {
      type: "company_contact",
      label: "Şirket İletişim",
      styles: { textAlign: "right", fontSize: 10 },
    },
    {
      type: "company_logo",
      label: "Şirket Logosu",
      styles: { textAlign: "right" },
    },

    // Müşteri Bilgileri Parça Parça
    {
      type: "customer_name",
      label: "Müşteri Ünvanı",
      styles: { fontSize: 12, fontWeight: "bold" },
    },
    {
      type: "customer_full_name",
      label: "Müşteri Ad Soyad",
      styles: { fontSize: 12 },
    },
    {
      type: "customer_address",
      label: "Müşteri Adresi",
      styles: { fontSize: 10 },
    },
    {
      type: "customer_full_info",
      label: "Tam Müşteri Bilgileri",
      styles: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 4 },
    },

    // Data Elements
    {
      type: "items_table",
      label: "Ürün/Hizmet Tablosu",
      content: "Hizmet/Ürün Tablosu",
      locked: true,
      styles: { border: "1px solid #e2e8f0", borderRadius: 4 },
    },
    {
      type: "totals",
      label: "Toplam Bilgileri",
      content: "Toplam Bilgileri",
      locked: true,
      styles: { textAlign: "right", fontWeight: "bold" },
    },

    // Layout Elements
    {
      type: "divider",
      label: "Ayırıcı Çizgi",
      styles: { border: "1px solid #e2e8f0", margin: 16 },
    },
    {
      type: "spacer",
      label: "Boşluk",
      styles: { height: 20 },
    },

    // Media Elements
    {
      type: "image",
      label: "Resim",
      styles: { textAlign: "center" },
      data: { placeholder: "Resim URL'si girin..." },
    },

    // Footer Elements
    {
      type: "terms",
      label: "Şartlar ve Koşullar",
      content: "Bu teklif 30 gün geçerlidir. Tüm fiyatlar KDV dahildir.",
      styles: {
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 4,
        fontSize: 10,
      },
    },
    {
      type: "signature",
      label: "İmza Alanı",
      styles: { textAlign: "right", margin: 32 },
    },
    {
      type: "footer",
      label: "Alt Bilgi",
      styles: { textAlign: "center", fontSize: 8, color: "#666" },
    },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // If dropping from sidebar to template
    if (
      active.id.toString().startsWith("sidebar-") &&
      over.id === "template-preview"
    ) {
      const elementType = active.id
        .toString()
        .replace("sidebar-", "") as TemplateElementType;
      const elementTemplate = availableElements.find(
        (el) => el.type === elementType
      );

      if (elementTemplate) {
        const newElement: TemplateElement = {
          ...elementTemplate,
          id: `element-${Date.now()}`,
          position: { x: 50, y: 50 }, // Default position
        };
        setTemplateElements([...templateElements, newElement]);
      }
      return;
    }

    // If moving elements within the template (page elements)
    if (active.id.toString().startsWith("element-")) {
      // This case is handled by the individual DraggablePageElement components
      // through their onPositionChange callbacks
      console.log("Element moved within template:", active.id);
    }

    // If reordering within template
    if (active.id !== over.id) {
      const oldIndex = templateElements.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = templateElements.findIndex(
        (item) => item.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        setTemplateElements(arrayMove(templateElements, oldIndex, newIndex));
      }
    }
  };

  const handleBack = () => {
    navigate("/settings/template-management");
  };

  const handleSave = async () => {
    try {
      console.log("=== SAVE TEMPLATE DEBUG ===");
      console.log("Template Name:", templateName);
      console.log("Template Elements:", templateElements);
      console.log("Template ID:", id);
      console.log("Tenant ID:", tenant?.id);

      if (!tenant?.id) {
        alert("Tenant bilgisi bulunamadı!");
        return;
      }

      // Template data to save
      const templateData = {
        tenant_id: tenant.id,
        name: templateName,
        type: "quote" as const,
        description: `${templateName} şablonu`,
        elements: templateElements,
        is_active: true,
        is_default: false,
      };

      console.log("Template data to save:", templateData);

      // Save to database
      let savedTemplate;
      if (id && id !== "new") {
        // Update existing template
        console.log("Updating existing template...");
        savedTemplate = await TemplateService.updateTemplate(id, templateData);
        console.log("Şablon başarıyla güncellendi:", savedTemplate);
        alert(`Şablon "${templateName}" başarıyla güncellendi!`);
      } else {
        // Create new template
        console.log("Creating new template...");
        savedTemplate = await TemplateService.createTemplate(templateData);
        console.log("Şablon başarıyla kaydedildi:", savedTemplate);
        alert(`Şablon "${templateName}" başarıyla kaydedildi!`);
      }

      // Navigate back to template list
      navigate("/settings/template-management");
    } catch (error) {
      console.error("Şablon kaydedilirken hata:", error);
      alert("Şablon kaydedilirken bir hata oluştu!");
    }
  };

  const handlePrintTest = async () => {
    try {
      console.log("Şablondan test çıktısı yazdırılıyor...");

      // Şablon elementlerinden PDF içeriği oluştur
      const generatePDFFromTemplate = () => {
        const content: any[] = [];

        // Elementleri Y konumuna göre sırala (üstten aşağıya), aynı Y'de olanları X'e göre sırala
        const sortedElements = [...templateElements].sort((a, b) => {
          const aY = a.position?.y || 0;
          const bY = b.position?.y || 0;
          const aX = a.position?.x || 0;
          const bX = b.position?.x || 0;

          // Önce Y konumuna göre sırala
          if (Math.abs(aY - bY) > 20) {
            // 20px tolerans ile aynı seviye kabul et
            return aY - bY;
          }
          // Aynı Y seviyesindeyse X konumuna göre sırala
          return aX - bX;
        });

        // Elementleri grupla (aynı Y seviyesindeki elementleri birlikte işle)
        const groupedElements: TemplateElement[][] = [];
        let currentGroup: TemplateElement[] = [];
        let lastY = -1;

        sortedElements.forEach((element) => {
          const currentY = element.position?.y || 0;

          if (Math.abs(currentY - lastY) > 20) {
            // Yeni grup başlat
            if (currentGroup.length > 0) {
              groupedElements.push([...currentGroup]);
            }
            currentGroup = [element];
          } else {
            // Aynı gruba ekle
            currentGroup.push(element);
          }
          lastY = currentY;
        });

        // Son grubu ekle
        if (currentGroup.length > 0) {
          groupedElements.push(currentGroup);
        }

        // Grupları PDF içeriğine dönüştür
        groupedElements.forEach((group) => {
          if (group.length === 1) {
            // Tek element - normal işle
            const element = group[0];
            const elementContent = processElement(element);
            if (elementContent) {
              content.push(elementContent);
            }
          } else {
            // Birden fazla element - columns olarak işle
            const columns: any[] = [];
            group.forEach((element) => {
              const elementContent = processElement(element);
              if (elementContent) {
                columns.push(elementContent);
              }
            });
            if (columns.length > 0) {
              return { columns };
            }
          }
        });

        // Element işleme fonksiyonu
        function processElement(element: TemplateElement): any {
          switch (element.type) {
            case "header":
              return {
                text: element.content || "TEKLİF",
                style: "h1",
                alignment: element.styles?.textAlign || "center",
                fontSize: element.styles?.fontSize || 24,
                bold: element.styles?.fontWeight === "bold",
                color: element.styles?.color || "#000",
                margin: [0, 10, 0, 10],
              };

            case "subheader":
              return {
                text: element.content || "Alt Başlık",
                style: "h2",
                alignment: element.styles?.textAlign || "left",
                fontSize: element.styles?.fontSize || 18,
                bold: element.styles?.fontWeight === "bold",
                color: element.styles?.color || "#000",
                margin: [0, 5, 0, 5],
              };

            case "text":
              return {
                text: element.content || "Metin içeriği",
                alignment: element.styles?.textAlign || "left",
                fontSize: element.styles?.fontSize || 12,
                bold: element.styles?.fontWeight === "bold",
                color: element.styles?.color || "#000",
                margin: [0, 5, 0, 5],
              };

            case "company_info":
              const companyInfo = [
                {
                  text:
                    corporateSettings?.company_name ||
                    corporateSettings?.company_full_name ||
                    "Şirket Adı",
                  bold: true,
                  fontSize: 14,
                  alignment: element.styles?.textAlign || "left",
                  margin: [0, 5, 0, 2],
                },
                {
                  text: corporateSettings?.company_address || "Şirket Adresi",
                  fontSize: 10,
                  alignment: element.styles?.textAlign || "left",
                  margin: [0, 2, 0, 2],
                },
                {
                  text: `VD: ${
                    corporateSettings?.tax_office || "Vergi Dairesi"
                  } • VKN: ${corporateSettings?.tax_number || "1234567890"}`,
                  fontSize: 10,
                  alignment: element.styles?.textAlign || "left",
                  margin: [0, 2, 0, 2],
                },
                {
                  text: `Tel: ${
                    corporateSettings?.company_phone || "+90 555 987 65 43"
                  } • E-posta: ${
                    corporateSettings?.company_email || "info@gözcü360.com"
                  }`,
                  fontSize: 10,
                  alignment: element.styles?.textAlign || "left",
                  margin: [0, 2, 0, 5],
                },
              ];
              return companyInfo;

            case "customer_info":
              return {
                text: [{ text: "MÜŞTERİ: ", bold: true }, "Örnek Müşteri A.Ş."],
                fontSize: element.styles?.fontSize || 12,
                alignment: element.styles?.textAlign || "left",
                margin: [0, 5, 0, 5],
              };

            case "date":
              return {
                text: [
                  { text: "TEKLİF TARİHİ: ", bold: true },
                  new Date().toLocaleDateString("tr-TR"),
                ],
                fontSize: element.styles?.fontSize || 12,
                alignment: element.styles?.textAlign || "left",
                margin: [0, 5, 0, 5],
              };

            case "items_table":
              const itemsTable = {
                table: {
                  headerRows: 1,
                  widths: ["*", 70, 80, 50, 90],
                  body: [
                    [
                      { text: "HİZMET / ÜRÜN", style: "th" },
                      { text: "MİKTAR", style: "th", alignment: "right" },
                      { text: "BR. FİYAT", style: "th", alignment: "right" },
                      { text: "KDV", style: "th", alignment: "right" },
                      { text: "TOPLAM", style: "th", alignment: "right" },
                    ],
                    [
                      { text: "Güvenlik Hizmeti", style: "td" },
                      { text: "2 Ay", alignment: "right", style: "td" },
                      { text: "5.000,00₺", alignment: "right", style: "td" },
                      { text: "%20", alignment: "right", style: "td" },
                      { text: "10.000,00₺", alignment: "right", style: "td" },
                    ],
                    [
                      { text: "Kamera Sistemi", style: "td" },
                      { text: "4 Adet", alignment: "right", style: "td" },
                      { text: "1.500,00₺", alignment: "right", style: "td" },
                      { text: "%20", alignment: "right", style: "td" },
                      { text: "6.000,00₺", alignment: "right", style: "td" },
                    ],
                  ],
                },
                layout: "lightHorizontalLines",
                margin: [0, 10, 0, 10],
              };
              return itemsTable;

            case "totals":
              const totalsTable = {
                columns: [
                  { width: "*", text: "" },
                  {
                    width: 220,
                    table: {
                      body: [
                        [
                          { text: "ARA TOPLAM", style: "totalKey" },
                          {
                            text: "16.000,00₺",
                            style: "totalVal",
                            alignment: "right",
                          },
                        ],
                        [
                          { text: "TOPLAM KDV", style: "totalKey" },
                          {
                            text: "3.200,00₺",
                            style: "totalVal",
                            alignment: "right",
                          },
                        ],
                        [
                          { text: "GENEL TOPLAM", style: "totalKey" },
                          {
                            text: "19.200,00₺",
                            style: "totalVal",
                            alignment: "right",
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                    margin: [0, 10, 0, 0],
                  },
                ],
              };
              return totalsTable;

            case "terms":
              return {
                text:
                  element.content ||
                  "Bu teklif 30 gün geçerlidir. Ödeme koşulları net 30 gündür.",
                fontSize: element.styles?.fontSize || 10,
                alignment: element.styles?.textAlign || "left",
                margin: [8, 6, 8, 6],
                fillColor: "#fafafa",
              };

            case "company_logo":
              if (tenant?.branding?.logo || corporateSettings?.logo_url) {
                return {
                  image: tenant?.branding?.logo || corporateSettings?.logo_url,
                  width: 120,
                  alignment: element.styles?.textAlign || "left",
                  margin: [0, 10, 0, 10],
                };
              }
              return null;

            default:
              return null;
          }
        }

        return content;
      };

      // Şablondan PDF içeriği oluştur
      const pdfContent = generatePDFFromTemplate();

      // PDFMake ile direkt PDF oluştur
      const pdfMake = (await import("pdfmake")).default as any;
      const pdfFonts = require("pdfmake/build/vfs_fonts");

      if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      }

      const docDefinition = {
        pageSize: "A4",
        pageMargins: [36, 36, 36, 48],
        defaultStyle: {
          fontSize: 10,
          lineHeight: 1.25,
        },
        styles: {
          h1: { fontSize: 24, bold: true },
          h2: { fontSize: 12, bold: true, color: "#444" },
          th: { bold: true, fillColor: "#f5f5f5" },
          td: {},
          small: { fontSize: 9, color: "#666" },
          totalKey: { bold: true, color: "#666" },
          totalVal: { bold: true },
        },
        content: pdfContent,
      };

      // PDF'i oluştur ve aç
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.open();

      console.log("Şablondan PDF başarıyla oluşturuldu!");
    } catch (error) {
      console.error("Şablondan PDF oluşturulurken hata:", error);
      alert("PDF oluşturulurken bir hata oluştu!");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{ display: "flex", height: "100vh", backgroundColor: "#f8fafc" }}
      >
        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
              <Breadcrumbs>
                <Link
                  underline="hover"
                  color="inherit"
                  href="/settings/template-management"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/settings/template-management");
                  }}
                >
                  Yazdırma Şablonları
                </Link>
                <Typography color="text.primary">Düzenle</Typography>
              </Breadcrumbs>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintTest}
                sx={{ textTransform: "none" }}
              >
                TEST ÇIKTISI YAZDIR
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ textTransform: "none" }}
              >
                KAYDET
              </Button>
            </Box>
          </Box>

          {/* Template Editor */}
          <Box sx={{ flexGrow: 1, display: "flex" }}>
            {/* Left Panel */}
            <Box
              sx={{
                width: 300,
                backgroundColor: "white",
                borderRight: "1px solid #e2e8f0",
                p: 2,
              }}
            >
              <TextField
                fullWidth
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />

              <Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Eklenebilir Elementler
                  </Typography>

                  {/* Text Elements Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1, color: "text.secondary" }}
                  >
                    📝 Metin Elementleri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      ["header", "subheader", "text"].includes(el.type)
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Information Elements Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    🏢 Bilgi Elementleri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      ["customer_info", "company_info", "date"].includes(
                        el.type
                      )
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Şirket Bilgileri Parça Parça */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    🏢 Şirket Bilgileri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      [
                        "company_name",
                        "company_address",
                        "company_contact",
                        "company_logo",
                      ].includes(el.type)
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Müşteri Bilgileri Parça Parça */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    👤 Müşteri Bilgileri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      [
                        "customer_name",
                        "customer_full_name",
                        "customer_address",
                        "customer_full_info",
                      ].includes(el.type)
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Data Elements Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    📊 Veri Elementleri
                  </Typography>
                  {availableElements
                    .filter((el) => ["items_table", "totals"].includes(el.type))
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Layout Elements Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    🎨 Layout Elementleri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      ["divider", "spacer", "image"].includes(el.type)
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}

                  {/* Footer Elements Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      mt: 2,
                      color: "text.secondary",
                    }}
                  >
                    📄 Alt Kısım Elementleri
                  </Typography>
                  {availableElements
                    .filter((el) =>
                      ["terms", "signature", "footer"].includes(el.type)
                    )
                    .map((element, index) => (
                      <SidebarElement key={index} element={element} />
                    ))}
                </Box>
              </Box>
            </Box>

            {/* Center - Template Preview */}
            <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Şablon Önizlemesi
              </Typography>
              <TemplatePreview
                elements={templateElements}
                onElementsChange={setTemplateElements}
                corporateSettings={corporateSettings}
                onDelete={handleDeleteElement}
                tenant={tenant}
                onElementSelect={setActiveId}
                selectedElementId={activeId}
              />
            </Box>

            {/* Right Panel - Element Properties */}
            {activeId && (
              <Box
                sx={{
                  width: 300,
                  backgroundColor: "#f8fafc",
                  borderLeft: "1px solid #e2e8f0",
                  p: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Element Özellikleri
                </Typography>

                {(() => {
                  const selectedElement = templateElements.find(
                    (el) => el.id === activeId
                  );
                  if (!selectedElement) return null;

                  return (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      {/* Element Adı */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Element Adı
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {selectedElement.label}
                        </Typography>
                      </Box>

                      {/* Metin İçeriği - Sadece metin elementleri için */}
                      {["header", "subheader", "text"].includes(
                        selectedElement.type
                      ) && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 1 }}
                          >
                            Metin İçeriği
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={selectedElement.content || ""}
                            onChange={(e) => {
                              const updatedElements = templateElements.map(
                                (el) =>
                                  el.id === activeId
                                    ? { ...el, content: e.target.value }
                                    : el
                              );
                              setTemplateElements(updatedElements);
                            }}
                            placeholder="Metin içeriğini buraya yazın..."
                            size="small"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontSize: "14px",
                              },
                            }}
                          />
                        </Box>
                      )}

                      {/* Hizalama Seçenekleri */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Hizalama
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant={
                              selectedElement.styles?.textAlign === "left"
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() => {
                              const updatedElements = templateElements.map(
                                (el) =>
                                  el.id === activeId
                                    ? {
                                        ...el,
                                        styles: {
                                          ...el.styles,
                                          textAlign: "left" as const,
                                        },
                                      }
                                    : el
                              );
                              setTemplateElements(updatedElements);
                            }}
                            sx={{ minWidth: "auto", px: 1 }}
                          >
                            ←
                          </Button>
                          <Button
                            size="small"
                            variant={
                              selectedElement.styles?.textAlign === "center"
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() => {
                              const updatedElements = templateElements.map(
                                (el) =>
                                  el.id === activeId
                                    ? {
                                        ...el,
                                        styles: {
                                          ...el.styles,
                                          textAlign: "center" as const,
                                        },
                                      }
                                    : el
                              );
                              setTemplateElements(updatedElements);
                            }}
                            sx={{ minWidth: "auto", px: 1 }}
                          >
                            ↔
                          </Button>
                          <Button
                            size="small"
                            variant={
                              selectedElement.styles?.textAlign === "right"
                                ? "contained"
                                : "outlined"
                            }
                            onClick={() => {
                              const updatedElements = templateElements.map(
                                (el) =>
                                  el.id === activeId
                                    ? {
                                        ...el,
                                        styles: {
                                          ...el.styles,
                                          textAlign: "right" as const,
                                        },
                                      }
                                    : el
                              );
                              setTemplateElements(updatedElements);
                            }}
                            sx={{ minWidth: "auto", px: 1 }}
                          >
                            →
                          </Button>
                        </Box>
                      </Box>

                      {/* Font Boyutu */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Font Boyutu
                        </Typography>
                        <TextField
                          size="small"
                          type="number"
                          value={selectedElement.styles?.fontSize || 12}
                          onChange={(e) => {
                            const fontSize = parseInt(e.target.value) || 12;
                            const updatedElements = templateElements.map((el) =>
                              el.id === activeId
                                ? { ...el, styles: { ...el.styles, fontSize } }
                                : el
                            );
                            setTemplateElements(updatedElements);
                          }}
                          sx={{ width: "100%" }}
                        />
                      </Box>

                      {/* Font Kalınlığı */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Font Kalınlığı
                        </Typography>
                        <FormControl size="small" sx={{ width: "100%" }}>
                          <Select
                            value={
                              selectedElement.styles?.fontWeight || "normal"
                            }
                            onChange={(e) => {
                              const updatedElements = templateElements.map(
                                (el) =>
                                  el.id === activeId
                                    ? {
                                        ...el,
                                        styles: {
                                          ...el.styles,
                                          fontWeight: e.target.value as any,
                                        },
                                      }
                                    : el
                              );
                              setTemplateElements(updatedElements);
                            }}
                          >
                            <MenuItem value="normal">Normal</MenuItem>
                            <MenuItem value="bold">Kalın</MenuItem>
                            <MenuItem value="light">İnce</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Renk */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 1 }}
                        >
                          Renk
                        </Typography>
                        <TextField
                          size="small"
                          type="color"
                          value={selectedElement.styles?.color || "#000000"}
                          onChange={(e) => {
                            const updatedElements = templateElements.map((el) =>
                              el.id === activeId
                                ? {
                                    ...el,
                                    styles: {
                                      ...el.styles,
                                      color: e.target.value,
                                    },
                                  }
                                : el
                            );
                            setTemplateElements(updatedElements);
                          }}
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <DragOverlay>
        {activeId ? (
          <Card sx={{ opacity: 0.5 }}>
            <CardContent>
              <Typography>Sürükleniyor...</Typography>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
