const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Supabase configuration - Replace with your actual values
const supabaseUrl = "https://wxxnpgevlncxvpbakrnx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "your-anon-key"; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployShiftSystems() {
  try {
    console.log("Deploying shift systems tables and functions...");

    // Read the SQL file
    const sqlContent = fs.readFileSync(
      "./create-shift-systems-table.sql",
      "utf8"
    );

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(
          `\n[${i + 1}/${statements.length}] Executing:`,
          statement.substring(0, 100) + "..."
        );

        try {
          const { error } = await supabase.rpc("exec_sql", { sql: statement });
          if (error) {
            console.error("❌ Error executing statement:", error);
            // Continue with next statement instead of stopping
          } else {
            console.log("✅ Statement executed successfully");
          }
        } catch (err) {
          console.error("❌ Exception executing statement:", err.message);
        }
      }
    }

    console.log("\n🎉 Shift systems deployment completed!");
    console.log("\nNext steps:");
    console.log("1. Refresh your admin panel");
    console.log("2. Try creating shift systems again");
    console.log("3. Check the browser console for any remaining errors");
  } catch (error) {
    console.error("❌ Error deploying shift systems:", error);
  }
}

// Alternative method using direct SQL execution
async function deployShiftSystemsDirect() {
  try {
    console.log("Deploying shift systems using direct SQL execution...");

    // Read the SQL file
    const sqlContent = fs.readFileSync(
      "./create-shift-systems-table.sql",
      "utf8"
    );

    // Execute the entire SQL content at once
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent });

    if (error) {
      console.error("❌ Error executing SQL:", error);
    } else {
      console.log("✅ Shift systems deployed successfully!");
    }
  } catch (error) {
    console.error("❌ Error deploying shift systems:", error);
  }
}

// Check if we should use direct execution
const useDirect = process.argv.includes("--direct");

if (useDirect) {
  deployShiftSystemsDirect();
} else {
  deployShiftSystems();
}
