/**
 * API 适配器
 * 
 * 基于 ctx.adapters.api 封装调用 Lovable Edge Functions
 * 当前是模拟实现，未来可以替换为真实 API 调用
 */

// ============ 高价值问题回答 ============

const RESPONSE_WEEKLY_PERFORMANCE = `📊 **本周内容表现报告**（2025.11.26 - 2025.12.03）

---

### 核心指标速览

| 指标 | 数值 | 变化 | 状态 |
|------|------|------|------|
| 内容产出 | 127 篇 | ↑ 6.7% | ✅ 健康 |
| 总互动量 | 1,010 | ↓ 18.4% | ⚠️ 需关注 |
| 平均互动 | 8.0 | ↓ 20.0% | 🔴 预警 |
| 爆款率 | 7.9% | ↓ 4.7pp | 🔴 预警 |
| KOS活跃 | 54% | ↑ 8.0% | ✅ 健康 |

---

### 🔴 需要立即关注的问题

**1️⃣ 爆款率显著下滑**
- 本周 AAA 级内容占比 7.9%，上周为 12.6%，下降 4.7 个百分点
- 直接原因：明星相关热点内容减少，日常内容占比提升
- 建议：保持每周至少 2-3 篇借势类内容，平衡流量与品牌调性

**2️⃣ 互动效率下降**
- 平均互动从 10 降至 8，下降 20%
- 分析发现：低效型KOS产出占比过高（18 人贡献了 42% 的内容，但只贡献了 15% 的互动）
- 建议：优化KOS内容配额，向高效KOS倾斜资源

---

### ✅ 积极信号

- 内容产出稳定增长（127 篇，+6.7%）
- KOS活跃度提升（54%，+8.0%）
- 本周仍有 10 篇爆款内容（互动>20），说明爆款能力依然存在

---

### 📈 本周爆款 Top 3

| 排名 | 内容标题 | 互动量 | 点赞 | 收藏 | 评论 | 亮点 |
|------|----------|--------|------|------|------|------|
| 1 | 三里屯tiffany开业啦 | 99 | 52 | 31 | 16 | 线下体验+真实场景 |
| 2 | Tiffany&朴成训，行走的贵公子 | 96 | 48 | 32 | 16 | 借势明星代言热度 |
| 3 | 阿盖尔粉钻 蒂芙尼 | 86 | 40 | 34 | 12 | 稀缺产品，收藏率40% |

---

### 🎯 本周行动建议

| 优先级 | 行动项 |
|--------|--------|
| 🔴 紧急 | 分析互动下滑原因，参考 Top 3 爆款优化内容策略 |
| 🟡 重要 | 与 @成都Tiffany-Amber 等潜力KOS增加合作频次 |
| 🟢 建议 | 提前规划圣诞节内容，把握节日营销窗口 |`;

const RESPONSE_CONTENT_STRATEGY = `📝 **内容策略建议**（基于近 30 天数据分析）

---

### 🏆 高 ROI 内容类型排名

基于 671 篇历史内容的互动数据，按「平均互动量」排序：

| 排名 | 内容类型 | 平均互动 | 当前占比 | 建议配比 |
|------|----------|----------|----------|----------|
| 1 | 明星借势类 | 82.0 | 3% | → 提升至 8% |
| 2 | 线下体验类 | 68.5 | 5% | → 提升至 10% |
| 3 | 稀缺产品特写 | 56.0 | 8% | → 保持 8% |
| 4 | 节日氛围类 | 42.0 | 4% | → 提升至 8% |
| 5 | 日常穿搭展示 | 12.3 | 45% | → 降至 35% |
| 6 | 产品介绍类 | 8.7 | 35% | → 降至 30% |

---

### 🎯 重点推荐：3 个高潜力内容方向

#### 1️⃣ 朴成训 × Tiffany 系列

**数据支撑：**
- 本周 2 篇相关内容，互动量分别为 96 和 68
- 平均互动 82，是日常内容的 **6.7 倍**
- 用户评论关键词：「帅」「代言人」「想买」

**内容建议：**
- 佩戴同款产品 + 明星话题标签
- 「同款」「代言人推荐」角度切入
- 配合门店朴成训物料展示

**预期效果：** 单篇互动量 50-100

---

#### 2️⃣ 线下门店体验系列

**数据支撑：**
- 「三里屯开业」互动量 99，本周第一
- 「生日体验」互动量 38，评论率高达 18%
- 真实场景更容易引发用户讨论和情感共鸣

**内容建议：**
- 新店打卡、VIP 活动、节日布置等
- 加入「第一视角」体验感叙述
- 标题用「探店」「体验」「氛围」等关键词

**预期效果：** 单篇互动量 40-80

---

#### 3️⃣ 圣诞节主题预热

**数据支撑：**
- 「期待圣诞」在节前 1 个月发布，互动量 42
- 历史数据显示，节日内容提前 2-4 周效果最佳
- 小红书 #圣诞礼物 话题热度上升中

**内容建议：**
- 「圣诞礼物清单」「送女友/送自己」角度
- 门店圣诞装饰 + 节日限定款
- 发布时间：12.10-12.20 为黄金窗口

**预期效果：** 单篇互动量 30-50

---

### 📅 下周内容排期建议

| 日期 | 内容方向 | 类型 |
|------|----------|------|
| 周一 | 朴成训同款产品分享 | 借势热点 |
| 周三 | 门店体验/VIP活动 | 真实场景 |
| 周五 | 圣诞礼物推荐预热 | 节日营销 |
| 周六 | 高端产品特写（阿盖尔粉钻类） | 收藏型内容 |
| 周日 | 日常穿搭展示 | 基础曝光 |

💡 **执行要点：** 减少低效日常内容占比，将资源向高 ROI 类型倾斜`;

