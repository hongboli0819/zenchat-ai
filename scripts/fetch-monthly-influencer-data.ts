/**
 * 从数据库获取按月统计的达人效果矩阵数据
 * 
 * 规则：
 * - 找到最后一篇内容的发布时间
 * - 往前倒推1个月作为统计范围
 * - 计算每个达人在这个月的表现
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchMonthlyInfluencerData() {
  console.log("📊 获取达人效果矩阵数据（按月统计）...\n");

  // 1. 获取所有账号
  const { data: accounts, error: accountsError } = await supabase
    .from("xhs_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (accountsError) {
    console.error("获取账号失败:", accountsError);
    return;
  }

  console.log(`✅ 总达人数: ${accounts?.length || 0}\n`);

  // 2. 获取所有帖子
  const { data: posts, error: postsError } = await supabase
    .from("xhs_posts")
    .select("*, xhs_accounts(nickname, avatar)")
    .order("publish_time", { ascending: false });

  if (postsError) {
    console.error("获取帖子失败:", postsError);
    return;
  }

  console.log(`✅ 总帖子数: ${posts?.length || 0}\n`);

  // 3. 找到最后一篇内容的发布时间，往前倒推1个月
  const validPosts = posts?.filter(p => p.publish_time) || [];
  if (validPosts.length === 0) {
    console.log("❌ 没有找到有发布时间的帖子");
    return;
  }

  const sortedPosts = [...validPosts].sort((a, b) => 
    new Date(b.publish_time!).getTime() - new Date(a.publish_time!).getTime()
  );

  const latestDate = new Date(sortedPosts[0].publish_time!);
  const monthAgo = new Date(latestDate);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  console.log(`📅 最新帖子发布时间: ${latestDate.toISOString().split('T')[0]}`);
  console.log(`📅 统计范围: ${monthAgo.toISOString().split('T')[0]} ~ ${latestDate.toISOString().split('T')[0]}\n`);

  // 4. 筛选本月帖子
  const thisMonthPosts = sortedPosts.filter(p => {
    const postDate = new Date(p.publish_time!);
    return postDate >= monthAgo && postDate <= latestDate;
  });

  console.log(`📊 本月帖子数量: ${thisMonthPosts.length}\n`);

  // 5. 统计每个达人的本月表现
  const accountStats = new Map<string, {
    account: typeof accounts[0];
    monthlyPosts: number;
    monthlyInteractions: number;
    monthlyLikes: number;
    monthlyFavorites: number;
    monthlyComments: number;
    avgInteraction: number;
    posts: typeof thisMonthPosts;
  }>();

  // 初始化所有账号（包括没有发布的）
  accounts?.forEach(account => {
    accountStats.set(account.id, {
      account,
      monthlyPosts: 0,
      monthlyInteractions: 0,
      monthlyLikes: 0,
      monthlyFavorites: 0,
      monthlyComments: 0,
      avgInteraction: 0,
      posts: [],
    });
  });

  // 计算本月数据
  thisMonthPosts.forEach(post => {
    if (!post.account_id) return;
    const stat = accountStats.get(post.account_id);
    if (stat) {
      stat.monthlyPosts += 1;
      stat.monthlyInteractions += post.interactions || 0;
      stat.monthlyLikes += post.likes || 0;
      stat.monthlyFavorites += post.favorites || 0;
      stat.monthlyComments += post.comments || 0;
      stat.posts.push(post);
    }
  });

  // 计算平均互动
  accountStats.forEach(stat => {
    stat.avgInteraction = stat.monthlyPosts > 0 
      ? Math.round(stat.monthlyInteractions / stat.monthlyPosts) 
      : 0;
  });

  // 6. 分类达人
  const activeAccounts = Array.from(accountStats.values()).filter(s => s.monthlyPosts > 0);
  const inactiveAccounts = Array.from(accountStats.values()).filter(s => s.monthlyPosts === 0);

  console.log(`👥 本月活跃达人: ${activeAccounts.length} 人`);
  console.log(`😴 本月未发布达人: ${inactiveAccounts.length} 人\n`);

  // 7. 计算象限
  const avgInteraction = activeAccounts.reduce((sum, s) => sum + s.avgInteraction, 0) / Math.max(1, activeAccounts.length);
  const avgOutput = activeAccounts.reduce((sum, s) => sum + s.monthlyPosts, 0) / Math.max(1, activeAccounts.length);

  console.log(`📈 平均互动量: ${avgInteraction.toFixed(1)}`);
  console.log(`📝 平均产出量: ${avgOutput.toFixed(1)} 篇\n`);

  const quadrantData = {
    star: [] as typeof activeAccounts,       // 高互动低产出
    potential: [] as typeof activeAccounts,  // 高互动高产出
    costEffective: [] as typeof activeAccounts, // 低互动低产出
    lowEfficiency: [] as typeof activeAccounts, // 低互动高产出
  };

  activeAccounts.forEach(stat => {
    const highInteraction = stat.avgInteraction > avgInteraction;
    const highOutput = stat.monthlyPosts > avgOutput;

    if (highInteraction && !highOutput) {
      quadrantData.star.push(stat);
    } else if (highInteraction && highOutput) {
      quadrantData.potential.push(stat);
    } else if (!highInteraction && !highOutput) {
      quadrantData.costEffective.push(stat);
    } else {
      quadrantData.lowEfficiency.push(stat);
    }
  });

  console.log("📊 象限分布:");
  console.log(`  ⭐ 明星型（高互动低产出）: ${quadrantData.star.length} 人`);
  console.log(`  🚀 潜力型（高互动高产出）: ${quadrantData.potential.length} 人`);
  console.log(`  💰 性价比型（低互动低产出）: ${quadrantData.costEffective.length} 人`);
  console.log(`  ⚠️ 低效型（低互动高产出）: ${quadrantData.lowEfficiency.length} 人\n`);

  // ============ 生成代码 ============
  let output = "";
  
  output += "// ============ 达人效果矩阵数据（基于真实数据）============\n";
  output += `// 统计范围: ${monthAgo.toISOString().split('T')[0]} ~ ${latestDate.toISOString().split('T')[0]}\n`;
  output += `// 总达人: ${accounts?.length}, 活跃: ${activeAccounts.length}, 未发布: ${inactiveAccounts.length}\n`;
  output += `// 平均互动: ${avgInteraction.toFixed(1)}, 平均产出: ${avgOutput.toFixed(1)}\n\n`;

  output += "export const mockInfluencerData: InfluencerMatrixData[] = [\n";

  // 按象限输出所有活跃达人
  const allActiveWithQuadrant = activeAccounts.map(stat => {
    const highInteraction = stat.avgInteraction > avgInteraction;
    const highOutput = stat.monthlyPosts > avgOutput;
    let quadrant: string;
    if (highInteraction && !highOutput) quadrant = "star";
    else if (highInteraction && highOutput) quadrant = "potential";
    else if (!highInteraction && !highOutput) quadrant = "costEffective";
    else quadrant = "lowEfficiency";

    return { ...stat, quadrant };
  }).sort((a, b) => b.avgInteraction - a.avgInteraction);

  allActiveWithQuadrant.forEach(stat => {
    const avatarStr = stat.account.avatar ? `"${stat.account.avatar}"` : "null";
    output += `  { id: "${stat.account.id}", accountId: "${stat.account.id}", nickname: "${stat.account.nickname}", avatar: ${avatarStr}, monthlyOutput: ${stat.monthlyPosts}, avgInteraction: ${stat.avgInteraction}, interactionRate: ${(stat.avgInteraction / 10000).toFixed(4)}, quadrant: "${stat.quadrant}" },\n`;
  });

  output += "];\n\n";

  // 未发布达人
  output += "// ============ 本月未发布达人 ============\n";
  output += "export const mockInactiveInfluencers = [\n";
  inactiveAccounts.slice(0, 20).forEach(stat => {
    const avatarStr = stat.account.avatar ? `"${stat.account.avatar}"` : "null";
    output += `  { id: "${stat.account.id}", nickname: "${stat.account.nickname}", avatar: ${avatarStr} },\n`;
  });
  if (inactiveAccounts.length > 20) {
    output += `  // ... 还有 ${inactiveAccounts.length - 20} 个未发布达人\n`;
  }
  output += "];\n\n";

  // 预警数据（互动量最高和最低的）
  output += "// ============ 达人预警数据 ============\n";
  output += "export const mockInfluencerAlerts: InfluencerAlert[] = [\n";
  
  // 表现最好的
  const topPerformers = allActiveWithQuadrant.slice(0, 2);
  topPerformers.forEach((stat, index) => {
    const avatarStr = stat.account.avatar ? `"${stat.account.avatar}"` : "null";
    output += `  { id: "alert-${index + 1}", accountId: "${stat.account.id}", nickname: "${stat.account.nickname}", avatar: ${avatarStr}, type: "positive", message: "本月平均互动 ${stat.avgInteraction}，产出 ${stat.monthlyPosts} 篇，表现优异", metric: "interaction", changeValue: ${Math.round(Math.random() * 30 + 20)} },\n`;
  });

  // 表现需要关注的（产出高但互动低）
  const needAttention = quadrantData.lowEfficiency.sort((a, b) => b.monthlyPosts - a.monthlyPosts).slice(0, 1);
  needAttention.forEach((stat, index) => {
    const avatarStr = stat.account.avatar ? `"${stat.account.avatar}"` : "null";
    output += `  { id: "alert-${topPerformers.length + index + 1}", accountId: "${stat.account.id}", nickname: "${stat.account.nickname}", avatar: ${avatarStr}, type: "warning", message: "产出 ${stat.monthlyPosts} 篇但平均互动仅 ${stat.avgInteraction}，建议优化内容", metric: "interaction", changeValue: -${Math.round(Math.random() * 20 + 10)} },\n`;
  });

  output += "];\n\n";

  // 统计数据
  output += "// ============ 月度统计 ============\n";
  output += `export const monthlyStats = {\n`;
  output += `  totalAccounts: ${accounts?.length},\n`;
  output += `  activeAccounts: ${activeAccounts.length},\n`;
  output += `  inactiveAccounts: ${inactiveAccounts.length},\n`;
  output += `  totalPosts: ${thisMonthPosts.length},\n`;
  output += `  avgInteraction: ${avgInteraction.toFixed(1)},\n`;
  output += `  avgOutput: ${avgOutput.toFixed(1)},\n`;
  output += `  quadrantStats: {\n`;
  output += `    star: ${quadrantData.star.length},\n`;
  output += `    potential: ${quadrantData.potential.length},\n`;
  output += `    costEffective: ${quadrantData.costEffective.length},\n`;
  output += `    lowEfficiency: ${quadrantData.lowEfficiency.length},\n`;
  output += `  },\n`;
  output += `};\n`;

  // 写入文件
  fs.writeFileSync("monthly-influencer-data.txt", output, "utf-8");
  console.log("✅ 数据已保存到 monthly-influencer-data.txt\n");
  console.log(output);
}

fetchMonthlyInfluencerData().catch(console.error);

