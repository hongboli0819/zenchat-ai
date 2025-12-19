'use client'

/**
 * 规则管理页面
 * 
 * 管理内容创作规则，支持：
 * - 多个主规则维度
 * - 每个规则可包含多个子规则
 * - 动态新建/编辑规则
 */

import React, { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PanelLeftIcon } from "@/shared/ui/Icon";

interface RulesManagementPageProps {
  onBack: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

// 子规则类型
interface SubRule {
  id: string;
  label: string;
  icon: string;
  content: string;
}

// 主规则类型
interface MainRule {
  id: string;
  label: string;
  icon: string;
  subRules: SubRule[];
  // 如果没有子规则，直接存储内容
  content?: string;
}

// 图标选项
const iconOptions = ["📋", "📝", "📌", "🎯", "⚡", "💡", "🔔", "⭐", "🏷️", "📊", "🎨", "🚫", "✅", "❌", "⚠️", "💎", "🔒", "🌟", "📸", "🎬"];

// 编辑器图标
const EditIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CancelIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// ============ 初始内容 ============

const aestheticContent = `# 高审美生活方式摄影

## 一、 视觉降噪标准 (Visual Noise Reduction)
——生活照不好看，90%是因为"信息过载"和"视觉杂乱"。

### 1. 极简的画框熵值 (Low Visual Entropy)
* **通用标准：** 画面中不能出现与主题无关的"视觉噪音"。
* **执行颗粒度：**
  * **背景净化：** 拍照前，请移走桌上的纸巾团、乱放的数据线、半个塑料瓶、无关的路人甲。
  * **边缘巡检：** 检查取景框的四个角落，确保没有杂物切入。如果有，要么移开，要么裁掉。
  * **色块整合：** 背景中如果出现大面积的杂色（如一个亮黄色的垃圾桶），必须避开或后期去色。

### 2. 呼吸感留白 (Breathing Space)
* **通用标准：** 主体不要填满每一个像素，要给视线留出"透气"的通道。
* **执行颗粒度：**
  * **主体占比：** 如果是拍静物/生活片段，主体占比控制在 40%-60%。
  * **负空间应用：** 画面必须有一块相对纯净的区域（如纯色的墙、干净的桌面、天空），这块区域不是为了展示什么，而是为了衬托主体。

---

## 二、 光源的美学质量 (Quality of Luminance)
——生活照的"廉价感"，通常源于光线的"硬"和"平"。

### 1. 漫反射的软光逻辑 (Diffused Soft Light)
* **通用标准：** 避免直射的硬光（如正午阳光、直射的顶灯），追求光线的"包裹感"。
* **执行颗粒度：**
  * **窗边光法则：** 生活照的最佳光源永远是侧逆方向的窗边自然光。它能勾勒物体轮廓，且阴影柔和。
  * **阴影的透明度：** 好看的照片一定有阴影，但阴影应该是灰色的、通透的，而不是死黑的。

### 2. 材质的高光解析 (Specular Texture)
* **通用标准：** 无论拍什么（咖啡杯、丝绸、皮肤、玻璃），都要体现材质的触感。
* **执行颗粒度：**
  * **寻找反光点：** 调整角度，让物体表面出现微弱的高光。没有高光，物体就是平面的、塑料的。
  * **锐度分离：** 对焦位置（主体）的纹理（如毛衣的针织感、皮肤的纹理）必须清晰锐利，这叫"触感还原"。

---

## 三、 色彩秩序与克制 (Color Discipline)
——高级感来源于"克制"，而非"鲜艳"。

### 1. 限定色板策略 (Limited Color Palette)
* **通用标准：** 全画面的核心色系（占比较大的颜色）不能超过 3 种。
* **执行颗粒度：**
  * **60-30-10法则：** 60%的主色调（通常是背景的中性色，如米白、灰、黑）+ 30%的辅助色（主体的颜色）+ 10%的点缀色（提亮的小细节）。
  * **去饱和处理：** 除了你想突出的那个重点（比如口红、鲜花、食物），环境中的其他颜色饱和度一律降低，让它们"退后"。

### 2. 氛围色温统一 (Unified Color Temperature)
* **通用标准：** 画面要么整体偏暖（温馨、复古），要么整体偏冷（清冷、现代），杜绝"冷暖光打架"。
* **执行颗粒度：**
  * **白平衡漂移：** 在生活照中，稍微偏暖一点的白平衡（加一点黄色/琥珀色）通常比绝对准确的白平衡更具生活气息和高级感。

---

## 四、 局部叙事与构图张力 (Fragmented Narrative)
——不要试图拍下全貌，"局部"往往比"整体"更美。

### 1. 碎片化构图 (Fragmented Composition)
* **通用标准：** 通过拍摄局部来暗示整体，留给观众想象空间。
* **执行颗粒度：**
  * **切人：** 拍穿搭不一定要露脸，拍吃饭不一定要拍全桌。只拍拿着咖啡的手、只拍锁骨和项链、只拍裙摆和鞋子。这种"不完整感"是社交媒体美学的核心。
  * **溢出画框：** 让盘子的一半切出画面，让书本的一个角切出画面。这暗示了画框外还有更广阔的生活空间。

### 2. 动态几何与引导 (Geometric Flow)
* **通用标准：** 避免横平竖直的证件照式构图，制造线条的流动。
* **执行颗粒度：**
  * **对角线打破：** 把你的手机稍微歪一点，或者让长条形的物体（餐具、手臂、路）沿对角线摆放。
  * **层次堆叠：** 前景（虚化）- 中景（主体）- 背景（虚化）。比如透过玻璃杯拍对面的人，或者透过树叶拍建筑。

---

## 五、 生活感的"伪装" (Curated Casualness)
——看起来随手拍的，其实都是精心设计的。

### 1. 道具的符号意义 (Semiotic Props)
* **通用标准：** 画面中出现的每一个物品，都要代表一种"向往的生活状态"。
* **执行颗粒度：**
  * **替换原则：** 把塑料水杯换成玻璃/陶瓷杯；把纸巾换成棉麻餐布；把电脑屏幕换成纸质书/杂志。
  * **去功能化：** 物品不仅是用的，更是装饰。眼镜可以不戴，放在书上；香水可以不喷，放在光下。

### 2. 肢体的松弛感 (Relaxed Body Language)
* **通用标准：** 肢体语言不能僵硬，要模仿"正在进行时"的状态。
* **执行颗粒度：**
  * **手指微曲：** 无论手放在哪里，手指都要自然弯曲，不要用力并拢。
  * **假装互动：** 假装正在翻书、假装正在拿杯子、假装正在整理头发。捕捉动作发生的瞬间，而不是摆好姿势后的静止。

---

## 总结：通用生活照美学检查表

当你在生活中举起手机，想要拍出一张有"网感"和"审美"的照片时，请自问：

1. ✅ **太乱了吗？** （是不是有杂物？背景是不是太花？）
2. ✅ **光好吗？** （是不是太黑或太硬？有没有利用窗边光？）
3. ✅ **颜色对吗？** （是不是颜色太多太杂？有没有一个主色调？）
4. ✅ **一定要拍全吗？** （是不是凑近一点、拍局部、裁切一下更有感觉？）
5. ✅ **有质感吗？** （对焦对实了吗？能不能感受到物体的材质？）`;

// Don'ts 子规则内容
const dontsSubRulesContent: Record<string, string> = {
  employee: `# Don'ts - 员工露出

---

## 一、 自拍形式规范 (Selfie Format Guidelines)

**核心原则：专业得体，拒绝随意**

### 1. 禁止对镜自拍：
* **手机入镜：** 穿着工服时，严禁对着镜子自拍，会导致手机露出。
* **背景杂乱：** 对镜自拍往往会暴露不美观的背景环境。
* **姿态不雅：** 单手举手机自拍的姿势不够专业得体。

### 2. 禁止使用表情包遮挡：
* **Emoji贴纸：** 严禁使用表情包、贴纸遮挡面部。
* **卡通特效：** 不可使用猫耳、兔耳等卡通特效装饰。
* **调性不符：** 此类元素与奢侈品牌的高级调性严重不符。

### 3. 正确的出镜方式：
* **产品特写：** 可以突出展示佩戴产品的局部自拍（如手部特写）。
* **同事协助：** 请同事帮忙拍摄专业服务或展示作品的状态。
* **动作自然：** 呈现专注工作、服务客户的真实瞬间。

---

## 二、 专业行为规范 (Professional Conduct Guidelines)

**核心原则：符合服务标准，体现专业素养**

### 1. 产品展示规范：
* **必须使用托盘：** 展呈作品时必须使用专业托盘承托。
* **必须佩戴手套：** 接触产品时需佩戴白手套，体现珍视态度。
* **蓝盒摆放：** 蓝盒应水平放置，禁止竖放或随意摆放。

---

## 总结口诀

> **员工出镜要专业，对镜自拍需避免；**
> **表情贴纸不能用，工服得体是底线；**
> **托盘手套是标配，蓝盒规范平着放；**
> **代表品牌非个人，专业形象记心间。**`,

  placement: `# Don'ts - 产品摆放及展示

---

## 一、 场景道具规范 (Props & Scene Guidelines)

**核心原则：产品为主角，拒绝喧宾夺主**

### 1. 禁止与食物、酒类同框：
* **食物干扰：** 严禁将产品与月饼、蛋糕、甜点等食物放在一起拍摄。
* **酒类规避：** 不可将产品与酒瓶、酒杯等同框展示。
* **焦点偏移：** 食物和酒类容易成为画面主角，导致观者无法第一时间注意到产品。

### 2. 禁止其他品牌及IP露出：
* **竞品规避：** 严禁出现任何其他珠宝品牌的产品或包装。
* **IP玩偶：** 不可出现Popmart盲盒、Jellycat玩偶等热门IP形象。
* **品牌标识：** 任何可辨识的第三方品牌Logo、包装均需避开。

---

## 总结口诀

> **产品摆放要端正，精致贵重是核心；**
> **食物酒类不同框，他牌IP要避开；**
> **链条舒展不缠绕，背景干净不抢眼。**`,

  quantity: `# Don'ts - 产品数量

---

## 一、 产品数量规范

**核心原则：少即是多，聚焦精品**

### 1. 单图产品数量控制：
* **数量限制：** 避免在同一张图片中出现过多件产品。
* **聚焦单品：** 优先展示1-2件核心产品，让观者视线集中。
* **稀缺性维护：** 大量同款产品堆砌会让作品失去稀缺性和珍贵感。

### 2. 禁止批量堆砌：
* **库存感规避：** 多件产品随意堆叠会呈现出"卖家发货"的既视感。
* **价值感损耗：** 产品过多会降低单件产品的价值感知。

---

## 总结口诀

> **产品展示要精简，一两件是最佳选；**
> **堆叠凌乱像卖家，稀缺珍贵全不见。**`,

  materials: `# Don'ts - 物料搬运

---

## 一、 官方物料使用规范

**核心原则：鼓励原创，拒绝搬运**

### 1. 禁止批量发布官方图片：
* **数量限制：** 严禁连续、大量发布品牌官方账号已发布的图片。
* **封面禁用：** 绝不能将官方产品图设置为笔记/帖子的封面图。

### 2. 禁止使用电商平台截图：
* **详情页截图：** 严禁直接截取官网或电商平台的产品详情页作为发布素材。
* **商品主图：** 不可使用电商平台的白底产品主图。

---

## 总结口诀

> **官方物料不要搬，电商截图更要禁；**
> **价格数字全屏蔽，促销话术不能用。**`,

  filter: `# Don'ts - 滤镜

---

## 一、 AI成像规范

**核心原则：真实至上，拒绝失真**

### 1. 禁止使用AI换脸/风格化工具：
* **粘土滤镜：** 严禁使用将人物或产品转换为"粘土小人"风格的AI滤镜。
* **卡通化效果：** 不可使用将真实照片转换为卡通、动漫风格的AI工具。

### 2. 禁止夸张特效滤镜：
* **闪光/亮片效果：** 严禁使用添加闪烁星星等特效的滤镜。
* **贴纸装饰：** 不可添加心形、蝴蝶、花朵等可爱风贴纸元素。

---

## 总结口诀

> **滤镜使用需克制，AI成像要禁止；**
> **产品真实是底线，贴纸闪光都不行。**`,

  store: `# Don'ts - 店内场景

---

## 一、 工作状态规范

**核心原则：只展示"完成态"，拒绝"进行时"**

### 1. 禁止展示未就绪状态：
* **陈列调整中：** 严禁拍摄正在调整中的陈列、橱窗布置过程。
* **盘点作业：** 不可展示店员进行库存盘点的画面。
* **员工休息：** 画面中不能出现正在休息、闲聊的其他同事。

### 2. 顾客隐私保护：
* **严禁露脸：** 绝不能拍到顾客，尤其是顾客的正脸。
* **背景检查：** 发布前仔细检查画面背景，确保无顾客身影。

---

## 总结口诀

> **店内拍摄要专业，整洁就绪再开拍；**
> **顾客隐私需保护，他牌露出要规避。**`,

  text: `# Don'ts - 压字

---

## 一、 文字内容规范

**核心原则：保持克制，拒绝营销感**

### 1. 禁止提及价格与促销：
* **图片上：** 严禁在图片文字中提及具体价格。
* **严禁打折信息：** 绝不能出现"打折"、"折扣"等促销字眼。

### 2. 视觉设计规范：
* **禁止花哨：** 严禁使用艺术字、卡通体或过于装饰性的花哨字体。
* **限制颜色：** 严禁使用过于花哨、饱和度过高的颜色。

---

## 总结口诀

> **图上压字要极简，黑白宋黑最保险；**
> **不提价格不打折，不压产品不抢眼。**`,

  competitor: `# Don'ts - 竞品

---

## 一、 竞品珠宝规避规范

**核心原则：品牌纯粹，拒绝竞品同框**

### 1. 禁止佩戴竞品珠宝：
* **珠宝竞品：** 严禁在内容中佩戴任何竞争品牌的珠宝产品。
* **涵盖品牌：** 包括但不限于卡地亚、宝格丽、梵克雅宝、海瑞温斯顿。

### 2. 时尚品牌规避：
* **LV、Dior、Chanel、Gucci：** 禁止佩戴这些品牌的珠宝、配饰。

---

## 总结口诀

> **竞品珠宝不能戴，卡地亚宝格丽最危险；**
> **LV Dior Chanel Gucci，统统都要避开看。**`,
};

// 初始规则数据
const getInitialRules = (): MainRule[] => [
  {
    id: "aesthetic",
    label: "审美规则",
    icon: "🎨",
    subRules: [],
    content: aestheticContent,
  },
  {
    id: "donts",
    label: "Don'ts",
    icon: "🚫",
    subRules: [
      { id: "employee", label: "员工露出", icon: "👤", content: dontsSubRulesContent.employee },
      { id: "placement", label: "产品摆放", icon: "💍", content: dontsSubRulesContent.placement },
      { id: "quantity", label: "产品数量", icon: "🔢", content: dontsSubRulesContent.quantity },
      { id: "materials", label: "物料搬运", icon: "📦", content: dontsSubRulesContent.materials },
      { id: "filter", label: "滤镜", icon: "✨", content: dontsSubRulesContent.filter },
      { id: "store", label: "店内场景", icon: "🏪", content: dontsSubRulesContent.store },
      { id: "text", label: "压字", icon: "📝", content: dontsSubRulesContent.text },
      { id: "competitor", label: "竞品", icon: "⚔️", content: dontsSubRulesContent.competitor },
    ],
  },
];

// Markdown 渲染组件
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert
      prose-headings:text-foreground prose-headings:font-semibold
      prose-h1:text-xl prose-h1:border-b prose-h1:border-border/40 prose-h1:pb-3 prose-h1:mb-4
      prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
      prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
      prose-p:text-foreground/80 prose-p:leading-relaxed
      prose-li:text-foreground/80 prose-li:my-0.5
      prose-strong:text-foreground prose-strong:font-semibold
      prose-hr:border-border/40 prose-hr:my-4
      prose-table:text-sm
      prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium
      prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-border/30
      prose-blockquote:border-l-tiffany-500 prose-blockquote:bg-tiffany-50/50 dark:prose-blockquote:bg-tiffany-900/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
      prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground/90 prose-code:before:content-none prose-code:after:content-none
      [&_ul]:list-disc [&_ul]:pl-5
      [&_ol]:list-decimal [&_ol]:pl-5
      [&_input[type=checkbox]]:mr-2 [&_input[type=checkbox]]:accent-tiffany-500
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

// 新建规则弹窗
interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, icon: string) => void;
  title: string;
}

