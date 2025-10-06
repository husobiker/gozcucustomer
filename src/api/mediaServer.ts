// Media Server API - FFmpeg ve Node Media Server entegrasyonu
import { supabase } from "../lib/supabase";

export interface MediaServerConfig {
  enabled: boolean;
  ffmpegPath: string;
  nodeMediaServerPort: number;
  hlsSegmentDuration: number;
  hlsListSize: number;
  streamQuality: "high" | "medium" | "low";
}

export interface StreamInfo {
  cameraId: string;
  rtspUrl: string;
  hlsUrl: string;
  mjpegUrl: string;
  status: "active" | "inactive" | "error";
  lastSeen: string;
  viewers: number;
}

class MediaServerManager {
  private config: MediaServerConfig = {
    enabled: true,
    ffmpegPath: "/usr/bin/ffmpeg",
    nodeMediaServerPort: 8000,
    hlsSegmentDuration: 2,
    hlsListSize: 3,
    streamQuality: "high",
  };

  private activeStreams: Map<string, StreamInfo> = new Map();

  // Media server yapılandırmasını al
  getConfig(): MediaServerConfig {
    return this.config;
  }

  // Media server yapılandırmasını güncelle
  updateConfig(newConfig: Partial<MediaServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Kamera stream'ini başlat
  async startCameraStream(
    cameraId: string,
    rtspUrl: string
  ): Promise<StreamInfo> {
    try {
      // FFmpeg komutunu oluştur
      const ffmpegCommand = this.buildFFmpegCommand(rtspUrl, cameraId);

      // Stream bilgilerini oluştur
      const streamInfo: StreamInfo = {
        cameraId,
        rtspUrl,
        hlsUrl: `/api/camera-stream/${cameraId}/playlist.m3u8`,
        mjpegUrl: `/api/camera-stream/${cameraId}/mjpeg`,
        status: "active",
        lastSeen: new Date().toISOString(),
        viewers: 0,
      };

      // Stream'i aktif listesine ekle
      this.activeStreams.set(cameraId, streamInfo);

      // Database'e stream durumunu kaydet
      await this.updateCameraStreamStatus(cameraId, "active");

      console.log(`Media server stream started for camera ${cameraId}`);
      return streamInfo;
    } catch (error) {
      console.error("Error starting media server stream:", error);
      throw error;
    }
  }

  // Kamera stream'ini durdur
  async stopCameraStream(cameraId: string): Promise<boolean> {
    try {
      // Stream'i aktif listesinden çıkar
      this.activeStreams.delete(cameraId);

      // Database'e stream durumunu kaydet
      await this.updateCameraStreamStatus(cameraId, "inactive");

      console.log(`Media server stream stopped for camera ${cameraId}`);
      return true;
    } catch (error) {
      console.error("Error stopping media server stream:", error);
      return false;
    }
  }

  // Aktif stream'leri al
  getActiveStreams(): StreamInfo[] {
    return Array.from(this.activeStreams.values());
  }

  // Belirli bir kamera stream'ini al
  getCameraStream(cameraId: string): StreamInfo | null {
    return this.activeStreams.get(cameraId) || null;
  }

  // Stream durumunu güncelle
  async updateStreamStatus(
    cameraId: string,
    status: "active" | "inactive" | "error"
  ): Promise<void> {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      stream.status = status;
      stream.lastSeen = new Date().toISOString();
      this.activeStreams.set(cameraId, stream);
    }
  }

  // FFmpeg komutunu oluştur
  private buildFFmpegCommand(rtspUrl: string, cameraId: string): string {
    const qualitySettings = this.getQualitySettings();

    return (
      `${this.config.ffmpegPath} -i "${rtspUrl}" ` +
      `-c:v libx264 -preset ${qualitySettings.preset} -crf ${qualitySettings.crf} ` +
      `-c:a aac -b:a 128k ` +
      `-f hls -hls_time ${this.config.hlsSegmentDuration} ` +
      `-hls_list_size ${this.config.hlsListSize} ` +
      `-hls_flags delete_segments ` +
      `-hls_segment_filename "/tmp/streams/${cameraId}_%03d.ts" ` +
      `/tmp/streams/${cameraId}/playlist.m3u8`
    );
  }

  // Kalite ayarlarını al
  private getQualitySettings() {
    switch (this.config.streamQuality) {
      case "high":
        return { preset: "fast", crf: 23, resolution: "1920x1080" };
      case "medium":
        return { preset: "medium", crf: 28, resolution: "1280x720" };
      case "low":
        return { preset: "slow", crf: 32, resolution: "854x480" };
      default:
        return { preset: "fast", crf: 23, resolution: "1920x1080" };
    }
  }

  // Database'e stream durumunu kaydet
  private async updateCameraStreamStatus(
    cameraId: string,
    status: string
  ): Promise<void> {
    try {
      await supabase
        .from("cameras")
        .update({
          is_online: status === "active",
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", cameraId);
    } catch (error) {
      console.error("Error updating camera stream status:", error);
    }
  }

  // Stream sağlık kontrolü
  async checkStreamHealth(cameraId: string): Promise<boolean> {
    const stream = this.activeStreams.get(cameraId);
    if (!stream) return false;

    try {
      // Stream'in aktif olup olmadığını kontrol et
      const response = await fetch(stream.hlsUrl);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Tüm stream'lerin sağlık kontrolünü yap
  async checkAllStreamsHealth(): Promise<void> {
    const cameraIds = Array.from(this.activeStreams.keys());
    for (const cameraId of cameraIds) {
      const isHealthy = await this.checkStreamHealth(cameraId);
      if (!isHealthy) {
        await this.updateStreamStatus(cameraId, "error");
      }
    }
  }
}

// Singleton instance
export const mediaServerManager = new MediaServerManager();

// API fonksiyonları
export const mediaServerAPI = {
  // Media server yapılandırmasını al
  getConfig: () => mediaServerManager.getConfig(),

  // Media server yapılandırmasını güncelle
  updateConfig: (config: Partial<MediaServerConfig>) =>
    mediaServerManager.updateConfig(config),

  // Kamera stream'ini başlat
  startCameraStream: (cameraId: string, rtspUrl: string) =>
    mediaServerManager.startCameraStream(cameraId, rtspUrl),

  // Kamera stream'ini durdur
  stopCameraStream: (cameraId: string) =>
    mediaServerManager.stopCameraStream(cameraId),

  // Aktif stream'leri al
  getActiveStreams: () => mediaServerManager.getActiveStreams(),

  // Belirli bir kamera stream'ini al
  getCameraStream: (cameraId: string) =>
    mediaServerManager.getCameraStream(cameraId),

  // Stream sağlık kontrolü
  checkStreamHealth: (cameraId: string) =>
    mediaServerManager.checkStreamHealth(cameraId),

  // Tüm stream'lerin sağlık kontrolünü yap
  checkAllStreamsHealth: () => mediaServerManager.checkAllStreamsHealth(),
};
