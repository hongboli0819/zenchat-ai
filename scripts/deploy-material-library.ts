/**
 * 部署素材库数据库迁移脚本
 * 
 * 使用 service_role key 执行 SQL
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少 Supabase 配置");
  process.exit(1);
}

// 使用 service_role 创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deployMigration() {
  console.log("🚀 开始部署素材库数据库迁移...\n");

  try {
    // 1. 创建 zip_upload_tasks 表
    console.log("📦 创建 zip_upload_tasks 表...");
    const { error: error1 } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS zip_upload_tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          status TEXT DEFAULT 'processing' 
            CHECK (status IN ('processing', 'completed', 'failed')),
          total_units INTEGER DEFAULT 0,
          processed_units INTEGER DEFAULT 0,
          matched_posts INTEGER DEFAULT 0,
          unmatched_count INTEGER DEFAULT 0,
          file_structure JSONB,
          result_summary JSONB,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });

    if (error1) {
      // 尝试直接插入一条测试数据来检查表是否存在
      const { error: testError } = await supabase
        .from("zip_upload_tasks")
        .select("id")
        .limit(1);

      if (testError && testError.code === "PGRST205") {
        console.log("   ⚠️ 需要手动在 Supabase SQL Editor 中创建表");
        console.log("   请访问: https://app.supabase.com/project/qqlwechtvktkhuheoeja/sql");
      } else if (!testError) {
        console.log("   ✅ 表已存在");
      }
    } else {
      console.log("   ✅ 创建成功");
    }

    // 2. 检查 post_images 表
    console.log("\n📷 检查 post_images 表...");
    const { error: error2 } = await supabase
      .from("post_images")
      .select("id")
      .limit(1);

    if (error2 && error2.code === "PGRST205") {
      console.log("   ⚠️ 表不存在，需要手动创建");
    } else if (!error2) {
      console.log("   ✅ 表已存在");
    }

    // 3. 检查 storage bucket
    console.log("\n🗂️ 检查 post-images storage bucket...");
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.log("   ⚠️ 无法检查 buckets:", bucketError.message);
    } else {
      const postImagesBucket = buckets?.find((b) => b.name === "post-images");
      if (postImagesBucket) {
        console.log("   ✅ Bucket 已存在");
      } else {
        console.log("   📦 创建 post-images bucket...");
        const { error: createError } = await supabase.storage.createBucket("post-images", {
          public: true,
        });
        if (createError) {
          console.log("   ⚠️ 创建失败:", createError.message);
        } else {
          console.log("   ✅ 创建成功");
        }
      }
    }

    console.log("\n✅ 部署检查完成！");
    console.log("\n如果有表需要手动创建，请执行以下步骤：");
    console.log("1. 打开 Supabase Dashboard: https://app.supabase.com");
    console.log("2. 进入 SQL Editor");
    console.log("3. 复制 supabase/migrations/add_material_library.sql 中的内容并执行");

  } catch (err) {
    console.error("❌ 部署失败:", err);
  }
}

deployMigration();


