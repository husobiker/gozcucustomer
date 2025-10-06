const express = require("express");
const router = express.Router();

// Personel limitlerini çek
router.get("/api/tenant-limits", async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID gerekli" });
    }

    // Ana landing sayfasındaki API'ye proxy yap
    const landingApiUrl = "http://localhost:3000";
    const response = await fetch(
      `${landingApiUrl}/api/tenant-limits?tenantId=${tenantId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy API error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Personel ekleme kontrolü
router.post("/api/tenant-limits", async (req, res) => {
  try {
    const { tenantId, personnelCount = 1 } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID gerekli" });
    }

    // Ana landing sayfasındaki API'ye proxy yap
    const landingApiUrl = "http://localhost:3000";
    const response = await fetch(`${landingApiUrl}/api/tenant-limits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenantId, personnelCount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy API error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;

