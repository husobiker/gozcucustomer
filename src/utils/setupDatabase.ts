import { supabase } from "../lib/supabase";

export const setupDatabase = async () => {
  try {
    console.log("Setting up database...");

    // Test connection
    const { error } = await supabase.from("users").select("count").limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return { success: false, error: error.message };
    }

    console.log("Database connection successful!");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Database setup failed" };
  }
};

export const createAdminUser = async (email: string, password: string) => {
  try {
    console.log("Creating admin user...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "admin",
          full_name: "Admin User",
        },
      },
    });

    if (error) {
      console.error("Error creating admin user:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Admin user created successfully:", data.user?.email);
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Connection test failed" };
  }
};
