import { supabase } from "../lib/supabase";

export const createDemoData = async () => {
  try {
    // Create demo tenant if not exists
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("subdomain", "abcguvenlik")
      .single();

    if (!existingTenant) {
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "ABC Güvenlik",
          subdomain: "abcguvenlik",
          subscription_plan: "pro",
          status: "active",
          max_users: 25,
          max_projects: 10,
          max_personnel: 100,
          max_checkpoints: 500,
          branding: {
            company_name: "ABC Güvenlik",
            primary_color: "#1976d2",
            secondary_color: "#dc004e",
          },
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        return;
      }

      // Create demo projects
      const { error: projectsError } = await supabase.from("projects").insert([
        {
          tenant_id: tenant.id,
          name: "ABC Sitesi",
          description: "Ana ofis güvenlik projesi",
          status: "active",
        },
        {
          tenant_id: tenant.id,
          name: "XYZ İş Merkezi",
          description: "İş merkezi güvenlik projesi",
          status: "active",
        },
      ]);

      if (projectsError) {
        console.error("Error creating projects:", projectsError);
      }

      // Create demo personnel
      const { error: personnelError } = await supabase
        .from("personnel")
        .insert([
          {
            tenant_id: tenant.id,
            project_id: tenant.id, // Will be updated after project creation
            first_name: "Ahmet",
            last_name: "Yılmaz",
            mobile_login_username: "ahmety",
            mobile_login_pin: "12345",
            mobile_version_system: "android",
            mobile_version_version: "1.0.15",
            status: "Aktif",
          },
          {
            tenant_id: tenant.id,
            project_id: tenant.id,
            first_name: "Mehmet",
            last_name: "Kaya",
            mobile_login_username: "mehmetk",
            mobile_login_pin: "67890",
            mobile_version_system: "ios",
            mobile_version_version: "1.0.16",
            status: "Aktif",
          },
        ]);

      if (personnelError) {
        console.error("Error creating personnel:", personnelError);
      }

      console.log("Demo data created successfully!");
    }
  } catch (error) {
    console.error("Error in createDemoData:", error);
  }
};
