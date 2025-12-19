/**
 * 执行 SQL 添加缩略图字段
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qqlwechtvktkhuheoeja.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🔧 添加缩略图字段到数据库...\n");

  // 1. 为 post_images 表添加 thumbnail_url 字段
  console.log("1️⃣ 为 post_images 表添加 thumbnail_url 字段...");
  const { error: error1 } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE post_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;"
  }).single();
  
  if (error1) {
    // 如果 rpc 不可用，尝试直接查询检查字段是否存在
    const { data: checkData } = await supabase
      .from("post_images")
      .select("thumbnail_url")
      .limit(1);
    
    if (checkData !== null) {
      console.log("   ✅ thumbnail_url 字段已存在");
    } else {
      console.log("   ⚠️ 需要手动在 Supabase SQL Editor 中执行 SQL");
      console.log("   请执行: ALTER TABLE post_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;");
    }
  } else {
    console.log("   ✅ 完成");
  }

  // 2. 为 xhs_posts 表添加缩略图字段
  console.log("\n2️⃣ 为 xhs_posts 表添加缩略图字段...");
  const { error: error2 } = await supabase.rpc("exec_sql", {
    sql: `ALTER TABLE xhs_posts 
          ADD COLUMN IF NOT EXISTS card_image_thumbnail TEXT DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS merge_image_thumbnail TEXT DEFAULT NULL;`
  }).single();

  if (error2) {
    const { data: checkData2 } = await supabase
      .from("xhs_posts")
      .select("card_image_thumbnail, merge_image_thumbnail")
      .limit(1);
    
    if (checkData2 !== null) {
      console.log("   ✅ 缩略图字段已存在");
    } else {
      console.log("   ⚠️ 需要手动在 Supabase SQL Editor 中执行 SQL");
      console.log("   请执行以下 SQL:");
      console.log(`   ALTER TABLE xhs_posts 
          ADD COLUMN IF NOT EXISTS card_image_thumbnail TEXT DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS merge_image_thumbnail TEXT DEFAULT NULL;`);
    }
  } else {
    console.log("   ✅ 完成");
  }

  // 3. 验证字段
  console.log("\n3️⃣ 验证字段...");
  
  // 检查 post_images 表
  const { data: postImagesTest, error: testError1 } = await supabase
    .from("post_images")
    .select("id, thumbnail_url")
    .limit(1);
  
  if (testError1) {
    console.log("   ❌ post_images.thumbnail_url 字段不存在，请手动执行 SQL");
  } else {
    console.log("   ✅ post_images.thumbnail_url 字段已就绪");
  }

  // 检查 xhs_posts 表
  const { data: xhsPostsTest, error: testError2 } = await supabase
    .from("xhs_posts")
    .select("id, card_image_thumbnail, merge_image_thumbnail")
    .limit(1);
  
  if (testError2) {
    console.log("   ❌ xhs_posts 缩略图字段不存在，请手动执行 SQL");
  } else {
    console.log("   ✅ xhs_posts 缩略图字段已就绪");
  }

  console.log("\n✅ 数据库字段检查完成！");
  console.log("\n📋 如果字段不存在，请在 Supabase SQL Editor 中执行以下 SQL:");
  console.log("─".repeat(60));
  console.log(`
-- post_images 表
ALTER TABLE post_images 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

-- xhs_posts 表
ALTER TABLE xhs_posts 
ADD COLUMN IF NOT EXISTS card_image_thumbnail TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS merge_image_thumbnail TEXT DEFAULT NULL;
`);
}

main().catch(console.error);

