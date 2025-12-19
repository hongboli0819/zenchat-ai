/**
 * 创建帖子统计视图
 */

const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

const SQL = `
-- 创建帖子总体统计视图
CREATE OR REPLACE VIEW xhs_posts_stats AS
SELECT 
  COUNT(*) as total_posts,
  COALESCE(SUM(likes), 0) as total_likes,
  COALESCE(SUM(favorites), 0) as total_favorites,
  COALESCE(SUM(comments), 0) as total_comments,
  COALESCE(SUM(interactions), 0) as total_interactions,
  COALESCE(SUM(shares), 0) as total_shares
FROM xhs_posts;
`;

async function main() {
  console.log("📡 创建帖子统计视图...");
  
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

  console.log("✅ 视图创建成功!");
}

main();



