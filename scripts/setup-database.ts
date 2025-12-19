/**
 * 数据库初始化脚本
 * 
 * 创建表结构并导入数据
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ 请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_KEY 环境变量");
  process.exit(1);
}

console.log("🔗 连接到 Supabase:", SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function checkAndCreateTables() {
  console.log("\n📋 检查数据库表...");

  // 尝试查询 xhs_accounts 表
  const { error: accountsError } = await supabase
    .from("xhs_accounts")
    .select("id")
    .limit(1);

  if (accountsError && accountsError.code === "42P01") {
    console.log("⚠️ 表不存在，请在 Supabase Dashboard 中执行以下 SQL:");
    console.log("\n" + "=".repeat(60));
    console.log(fs.readFileSync(path.join(process.cwd(), "supabase/schema.sql"), "utf-8"));
    console.log("=".repeat(60) + "\n");
    console.log("📝 步骤:");
    console.log("1. 打开 https://supabase.com/dashboard/project/qqlwechtvktkhuheoeja/sql/new");
    console.log("2. 复制上面的 SQL 并执行");
    console.log("3. 执行完成后重新运行此脚本");
    process.exit(1);
  } else if (accountsError) {
    console.error("❌ 查询失败:", accountsError);
    process.exit(1);
  }

  console.log("✅ 数据库表已存在");
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

  // 1. 提取并去重账号
  console.log("\n👤 处理账号数据...");
  const accountMap = new Map<
    string,
    {
      xhs_id: string;
      nickname: string;
      avatar: string;
      profile_url: string;
      account_type: string;
    }
  >();

  rawData.forEach((row) => {
    if (row.昵称 && !accountMap.has(row.昵称)) {
      accountMap.set(row.昵称, {
        xhs_id: String(row.小红书号 || ""),
        nickname: row.昵称,
        avatar: row.头像 || "",
        profile_url: row.账号主页链接 || "",
        account_type: row.账号类型 || "",
      });
    }
  });

  const accounts = Array.from(accountMap.values());
  console.log(`👤 共 ${accounts.length} 个唯一账号`);

  // 2. 插入账号
  console.log("⬆️ 上传账号数据...");
  
  // 分批插入账号（每次100个）
  const accountBatchSize = 100;
  let insertedAccounts: any[] = [];
  
  for (let i = 0; i < accounts.length; i += accountBatchSize) {
    const batch = accounts.slice(i, i + accountBatchSize);
    const { data, error } = await supabase
      .from("xhs_accounts")
      .upsert(batch, { onConflict: "nickname", ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`❌ 账号批次 ${Math.floor(i / accountBatchSize) + 1} 上传失败:`, error);
    } else {
      insertedAccounts = insertedAccounts.concat(data || []);
      console.log(`✅ 账号批次 ${Math.floor(i / accountBatchSize) + 1}/${Math.ceil(accounts.length / accountBatchSize)} 完成`);
    }
  }

  console.log(`✅ 成功上传 ${insertedAccounts.length} 个账号`);

  // 3. 创建昵称到账号ID的映射
  const nicknameToAccountId = new Map<string, string>();
  insertedAccounts.forEach((account) => {
    nicknameToAccountId.set(account.nickname, account.id);
  });

  // 4. 准备帖子数据
  console.log("\n📝 处理帖子数据...");
  const posts = rawData.map((row) => {
    let publishTime = null;
    if (row.发布时间) {
      try {
        publishTime = new Date(row.发布时间).toISOString();
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

  // 5. 批量插入帖子（每次 200 条）
  console.log("⬆️ 上传帖子数据...");
  const batchSize = 200;
  let successCount = 0;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from("xhs_posts")
      .upsert(batch, { onConflict: "post_url", ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`❌ 帖子批次 ${Math.floor(i / batchSize) + 1} 上传失败:`, error);
      console.error("错误详情:", JSON.stringify(error, null, 2));
    } else {
      successCount += data?.length || 0;
      console.log(
        `✅ 帖子批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)} 完成 (${successCount}/${posts.length})`
      );
    }
  }

  console.log(`\n🎉 数据导入完成!`);
  console.log(`   📊 账号: ${insertedAccounts.length} 个`);
  console.log(`   📝 帖子: ${successCount} 条`);
}

async function main() {
  console.log("🚀 开始数据库初始化...\n");

  await checkAndCreateTables();
  await importData();

  console.log("\n✨ 全部完成!");
}

main().catch(console.error);