const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim(), selectedIcon);
      setName("");
      setSelectedIcon(iconOptions[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* 弹窗内容 */}
      <div className="relative bg-card border border-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        
        {/* 规则名称输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">规则名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入规则名称"
            className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tiffany-500/50"
            autoFocus
          />
        </div>
        
        {/* 图标选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">选择图标</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                onClick={() => setSelectedIcon(icon)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                  selectedIcon === icon
                    ? "bg-tiffany-500/20 ring-2 ring-tiffany-500"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        {/* 按钮 */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="px-4 py-2 bg-tiffany-500 text-white rounded-lg font-medium hover:bg-tiffany-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认创建
          </button>
        </div>
      </div>
    </div>
  );
};

export const RulesManagementPage: React.FC<RulesManagementPageProps> = ({
  onBack,
  sidebarOpen = true,
  setSidebarOpen,
}) => {
  // 规则数据
  const [rules, setRules] = useState<MainRule[]>(getInitialRules);
  
  // 选中状态
  const [selectedMainRuleId, setSelectedMainRuleId] = useState<string>(rules[0]?.id || "");
  const [selectedSubRuleId, setSelectedSubRuleId] = useState<string>("");
  
  // 编辑模式
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  
  // 新建弹窗
  const [showCreateMainRule, setShowCreateMainRule] = useState(false);
  const [showCreateSubRule, setShowCreateSubRule] = useState(false);
  
  // 获取当前选中的主规则
  const selectedMainRule = rules.find(r => r.id === selectedMainRuleId);
  
  // 获取当前选中的子规则
  const selectedSubRule = selectedMainRule?.subRules.find(s => s.id === selectedSubRuleId);
  
  // 获取当前显示的内容
  const currentContent = selectedSubRule?.content || selectedMainRule?.content || "";
  
  // 进入编辑模式
  const handleStartEdit = useCallback(() => {
    setEditContent(currentContent);
    setIsEditing(true);
  }, [currentContent]);
  
  // 保存编辑
  const handleSave = useCallback(() => {
    setRules(prev => prev.map(rule => {
      if (rule.id !== selectedMainRuleId) return rule;
      
      if (selectedSubRuleId && rule.subRules.length > 0) {
        return {
          ...rule,
          subRules: rule.subRules.map(sub => 
            sub.id === selectedSubRuleId ? { ...sub, content: editContent } : sub
          ),
        };
      } else {
        return { ...rule, content: editContent };
      }
    }));
    setIsEditing(false);
  }, [selectedMainRuleId, selectedSubRuleId, editContent]);
  
  // 取消编辑
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent("");
  }, []);
  
  // 新建主规则
  const handleCreateMainRule = useCallback((name: string, icon: string) => {
    const newId = `rule_${Date.now()}`;
    const newRule: MainRule = {
      id: newId,
      label: name,
      icon,
      subRules: [],
      content: `# ${name}\n\n在此编辑规则内容...`,
    };
    setRules(prev => [...prev, newRule]);
    setSelectedMainRuleId(newId);
    setSelectedSubRuleId("");
  }, []);
  
  // 新建子规则
  const handleCreateSubRule = useCallback((name: string, icon: string) => {
    const newId = `subrule_${Date.now()}`;
    const newSubRule: SubRule = {
      id: newId,
      label: name,
      icon,
      content: `# ${name}\n\n在此编辑规则内容...`,
    };
    setRules(prev => prev.map(rule => {
      if (rule.id !== selectedMainRuleId) return rule;
      // 如果原来有主规则内容但没有子规则，将主规则内容移到第一个子规则
      if (rule.subRules.length === 0 && rule.content) {
        const firstSubRule: SubRule = {
          id: `subrule_${Date.now()}_first`,
          label: "默认",
          icon: "📋",
          content: rule.content,
        };
        return {
          ...rule,
          content: undefined,
          subRules: [firstSubRule, newSubRule],
        };
      }
      return {
        ...rule,
        subRules: [...rule.subRules, newSubRule],
      };
    }));
    setSelectedSubRuleId(newId);
  }, [selectedMainRuleId]);
  
  // 删除主规则
  const handleDeleteMainRule = useCallback((ruleId: string) => {
    if (rules.length <= 1) return; // 至少保留一个规则
    setRules(prev => prev.filter(r => r.id !== ruleId));
    if (selectedMainRuleId === ruleId) {
      const remaining = rules.filter(r => r.id !== ruleId);
      setSelectedMainRuleId(remaining[0]?.id || "");
      setSelectedSubRuleId("");
    }
  }, [rules, selectedMainRuleId]);
  
  // 删除子规则
  const handleDeleteSubRule = useCallback((subRuleId: string) => {
    setRules(prev => prev.map(rule => {
      if (rule.id !== selectedMainRuleId) return rule;
      const updatedSubRules = rule.subRules.filter(s => s.id !== subRuleId);
      // 如果删除后只剩一个或没有子规则，将第一个子规则内容移到主规则
      if (updatedSubRules.length === 0) {
        return {
          ...rule,
          subRules: [],
          content: rule.content || `# ${rule.label}\n\n在此编辑规则内容...`,
        };
      }
      return { ...rule, subRules: updatedSubRules };
    }));
    if (selectedSubRuleId === subRuleId) {
      const rule = rules.find(r => r.id === selectedMainRuleId);
      const remaining = rule?.subRules.filter(s => s.id !== subRuleId) || [];
      setSelectedSubRuleId(remaining[0]?.id || "");
    }
  }, [selectedMainRuleId, selectedSubRuleId, rules]);
  
  // 切换规则时退出编辑模式
  useEffect(() => {
    setIsEditing(false);
  }, [selectedMainRuleId, selectedSubRuleId]);
  
  // 选择主规则时自动选中第一个子规则
  useEffect(() => {
    const mainRule = rules.find(r => r.id === selectedMainRuleId);
    if (mainRule && mainRule.subRules.length > 0) {
      setSelectedSubRuleId(mainRule.subRules[0].id);
    } else {
      setSelectedSubRuleId("");
    }
  }, [selectedMainRuleId, rules]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {setSidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all ${
                  sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"
                }`}
                aria-label="Toggle Menu"
              >
                <PanelLeftIcon className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-tiffany-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-tiffany-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">规则管理</h1>
                <p className="text-xs text-muted-foreground">管理内容创作规则与规范</p>
              </div>
            </div>
          </div>
          
          {/* 新建主规则按钮 */}
          <button
            onClick={() => setShowCreateMainRule(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-tiffany-500 text-white rounded-xl text-sm font-medium hover:bg-tiffany-600 transition-colors shadow-md"
          >
            <PlusIcon className="w-4 h-4" />
            <span>新建规则</span>
          </button>
        </div>
      </header>

      {/* 主规则 Tab 栏 */}
      <div className="px-4 md:px-8 py-3 border-b border-border/40 flex-shrink-0">
        <div className="flex gap-2 items-center overflow-x-auto pb-1">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center group">
              <button
                onClick={() => setSelectedMainRuleId(rule.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedMainRuleId === rule.id
                    ? "bg-tiffany-500 text-primary-foreground shadow-md shadow-tiffany-500/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{rule.icon}</span>
                <span>{rule.label}</span>
              </button>
              {/* 删除按钮 */}
              {rules.length > 1 && (
                <button
                  onClick={() => handleDeleteMainRule(rule.id)}
                  className="ml-1 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="删除规则"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 子规则 Tab 栏（仅在有子规则时显示） */}
      {selectedMainRule && selectedMainRule.subRules.length > 0 && (
        <div className="px-4 md:px-8 py-2 border-b border-border/40 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1.5 items-center min-w-max pb-1">
            {selectedMainRule.subRules.map((sub) => (
              <div key={sub.id} className="flex items-center group">
                <button
                  onClick={() => setSelectedSubRuleId(sub.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedSubRuleId === sub.id
                      ? "bg-foreground/10 text-foreground border border-foreground/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
                {/* 删除子规则按钮 */}
                <button
                  onClick={() => handleDeleteSubRule(sub.id)}
                  className="ml-0.5 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="删除子规则"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* 添加子规则按钮 */}
            <button
              onClick={() => setShowCreateSubRule(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-tiffany-600 hover:bg-tiffany-500/10 transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>添加子规则</span>
            </button>
          </div>
        </div>
      )}

      {/* 规则内容区域 */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-6 md:p-8 relative">
          {/* 编辑/保存/取消按钮 */}
          <div className="absolute top-4 right-4 flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-tiffany-500 text-white rounded-lg text-sm font-medium hover:bg-tiffany-600 transition-colors shadow-md"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span>保存</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  <CancelIcon className="w-4 h-4" />
                  <span>取消</span>
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                {/* 如果没有子规则，显示添加子规则按钮 */}
                {selectedMainRule && selectedMainRule.subRules.length === 0 && (
                  <button
                    onClick={() => setShowCreateSubRule(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>添加子规则</span>
                  </button>
                )}
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/10 text-foreground rounded-lg text-sm font-medium hover:bg-foreground/20 transition-colors"
                >
                  <EditIcon className="w-4 h-4" />
                  <span>编辑</span>
                </button>
              </div>
            )}
          </div>
          
          {/* 内容展示/编辑 */}
          {isEditing ? (
            <div className="pt-10">
              <div className="mb-3 text-sm text-muted-foreground">
                使用 Markdown 格式编辑规则内容
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-[calc(100vh-380px)] min-h-[300px] p-4 bg-background/50 border border-border/50 rounded-xl text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-tiffany-500/50 custom-scrollbar"
                placeholder="在此编辑 Markdown 内容..."
              />
              {/* 实时预览 */}
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  实时预览
                </div>
                <div className="p-4 bg-background/30 rounded-xl border border-border/30 max-h-[250px] overflow-auto custom-scrollbar">
                  <MarkdownContent content={editContent} />
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-8">
              {currentContent ? (
                <MarkdownContent content={currentContent} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>暂无内容，点击右上角「编辑」按钮添加内容</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 新建主规则弹窗 */}
      <CreateRuleModal
        isOpen={showCreateMainRule}
        onClose={() => setShowCreateMainRule(false)}
        onConfirm={handleCreateMainRule}
        title="新建规则"
      />
      
      {/* 新建子规则弹窗 */}
      <CreateRuleModal
        isOpen={showCreateSubRule}
        onClose={() => setShowCreateSubRule(false)}
        onConfirm={handleCreateSubRule}
        title="新建子规则"
      />
    </div>
  );
};

export default RulesManagementPage;
