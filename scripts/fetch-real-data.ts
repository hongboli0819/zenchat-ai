/**
 * 从数据库获取所有真实数据，用于生成 Mock 数据
 * 
 * 规则：
 * - 获取所有帖子（包括没有图片的）
 * - 找到最近发布的帖子，往前倒推一周作为"本周"范围
 * - 互动量超过 20 的就是 AAA（爆款）
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchRealData() {
  console.log("📊 获取所有真实数据用于生成 Mock 数据...\n");

  // 1. 获取账号数据
  const { data: accounts, error: accountsError } = await supabase
    .from("xhs_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (accountsError) {
    console.error("获取账号失败:", accountsError);
    return;
  }

  console.log(`✅ 获取到 ${accounts?.length || 0} 个账号\n`);

  // 2. 获取所有帖子数据（包括没有图片的）
  const { data: posts, error: postsError } = await supabase
    .from("xhs_posts")
    .select("*, xhs_accounts(nickname, avatar)")
    .order("publish_time", { ascending: false });

  if (postsError) {
    console.error("获取帖子失败:", postsError);
    return;
  }

  console.log(`✅ 获取到 ${posts?.length || 0} 篇帖子\n`);

  // 3. 找到最近发布的帖子，往前倒推一周
  const validPosts = posts?.filter(p => p.publish_time) || [];
  if (validPosts.length === 0) {
    console.log("❌ 没有找到有发布时间的帖子");
    return;
  }

  // 按发布时间排序，找到最新的
  const sortedPosts = [...validPosts].sort((a, b) => 
    new Date(b.publish_time!).getTime() - new Date(a.publish_time!).getTime()
  );

  const latestDate = new Date(sortedPosts[0].publish_time!);
  const weekAgo = new Date(latestDate);
  weekAgo.setDate(weekAgo.getDate() - 7);

  console.log(`📅 最新帖子发布时间: ${latestDate.toISOString().split('T')[0]}`);
  console.log(`📅 本周范围: ${weekAgo.toISOString().split('T')[0]} ~ ${latestDate.toISOString().split('T')[0]}\n`);

  // 4. 筛选本周帖子
  const thisWeekPosts = sortedPosts.filter(p => {
    const postDate = new Date(p.publish_time!);
    return postDate >= weekAgo && postDate <= latestDate;
  });

  console.log(`📊 本周帖子数量: ${thisWeekPosts.length}\n`);

  // 5. AAA 爆款（互动量 > 20）
  const aaaPosts = thisWeekPosts.filter(p => (p.interactions || 0) > 20);
  console.log(`🔥 本周 AAA 爆款（互动量>20）: ${aaaPosts.length} 篇\n`);

  // 6. 分析每个账号的数据
  const accountStats = new Map<string, {
    account: typeof accounts[0];
    thisWeekPosts: number;
    thisWeekInteractions: number;
    thisWeekAAA: number;
    totalPosts: number;
    totalInteractions: number;
    avgInteraction: number;
  }>();

  // 初始化所有账号
  accounts?.forEach(account => {
    accountStats.set(account.id, {
      account,
      thisWeekPosts: 0,
      thisWeekInteractions: 0,
      thisWeekAAA: 0,
      totalPosts: 0,
      totalInteractions: 0,
      avgInteraction: 0,
    });
  });

  // 计算总数据
  sortedPosts.forEach(post => {
    if (!post.account_id) return;
    const stat = accountStats.get(post.account_id);
    if (stat) {
      stat.totalPosts += 1;
      stat.totalInteractions += post.interactions || 0;
    }
  });

  // 计算本周数据
  thisWeekPosts.forEach(post => {
    if (!post.account_id) return;
    const stat = accountStats.get(post.account_id);
    if (stat) {
      stat.thisWeekPosts += 1;
      stat.thisWeekInteractions += post.interactions || 0;
      if ((post.interactions || 0) > 20) {
        stat.thisWeekAAA += 1;
      }
    }
  });

  // 计算平均互动
  accountStats.forEach(stat => {
    stat.avgInteraction = stat.totalPosts > 0 
      ? Math.round(stat.totalInteractions / stat.totalPosts) 
      : 0;
  });

  // 7. 筛选有本周数据的账号
  const activeAccounts = Array.from(accountStats.values())
    .filter(s => s.thisWeekPosts > 0)
    .sort((a, b) => b.thisWeekInteractions - a.thisWeekInteractions);

  console.log(`👥 本周活跃达人: ${activeAccounts.length} 人\n`);

  // ============ 开始生成报告 ============
  let output = "";
  
  output += "# 策略洞察真实数据报告\n\n";
  output += `生成时间: ${new Date().toISOString()}\n\n`;
  
  // 基础统计
  output += "## 一、基础统计\n\n";
  output += `- 总账号数: ${accounts?.length || 0}\n`;
  output += `- 总帖子数: ${sortedPosts.length}\n`;
  output += `- 最新帖子日期: ${latestDate.toISOString().split('T')[0]}\n`;
  output += `- 本周范围: ${weekAgo.toISOString().split('T')[0]} ~ ${latestDate.toISOString().split('T')[0]}\n`;
  output += `- 本周帖子数: ${thisWeekPosts.length}\n`;
  output += `- 本周 AAA 爆款数（互动量>20）: ${aaaPosts.length}\n`;
  output += `- 本周 AAA 比例: ${thisWeekPosts.length > 0 ? ((aaaPosts.length / thisWeekPosts.length) * 100).toFixed(1) : 0}%\n`;
  output += `- 本周活跃达人数: ${activeAccounts.length}\n\n`;

  // 本周爆款详情
  output += "## 二、本周 AAA 爆款详情（互动量>20）\n\n";
  if (aaaPosts.length > 0) {
    aaaPosts.sort((a, b) => (b.interactions || 0) - (a.interactions || 0));
    aaaPosts.forEach((post, index) => {
      const accountInfo = post.xhs_accounts as { nickname?: string } | null;
      output += `### ${index + 1}. ${post.title || '无标题'}\n`;
      output += `- 达人: ${accountInfo?.nickname || '未知'}\n`;
      output += `- 互动量: ${post.interactions || 0}\n`;
      output += `- 点赞: ${post.likes || 0} | 收藏: ${post.favorites || 0} | 评论: ${post.comments || 0}\n`;
      output += `- 发布时间: ${post.publish_time}\n`;
      output += `- 类型: ${post.note_type || '未知'}\n\n`;
    });
  } else {
    output += "本周暂无 AAA 爆款\n\n";
  }

  // 本周达人表现
  output += "## 三、本周达人表现（按互动量排序）\n\n";
  output += "| 排名 | 达人 | 本周帖子 | 本周互动 | 本周AAA | 总帖子 | 平均互动 |\n";
  output += "|------|------|----------|----------|---------|--------|----------|\n";
  activeAccounts.slice(0, 20).forEach((stat, index) => {
    output += `| ${index + 1} | ${stat.account.nickname} | ${stat.thisWeekPosts} | ${stat.thisWeekInteractions} | ${stat.thisWeekAAA} | ${stat.totalPosts} | ${stat.avgInteraction} |\n`;
  });
  output += "\n";

  // 所有达人总览
  output += "## 四、所有达人总览（按总互动量排序）\n\n";
  const allAccountsSorted = Array.from(accountStats.values())
    .filter(s => s.totalPosts > 0)
    .sort((a, b) => b.totalInteractions - a.totalInteractions);
  
  output += "| 排名 | 达人 | 头像URL | 总帖子 | 总互动 | 平均互动 |\n";
  output += "|------|------|---------|--------|--------|----------|\n";
  allAccountsSorted.forEach((stat, index) => {
    const avatarUrl = stat.account.avatar ? stat.account.avatar.substring(0, 50) + '...' : '无';
    output += `| ${index + 1} | ${stat.account.nickname} | ${avatarUrl} | ${stat.totalPosts} | ${stat.totalInteractions} | ${stat.avgInteraction} |\n`;
  });
  output += "\n";

  // 按周统计（过去8周）
  output += "## 五、过去8周趋势数据\n\n";
  output += "| 周次 | 日期范围 | 帖子数 | AAA数 | AAA比例 | 总互动 |\n";
  output += "|------|----------|--------|-------|---------|--------|\n";
  
  for (let i = 0; i < 8; i++) {
    const weekEnd = new Date(latestDate);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekPosts = sortedPosts.filter(p => {
      const postDate = new Date(p.publish_time!);
      return postDate >= weekStart && postDate <= weekEnd;
    });
    
    const weekAAA = weekPosts.filter(p => (p.interactions || 0) > 20);
    const weekInteractions = weekPosts.reduce((sum, p) => sum + (p.interactions || 0), 0);
    const aaaRatio = weekPosts.length > 0 ? ((weekAAA.length / weekPosts.length) * 100).toFixed(1) : '0.0';
    
    output += `| W${8 - i} | ${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]} | ${weekPosts.length} | ${weekAAA.length} | ${aaaRatio}% | ${weekInteractions} |\n`;
  }
  output += "\n";

  // KPI 数据
  output += "## 六、KPI 指标\n\n";
  const totalInteractions = sortedPosts.reduce((sum, p) => sum + (p.interactions || 0), 0);
  const avgInteractionsPerPost = sortedPosts.length > 0 ? totalInteractions / sortedPosts.length : 0;
  const thisWeekTotalInteractions = thisWeekPosts.reduce((sum, p) => sum + (p.interactions || 0), 0);
  const thisWeekAvgInteractions = thisWeekPosts.length > 0 ? thisWeekTotalInteractions / thisWeekPosts.length : 0;
  
  output += `- 总互动量（全部）: ${totalInteractions}\n`;
  output += `- 平均互动量（全部）: ${avgInteractionsPerPost.toFixed(1)}\n`;
  output += `- 本周总互动量: ${thisWeekTotalInteractions}\n`;
  output += `- 本周平均互动量: ${thisWeekAvgInteractions.toFixed(1)}\n`;
  output += `- 本周活跃达人比例: ${accounts?.length ? ((activeAccounts.length / accounts.length) * 100).toFixed(1) : 0}%\n\n`;

  // 达人矩阵数据（用于代码）
  output += "## 七、达人矩阵数据（可直接用于代码）\n\n";
  output += "```typescript\n";
  output += "export const realInfluencerData: InfluencerMatrixData[] = [\n";
  
  allAccountsSorted.slice(0, 10).forEach(stat => {
    const monthlyOutput = Math.round(stat.totalPosts / 3); // 假设 3 个月数据
    const interactionRate = stat.avgInteraction / 10000; // 假设 10000 粉丝基数
    
    // 计算象限
    const avgAllInteraction = allAccountsSorted.reduce((sum, s) => sum + s.avgInteraction, 0) / allAccountsSorted.length;
    const avgAllOutput = allAccountsSorted.reduce((sum, s) => sum + s.totalPosts, 0) / allAccountsSorted.length / 3;
    
    let quadrant: string;
    const highInteraction = stat.avgInteraction > avgAllInteraction;
    const highOutput = monthlyOutput > avgAllOutput;
    
    if (highInteraction && !highOutput) quadrant = "star";
    else if (highInteraction && highOutput) quadrant = "potential";
    else if (!highInteraction && !highOutput) quadrant = "costEffective";
    else quadrant = "lowEfficiency";

    output += `  { id: "${stat.account.id}", accountId: "${stat.account.id}", nickname: "${stat.account.nickname}", avatar: ${stat.account.avatar ? `"${stat.account.avatar}"` : "null"}, monthlyOutput: ${monthlyOutput}, avgInteraction: ${stat.avgInteraction}, interactionRate: ${interactionRate.toFixed(4)}, quadrant: "${quadrant}" },\n`;
  });
  
  output += "];\n";
  output += "```\n\n";

  // 周度统计数据（用于代码）
  output += "## 八、周度统计数据（可直接用于代码）\n\n";
  output += "```typescript\n";
  output += `export const mockWeeklyStats = {\n`;
  output += `  totalPosts: ${thisWeekPosts.length},\n`;
  output += `  topPerformingPosts: ${aaaPosts.length},\n`;
  output += `  topPerformingRatio: ${thisWeekPosts.length > 0 ? ((aaaPosts.length / thisWeekPosts.length) * 100).toFixed(1) : 0},\n`;
  output += `};\n`;
  output += "```\n\n";

  // 写入文件
  fs.writeFileSync("real-data-report.md", output, "utf-8");
  console.log("✅ 数据报告已保存到 real-data-report.md\n");

  // 同时输出到控制台
  console.log(output);
}

fetchRealData().catch(console.error);
