import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTenant } from "./TenantContext";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "maintenance";
}

interface ProjectContextType {
  selectedProject: Project | null;
  projects: Project[];
  setSelectedProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({
  children,
}) => {
  const { tenant, loading: tenantLoading } = useTenant();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // localStorage'dan seçili projeyi yükle
  useEffect(() => {
    const savedProjectId = localStorage.getItem("selectedProjectId");
    if (savedProjectId && projects.length > 0) {
      const savedProject = projects.find((p) => p.id === savedProjectId);
      if (savedProject) {
        setSelectedProject(savedProject);
      }
    }
  }, [projects]);

  // Proje seçimi değiştiğinde localStorage'a kaydet
  const handleSetSelectedProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      localStorage.setItem("selectedProjectId", project.id);
    } else {
      localStorage.removeItem("selectedProjectId");
    }
  };

  // Fetch projects from database
  const fetchProjects = async () => {
    if (!tenant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set tenant context for RLS
      await supabase.rpc("set_tenant_context", { tenant_id: tenant.id });

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setError("Projeler yüklenirken bir hata oluştu: " + error.message);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.error("Error in fetchProjects:", err);
      setError("Projeler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  // Load projects when tenant is available
  useEffect(() => {
    if (!tenantLoading && tenant) {
      fetchProjects();
    }
  }, [tenant, tenantLoading]);

  // Set default project on load (sadece localStorage'da kayıt yoksa)
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const savedProjectId = localStorage.getItem("selectedProjectId");
      if (!savedProjectId) {
        // İlk projeyi seç ve localStorage'a kaydet
        const firstProject = projects[0];
        setSelectedProject(firstProject);
        localStorage.setItem("selectedProjectId", firstProject.id);
      }
    }
  }, [projects, selectedProject]);

  const value = {
    selectedProject,
    projects,
    setSelectedProject: handleSetSelectedProject,
    setProjects,
    loading,
    error,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
