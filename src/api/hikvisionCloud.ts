// Hikvision Cloud API Service
interface HikvisionConfig {
  appKey: string;
  appSecret: string;
  baseURL: string;
}

interface CameraInfo {
  id: string;
  name: string;
  status: "online" | "offline";
  thumbnailUrl?: string;
  liveStreamUrl?: string;
  deviceSerial: string;
  channelNo: number;
}

interface StreamInfo {
  hlsUrl: string;
  rtmpUrl: string;
  rtspUrl: string;
  expireTime: number;
}

class HikvisionCloudAPI {
  private config: HikvisionConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(config: HikvisionConfig) {
    this.config = config;
  }

  // Access token al
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appKey: this.config.appKey,
            appSecret: this.config.appSecret,
            grantType: "client_credentials",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Token alınamadı");
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.tokenExpireTime = Date.now() + data.expiresIn * 1000;

      if (!this.accessToken) {
        throw new Error("Access token alınamadı");
      }

      return this.accessToken;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }

  // Kamera listesini al
  async getCameras(): Promise<CameraInfo[]> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(`${this.config.baseURL}/api/v1/cameras`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Kamera listesi alınamadı");
      }

      const data = await response.json();
      return data.cameras || [];
    } catch (error) {
      console.error("Error getting cameras:", error);
      throw error;
    }
  }

  // Kamera bilgilerini al
  async getCameraInfo(cameraId: string): Promise<CameraInfo> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/cameras/${cameraId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Kamera bilgileri alınamadı");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting camera info:", error);
      throw error;
    }
  }

  // Canlı stream URL'ini al
  async getLiveStream(cameraId: string): Promise<StreamInfo> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/cameras/${cameraId}/live`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Stream URL alınamadı");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting live stream:", error);
      throw error;
    }
  }

  // Kamera thumbnail'ini al
  async getCameraThumbnail(cameraId: string): Promise<string> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/cameras/${cameraId}/thumbnail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Thumbnail alınamadı");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error getting thumbnail:", error);
      throw error;
    }
  }

  // Kamera kayıtlarını al
  async getRecordings(cameraId: string, startTime: string, endTime: string) {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/cameras/${cameraId}/recordings?startTime=${startTime}&endTime=${endTime}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Kayıtlar alınamadı");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting recordings:", error);
      throw error;
    }
  }

  // Kamera PTZ kontrolü
  async controlPTZ(cameraId: string, action: string, speed: number = 5) {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `${this.config.baseURL}/api/v1/cameras/${cameraId}/ptz`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            speed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("PTZ kontrolü başarısız");
      }

      return await response.json();
    } catch (error) {
      console.error("Error controlling PTZ:", error);
      throw error;
    }
  }
}

// Singleton instance
export const hikvisionCloudAPI = new HikvisionCloudAPI({
  appKey: process.env.REACT_APP_HIKVISION_APP_KEY || "",
  appSecret: process.env.REACT_APP_HIKVISION_APP_SECRET || "",
  baseURL: "https://open.hik-connect.com",
});

export default HikvisionCloudAPI;
