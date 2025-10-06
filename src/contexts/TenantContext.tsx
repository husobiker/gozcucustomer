import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  subscription_plan: "basic" | "pro" | "enterprise";
  status: "active" | "suspended" | "cancelled" | "trial";
  max_users: number;
  max_projects: number;
  max_personnel: number;
  max_checkpoints: number;
  branding: {
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
    company_name?: string;
    software_name?: string;
  };
  settings: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  setTenant: (tenant: Tenant | null) => void;
  refreshTenant: () => Promise<void>;
  updateTenantLogo: (logoUrl: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Get tenant from subdomain or user's tenant
  const getTenantFromSubdomain = async () => {
    try {
      const hostname = window.location.hostname;
      let subdomain = "";

      // Extract subdomain from hostname
      if (hostname.includes("localhost")) {
        // For localhost, subdomain is the first part before .localhost
        const parts = hostname.split(".");
        if (parts.length > 1 && parts[1] === "localhost") {
          subdomain = parts[0];
        } else {
          subdomain = "";
        }
      } else {
        // For production, subdomain is before .gozcu360.com
        const parts = hostname.split(".");
        if (parts.length > 1 && parts[1] === "gozcu360" && parts[2] === "com") {
          subdomain = parts[0];
        } else {
          subdomain = "";
        }
      }

      console.log("Hostname:", hostname, "Extracted subdomain:", subdomain);

      // Admin subdomain check removed - all subdomains are tenant subdomains

      // No subdomain means no access - redirect to error or login
      if (!subdomain || subdomain === "localhost") {
        console.error("No subdomain found - subdomain access required");
        setTenant(null);
        setLoading(false);
        return;
      }

      console.log("Searching for tenant with subdomain:", subdomain);

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (error || !data) {
        console.error("Tenant not found for subdomain:", subdomain, error);
        setTenant(null);
      } else {
        console.log("Found tenant:", data);
        setTenant(data);
      }
    } catch (error) {
      console.error("Error in getTenantFromSubdomain:", error);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    setLoading(true);
    await getTenantFromSubdomain();
  };

  const updateTenantLogo = async (logoUrl: string) => {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          branding: {
            ...tenant.branding,
            logo: logoUrl,
          },
        })
        .eq("id", tenant.id);

      if (error) {
        console.error("Error updating tenant logo:", error);
        throw error;
      }

      // Update local tenant state
      setTenant({
        ...tenant,
        branding: {
          ...tenant.branding,
          logo: logoUrl,
        },
      });
    } catch (error) {
      console.error("Error updating tenant logo:", error);
      throw error;
    }
  };

  useEffect(() => {
    getTenantFromSubdomain();
  }, []);

  const value = {
    tenant,
    loading,
    setTenant,
    refreshTenant,
    updateTenantLogo,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
};
