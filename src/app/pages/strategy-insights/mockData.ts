/**
 * 策略洞察模块 Mock 数据
 * 
 * 用于演示和测试，实际使用时会被真实数据替代
 */

import type {
  ContentInsight,
  PerformanceDistributionPoint,
  InfluencerMatrixData,
  InfluencerAlert,
  TopicTrend,
  KPIMetric,
  ActionItem,
  WeekIdentifier,
} from "./types";
import { getPastWeeks } from "./utils";

// ============ 高效内容特征分析 Mock 数据（基于真实爆款）============
// 本周爆款（互动量>20）：10 篇，包括：
// - 三里屯tiffany开业啦（99互动）
// - Tiffany&朴成训，行走的贵公子（96互动）
// - 阿盖尔粉钻 蒂芙尼（86互动）
// - Tiffany与朴成训的碰撞（68互动）
// - 期待圣诞（42互动）
// - 简约不简单（38互动）
// - 在Tiffany度过的第18个生日（38互动）
// - 歌手宋雨琦 x Tiffany（35互动）
// - 11月Mini Vlog（26互动）
// - 拒绝撞款！异形钻美到窒息（26互动）

export const mockContentInsights: ContentInsight[] = [
  {
    id: "insight-1",
    insight: "明星/热点借势内容表现突出。本周 10 篇爆款中，「朴成训」相关内容占 2 篇（互动量 96 和 68），「宋雨琦」相关内容互动量达 35。借势明星代言热度的内容显著高于日常内容表现。",
    category: "话题策略",
    importance: "high",
  },
  {
    id: "insight-2",
    insight: "店铺开业/线下活动类内容互动率最高。「三里屯tiffany开业」以 99 互动量位列第一，「在Tiffany度过的第18个生日」获得 38 互动。线下场景的真实体验分享更容易引发用户共鸣和评论互动。",
    category: "内容类型",
    importance: "high",
  },
  {
    id: "insight-3",
    insight: "产品特写类内容收藏率高。「阿盖尔粉钻」收藏数达 34（占互动 40%），「异形钻」收藏数 8（占互动 31%）。用户对稀缺款式、高端产品的收藏意愿强烈，建议持续产出产品特写内容。",
    category: "互动特征",
    importance: "high",
  },
  {
    id: "insight-4",
    insight: "节日氛围内容提前布局效果好。「期待圣诞」在圣诞节前一个月发布，互动量达 42。提前 2-4 周布局节日内容，可以抓住用户的情绪共鸣期，获得更高曝光。",
    category: "发布策略",
    importance: "medium",
  },
  {
    id: "insight-5",
    insight: "本周整体 AAA 比例（7.9%）较上周（12.6%）下降明显。分析原因：明星相关热点内容减少，日常内容占比提升。建议保持一定比例的借势内容，平衡流量与品牌调性。",
    category: "趋势警示",
    importance: "high",
  },
  {
    id: "insight-6",
    insight: "头部KOS贡献度高。本周互动量 Top 3 KOS贡献了 45% 的爆款内容。其中「玛丽没有小羊Tiffany」单篇互动 99，「深圳湾Tiffany-JJ」单篇 86。建议重点维护高产出高互动KOS关系。",
    category: "KOS洞察",
    importance: "medium",
  },
];

// 基于真实数据（本周：2025-11-26 ~ 2025-12-03）
export const mockWeeklyStats = {
  totalPosts: 127,
  topPerformingPosts: 10, // 互动量 > 20
  topPerformingRatio: 7.9,
};

// ============ 内容表现分布 Mock 数据 ============

export function generateMockPerformanceDistribution(): PerformanceDistributionPoint[] {
  const weeks = getPastWeeks(8);
  
  // 基于真实数据趋势（过去8周）
  // W1: 50.0%, W2: 37.9%, W3: 52.1%, W4: 25.6%, W5: 24.4%, W6: 23.0%, W7: 12.6%, W8: 7.9%
  const baseAAAData = [50.0, 37.9, 52.1, 25.6, 24.4, 23.0, 12.6, 7.9];
  const baseTotalPosts = [20, 29, 94, 78, 82, 122, 119, 127];
  // 假设不合规率约 3-5%
  const baseNonCompliantData = [3.5, 4.0, 3.2, 4.5, 3.8, 4.2, 3.5, 3.9];
  
  return weeks.map((week, index) => ({
    week,
    aaaRatio: baseAAAData[index],
    nonCompliantRatio: baseNonCompliantData[index],
    totalPosts: baseTotalPosts[index],
  }));
}

// ============ KOS效果矩阵 Mock 数据（基于真实数据 - 92 位活跃KOS）============
// 统计范围: 2025-11-03 ~ 2025-12-03
// 总KOS: 106, 活跃: 92, 未发布: 14
// 平均互动: 19.6, 平均产出: 5.2 篇

