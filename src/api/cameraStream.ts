// Kamera Stream Yönetimi API
import { supabase } from '../lib/supabase';
import { mockStreamAPI } from './mockStreamServer';

interface CameraStream {
  id: string;
  rtspUrl: string;
  hlsUrl: string;
  status: 'active' | 'inactive' | 'error';
  lastSeen: string;
}

interface StreamManager {
  streams: Map<string, CameraStream>;
  startStream: (cameraId: string) => Promise<boolean>;
  stopStream: (cameraId: string) => Promise<boolean>;
  getStreamStatus: (cameraId: string) => CameraStream | null;
}

class CameraStreamManager implements StreamManager {
  streams: Map<string, CameraStream> = new Map();

  async startStream(cameraId: string): Promise<boolean> {
    try {
      // Kamera bilgilerini al
      const { data: camera, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('id', cameraId)
        .single();

      if (error || !camera) {
        console.error('Camera not found:', error);
        return false;
      }

      // Hikvision RTSP URL oluştur
      const rtspUrl = this.buildHikvisionRTSPUrl(camera);
      const hlsUrl = `/api/camera-stream/${cameraId}/playlist.m3u8`;

      // Mock stream server ile stream'i başlat
      const mockStream = mockStreamAPI.startStream(cameraId, rtspUrl);
      
      const stream: CameraStream = {
        id: cameraId,
        rtspUrl,
        hlsUrl: mockStream.hlsUrl,
        status: 'active',
        lastSeen: new Date().toISOString(),
      };

      this.streams.set(cameraId, stream);
      
      // Stream durumunu database'e kaydet
      await supabase
        .from('cameras')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', cameraId);

      console.log(`Stream started for camera ${cameraId}: ${rtspUrl}`);
      return true;

    } catch (error) {
      console.error('Error starting stream:', error);
      return false;
    }
  }

  async stopStream(cameraId: string): Promise<boolean> {
    try {
      const stream = this.streams.get(cameraId);
      if (stream) {
        stream.status = 'inactive';
        this.streams.set(cameraId, stream);

        // Stream durumunu database'e kaydet
        await supabase
          .from('cameras')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', cameraId);

        console.log(`Stream stopped for camera ${cameraId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping stream:', error);
      return false;
    }
  }

  getStreamStatus(cameraId: string): CameraStream | null {
    return this.streams.get(cameraId) || null;
  }

  private buildHikvisionRTSPUrl(camera: any): string {
    // Hikvision RTSP URL formatı
    // rtsp://username:password@ip:port/Streaming/Channels/101
    const { rtsp_url, username, password } = camera;
    
    if (rtsp_url) {
      return rtsp_url;
    }

    // Eğer rtsp_url yoksa, IP ve port bilgilerinden oluştur
    const ip = camera.ip || '192.168.1.100';
    const port = camera.port || '554';
    const user = username || 'admin';
    const pass = password || 'admin123';
    
    return `rtsp://${user}:${pass}@${ip}:${port}/Streaming/Channels/101`;
  }

  // Tüm aktif stream'leri al
  getAllActiveStreams(): CameraStream[] {
    return Array.from(this.streams.values()).filter(s => s.status === 'active');
  }

  // Stream durumunu güncelle
  updateStreamStatus(cameraId: string, status: 'active' | 'inactive' | 'error'): void {
    const stream = this.streams.get(cameraId);
    if (stream) {
      stream.status = status;
      stream.lastSeen = new Date().toISOString();
      this.streams.set(cameraId, stream);
    }
  }
}

// Singleton instance
export const streamManager = new CameraStreamManager();

// API fonksiyonları
export const cameraStreamAPI = {
  // Stream başlat
  startStream: async (cameraId: string) => {
    return await streamManager.startStream(cameraId);
  },

  // Stream durdur
  stopStream: async (cameraId: string) => {
    return await streamManager.stopStream(cameraId);
  },

  // Stream durumu al
  getStreamStatus: (cameraId: string) => {
    return streamManager.getStreamStatus(cameraId);
  },

  // Tüm aktif stream'ler
  getAllActiveStreams: () => {
    return streamManager.getAllActiveStreams();
  },

  // Stream URL'i al
  getStreamUrl: (cameraId: string) => {
    const stream = streamManager.getStreamStatus(cameraId);
    return stream ? stream.hlsUrl : null;
  },

  // Kamera bilgilerini al ve stream başlat
  initializeCamera: async (cameraId: string) => {
    const { data: camera, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('id', cameraId)
      .single();

    if (error || !camera) {
      throw new Error('Camera not found');
    }

    // Stream'i başlat
    const success = await streamManager.startStream(cameraId);
    
    if (success) {
      return {
        camera,
        stream: streamManager.getStreamStatus(cameraId),
        streamUrl: `/api/camera-stream/${cameraId}/playlist.m3u8`
      };
    }

    throw new Error('Failed to start stream');
  }
};
