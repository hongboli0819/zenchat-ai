/**
 * 自动化数据库设置脚本
 * 
 * 使用 Supabase Management API 创建表并导入数据
 */

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

// 配置
const SUPABASE_URL = "https://qqlwechtvktkhuheoeja.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I";
const SUPABASE_ACCESS_TOKEN = "sbp_f13dc569448f0535fbe9914138908521af3ad99e";
const PROJECT_REF = "qqlwechtvktkhuheoeja";

// 建表 SQL
const CREATE_TABLES_SQL = `
-- 启用 uuid 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS xhs_posts CASCADE;
DROP TABLE IF EXISTS xhs_accounts CASCADE;

-- 表 1: xhs_accounts (小红书账号)
CREATE TABLE xhs_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  xhs_id TEXT,
  nickname TEXT NOT NULL UNIQUE,
  avatar TEXT,
  profile_url TEXT,
  account_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_xhs_accounts_nickname ON xhs_accounts(nickname);

-- 表 2: xhs_posts (小红书帖子)
CREATE TABLE xhs_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES xhs_accounts(id) ON DELETE CASCADE,
  platform TEXT DEFAULT '小红书',
  title TEXT,
  content TEXT,
  post_url TEXT UNIQUE,
  cover_url TEXT,
  note_type TEXT,
  publish_time TIMESTAMPTZ,
  status TEXT,
  interactions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  data_period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_xhs_posts_account_id ON xhs_posts(account_id);
CREATE INDEX idx_xhs_posts_publish_time ON xhs_posts(publish_time DESC);
CREATE INDEX idx_xhs_posts_interactions ON xhs_posts(interactions DESC);

-- RLS 策略
ALTER TABLE xhs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_posts ENABLE ROW LEVEL SECURITY;

-- Service role 完全访问
CREATE POLICY "service_role_all_xhs_accounts" ON xhs_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_xhs_posts" ON xhs_posts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 匿名用户只读
CREATE POLICY "anon_read_xhs_accounts" ON xhs_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_xhs_posts" ON xhs_posts FOR SELECT TO anon USING (true);
`;

interface RawData {
  序号: number;
  平台: string;
  标题: string;
  作品正文: string;
  作品原链接: string;
  封面图链接: string;
  笔记类型: string;
  发布时间: string;
  昵称: string;
  头像: string;
  账号主页链接: string;
  小红书号: string;
  作品状态: string;
  账号类型: string;
  互动量: number;
  获赞数: number;
  收藏数: number;
  评论数: number;
  分享数: number;
  发布时间段: string;
}

async function executeSQL(sql: string): Promise<boolean> {
  console.log("📡 执行 SQL...");
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ SQL 执行失败:", error);
      return false;
    }

    const result = await response.json();
    console.log("✅ SQL 执行成功");
    return true;
  } catch (error) {
    console.error("❌ 请求失败:", error);
    return false;
  }
}

async function importData() {
  console.log("\n📁 读取 xlsx 文件...");

  const xlsxPath = path.join(process.cwd(), "副本小红书作品数据20251204141711.xlsx");

  if (!fs.existsSync(xlsxPath)) {
    console.error("❌ 找不到 xlsx 文件:", xlsxPath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: RawData[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 读取到 ${rawData.length} 条数据`);

  // 创建 Supabase 客户端
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. 提取并去重账号
  console.log("\n👤 处理账号数据...");
  const accountMap = new Map<string, {
    xhs_id: string | null;
    nickname: string;
    avatar: string | null;
    profile_url: string | null;
    account_type: string | null;
  }>();

  rawData.forEach((row) => {
    if (row.昵称 && !accountMap.has(row.昵称)) {
      accountMap.set(row.昵称, {
        xhs_id: row.小红书号 ? String(row.小红书号) : null,
        nickname: row.昵称,
        avatar: row.头像 || null,
        profile_url: row.账号主页链接 || null,
        account_type: row.账号类型 || null,
      });
    }
  });

  const accounts = Array.from(accountMap.values());
  console.log(`👤 共 ${accounts.length} 个唯一账号`);

  // 2. 插入账号
  console.log("⬆️ 上传账号数据...");
  
  const { data: insertedAccounts, error: accountError } = await supabase
    .from("xhs_accounts")
    .insert(accounts)
    .select();

  if (accountError) {
    console.error("❌ 账号上传失败:", accountError);
    process.exit(1);
  }

  console.log(`✅ 成功上传 ${insertedAccounts?.length || 0} 个账号`);

  // 3. 创建昵称到账号ID的映射
  const nicknameToAccountId = new Map<string, string>();
  insertedAccounts?.forEach((account) => {
    nicknameToAccountId.set(account.nickname, account.id);
  });

  // 4. 准备帖子数据
  console.log("\n📝 处理帖子数据...");
  const posts = rawData.map((row) => {
    let publishTime = null;
    if (row.发布时间) {
      try {
        const date = new Date(row.发布时间);
        if (!isNaN(date.getTime())) {
          publishTime = date.toISOString();
        }
      } catch (e) {
        publishTime = null;
      }
    }

    return {
      account_id: nicknameToAccountId.get(row.昵称) || null,
      platform: row.平台 || "小红书",
      title: row.标题 || null,
      content: row.作品正文 || null,
      post_url: row.作品原链接 || null,
      cover_url: row.封面图链接 || null,
      note_type: row.笔记类型 || null,
      publish_time: publishTime,
      status: row.作品状态 || null,
      interactions: Number(row.互动量) || 0,
      likes: Number(row.获赞数) || 0,
      favorites: Number(row.收藏数) || 0,
      comments: Number(row.评论数) || 0,
      shares: Number(row.分享数) || 0,
      data_period: row.发布时间段 || null,
    };
  });

  // 5. 批量插入帖子
  console.log("⬆️ 上传帖子数据...");
  const batchSize = 100;
  let successCount = 0;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from("xhs_posts")
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ 帖子批次 ${Math.floor(i / batchSize) + 1} 失败:`, error.message);
    } else {
      successCount += data?.length || 0;
      console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)} 完成`);
    }
  }

  console.log(`\n🎉 数据导入完成!`);
  console.log(`   📊 账号: ${insertedAccounts?.length || 0} 个`);
  console.log(`   📝 帖子: ${successCount} 条`);
}

async function main() {
  console.log("🚀 开始自动化部署...\n");
  console.log("📦 项目: " + PROJECT_REF);
  console.log("🔗 URL: " + SUPABASE_URL);

  // Step 1: 创建表
  console.log("\n" + "=".repeat(50));
  console.log("📋 Step 1: 创建数据库表");
  console.log("=".repeat(50));
  
  const sqlSuccess = await executeSQL(CREATE_TABLES_SQL);
  if (!sqlSuccess) {
    console.error("❌ 建表失败，请检查 Access Token 权限");
    process.exit(1);
  }

  // 等待几秒让数据库同步
  console.log("⏳ 等待数据库同步...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 2: 导入数据
  console.log("\n" + "=".repeat(50));
  console.log("📥 Step 2: 导入数据");
  console.log("=".repeat(50));
  
  await importData();

  console.log("\n" + "=".repeat(50));
  console.log("✨ 全部完成!");
  console.log("=".repeat(50));
  console.log("\n🌐 可以在以下地址查看数据:");
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/editor`);
}

main().catch(console.error);

