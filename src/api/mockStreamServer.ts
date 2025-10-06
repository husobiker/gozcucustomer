// Mock Stream Server - Test için
// Gerçek implementasyonda FFmpeg ile RTSP'i HLS'ye dönüştürecek

interface MockStream {
  id: string;
  rtspUrl: string;
  hlsUrl: string;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
}

class MockStreamServer {
  private streams: Map<string, MockStream> = new Map();
  private streamCounter = 0;

  // Stream başlat
  startStream(cameraId: string, rtspUrl: string): MockStream {
    const stream: MockStream = {
      id: cameraId,
      rtspUrl,
      hlsUrl: `/api/mock-stream/${cameraId}/playlist.m3u8`,
      status: 'active',
      createdAt: new Date(),
    };

    this.streams.set(cameraId, stream);
    console.log(`Mock stream started for camera ${cameraId}: ${rtspUrl}`);
    
    return stream;
  }

  // Stream durdur
  stopStream(cameraId: string): boolean {
    const stream = this.streams.get(cameraId);
    if (stream) {
      stream.status = 'inactive';
      this.streams.set(cameraId, stream);
      console.log(`Mock stream stopped for camera ${cameraId}`);
      return true;
    }
    return false;
  }

  // Stream durumu al
  getStream(cameraId: string): MockStream | null {
    return this.streams.get(cameraId) || null;
  }

  // Tüm aktif stream'ler
  getAllActiveStreams(): MockStream[] {
    return Array.from(this.streams.values()).filter(s => s.status === 'active');
  }

  // Mock HLS playlist oluştur
  generateMockPlaylist(cameraId: string): string {
    const stream = this.streams.get(cameraId);
    if (!stream || stream.status !== 'active') {
      return '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-ENDLIST\n';
    }

    // Mock segment'ler oluştur
    const segments = [];
    for (let i = 0; i < 3; i++) {
      segments.push(`#EXTINF:2.0,\nsegment${i}.ts`);
    }

    return [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-MEDIA-SEQUENCE:0',
      ...segments,
      '#EXT-X-ENDLIST'
    ].join('\n');
  }

  // Mock segment oluştur
  generateMockSegment(cameraId: string, segmentName: string): Buffer {
    // Gerçek implementasyonda bu FFmpeg'den gelen video segment'i olacak
    // Şimdilik boş buffer döndürüyoruz
    return Buffer.from('Mock video segment data');
  }

  // Stream istatistikleri
  getStats() {
    const activeStreams = this.getAllActiveStreams();
    return {
      totalStreams: this.streams.size,
      activeStreams: activeStreams.length,
      inactiveStreams: this.streams.size - activeStreams.length,
      uptime: Date.now() - (this.streamCounter * 1000),
    };
  }
}

// Singleton instance
export const mockStreamServer = new MockStreamServer();

// API endpoints için helper fonksiyonlar
export const mockStreamAPI = {
  // Stream başlat
  startStream: (cameraId: string, rtspUrl: string) => {
    return mockStreamServer.startStream(cameraId, rtspUrl);
  },

  // Stream durdur
  stopStream: (cameraId: string) => {
    return mockStreamServer.stopStream(cameraId);
  },

  // Stream durumu al
  getStream: (cameraId: string) => {
    return mockStreamServer.getStream(cameraId);
  },

  // HLS playlist oluştur
  getPlaylist: (cameraId: string) => {
    return mockStreamServer.generateMockPlaylist(cameraId);
  },

  // Segment oluştur
  getSegment: (cameraId: string, segmentName: string) => {
    return mockStreamServer.generateMockSegment(cameraId, segmentName);
  },

  // İstatistikler
  getStats: () => {
    return mockStreamServer.getStats();
  },

  // Tüm aktif stream'ler
  getAllActiveStreams: () => {
    return mockStreamServer.getAllActiveStreams();
  }
};