const RESPONSE_INFLUENCER_STRATEGY = `👥 **KOS效能分析报告**（2025.11.03 - 2025.12.03）

---

### 📊 KOS矩阵总览

|  | 低产出（<6篇） | 高产出（≥6篇） |
|--|----------------|----------------|
| **高互动（≥20）** | ⭐ 明星型 15人（互动高/待激活） | 🚀 潜力型 9人（核心力量/重点维护） |
| **低互动（<20）** | 💰 性价比型 50人（观察培养） | ⚠️ 低效型 18人（需优化调整） |

**未发布KOS：14 人**

---

### 🔴 紧急：需立即优化的低效KOS

这 5 位KOS贡献了 **23% 的内容**，但只带来 **6% 的互动**：

| KOS | 月产出 | 平均互动 | 问题诊断 |
|------|--------|----------|----------|
| @Mia | 54 篇 | 4 | 🔴 严重低效，建议暂停 |
| @Tiffany成都太古里Ada | 24 篇 | 11 | 内容同质化严重 |
| @Tiffany-成都太古里-July | 22 篇 | 6 | 缺乏爆款能力 |
| @南京国金Tiffany的塔夫 | 18 篇 | 6 | 内容吸引力不足 |
| @武汉国广Tiffany-Gabby | 15 篇 | 14 | 接近阈值，可观察 |

**📍 建议行动：**
1. @Mia：月产 54 篇但互动仅 4，建议暂停合作或大幅减少配额
2. 其他 4 位：将月产出控制在 8-10 篇，提升单篇质量
3. 提供爆款案例培训，帮助优化封面和文案

---

### ⭐ 重点：应增加合作的明星型KOS

这 5 位KOS平均互动远超平均（19.6），但产出偏低：

| KOS | 月产出 | 平均互动 | 提升空间 |
|------|--------|----------|----------|
| @杭州大厦tiffany simon | 1 篇 | **461** | 🔥🔥🔥🔥🔥 |
| @上海前滩Tiffany-Kiki🐯 | 1 篇 | 62 | 🔥🔥🔥🔥 |
| @上海港汇Tiffany-Yuno | 2 篇 | 49 | 🔥🔥🔥 |
| @广州Tiffany森森 | 2 篇 | 47 | 🔥🔥🔥 |
| @玛丽没有小羊Tiffany | 4 篇 | 39 | 🔥🔥 |

**📍 建议行动：**
1. **@杭州大厦tiffany simon**：互动 461 遥遥领先！建议将月产出从 1 篇提升至 4 篇，**预计增加 1,300+ 互动**
2. **@上海前滩Tiffany-Kiki🐯**：产出从 1 篇提升至 4 篇，预计增加 180+ 互动
3. 主动联系了解低产出原因，提供内容支持

---

### 🚀 核心：需重点维护的潜力型KOS

这 5 位是账号矩阵的 **核心力量**：

| KOS | 月产出 | 平均互动 | 贡献度 |
|------|--------|----------|--------|
| @成都Tiffany-Amber | 7 篇 | 116 | ⭐⭐⭐⭐⭐ |
| @南京德基-Tiffany-Alex💎 | 7 篇 | 109 | ⭐⭐⭐⭐⭐ |
| @南京德基-Tiffany-Aimee🐱 | 12 篇 | 85 | ⭐⭐⭐⭐⭐ |
| @深圳湾Tiffany-JJ | 9 篇 | 57 | ⭐⭐⭐⭐ |
| @Tiffany Susie-上海恒隆 | 8 篇 | 36 | ⭐⭐⭐⭐ |

**📍 建议行动：**
1. 建立专属沟通群，优先获取新品/活动信息
2. 定期分享数据反馈，激励持续高质量产出
3. 考虑给予更多激励资源（产品、活动邀请等）

---

### ⚪ 关注：本月未发布的KOS（14 人）

@杭州大厦蒂芙尼Candy、@宁波和义大道-Tiffany-Joy99、@上海HKP-Tiffany-Jasmine Fu、@宁波阪急Tiffany店铺-Zoe Luo、@上海HKP-Tiffany-Sammi 等

**📍 建议行动：**
1. 一一联系了解情况（离职/调岗/休假等）
2. 对于持续不活跃者，考虑调整合作关系
3. 补充新KOS，保持账号矩阵规模

---

### 📈 优化后预期效果

如果按以上建议调整KOS策略：

| 指标 | 当前 | 预期 | 提升 |
|------|------|------|------|
| 月均互动量 | 1,010 | 1,400+ | **+35-50%** |
| 爆款率 | 7.9% | 12%+ | **+4pp** |
| 内容效率 | 8/篇 | 11+/篇 | **+40%** |

**关键动作：**
- ✓ 减少 5 位低效KOS的 60% 配额
- ✓ 增加 5 位明星KOS的产出至 4 篇/月
- ✓ 维护好 5 位潜力KOS的合作关系`;

