/**
 * 给 xhs_posts 表添加 post_id 字段
 * 从 post_url 提取帖子ID
 */

const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

const SQL = `
-- 添加 post_id 字段（从 post_url 提取）
ALTER TABLE xhs_posts ADD COLUMN IF NOT EXISTS post_id TEXT;

-- 从 post_url 提取最后一段作为 post_id
-- 格式：https://www.xiaohongshu.com/discovery/item/692fe5d4000000001e02e93c
-- 提取：692fe5d4000000001e02e93c
UPDATE xhs_posts 
SET post_id = SUBSTRING(post_url FROM '/([^/]+)$')
WHERE post_url IS NOT NULL AND post_id IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_posts_post_id ON xhs_posts(post_id);
`;

async function main() {
  console.log("📡 执行 SQL: 添加 post_id 字段...");
  
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

  console.log("✅ SQL 执行成功!");
}

main();



