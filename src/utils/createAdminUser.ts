import { supabase } from "../lib/supabase";

export const createAdminUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "admin",
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

// Test admin user oluşturmak için
export const createTestAdmin = async () => {
  return await createAdminUser("admin@safebase.com", "admin123");
};
