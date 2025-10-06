import { supabaseAdmin } from "../lib/supabase";

// Template element types - HubSpot style comprehensive elements
export type TemplateElementType =
  | "header"
  | "subheader"
  | "customer_info"
  | "company_info"
  | "date"
  | "items_table"
  | "totals"
  | "terms"
  | "text"
  | "image"
  | "divider"
  | "spacer"
  | "signature"
  | "footer"
  // Şirket bilgileri parça parça
  | "company_name"
  | "company_address"
  | "company_contact"
  | "company_logo"
  // Müşteri bilgileri parça parça
  | "customer_name"
  | "customer_full_name"
  | "customer_address"
  | "customer_full_info";

export interface TemplateElement {
  id: string;
  type: TemplateElementType;
  label: string;
  content?: string;
  required?: boolean;
  locked?: boolean;
  styles?: {
    fontSize?: number;
    fontWeight?: "normal" | "bold" | "light";
    textAlign?: "left" | "center" | "right" | "justify";
    margin?: number;
    padding?: number;
    color?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: number;
    height?: number;
    width?: number;
  };
  position?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  data?: {
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
    validation?: string;
  };
}

export interface PrintTemplate {
  id: string;
  tenant_id: string;
  name: string;
  type: "quote" | "invoice" | "receipt";
  description?: string;
  elements: TemplateElement[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export class TemplateService {
  // Get all templates for current tenant
  static async getTemplates(): Promise<PrintTemplate[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from("print_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  // Get template by ID
  static async getTemplate(id: string): Promise<PrintTemplate | null> {
    try {
      console.log("Fetching template:", id);
      const { data, error } = await supabaseAdmin
        .from("print_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase fetch error:", error);
        throw error;
      }
      console.log("Template fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw error;
    }
  }

  // Create new template
  static async createTemplate(
    template: Omit<PrintTemplate, "id" | "created_at" | "updated_at">
  ): Promise<PrintTemplate> {
    try {
      console.log("Creating template:", template);
      const { data, error } = await supabaseAdmin
        .from("print_templates")
        .insert([template])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      console.log("Template created successfully:", data);
      return data;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }

  // Update template
  static async updateTemplate(
    id: string,
    updates: Partial<PrintTemplate>
  ): Promise<PrintTemplate> {
    try {
      console.log("Updating template:", id, updates);
      const { data, error } = await supabaseAdmin
        .from("print_templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      console.log("Template updated successfully:", data);
      return data;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  }

  // Delete template
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("print_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }

  // Set default template
  static async setDefaultTemplate(id: string, type: string): Promise<void> {
    try {
      // First, unset all other defaults for this type
      await supabaseAdmin
        .from("print_templates")
        .update({ is_default: false })
        .eq("type", type);

      // Then set this template as default
      const { error } = await supabaseAdmin
        .from("print_templates")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error setting default template:", error);
      throw error;
    }
  }

  // Get default template for type
  static async getDefaultTemplate(type: string): Promise<PrintTemplate | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("print_templates")
        .select("*")
        .eq("type", type)
        .eq("is_default", true)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data || null;
    } catch (error) {
      console.error("Error fetching default template:", error);
      throw error;
    }
  }
}
