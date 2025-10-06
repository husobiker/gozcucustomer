const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://your-project.supabase.co"; // Replace with your actual URL
const supabaseKey = "your-anon-key"; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDutySchedules() {
  try {
    console.log("Setting up duty schedules tables...");

    // Read the SQL file
    const fs = require("fs");
    const sqlContent = fs.readFileSync(
      "./create-duty-schedules-tables.sql",
      "utf8"
    );

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 50) + "...");
        const { error } = await supabase.rpc("exec_sql", { sql: statement });
        if (error) {
          console.error("Error executing statement:", error);
        } else {
          console.log("✓ Statement executed successfully");
        }
      }
    }

    console.log("Duty schedules setup completed!");
  } catch (error) {
    console.error("Error setting up duty schedules:", error);
  }
}

setupDutySchedules();
