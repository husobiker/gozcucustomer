import { useState, useEffect, useCallback } from "react";
import {
  hikvisionIntegrationService,
  HikvisionCamera,
  HikvisionIntegrationConfig,
} from "../api/hikvisionIntegration";
import { useTenant } from "../contexts/TenantContext";

export interface UseHikvisionIntegrationReturn {
  // State
  cameras: HikvisionCamera[];
  config: HikvisionIntegrationConfig | null;
  loading: boolean;
  error: string | null;
  integrationStatus: {
    status: "connected" | "disconnected" | "error";
    message: string;
    last_sync?: string;
  } | null;

  // Actions
  loadCameras: (projectId: string) => Promise<void>;
  updateCameraStatus: (
    cameraId: string,
    status: HikvisionCamera["status"]
  ) => Promise<boolean>;
  updateCameraSettings: (
    cameraId: string,
    settings: Partial<HikvisionCamera>
  ) => Promise<boolean>;
  addCamera: (
    projectId: string,
    cameraData: Omit<
      HikvisionCamera,
      "id" | "project_id" | "tenant_id" | "created_at" | "updated_at"
    >
  ) => Promise<HikvisionCamera | null>;
  deleteCamera: (cameraId: string) => Promise<boolean>;
  refreshIntegration: (projectId: string) => Promise<void>;
  getCameraStreamUrl: (camera: HikvisionCamera) => string;
  getCameraSnapshotUrl: (camera: HikvisionCamera) => string;
}

export const useHikvisionIntegration = (): UseHikvisionIntegrationReturn => {
  const { tenant } = useTenant();
  const [cameras, setCameras] = useState<HikvisionCamera[]>([]);
  const [config, setConfig] = useState<HikvisionIntegrationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<{
    status: "connected" | "disconnected" | "error";
    message: string;
    last_sync?: string;
  } | null>(null);

  // Konfigürasyonu yükle
  const loadConfig = useCallback(async () => {
    if (!tenant) return;

    try {
      setLoading(true);
      setError(null);
      const integrationConfig =
        await hikvisionIntegrationService.loadIntegrationConfig(tenant.id);
      setConfig(integrationConfig);
    } catch (err) {
      console.error("Hikvision konfigürasyonu yüklenemedi:", err);
      setError("Hikvision entegrasyon konfigürasyonu yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  // Kameraları yükle
  const loadCameras = useCallback(
    async (projectId: string) => {
      if (!tenant) return;

      try {
        setLoading(true);
        setError(null);
        const camerasData = await hikvisionIntegrationService.getProjectCameras(
          projectId
        );
        setCameras(camerasData);
      } catch (err) {
        console.error("Kamera listesi yüklenemedi:", err);
        setError("Kamera listesi yüklenemedi");
      } finally {
        setLoading(false);
      }
    },
    [tenant]
  );

  // Kamera durumunu güncelle
  const updateCameraStatus = useCallback(
    async (
      cameraId: string,
      status: HikvisionCamera["status"]
    ): Promise<boolean> => {
      try {
        setError(null);
        const success = await hikvisionIntegrationService.updateCameraStatus(
          cameraId,
          status
        );

        if (success) {
          // Local state'i güncelle
          setCameras((prev) =>
            prev.map((camera) =>
              camera.id === cameraId
                ? { ...camera, status, updated_at: new Date().toISOString() }
                : camera
            )
          );
        }

        return success;
      } catch (err) {
        console.error("Kamera durumu güncellenemedi:", err);
        setError("Kamera durumu güncellenemedi");
        return false;
      }
    },
    []
  );

  // Kamera ayarlarını güncelle
  const updateCameraSettings = useCallback(
    async (
      cameraId: string,
      settings: Partial<HikvisionCamera>
    ): Promise<boolean> => {
      try {
        setError(null);
        const success = await hikvisionIntegrationService.updateCameraSettings(
          cameraId,
          settings
        );

        if (success) {
          // Local state'i güncelle
          setCameras((prev) =>
            prev.map((camera) =>
              camera.id === cameraId
                ? {
                    ...camera,
                    ...settings,
                    updated_at: new Date().toISOString(),
                  }
                : camera
            )
          );
        }

        return success;
      } catch (err) {
        console.error("Kamera ayarları güncellenemedi:", err);
        setError("Kamera ayarları güncellenemedi");
        return false;
      }
    },
    []
  );

  // Kamera ekle
  const addCamera = useCallback(
    async (
      projectId: string,
      cameraData: Omit<
        HikvisionCamera,
        "id" | "project_id" | "tenant_id" | "created_at" | "updated_at"
      >
    ): Promise<HikvisionCamera | null> => {
      try {
        setError(null);
        const newCamera = await hikvisionIntegrationService.addCamera(
          projectId,
          cameraData
        );

        if (newCamera) {
          setCameras((prev) => [newCamera, ...prev]);
        }

        return newCamera;
      } catch (err) {
        console.error("Kamera eklenemedi:", err);
        setError("Kamera eklenemedi");
        return null;
      }
    },
    []
  );

  // Kamera sil
  const deleteCamera = useCallback(
    async (cameraId: string): Promise<boolean> => {
      try {
        setError(null);
        const success = await hikvisionIntegrationService.deleteCamera(
          cameraId
        );

        if (success) {
          setCameras((prev) => prev.filter((camera) => camera.id !== cameraId));
        }

        return success;
      } catch (err) {
        console.error("Kamera silinemedi:", err);
        setError("Kamera silinemedi");
        return false;
      }
    },
    []
  );

  // Entegrasyonu yenile
  const refreshIntegration = useCallback(
    async (projectId: string) => {
      if (!tenant) return;

      try {
        setLoading(true);
        setError(null);

        // Entegrasyon durumunu kontrol et
        const status = await hikvisionIntegrationService.checkIntegrationStatus(
          projectId
        );
        setIntegrationStatus(status);

        // Kameraları yeniden yükle
        if (status.status === "connected") {
          await loadCameras(projectId);
        }
      } catch (err) {
        console.error("Entegrasyon yenilenemedi:", err);
        setError("Entegrasyon yenilenemedi");
      } finally {
        setLoading(false);
      }
    },
    [tenant, loadCameras]
  );

  // Kamera stream URL'ini al
  const getCameraStreamUrl = useCallback((camera: HikvisionCamera): string => {
    return hikvisionIntegrationService.getCameraStreamUrl(camera);
  }, []);

  // Kamera snapshot URL'ini al
  const getCameraSnapshotUrl = useCallback(
    (camera: HikvisionCamera): string => {
      return hikvisionIntegrationService.getCameraSnapshotUrl(camera);
    },
    []
  );

  // Component mount olduğunda konfigürasyonu yükle
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    // State
    cameras,
    config,
    loading,
    error,
    integrationStatus,

    // Actions
    loadCameras,
    updateCameraStatus,
    updateCameraSettings,
    addCamera,
    deleteCamera,
    refreshIntegration,
    getCameraStreamUrl,
    getCameraSnapshotUrl,
  };
};

export default useHikvisionIntegration;
