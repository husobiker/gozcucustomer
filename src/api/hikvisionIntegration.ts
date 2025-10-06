// Hikvision Partner Portal Entegrasyonu API Servisi
// Bu servis Hikvision Partner Portal'dan gelen API bilgilerine göre kamera yönetimi sağlar

import { supabase } from "../lib/supabase";

export interface HikvisionCamera {
  id: string;
  name: string;
  model: string;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  rtsp_url: string;
  status: "online" | "offline" | "error" | "maintenance";
  location?: string;
  project_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface HikvisionIntegrationConfig {
  api_endpoint: string;
  api_key: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
}

export interface HikvisionProject {
  id: string;
  name: string;
  description: string;
  integration_status: "pending" | "active" | "inactive" | "error";
  hikvision_project_id?: string;
  cameras: HikvisionCamera[];
  created_at: string;
  updated_at: string;
}

class HikvisionIntegrationService {
  private baseUrl =
    process.env.REACT_APP_HIKVISION_API_URL || "https://api.hikvision.com";
  private config: HikvisionIntegrationConfig | null = null;

  // Entegrasyon konfigürasyonunu yükle
  async loadIntegrationConfig(
    tenantId: string
  ): Promise<HikvisionIntegrationConfig | null> {
    try {
      const { data, error } = await supabase
        .from("hikvision_cloud_configs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Hikvision config yüklenemedi:", error);
        return null;
      }

      if (!data) {
        console.log("Hikvision config bulunamadı, yeni config oluşturulacak");
        return null;
      }

      const config: HikvisionIntegrationConfig = {
        api_endpoint: data.base_url || "https://open.hik-connect.com",
        api_key: data.app_key,
        client_id: data.app_key,
        client_secret: data.app_secret,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: data.token_expires_at,
      };

      this.config = config;
      return config;
    } catch (error) {
      console.error("Hikvision entegrasyon konfigürasyonu yüklenemedi:", error);
      return null;
    }
  }

