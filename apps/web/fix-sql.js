
const fs = require("fs");
let sql = fs.readFileSync("../../supabase/migrations/002_rls_policies.sql", "utf8");

// Regex to match: CREATE POLICY "policy_name" ON public.table_name
sql = sql.replace(/CREATE POLICY "([^"]+)" ON (public\.[a-zA-Z_]+)/g, "DROP POLICY IF EXISTS \"$1\" ON $2;\nCREATE POLICY \"$1\" ON $2");

fs.writeFileSync("../../supabase/migrations/002_rls_policies.sql", sql, "utf8");
console.log("SQL File fixed");

