/**
 * 创建账号统计视图
 */

const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

const CREATE_VIEW_SQL = `
CREATE OR REPLACE VIEW xhs_account_stats AS
SELECT 
  a.id,
  a.xhs_id,
  a.nickname,
  a.avatar,
  a.profile_url,
  a.account_type,
  COUNT(p.id) as total_posts,
  COALESCE(SUM(p.interactions), 0) as total_interactions,
  COALESCE(SUM(p.likes), 0) as total_likes,
  COALESCE(SUM(p.favorites), 0) as total_favorites,
  COALESCE(SUM(p.comments), 0) as total_comments,
  COALESCE(SUM(p.shares), 0) as total_shares,
  a.created_at,
  a.updated_at
FROM xhs_accounts a
LEFT JOIN xhs_posts p ON a.id = p.account_id
GROUP BY a.id
ORDER BY total_interactions DESC;
`;

async function main() {
  console.log("📡 创建账号统计视图...");
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: CREATE_VIEW_SQL }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ 创建失败:", error);
    return;
  }

  console.log("✅ 视图创建成功!");
}

main();



