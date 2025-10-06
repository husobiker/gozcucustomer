import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Box, Typography, Chip } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

interface PersonnelLocation {
  id: string;
  name: string;
  position: [number, number]; // [lat, lng]
  color: string;
  lastSeen: string;
  status: "online" | "offline";
}

interface PersonnelMapProps {
  personnel?: PersonnelLocation[];
}

const PersonnelMap: React.FC<PersonnelMapProps> = ({ personnel = [] }) => {
  // Örnek personel konumları (İstanbul koordinatları)
  const defaultPersonnel: PersonnelLocation[] = [
    {
      id: "1",
      name: "Dicle Deniz",
      position: [41.0082, 28.9784],
      color: "#00bcd4",
      lastSeen: "22 dakika",
      status: "online",
    },
    {
      id: "2",
      name: "Eda Doğan",
      position: [41.0085, 28.9787],
      color: "#f44336",
      lastSeen: "22 dakika",
      status: "online",
    },
    {
      id: "3",
      name: "Ziya Kahveci",
      position: [41.0078, 28.978],
      color: "#9c27b0",
      lastSeen: "2 saat",
      status: "offline",
    },
    {
      id: "4",
      name: "Joker Personel",
      position: [41.008, 28.9782],
      color: "#9c27b0",
      lastSeen: "2 gün",
      status: "offline",
    },
    {
      id: "5",
      name: "Mahmut Serttaş",
      position: [41.0083, 28.9785],
      color: "#ff9800",
      lastSeen: "3 gün",
      status: "offline",
    },
    {
      id: "6",
      name: "Ferhat Keleşler",
      position: [41.0079, 28.9781],
      color: "#9c27b0",
      lastSeen: "3 gün",
      status: "offline",
    },
  ];

  const personnelData = personnel.length > 0 ? personnel : defaultPersonnel;

  // Özel marker iconları oluştur
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={[41.0082, 28.9784]} // İstanbul merkez
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {personnelData.map((person) => (
          <Marker
            key={person.id}
            position={person.position}
            icon={createCustomIcon(person.color)}
          >
            <Popup>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {person.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Son görülme: {person.lastSeen}
                </Typography>
                <Chip
                  label={
                    person.status === "online" ? "Çevrimiçi" : "Çevrimdışı"
                  }
                  size="small"
                  color={person.status === "online" ? "success" : "default"}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default PersonnelMap;
