const { createClient } = require("@supabase/supabase-js");

// Supabase configuration - Replace with your actual values
const supabaseUrl = "https://wxxnpgevlncxvpbakrnx.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "your-anon-key"; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testShiftFunctions() {
  try {
    console.log("Testing shift system functions...\n");

    // Test 1: Check if tables exist
    console.log("1. Checking if shift_systems table exists...");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "shift_systems");

    if (tablesError) {
      console.log("❌ Error checking tables:", tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log("✅ shift_systems table exists");
    } else {
      console.log("❌ shift_systems table does not exist");
    }

    // Test 2: Check if shift_details table exists
    console.log("\n2. Checking if shift_details table exists...");
    const { data: detailsTables, error: detailsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "shift_details");

    if (detailsError) {
      console.log("❌ Error checking details table:", detailsError.message);
    } else if (detailsTables && detailsTables.length > 0) {
      console.log("✅ shift_details table exists");
    } else {
      console.log("❌ shift_details table does not exist");
    }

    // Test 3: Check if functions exist
    console.log("\n3. Checking if RPC functions exist...");

    const functions = [
      "create_8_hour_3_shift_system",
      "create_12_hour_2_shift_system",
      "create_12_36_shift_system",
      "get_shift_system_info",
    ];

    for (const funcName of functions) {
      try {
        // Try to call the function with dummy parameters to see if it exists
        const { error } = await supabase.rpc(funcName, {
          tenant_id_param: "00000000-0000-0000-0000-000000000000",
          project_id_param: "00000000-0000-0000-0000-000000000000",
        });

        if (error) {
          if (
            error.message.includes("function") &&
            error.message.includes("does not exist")
          ) {
            console.log(`❌ ${funcName} function does not exist`);
          } else {
            console.log(
              `✅ ${funcName} function exists (but may have parameter errors)`
            );
          }
        } else {
          console.log(`✅ ${funcName} function exists`);
        }
      } catch (err) {
        console.log(`❌ ${funcName} function does not exist or has errors`);
      }
    }

    // Test 4: Check if we can query shift_systems table
    console.log("\n4. Testing shift_systems table access...");
    const { data: systems, error: systemsError } = await supabase
      .from("shift_systems")
      .select("*")
      .limit(1);

    if (systemsError) {
      console.log("❌ Error accessing shift_systems:", systemsError.message);
    } else {
      console.log("✅ Can access shift_systems table");
      console.log(`   Found ${systems?.length || 0} existing systems`);
    }

    console.log("\n📋 Summary:");
    console.log(
      "- If tables don't exist: Run create-shift-systems-table.sql in Supabase SQL Editor"
    );
    console.log(
      "- If functions don't exist: Run create-shift-systems-table.sql in Supabase SQL Editor"
    );
    console.log("- If RLS errors: Run temporarily-disable-rls.sql first");
  } catch (error) {
    console.error("❌ Error testing functions:", error);
  }
}

testShiftFunctions();
