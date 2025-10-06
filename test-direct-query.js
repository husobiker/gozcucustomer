// Test script to check Supabase connection directly
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://wxxnpgevlncxvpbakrnx.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eG5wZ2V2bG5jeHZwYmFrcm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM0NDcyMSwiZXhwIjoyMDczOTIwNzIxfQ.K_lv5FRs2nZMSdxL8olKd3Wm5jryfMtu8vhe8amkveQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQueries() {
  console.log("🔍 Testing Supabase queries...");

  const tenantId = "95ba933f-6647-4181-bf57-e50119b13050";

  // Test 2: Projects (all)
  console.log("\n2. Testing Projects query:");
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("tenant_id", tenantId);

  if (projectsError) {
    console.error("❌ Projects error:", projectsError);
    return;
  } else {
    console.log("✅ Projects result:", projects?.length || 0, "items");
    console.log("All projects:", projects);
  }

  // Test 1: Personnel (with project filter) - Parkverde Residance
  console.log("\n1. Testing Personnel query for Parkverde Residance:");
  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id, first_name, last_name")
    .eq("tenant_id", tenantId)
    .eq("project_id", "e68213b9-aee2-4344-8369-15dc794126e8") // Parkverde Residance project ID
    .limit(10);

  if (personnelError) {
    console.error("❌ Personnel error:", personnelError);
  } else {
    console.log("✅ Personnel result:", personnel?.length || 0, "items");
    console.log("Sample:", personnel?.[0]);
  }

  // Test 3: Joker Personnel - Parkverde Residance
  console.log("\n3. Testing Joker Personnel query for Parkverde Residance:");
  const { data: jokers, error: jokersError } = await supabase
    .from("joker_personnel")
    .select(
      "id, first_name, last_name, phone, id_number, company_name, status, project_id"
    )
    .eq("tenant_id", tenantId)
    .eq("project_id", "e68213b9-aee2-4344-8369-15dc794126e8") // Parkverde Residance project ID
    .eq("status", "Aktif");

  if (jokersError) {
    console.error("❌ Joker personnel error:", jokersError);
  } else {
    console.log("✅ Joker personnel result:", jokers?.length || 0, "items");
    console.log("Sample:", jokers?.[0]);
  }
}

testQueries().catch(console.error);