export const mockInfluencerData: InfluencerMatrixData[] = [
  // 明星型（15人）- 高互动低产出
  { id: "35c392b6-93d9-4094-8263-72dfcbbdec6f", accountId: "35c392b6-93d9-4094-8263-72dfcbbdec6f", nickname: "杭州大厦tiffany simon", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/63d290e57c7584ad97742a39.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 461, interactionRate: 0.0461, quadrant: "star" },
  { id: "bad739e7-9946-4294-a82e-6cf80c99ed30", accountId: "bad739e7-9946-4294-a82e-6cf80c99ed30", nickname: "上海前滩Tiffany-Kiki🐯", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31kaghuvtiu0049vl9hkhdtc7qqvh77g?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 62, interactionRate: 0.0062, quadrant: "star" },
  { id: "9e2ffae6-359e-4447-8601-c144ff055e9e", accountId: "9e2ffae6-359e-4447-8601-c144ff055e9e", nickname: "上海港汇Tiffany-Yuno", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31n9vii774s0049sjd58hv40ih7pmeeg?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 49, interactionRate: 0.0049, quadrant: "star" },
  { id: "c0c31762-9d7c-4edf-a368-fb5d1f229eb6", accountId: "c0c31762-9d7c-4edf-a368-fb5d1f229eb6", nickname: "广州Tiffany森森", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31ggnqlet3u0g4a3le128dne1qunao2o?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 47, interactionRate: 0.0047, quadrant: "star" },
  { id: "37809a4b-6d3a-4a0a-b0fc-19323b715437", accountId: "37809a4b-6d3a-4a0a-b0fc-19323b715437", nickname: "玛丽没有小羊Tiffany", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31ns3nojfl00g5p9jgg3aldhur85r85o?imageView2/2/w/540/format/webp", monthlyOutput: 4, avgInteraction: 39, interactionRate: 0.0039, quadrant: "star" },
  { id: "ccf5c691-3eb0-466b-b711-63774e43cb29", accountId: "ccf5c691-3eb0-466b-b711-63774e43cb29", nickname: "上海 HKP- Tiffany-Yoyo-Xie", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/5fce2a12d4b6030001cffa38.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 38, interactionRate: 0.0038, quadrant: "star" },
  { id: "2b9eb1cd-cb30-4738-b411-9cf659bf27a9", accountId: "2b9eb1cd-cb30-4738-b411-9cf659bf27a9", nickname: "Jessica", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/5c491b77c7235e000163bd94.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 29, interactionRate: 0.0029, quadrant: "star" },
  { id: "9be6eac9-08b0-4b2c-9bc6-ba6f7e4612c9", accountId: "9be6eac9-08b0-4b2c-9bc6-ba6f7e4612c9", nickname: "济南Tiffany Mini", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31ihjjk4d0c004a17mk3ebp0idc7q0q8?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 28, interactionRate: 0.0028, quadrant: "star" },
  { id: "a6fd0463-24ad-4790-baf3-7c0504d6f591", accountId: "a6fd0463-24ad-4790-baf3-7c0504d6f591", nickname: "上海港汇-Tiffany-Karen", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo3160bobvm0u105o1mgsngbjb9sauvis0?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 25, interactionRate: 0.0025, quadrant: "star" },
  { id: "53ba10cc-4da5-4dd6-9339-800b8c09ad76", accountId: "53ba10cc-4da5-4dd6-9339-800b8c09ad76", nickname: "北京SKP-Tiffany-David杜大卫", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo3133l4vksjs004a7142un0le3vjbid38?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 24, interactionRate: 0.0024, quadrant: "star" },
  { id: "ad7b2b48-b5ee-47d8-8698-3687bf96179b", accountId: "ad7b2b48-b5ee-47d8-8698-3687bf96179b", nickname: "RAERAE伟伟", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/625bd87881f9a68f686fe1cb.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 23, interactionRate: 0.0023, quadrant: "star" },
  { id: "1ee07728-4810-472d-9eff-4b847922976a", accountId: "1ee07728-4810-472d-9eff-4b847922976a", nickname: "北京SKP-Tiffany-Leon昂昂", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/61736a12d2236b61c9f68995.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 23, interactionRate: 0.0023, quadrant: "star" },
  { id: "f39bf154-673c-4ea7-b6e7-46a8e7a42f9c", accountId: "f39bf154-673c-4ea7-b6e7-46a8e7a42f9c", nickname: "Edison-港汇恒隆Tiffany💎", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31o6cmlddks005pb2vb90ml4j0tafeco?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 20, interactionRate: 0.0020, quadrant: "star" },
  { id: "548fcf93-ad82-405f-aa5e-35c06eed1bc6", accountId: "548fcf93-ad82-405f-aa5e-35c06eed1bc6", nickname: "yoyo", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31jmodhu42i005n3bh4gk688ot0igumo?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 20, interactionRate: 0.0020, quadrant: "star" },
  { id: "f7ce4274-b7ba-4ef9-b4ba-c3a209fa1b56", accountId: "f7ce4274-b7ba-4ef9-b4ba-c3a209fa1b56", nickname: "上海-Tiffany-Sophia", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31g6bhfhmhk0048buvdl3lhu852p9lp0?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 20, interactionRate: 0.0020, quadrant: "star" },

  // 潜力型（9人）- 高互动高产出
  { id: "66efbe64-cca1-40bc-b498-6cb1f0003619", accountId: "66efbe64-cca1-40bc-b498-6cb1f0003619", nickname: "成都Tiffany-Amber", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo318np1n0h3u005oldd4c6d2e6dne20eg?imageView2/2/w/540/format/webp", monthlyOutput: 7, avgInteraction: 116, interactionRate: 0.0116, quadrant: "potential" },
  { id: "675dd184-d5d8-4b9d-a719-6a204a6140b1", accountId: "675dd184-d5d8-4b9d-a719-6a204a6140b1", nickname: "南京德基-Tiffany-Alex💎", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31c458sn4h6005p5i69tamo5br2hhbe8?imageView2/2/w/540/format/webp", monthlyOutput: 7, avgInteraction: 109, interactionRate: 0.0109, quadrant: "potential" },
  { id: "dc8dcc48-0129-4b5c-811a-73f98d179845", accountId: "dc8dcc48-0129-4b5c-811a-73f98d179845", nickname: "南京德基-Tiffany-Aimee🐱", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31njv78uvkq004a6qde9frimt4j5t8m8?imageView2/2/w/540/format/webp", monthlyOutput: 12, avgInteraction: 85, interactionRate: 0.0085, quadrant: "potential" },
  { id: "4c0923b2-a126-438d-a4e9-5cb7fe5fa69c", accountId: "4c0923b2-a126-438d-a4e9-5cb7fe5fa69c", nickname: "深圳湾Tiffany-JJ", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31m730t8i4u005nll7um08u4betiglkg?imageView2/2/w/540/format/webp", monthlyOutput: 9, avgInteraction: 57, interactionRate: 0.0057, quadrant: "potential" },
  { id: "cbd3575d-401d-4c8c-b405-aec1e9386bce", accountId: "cbd3575d-401d-4c8c-b405-aec1e9386bce", nickname: "Tiffany Susie -上海恒隆", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31h25mfamji0g5pdpopn3ksmsskceep0?imageView2/2/w/540/format/webp", monthlyOutput: 8, avgInteraction: 36, interactionRate: 0.0036, quadrant: "potential" },
  { id: "3f03a28b-52f0-405a-9e7a-11e5a1f1b40f", accountId: "3f03a28b-52f0-405a-9e7a-11e5a1f1b40f", nickname: "成都SKP-Tiffany Alice💎", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31i3qacmcmm005o4m06ug8134ej1682o?imageView2/2/w/540/format/webp", monthlyOutput: 6, avgInteraction: 30, interactionRate: 0.0030, quadrant: "potential" },
  { id: "aaf9ee3f-a576-43e7-80df-374e628e4e89", accountId: "aaf9ee3f-a576-43e7-80df-374e628e4e89", nickname: "Angel", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31l2j26poj2005q13ung2nre5gssps80?imageView2/2/w/540/format/webp", monthlyOutput: 10, avgInteraction: 24, interactionRate: 0.0024, quadrant: "potential" },
  { id: "caeb832d-ec32-4640-bcac-13f5c5fdde44", accountId: "caeb832d-ec32-4640-bcac-13f5c5fdde44", nickname: "成都Tiffany-Esther小伍", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31jjfemvj2u004a3pu0jrfi26nfmktd0?imageView2/2/w/540/format/webp", monthlyOutput: 11, avgInteraction: 23, interactionRate: 0.0023, quadrant: "potential" },
  { id: "93ac1802-c431-46fd-8518-a85c9ad54a82", accountId: "93ac1802-c431-46fd-8518-a85c9ad54a82", nickname: "武汉Tiffany Linda", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31k7sbgnmk8004bev9rt9049v5e3a67g?imageView2/2/w/540/format/webp", monthlyOutput: 6, avgInteraction: 20, interactionRate: 0.0020, quadrant: "potential" },

  // 低效型（18人）- 低互动高产出
  { id: "2ba48696-d584-4a57-8082-bd431540a6a4", accountId: "2ba48696-d584-4a57-8082-bd431540a6a4", nickname: "成都 Tiffany-Lucy 钟", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31bcipvi804005ncs8aag9b2gk5ttevo?imageView2/2/w/540/format/webp", monthlyOutput: 14, avgInteraction: 19, interactionRate: 0.0019, quadrant: "lowEfficiency" },
  { id: "31e3c28a-ca77-46aa-814d-535a5b4f1fce", accountId: "31e3c28a-ca77-46aa-814d-535a5b4f1fce", nickname: "武汉国广-Tiffany-Maze倩宝", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31p4uq7jp3c6g5n1n43k1a8opt3vqe30?imageView2/2/w/540/format/webp", monthlyOutput: 9, avgInteraction: 17, interactionRate: 0.0017, quadrant: "lowEfficiency" },
  { id: "bb766d32-3533-4155-9f7a-ca7615d6ce3f", accountId: "bb766d32-3533-4155-9f7a-ca7615d6ce3f", nickname: "武汉国广Tiffany-Gabby", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31p90pi1ajc005q0tr2d2nu0ju0jo9g0?imageView2/2/w/540/format/webp", monthlyOutput: 15, avgInteraction: 14, interactionRate: 0.0014, quadrant: "lowEfficiency" },
  { id: "cf136092-cab5-45cc-8ad0-0daa0c64a094", accountId: "cf136092-cab5-45cc-8ad0-0daa0c64a094", nickname: "Tiffany武汉SKP店 Kenny", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31o91b8lq5m7049e80cjt3iupoi31iig?imageView2/2/w/540/format/webp", monthlyOutput: 15, avgInteraction: 13, interactionRate: 0.0013, quadrant: "lowEfficiency" },
  { id: "851bf56b-1282-40b9-9344-d8591aad0634", accountId: "851bf56b-1282-40b9-9344-d8591aad0634", nickname: "成都Tiffany-Snow Liang梁心爱", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31olum0po6g005q38tunjfji8d0m5i9g?imageView2/2/w/540/format/webp", monthlyOutput: 6, avgInteraction: 13, interactionRate: 0.0013, quadrant: "lowEfficiency" },
  { id: "3ecd8afa-6f6c-47dc-8f74-72940bfa6f5b", accountId: "3ecd8afa-6f6c-47dc-8f74-72940bfa6f5b", nickname: "Tiffany成都太古里Ada", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31has4dltk20049iu50of9kgbe5cbodg?imageView2/2/w/540/format/webp", monthlyOutput: 24, avgInteraction: 11, interactionRate: 0.0011, quadrant: "lowEfficiency" },
  { id: "e3055f8c-884f-48dd-a232-b0b2d1fd88c8", accountId: "e3055f8c-884f-48dd-a232-b0b2d1fd88c8", nickname: "深圳湾万象城Tiffany-lily", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/62d18dac19e70907191df8cf.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 15, avgInteraction: 10, interactionRate: 0.0010, quadrant: "lowEfficiency" },
  { id: "f953d376-5a8b-4e22-9734-7818c5199c79", accountId: "f953d376-5a8b-4e22-9734-7818c5199c79", nickname: "福州Tiffany-Queena庆庆", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31fubg8svg00040qj2hrqd0sr2e0c4qo?imageView2/2/w/540/format/webp", monthlyOutput: 12, avgInteraction: 9, interactionRate: 0.0009, quadrant: "lowEfficiency" },
  { id: "21bab499-353c-45cb-bfcc-c21f6255460f", accountId: "21bab499-353c-45cb-bfcc-c21f6255460f", nickname: "Tiffany-武汉SKP缘缘", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31o2dr7a2l2004a47hn30foq9bjilhqg?imageView2/2/w/540/format/webp", monthlyOutput: 10, avgInteraction: 8, interactionRate: 0.0008, quadrant: "lowEfficiency" },
  { id: "6582747f-b0fb-40e2-8681-e6980af8b1e4", accountId: "6582747f-b0fb-40e2-8681-e6980af8b1e4", nickname: "长沙IFS Tiffany💍Landy", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/6356a5b2ee160c510ad63437.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 11, avgInteraction: 7, interactionRate: 0.0007, quadrant: "lowEfficiency" },
  { id: "1207e66e-6f54-4432-a3d1-a722dc6497f9", accountId: "1207e66e-6f54-4432-a3d1-a722dc6497f9", nickname: "成都- Tiffany-珊珊", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31c2r1fcu12005o98qob086d9ro1q8a8?imageView2/2/w/540/format/webp", monthlyOutput: 13, avgInteraction: 7, interactionRate: 0.0007, quadrant: "lowEfficiency" },
  { id: "b5dba32c-6914-4743-870d-fdeaf7dd75d8", accountId: "b5dba32c-6914-4743-870d-fdeaf7dd75d8", nickname: "上海HKP-Tiffany-Amy_Gong💓", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo319dnb4lv6e004bsrjh4cosrretli288?imageView2/2/w/540/format/webp", monthlyOutput: 10, avgInteraction: 7, interactionRate: 0.0007, quadrant: "lowEfficiency" },
  { id: "c0b7cfaf-b63e-449d-8631-2e16a87a2d5c", accountId: "c0b7cfaf-b63e-449d-8631-2e16a87a2d5c", nickname: "南京国金Tiffany的塔夫", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31j8m3us436005p9kkal1gr8143e06fg?imageView2/2/w/540/format/webp", monthlyOutput: 18, avgInteraction: 6, interactionRate: 0.0006, quadrant: "lowEfficiency" },
  { id: "91f8885b-3725-4616-bf6c-abfa965fcf24", accountId: "91f8885b-3725-4616-bf6c-abfa965fcf24", nickname: "Tiffany-成都太古里-July", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo313ur110phg004a6143ak3poaaj2bseo?imageView2/2/w/540/format/webp", monthlyOutput: 22, avgInteraction: 6, interactionRate: 0.0006, quadrant: "lowEfficiency" },
  { id: "e0805140-e2e7-408b-85ab-257e1e08b1f6", accountId: "e0805140-e2e7-408b-85ab-257e1e08b1f6", nickname: "Mia", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31odrhgq8lmeg5pl7e81nebj29fdcru8?imageView2/2/w/540/format/webp", monthlyOutput: 54, avgInteraction: 4, interactionRate: 0.0004, quadrant: "lowEfficiency" },
  { id: "39a815a5-01a9-4799-8fdb-e9f9dae3aff0", accountId: "39a815a5-01a9-4799-8fdb-e9f9dae3aff0", nickname: "南京德基Tiffany-M", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo30uv9bqqsli0049lfk7p77a68oglv5bg?imageView2/2/w/540/format/webp", monthlyOutput: 6, avgInteraction: 4, interactionRate: 0.0004, quadrant: "lowEfficiency" },
  { id: "44453b61-4a49-44e4-820e-8d3e0f661105", accountId: "44453b61-4a49-44e4-820e-8d3e0f661105", nickname: "Amy Yu", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31o17i7bkks005ohsb5oocagd2e0bcd0?imageView2/2/w/540/format/webp", monthlyOutput: 7, avgInteraction: 1, interactionRate: 0.0001, quadrant: "lowEfficiency" },
  { id: "0bf7c199-c293-4e9f-81c2-f83a5325ebb4", accountId: "0bf7c199-c293-4e9f-81c2-f83a5325ebb4", nickname: "成都skp tiffany lily丽丽", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/63ece30f0a19bbcc928959e9.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 6, avgInteraction: 1, interactionRate: 0.0001, quadrant: "lowEfficiency" },

  // 性价比型（50人）- 低互动低产出（显示前20）
  { id: "055d4e3e-31ba-4dca-a15d-68236a7a05eb", accountId: "055d4e3e-31ba-4dca-a15d-68236a7a05eb", nickname: "港汇恒隆Tiffany- Kiki Guo", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31nelqht26g0042vo04uljlu1p83o0kg?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 17, interactionRate: 0.0017, quadrant: "costEffective" },
  { id: "d6e6d231-3544-4761-99a5-b852c000807a", accountId: "d6e6d231-3544-4761-99a5-b852c000807a", nickname: "深圳万象城Tiffany-Yuno", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31j5lngs0j0005pebbrjhe0b6ln89e8g?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 17, interactionRate: 0.0017, quadrant: "costEffective" },
  { id: "1fba528f-dc0a-49cc-9a1e-cc4b64fcf9e1", accountId: "1fba528f-dc0a-49cc-9a1e-cc4b64fcf9e1", nickname: "南京IFC-Tiffany-Ruby柯柯", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31id51s32ga0044ljulj4t157i12idq8?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 16, interactionRate: 0.0016, quadrant: "costEffective" },
  { id: "b6e736fd-1842-4511-aab4-7d5e3d6d5c50", accountId: "b6e736fd-1842-4511-aab4-7d5e3d6d5c50", nickname: "深圳万象城Tiffany-yueyue", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo316lvcgs30o005pdfhtskt8hsnm78gog?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 15, interactionRate: 0.0015, quadrant: "costEffective" },
  { id: "34db87e2-87ad-4126-b9a1-55e6e0d3b02c", accountId: "34db87e2-87ad-4126-b9a1-55e6e0d3b02c", nickname: "Tiffany 北京SKP Melinda", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo317vkndre465g5nisp8d08nakc8gcrqo?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 13, interactionRate: 0.0013, quadrant: "costEffective" },
  { id: "7788561d-d258-4a36-84df-948788351d80", accountId: "7788561d-d258-4a36-84df-948788351d80", nickname: "Chris", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31oghg0335000497qtii1i93o7o6u8g0?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 12, interactionRate: 0.0012, quadrant: "costEffective" },
  { id: "690df475-c1e6-40a0-8619-56baccef5656", accountId: "690df475-c1e6-40a0-8619-56baccef5656", nickname: "深圳万象城Tiffany Kitty", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31pkkkim34k6049va0335v8gkun25ch0?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 10, interactionRate: 0.0010, quadrant: "costEffective" },
  { id: "5420b4ef-137f-4fbe-8be5-831ebe5cb2a6", accountId: "5420b4ef-137f-4fbe-8be5-831ebe5cb2a6", nickname: "广州Tiffany-Felix", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31in8qkh31g0048bb8h0prug0p4ka6ig?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 10, interactionRate: 0.0010, quadrant: "costEffective" },
  { id: "81548ec9-a13d-43fa-b9b8-c4493a93aa37", accountId: "81548ec9-a13d-43fa-b9b8-c4493a93aa37", nickname: "Tiffany Queenie", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/6310484ee323d66d241b408e.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 10, interactionRate: 0.0010, quadrant: "costEffective" },
  { id: "b98ea638-ff11-4f3e-9e1d-f89ae0b175aa", accountId: "b98ea638-ff11-4f3e-9e1d-f89ae0b175aa", nickname: "上海IFC国金中心✨Tiffany 💎Jasy", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo311h88t146m6g5o3cvle09ehff2rnk88?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 10, interactionRate: 0.0010, quadrant: "costEffective" },
  { id: "5fa212fd-6ea6-4e94-8237-6bafa2530602", accountId: "5fa212fd-6ea6-4e94-8237-6bafa2530602", nickname: "杭州万象城Tiffany-Asher阿舍", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31cc53uu6g8005nui83k09a5kbbkdal0?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 9, interactionRate: 0.0009, quadrant: "costEffective" },
  { id: "505aad29-2aa3-4cb1-8c5c-82e7f5e4c936", accountId: "505aad29-2aa3-4cb1-8c5c-82e7f5e4c936", nickname: "SKP Tiffany ～Sophie", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/6178fd2da7f98ddc54ca0aec.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 9, interactionRate: 0.0009, quadrant: "costEffective" },
  { id: "d2efcaea-b830-4a6a-89bc-c9cbf1261cf4", accountId: "d2efcaea-b830-4a6a-89bc-c9cbf1261cf4", nickname: "✨💗Kikiyo倩💋✨", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo314gpjmkm5s0043o68dopc93vb46m0e8?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 8, interactionRate: 0.0008, quadrant: "costEffective" },
  { id: "6de47bb6-5da7-465f-a809-aa1438abd27a", accountId: "6de47bb6-5da7-465f-a809-aa1438abd27a", nickname: "上海HKP-Tiffany-Carol_Chen", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/63492aeb464748d6e38ef7a7.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 8, interactionRate: 0.0008, quadrant: "costEffective" },
  { id: "31dde586-0c78-4957-8720-7e0b6e9dd616", accountId: "31dde586-0c78-4957-8720-7e0b6e9dd616", nickname: "ADA💎Tiffany & CO.💠", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31o9o8i1il8005p7r1sg14naadfp990g?imageView2/2/w/540/format/webp", monthlyOutput: 1, avgInteraction: 7, interactionRate: 0.0007, quadrant: "costEffective" },
  { id: "18e7c2bf-572a-419e-be62-676cb110dc63", accountId: "18e7c2bf-572a-419e-be62-676cb110dc63", nickname: "上海前滩Tiffany-LucasChen", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31ktsntf8k8004a1mjlrlh16rltgcga0?imageView2/2/w/540/format/webp", monthlyOutput: 2, avgInteraction: 7, interactionRate: 0.0007, quadrant: "costEffective" },
  { id: "a749e6df-5b87-4188-bd3d-89813fd12afd", accountId: "a749e6df-5b87-4188-bd3d-89813fd12afd", nickname: "港汇Tiffany💙Linda", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31niunqnolm004a4toju7ig6rr42rmpo?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 6, interactionRate: 0.0006, quadrant: "costEffective" },
  { id: "eb7a75e6-14b2-441f-b2cf-24dfa971b07b", accountId: "eb7a75e6-14b2-441f-b2cf-24dfa971b07b", nickname: "Tiffany王薇薇", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31lg7401plm005q142ivji5hqul9eb2o?imageView2/2/w/540/format/webp", monthlyOutput: 3, avgInteraction: 5, interactionRate: 0.0005, quadrant: "costEffective" },
  { id: "c4efd384-799c-499c-922e-1f2014f12a65", accountId: "c4efd384-799c-499c-922e-1f2014f12a65", nickname: "成都Tiffany-Jerry🐼", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31k70eb22300049vvhld791hm85l6vj0?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 3, interactionRate: 0.0003, quadrant: "costEffective" },
  { id: "a6875368-1021-4092-b17f-988759131092", accountId: "a6875368-1021-4092-b17f-988759131092", nickname: "武汉Tiffany &Tina", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/63b26c69daa810d35a533181.jpg?imageView2/2/w/540/format/webp", monthlyOutput: 5, avgInteraction: 3, interactionRate: 0.0003, quadrant: "costEffective" },
  // ... 还有30位性价比型KOS
];

// ============ 本月未发布KOS（14人）============
export const mockInactiveInfluencers = [
  { id: "4ebdfdcc-732f-43bf-bb97-34c0fcd5141a", nickname: "杭州大厦蒂芙尼Candy", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31g0vc9bn0600401j3ut37n8co2r2h00?imageView2/2/w/540/format/webp" },
  { id: "0a03b8b6-9667-4b80-8f6f-b7d0976ed2c6", nickname: "宁波和义大道-Tiffany-Joy99", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31hsb9ajdja005no6vb2g8s1fm95ai18?imageView2/2/w/540/format/webp" },
  { id: "ac92244a-c084-49af-b949-4932a8eb0f0d", nickname: "宁波和义TiffanySasa", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31bo341860u004a0f67051kg04ru1pr8?imageView2/2/w/540/format/webp" },
  { id: "0d007b55-ad21-490e-a361-2c6ef6daaeee", nickname: "上海HKP-Tiffany-Jasmine Fu", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31atdt4fvne004buqqq0cvkd8nj9fvs0?imageView2/2/w/540/format/webp" },
  { id: "3e807e47-8121-48af-953a-21bfd20bd42e", nickname: "宁波阪急Tiffany店铺- Zoe Luo", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31hqus1jl38005pr54l6m3mufarqudc8?imageView2/2/w/540/format/webp" },
  { id: "98922310-fcfb-4e10-a49a-648f4d81f8f0", nickname: "Raymond有话说", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/660bb4aec7935240db5acf04.jpg?imageView2/2/w/540/format/webp" },
  { id: "71ed0246-b0c5-4247-b567-d14db571a169", nickname: "上海HKP-Tiffany-Sammi", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31m6qf4t7ku705q2kpj76rd1qv30kcug?imageView2/2/w/540/format/webp" },
  { id: "b646c610-906c-48b0-9d7b-ed6dce14e5c8", nickname: "上海HKP-Tiffany-Ashe_Xie💍", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31m6tnpjp52004a4cm14jtpg74cnbvs0?imageView2/2/w/540/format/webp" },
  { id: "9b9659ca-9feb-40d3-a23e-eccd3f414dfa", nickname: "辣辣Tina_国金Tiffany", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/66e04c4b504cffd480ea817c.jpg?imageView2/2/w/540/format/webp" },
  { id: "65e15c41-d3ac-470e-9b78-81b7a0a54204", nickname: "Tiffany客户关怀中心- Freya", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31klmfic932005pmuien7e7v9cvjem2o?imageView2/2/w/540/format/webp" },
  { id: "0be8f087-8768-4551-93e8-cf43cd49a7ad", nickname: "杭州大厦-Tiffany-Koi", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/60e834724163e84b33450106.jpg?imageView2/2/w/540/format/webp" },
  { id: "2b4345cd-dfc8-4932-a700-ad9404107845", nickname: "客户关怀中心 - 蒂芙尼 - Eason", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31dnfbfjk12005oraepq7rt2uqd11m1g?imageView2/2/w/540/format/webp" },
  { id: "9c46fc73-3ccd-44ae-a818-30f302ba002b", nickname: "Tiffany Ruby-上海恒隆", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31gp49r8j3q0g5pdsba5jkqni2p6v6e0?imageView2/2/w/540/format/webp" },
  { id: "4073c057-da98-45b8-81c6-c3eaccfd0af6", nickname: "上海IFC- Tiffany- Lucy小瑛", avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo316ihf8o90u005pd5c362vidpdd63pp0?imageView2/2/w/540/format/webp" },
];

// 基于真实KOS数据（本月表现）
export const mockInfluencerAlerts: InfluencerAlert[] = [
  {
    id: "alert-1",
    accountId: "35c392b6-93d9-4094-8263-72dfcbbdec6f",
    nickname: "杭州大厦tiffany simon",
    avatar: "https://sns-avatar-qc.xhscdn.com/avatar/63d290e57c7584ad97742a39.jpg?imageView2/2/w/540/format/webp",
    type: "positive",
    message: "本月平均互动 461，遥遥领先，建议增加产出",
    metric: "interaction",
    changeValue: 35,
  },
  {
    id: "alert-2",
    accountId: "66efbe64-cca1-40bc-b498-6cb1f0003619",
    nickname: "成都Tiffany-Amber",
    avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo318np1n0h3u005oldd4c6d2e6dne20eg?imageView2/2/w/540/format/webp",
    type: "positive",
    message: "本月平均互动 116，产出 7 篇，表现优异",
    metric: "interaction",
    changeValue: 35,
  },
  {
    id: "alert-3",
    accountId: "e0805140-e2e7-408b-85ab-257e1e08b1f6",
    nickname: "Mia",
    avatar: "https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31odrhgq8lmeg5pl7e81nebj29fdcru8?imageView2/2/w/540/format/webp",
    type: "warning",
    message: "产出 54 篇但平均互动仅 4，建议优化内容质量",
    metric: "interaction",
    changeValue: -17,
  },
];

// ============ 话题趋势 Mock 数据 ============

export const mockTopicTrends: TopicTrend[] = [
  { id: "topic-1", topic: "#氛围感穿搭", heatChange: 156, relatedPosts: 23, trend: "up" },
  { id: "topic-2", topic: "#早C晚A", heatChange: 89, relatedPosts: 18, trend: "up" },
  { id: "topic-3", topic: "#秋冬护肤", heatChange: 67, relatedPosts: 31, trend: "up" },
  { id: "topic-4", topic: "#小众香水推荐", heatChange: 45, relatedPosts: 12, trend: "up" },
  { id: "topic-5", topic: "#健康轻食", heatChange: -12, relatedPosts: 8, trend: "down" },
  { id: "topic-6", topic: "#通勤穿搭", heatChange: 5, relatedPosts: 15, trend: "stable" },
];

// ============ KPI 指标 Mock 数据（基于真实数据）============
// 本周：127篇帖子，1010互动量，平均互动8.0，活跃KOS 57/106=53.8%
// status: "healthy" | "attention" | "warning"

export const mockKPIMetrics: KPIMetric[] = [
  {
    id: "kpi-1",
    name: "总互动量",
    currentValue: 1010,
    averageValue: 1238, // 上周
    changePercent: -18.4,
    status: "attention",
  },
  {
    id: "kpi-2",
    name: "平均互动量",
    currentValue: 8,
    averageValue: 10, // 上周
    changePercent: -20.0,
    status: "warning",
  },
  {
    id: "kpi-3",
    name: "内容产出",
    currentValue: 127,
    averageValue: 119, // 上周
    changePercent: 6.7,
    status: "healthy",
    unit: "篇",
  },
  {
    id: "kpi-4",
    name: "KOS活跃度",
    currentValue: 54,
    averageValue: 50, // 假设上周
    changePercent: 8.0,
    status: "healthy",
    unit: "%",
  },
];

// ============ 行动建议 Mock 数据 ============

// 基于真实KOS数据（本周 AAA 爆款分析）
export const mockActionItems: ActionItem[] = [
  {
    id: "action-1",
    category: "urgent",
    title: "关注互动量下滑趋势",
    description: "本周平均互动量 8.0，较上周下降 20%。AAA 比例从 12.6% 降至 7.9%。建议分析近期内容质量变化，参考「三里屯tiffany开业」「阿盖尔粉钻」等爆款的成功要素。",
    priority: "high",
  },
  {
    id: "action-2",
    category: "influencer",
    title: "重点培养 @上海前滩Tiffany-Kiki🐯",
    description: "该KOS平均互动量 193，远超其他KOS，但月产出仅 2 篇。建议增加合作频次，将产出提升至每周 1 篇，预计可大幅提升整体互动表现。",
    priority: "high",
    relatedData: { type: "account", id: "bad739e7-9946-4294-a82e-6cf80c99ed30", name: "上海前滩Tiffany-Kiki🐯" },
  },
  {
    id: "action-3",
    category: "content",
    title: "借势「朴成训」话题热度",
    description: "本周两篇 Tiffany×朴成训相关内容互动量分别达 96 和 68，明显高于平均水平。建议持续跟进明星代言相关内容，抓住流量红利。",
    priority: "high",
  },
  {
    id: "action-4",
    category: "influencer",
    title: "优化 @武汉国广-Tiffany-Maze倩宝 内容策略",
    description: "该KOS月产出 12 篇但平均互动仅 18，属于低效型。建议减少发布频次，提升单篇内容质量，参考高互动KOS的封面和文案风格。",
    priority: "medium",
    relatedData: { type: "account", id: "31e3c28a-ca77-46aa-814d-535a5b4f1fce", name: "武汉国广-Tiffany-Maze倩宝" },
  },
  {
    id: "action-5",
    category: "publishing",
    title: "圣诞节内容提前布局",
    description: "「期待圣诞」相关内容互动量达 42，用户对节日内容有较高兴趣。建议提前规划圣诞主题内容，在 12 月中旬集中发布。",
    priority: "medium",
  },
];

// ============ 获取 Mock 数据的工具函数 ============

export function getMockWeeklyData(weeks: WeekIdentifier[]) {
  const performanceData = generateMockPerformanceDistribution();
  
  return weeks.map((week, index) => {
    const perfData = performanceData[index] || performanceData[performanceData.length - 1];
    return {
      week,
      totalPosts: perfData.totalPosts,
      topPosts: [], // Mock 数据不需要实际帖子
      aaaRatio: perfData.aaaRatio,
      nonCompliantRatio: perfData.nonCompliantRatio,
    };
  });
}

/**
 * 判断是否应该使用 Mock 数据
 * 当真实数据不足时返回 true
 */
export function shouldUseMockData(
  postsCount: number,
  accountsCount: number
): boolean {
  return postsCount < 10 || accountsCount < 3;
}

