import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wxxnpgevlncxvpbakrnx.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eG5wZ2V2bG5jeHZwYmFrcm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDQ3MjEsImV4cCI6MjA3MzkyMDcyMX0.EJtpHg5KUzp_ceCQ7rOqE6sShLskHnO8jH5m5nXlwFY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role key for admin operations (server-side only)
export const supabaseAdmin = createClient(
  supabaseUrl,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eG5wZ2V2bG5jeHZwYmFrcm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM0NDcyMSwiZXhwIjoyMDczOTIwNzIxfQ.K_lv5FRs2nZMSdxL8olKd3Wm5jryfMtu8vhe8amkveQ"
);
