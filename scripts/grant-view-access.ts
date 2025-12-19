/**
 * 给视图添加访问权限
 */

const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

const SQL = `
-- 授予匿名用户对视图的访问权限
GRANT SELECT ON xhs_posts_stats TO anon;
GRANT SELECT ON xhs_posts_stats TO authenticated;
`;

async function main() {
  console.log("📡 授予视图访问权限...");
  
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

  console.log("✅ 权限授予成功!");
}

main();



