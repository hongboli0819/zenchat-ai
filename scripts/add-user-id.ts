/**
 * 给 xhs_accounts 表添加 xhs_user_id 字段
 * 从 profile_url 提取用户ID
 */

const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

const SQL = `
-- 添加 xhs_user_id 字段（从 profile_url 提取）
ALTER TABLE xhs_accounts ADD COLUMN IF NOT EXISTS xhs_user_id TEXT;

-- 从 profile_url 提取最后一段作为 xhs_user_id
UPDATE xhs_accounts 
SET xhs_user_id = SUBSTRING(profile_url FROM '/profile/([^/]+)$')
WHERE profile_url IS NOT NULL AND profile_url LIKE '%/profile/%';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_accounts_user_id ON xhs_accounts(xhs_user_id);
`;

async function main() {
  console.log("📡 执行 SQL: 添加 xhs_user_id 字段...");
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ 执行失败:", error);
    return;
  }

  const result = await response.json();
  console.log("✅ SQL 执行成功!");
  console.log("📊 结果:", JSON.stringify(result, null, 2));
}

main();