const RESPONSE_DEFAULT = `你好！我是 Tiffany 小红书内容分析助手。

我可以帮你分析以下问题：

1️⃣ **本周内容整体表现如何？有哪些需要关注的问题？**
   - 核心指标速览、问题诊断、爆款分析、行动建议

2️⃣ **接下来应该重点做什么类型的内容？**
   - 高 ROI 内容类型排名、三大高潜力方向、具体内容排期

3️⃣ **哪些KOS需要重点关注或调整合作策略？**
   - KOS四象限分析、低效KOS优化、明星KOS激活、核心KOS维护

请输入你想了解的问题，我会基于最新数据为你提供专业分析。`;

// ============ 关键词匹配规则 ============

interface MatchRule {
  keywords: string[];
  response: string;
}

const MATCH_RULES: MatchRule[] = [
  {
    // 问题一：本周表现
    keywords: ["本周", "表现", "整体", "数据", "情况", "怎么样", "如何", "关注", "问题"],
    response: RESPONSE_WEEKLY_PERFORMANCE,
  },
  {
    // 问题二：内容策略
    keywords: ["内容", "类型", "做什么", "策略", "方向", "重点做", "应该做", "建议做"],
    response: RESPONSE_CONTENT_STRATEGY,
  },
  {
    // 问题三：KOS策略
    keywords: ["KOS", "达人", "合作", "调整", "关注", "策略", "优化", "效果", "哪些KOS"],
    response: RESPONSE_INFLUENCER_STRATEGY,
  },
];

/**
 * 计算消息与规则的匹配分数
 */
function calculateMatchScore(message: string, rule: MatchRule): number {
  const lowerMessage = message.toLowerCase();
  let score = 0;
  
  for (const keyword of rule.keywords) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      score += 1;
    }
  }
  
  return score;
}

/**
 * 查找最佳匹配的响应
 */
function findBestResponse(message: string): string {
  let bestScore = 0;
  let bestResponse = RESPONSE_DEFAULT;
  
  for (const rule of MATCH_RULES) {
    const score = calculateMatchScore(message, rule);
    if (score > bestScore) {
      bestScore = score;
      bestResponse = rule.response;
    }
  }
  
  // 至少需要匹配 2 个关键词才返回专业回答
  if (bestScore < 2) {
    return RESPONSE_DEFAULT;
  }
  
  return bestResponse;
}

// ============ 流式响应模拟 ============

/**
 * 模拟流式响应（逐字符输出，更流畅）
 */
function simulateStreaming(
  text: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve) => {
    // 按字符分割（支持中文）
    const chars = Array.from(text);
    let currentText = "";
    let index = 0;
    
    // 计算每个字符的输出间隔（目标：整个响应在 8-10 秒内完成）
    const totalChars = chars.length;
    const targetDuration = 8000; // 8 秒
    const interval = Math.max(5, Math.min(30, targetDuration / totalChars));

    const timer = setInterval(() => {
      if (index < chars.length) {
        // 每次输出 1-3 个字符，模拟更自然的打字效果
        const chunkSize = Math.min(3, chars.length - index);
        const chunk = chars.slice(index, index + chunkSize).join("");
        currentText += chunk;
        onChunk?.(chunk);
        index += chunkSize;
      } else {
        clearInterval(timer);
        resolve(currentText);
      }
    }, interval);
  });
}

// ============ 主函数 ============

/**
 * 模拟 AI 响应
 * 
 * 功能：
 * 1. 15 秒 loading 延迟（模拟 AI 思考）
 * 2. 基于关键词匹配返回专业回答
 * 3. 流式输出效果
 */
export async function simulateAIResponse(
  message: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // 模拟 AI 思考延迟（15 秒）
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // 查找最佳匹配的响应
  const response = findBestResponse(message);

  // 模拟流式响应
  return await simulateStreaming(response, onChunk);
}