  // Access token'ı yenile
  async refreshAccessToken(): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Hikvision API'den yeni token al
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
          grant_type: "refresh_token",
          refresh_token: this.config.refresh_token,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.config.access_token = data.access_token;
        this.config.refresh_token = data.refresh_token;
        this.config.token_expires_at = new Date(
          Date.now() + data.expires_in * 1000
        ).toISOString();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Access token yenilenemedi:", error);
      return false;
    }
  }

  // Token'ın geçerli olup olmadığını kontrol et
  private isTokenValid(): boolean {
    if (!this.config?.token_expires_at) return false;
    return new Date(this.config.token_expires_at) > new Date();
  }

  // API isteği yap
  private async makeApiRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.config) {
      throw new Error("Hikvision entegrasyonu yapılandırılmamış");
    }

    // Token geçersizse yenile
    if (!this.isTokenValid()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error("Access token yenilenemedi");
      }
    }

    const response = await fetch(`${this.config.api_endpoint}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Hikvision API hatası: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Proje için kameraları getir
  async getProjectCameras(projectId: string): Promise<HikvisionCamera[]> {
    try {
      const { data, error } = await supabase
        .from("hikvision_cloud_cameras")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Kamera listesi alınamadı:", error);
        return [];
      }

      if (!data) {
        return [];
      }

      // HikvisionCloudCamera formatından HikvisionCamera formatına dönüştür
      const cameras: HikvisionCamera[] = data.map((camera) => ({
        id: camera.id,
        name: camera.name,
        model: camera.model || "Unknown",
        ip_address: "", // Hikvision Cloud'da IP adresi yok
        port: 0,
        username: "",
        password: "",
        location: camera.location || "",
        status: camera.status as "online" | "offline" | "error",
        rtsp_url: camera.rtsp_url || "",
        project_id: camera.project_id,
        tenant_id: camera.tenant_id,
        created_at: camera.created_at,
        updated_at: camera.updated_at,
      }));

      return cameras;
    } catch (error) {
      console.error("Kamera listesi alınamadı:", error);
      return [];
    }
  }

  // Kamera durumunu güncelle
  async updateCameraStatus(
    cameraId: string,
    status: HikvisionCamera["status"]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("hikvision_cloud_cameras")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cameraId);

      if (error) {
        console.error("Kamera durumu güncellenemedi:", error);
        return false;
      }

      console.log(`Kamera ${cameraId} durumu ${status} olarak güncellendi`);
      return true;
    } catch (error) {
      console.error("Kamera durumu güncellenemedi:", error);
      return false;
    }
  }

  // Kamera ayarlarını güncelle
  async updateCameraSettings(
    cameraId: string,
    settings: Partial<HikvisionCamera>
  ): Promise<boolean> {
    try {
      // HikvisionCamera formatından HikvisionCloudCamera formatına dönüştür
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (settings.name) updateData.name = settings.name;
      if (settings.model) updateData.model = settings.model;
      if (settings.location) updateData.location = settings.location;
      if (settings.status) updateData.status = settings.status;
      if (settings.rtsp_url) updateData.rtsp_url = settings.rtsp_url;

      const { error } = await supabase
        .from("hikvision_cloud_cameras")
        .update(updateData)
        .eq("id", cameraId);

      if (error) {
        console.error("Kamera ayarları güncellenemedi:", error);
        return false;
      }

      console.log(`Kamera ${cameraId} ayarları güncellendi:`, settings);
      return true;
    } catch (error) {
      console.error("Kamera ayarları güncellenemedi:", error);
      return false;
    }
  }

  // Kamera ekle
  async addCamera(
    projectId: string,
    cameraData: Omit<
      HikvisionCamera,
      "id" | "project_id" | "tenant_id" | "created_at" | "updated_at"
    >
  ): Promise<HikvisionCamera | null> {
    try {
      // Tenant ID'yi al
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id")
        .single();

      if (!tenantData) {
        throw new Error("Tenant bulunamadı");
      }

      // HikvisionCloudCamera formatına dönüştür
      const hikvisionCameraData = {
        tenant_id: tenantData.id,
        project_id: projectId,
        hikvision_device_id: `MANUAL_${Date.now()}`,
        device_serial: `MANUAL_SERIAL_${Date.now()}`,
        channel_no: 1,
        name: cameraData.name,
        model: cameraData.model,
        status: cameraData.status,
        location: cameraData.location,
        rtsp_url: cameraData.rtsp_url,
      };

      const { data, error } = await supabase
        .from("hikvision_cloud_cameras")
        .insert(hikvisionCameraData)
        .select()
        .single();

      if (error) {
        console.error("Kamera eklenemedi:", error);
        return null;
      }

      // HikvisionCamera formatına dönüştür
      const newCamera: HikvisionCamera = {
        id: data.id,
        name: data.name,
        model: data.model || "Unknown",
        ip_address: "",
        port: 0,
        username: "",
        password: "",
        location: data.location || "",
        status: data.status as "online" | "offline" | "error",
        rtsp_url: data.rtsp_url || "",
        project_id: data.project_id,
        tenant_id: data.tenant_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      console.log("Yeni kamera eklendi:", newCamera);
      return newCamera;
    } catch (error) {
      console.error("Kamera eklenemedi:", error);
      return null;
    }
  }

  // Kamera sil
  async deleteCamera(cameraId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("hikvision_cloud_cameras")
        .delete()
        .eq("id", cameraId);

      if (error) {
        console.error("Kamera silinemedi:", error);
        return false;
      }

      console.log(`Kamera ${cameraId} silindi`);
      return true;
    } catch (error) {
      console.error("Kamera silinemedi:", error);
      return false;
    }
  }

  // Entegrasyon durumunu kontrol et
  async checkIntegrationStatus(projectId: string): Promise<{
    status: "connected" | "disconnected" | "error";
    message: string;
    last_sync?: string;
  }> {
    try {
      // Konfigürasyon var mı kontrol et
      if (!this.config) {
        return {
          status: "disconnected",
          message: "Hikvision konfigürasyonu bulunamadı",
        };
      }

      // Token geçerli mi kontrol et
      if (
        !this.config.access_token ||
        (this.config.token_expires_at &&
          new Date(this.config.token_expires_at) <= new Date())
      ) {
        return {
          status: "disconnected",
          message: "Hikvision access token geçersiz veya süresi dolmuş",
        };
      }

      // Son senkronizasyon zamanını al
      const { data: lastCamera } = await supabase
        .from("hikvision_cloud_cameras")
        .select("last_sync_at")
        .eq("project_id", projectId)
        .order("last_sync_at", { ascending: false })
        .limit(1)
        .single();

      return {
        status: "connected",
        message: "Hikvision entegrasyonu aktif",
        last_sync: lastCamera?.last_sync_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Entegrasyon durumu kontrol edilemedi:", error);
      return {
        status: "error",
        message: "Entegrasyon durumu kontrol edilemedi",
      };
    }
  }

  // Kamera stream URL'ini al
  getCameraStreamUrl(camera: HikvisionCamera): string {
    return camera.rtsp_url;
  }

  // Kamera snapshot URL'ini al
  getCameraSnapshotUrl(camera: HikvisionCamera): string {
    return `http://${camera.ip_address}:${camera.port}/ISAPI/Streaming/channels/101/picture`;
  }
}

// Singleton instance
export const hikvisionIntegrationService = new HikvisionIntegrationService();
export default hikvisionIntegrationService;
