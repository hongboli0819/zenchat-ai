import React, { useState, useEffect } from "react";
import { usePostImages, type XHSPost, type PostImage } from "@/shared/lib/queries";
import { LazyImage, preloadImages, preloadImage } from "@/shared/ui/LazyImage";

// ============ 类型定义 ============

interface AnalysisKeyPoint {
  category: string;
  points: string[];
}

interface AnalysisDimension {
  score: "A" | "B" | "C";
  title: string;
  subtitle?: string;
  conclusion: string;
  judgment: string;
  keyPoints?: AnalysisKeyPoint[];
  summaryPoints?: string[];
}

interface ContentAnalysis {
  overallScore: string;
  overallSummary: string;
  performanceAnalysis: AnalysisDimension;
  firstTouchAnalysis: AnalysisDimension;
  interactionAnalysis: AnalysisDimension;
  aestheticAnalysis: AnalysisDimension;
  complianceAnalysis: AnalysisDimension;
}

interface ContentAnalysisDetailPageProps {
  post: XHSPost;
  onBack: () => void;
}

// ============ Mock 数据 ============

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockAnalysis(_post: XHSPost): ContentAnalysis {
  return {
    // 综合评分
    overallScore: "BAA",
    overallSummary: "胜在视觉质感与明星背书，弱在泛流量吸引与互动引导。属于「叫好不叫座」的稳妥型内容。",
    
    // 表现分析
    performanceAnalysis: {
      score: "B",
      title: "表现分析",
      subtitle: "重审美，轻互动",
      conclusion: "胜在视觉质感与明星背书，弱在泛流量吸引与互动引导。",
      judgment: "头图能筛选精准人群但难破圈，正文缺乏参与切口，数据主要依赖明星IP的基础盘，属于「叫好不叫座」的稳妥型内容。",
    },
    
    // 第一触点分析
    firstTouchAnalysis: {
      score: "B",
      title: "用户第一触点分析",
      subtitle: "头图 + 标题",
      conclusion: "审美完成度高，但点击驱动力中等，更偏向吸引对奢品/时尚本就感兴趣的人群。",
      judgment: "属于「好看型弹窗」，而非「强诱导型弹窗」。",
      keyPoints: [
        {
          category: "头图表现",
          points: [
            "超近景人像+饰品特写，视觉张力强，具备信息流「停留能力」",
            "画面质感高级，符合小红书奢品/时尚审美",
            "但产品识别不够直观，第一眼不一定立刻聚焦在「Tiffany戒指」本身",
          ],
        },
        {
          category: "标题表现",
          points: [
            "品牌名直出，自带吸引力",
            "情绪化表达自然，符合平台语境",
            "但缺乏明确内容预期，未清晰告诉用户「点进来能看到什么」",
          ],
        },
      ],
      summaryPoints: [
        "能吸引目标人群点击",
        "对泛用户的点击刺激不够强",
        "属于「好看型弹窗」，而非「强诱导型弹窗」",
      ],
    },
    
    // 互动分析
    interactionAnalysis: {
      score: "B",
      title: "互动分析",
      subtitle: "正文内容",
      conclusion: "正文整体符合明星 × 奢品品牌内容的常规表达逻辑，以氛围营造与品牌露出为主。",
      judgment: "这是一篇完成度合格、风格安全的明星品牌正文，能够支撑基础互动表现，但缺乏推动高频评论和二次传播的内容设计，整体互动潜力为中等水平。",
      keyPoints: [
        {
          category: "内容结构",
          points: [
            "正文更偏向展示型而非叙事型",
            "没有引入个人视角、故事背景或明确观点",
            "用户阅读路径是「看到明星 + 感受品牌气质」，而非「被引导表达态度」",
            "互动行为更多停留在点赞层面，评论与转发的动机较弱",
          ],
        },
        {
          category: "互动设计",
          points: [
            "正文缺乏明确的互动入口",
            "没有问题抛出、态度对立或情绪共鸣点",
            "用户即使产生好感，也不容易转化为主动发声",
            "写法稳妥但限制了内容的讨论度",
          ],
        },
        {
          category: "标签使用",
          points: [
            "标签数量多且情绪高度集中",
            "主要承担曝光与品牌强化作用",
            "对引导用户参与讨论的实际帮助有限",
            "更偏向「宣告式内容」而非「参与式内容」",
          ],
        },
      ],
    },
    
    // 美感分析
    aestheticAnalysis: {
      score: "A",
      title: "图片美感分析",
      subtitle: "高奢质感",
      conclusion: "整体图片在美感层面完成度非常高，属于奢品内容中标准偏上的视觉表现。",
      judgment: "该图片在构图、质感、风格与平台审美匹配度上均表现出色，是一张可以直接支撑奢品品牌调性的 A 级视觉内容，在美感维度上不存在明显短板。",
      keyPoints: [
        {
          category: "构图",
          points: [
            "极近景人像特写，视觉重心高度集中在眼神与戒指两个核心元素",
            "既有人物情绪张力，又不削弱产品存在感",
            "手部姿态自然且具有设计感，成功引导视线流向饰品本身",
            "画面主次清晰",
          ],
        },
        {
          category: "质感与光影",
          points: [
            "光线控制细腻，肤质、金属与钻石的反光层次分明",
            "没有过度修饰或滤镜痕迹",
            "呈现出偏高端、克制的时尚质感",
            "与奢品调性高度一致，容易建立「高级」「可信」的视觉感受",
          ],
        },
        {
          category: "风格统一性",
          points: [
            "色调偏暖但不过度情绪化",
            "妆容、指甲细节、饰品风格高度统一",
            "没有杂讯元素干扰",
            "符合小红书当前对奢品内容「干净、克制、精致」的主流审美",
          ],
        },
        {
          category: "平台适配度",
          points: [
            "强审美、强质感的图片在信息流中具备明显区隔度",
            "既不像硬广，也区别于日常生活向内容",
            "容易被识别为高价值内容",
            "能提升停留与信任感",
          ],
        },
      ],
    },
    
    // 合规分析
    complianceAnalysis: {
      score: "A",
      title: "合规分析",
      subtitle: "安全无险",
      conclusion: "表达克制严谨，符合商业边界。",
      judgment: "无违规或限流隐患，适合长期留存。",
      keyPoints: [
        {
          category: "内容安全",
          points: [
            "表达克制严谨，符合商业边界",
            "无违规或限流隐患",
            "适合长期留存",
          ],
        },
      ],
    },
  };
}

// ============ 组件 ============

// 评分徽章组件
const ScoreBadge: React.FC<{ score: string; size?: "sm" | "md" | "lg" }> = ({ score, size = "md" }) => {
  const getColor = () => {
    if (score.startsWith("A") || score === "A") return "bg-emerald-500 text-emerald-50";
    if (score.startsWith("B") || score === "B") return "bg-amber-500 text-amber-50";
    return "bg-red-500 text-red-50";
  };

  const getSize = () => {
    switch (size) {
      case "sm": return "px-2 py-1 text-xs";
      case "lg": return "px-6 py-3 text-2xl";
      default: return "px-3 py-1.5 text-sm";
    }
  };

  return (
    <span className={`inline-flex items-center justify-center font-bold rounded-lg ${getColor()} ${getSize()}`}>
      {score}
    </span>
  );
};

// 关键分析点展示组件
const KeyPointsBlock: React.FC<{ keyPoints: AnalysisKeyPoint[] }> = ({ keyPoints }) => {
  return (
    <div className="space-y-4">
      {keyPoints.map((kp, idx) => (
        <div key={idx}>
          <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tiffany-500"></span>
            {kp.category}
          </h5>
          <ul className="space-y-1.5 pl-3">
            {kp.points.map((point, pidx) => (
              <li key={pidx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-muted-foreground/50 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// 分析维度展示组件（新版）
const DimensionBlock: React.FC<{ 
  dimension: AnalysisDimension;
  icon: React.ReactNode;
  iconColor?: string;
}> = ({ dimension, icon, iconColor = "text-tiffany-500" }) => {
  return (
    <div className="glass rounded-xl p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <h4 className="font-semibold text-foreground">{dimension.title}</h4>
          {dimension.subtitle && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {dimension.subtitle}
            </span>
          )}
        </div>
        <ScoreBadge score={dimension.score} size="sm" />
      </div>
      
      {/* 结论 */}
      <div className="mb-3">
        <p className="text-sm text-foreground font-medium">{dimension.conclusion}</p>
      </div>
      
      {/* 判断 */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">{dimension.judgment}</p>
      </div>
      
      {/* 关键分析点 */}
      {dimension.keyPoints && dimension.keyPoints.length > 0 && (
        <KeyPointsBlock keyPoints={dimension.keyPoints} />
      )}
      
      {/* 综合结论点 */}
      {dimension.summaryPoints && dimension.summaryPoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <h5 className="text-sm font-semibold text-foreground mb-2">综合结论</h5>
          <ul className="space-y-1.5">
            {dimension.summaryPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// 图片轮播组件（带预加载）
const ImageCarousel: React.FC<{ images: PostImage[]; className?: string; loading?: boolean }> = ({ 
  images, 
  className = "",
  loading = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 预加载相邻图片（切换时触发）
  useEffect(() => {
    if (images.length <= 1) return;
    
    // 只预加载下一张图片
    const nextIndex = currentIndex + 1;
    if (nextIndex < images.length) {
      preloadImage(images[nextIndex]?.storage_url);
    }
  }, [currentIndex, images]);

  // 进入时只预加载前 4 张图片（避免并发过多）
  useEffect(() => {
    if (images.length > 0) {
      // 只预加载前 4 张，减少并发请求
      const urlsToPreload = images.slice(0, 4).map(img => img.storage_url);
      preloadImages(urlsToPreload, 2); // 并发数限制为 2
    }
  }, [images]);

  // 加载中状态
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">加载图片...</span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl ${className}`}>
        <span className="text-muted-foreground">暂无图片</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
        <LazyImage
          src={images[currentIndex]?.storage_url}
          alt={`图片 ${currentIndex + 1}`}
          containerClassName="w-full h-full"
        />
      </div>
      
      {/* 图片指示器 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground/60 text-background rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 左右切换按钮 */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-foreground/40 hover:bg-foreground/60 text-background rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-foreground/40 hover:bg-foreground/60 text-background rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

// ============ 主页面组件 ============

export const ContentAnalysisDetailPage: React.FC<ContentAnalysisDetailPageProps> = ({ post, onBack }) => {
  // 图片数据单独加载，不阻塞页面渲染
  const { data: images = [], isLoading: imagesLoading } = usePostImages(post.id);
  // 分析数据是本地生成的，立即可用
  const [analysis] = useState<ContentAnalysis>(() => generateMockAnalysis(post));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 relative z-20 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 px-4 py-2 glass rounded-full">
            <svg className="w-4 h-4 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">内容分析详情</span>
          </div>
        </div>
        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-tiffany-600 hover:underline"
          >
            查看原文 →
          </a>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
          
          {/* 1. 综合评分 */}
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              综合评分
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <ScoreBadge score={analysis.overallScore} size="lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">概览总结</h3>
                <p className="text-muted-foreground leading-relaxed">{analysis.overallSummary}</p>
                
                {/* 三维度速览 */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">表现</span>
                    <ScoreBadge score={analysis.performanceAnalysis.score} size="sm" />
                    <span className="text-xs text-muted-foreground">{analysis.performanceAnalysis.subtitle}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">美感</span>
                    <ScoreBadge score={analysis.aestheticAnalysis.score} size="sm" />
                    <span className="text-xs text-muted-foreground">{analysis.aestheticAnalysis.subtitle}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">合规</span>
                    <ScoreBadge score={analysis.complianceAnalysis.score} size="sm" />
                    <span className="text-xs text-muted-foreground">{analysis.complianceAnalysis.subtitle}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. 详细分析 */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              详细分析
            </h2>

            {/* 2.1 表现分析 */}
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-foreground border-l-4 border-tiffany-500 pl-3">
                表现分析
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  {analysis.performanceAnalysis.subtitle}
                </span>
              </h3>
              
              {/* 表现分析概览 */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ScoreBadge score={analysis.performanceAnalysis.score} />
                  <p className="text-foreground font-medium">{analysis.performanceAnalysis.conclusion}</p>
                </div>
                <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  {analysis.performanceAnalysis.judgment}
                </p>
              </div>
              
              {/* a. 第一触点分析 */}
              <div className="glass rounded-2xl p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {analysis.firstTouchAnalysis.title}
                  <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                    {analysis.firstTouchAnalysis.subtitle}
                  </span>
                  <ScoreBadge score={analysis.firstTouchAnalysis.score} size="sm" />
                </h4>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 左侧：卡片图片 */}
                  <div className="flex-shrink-0 w-full md:w-64">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                      {post.card_image ? (
                        <img src={post.card_image} alt="卡片图片" className="w-full h-full object-cover" />
                      ) : post.cover_url ? (
                        <img src={post.cover_url} alt="封面图片" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">暂无图片</div>
                      )}
                    </div>
                  </div>
                  
                  {/* 右侧：分析结果 */}
                  <div className="flex-1">
                    {/* 核心判断 */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-foreground mb-2">核心判断</h5>
                      <p className="text-sm text-foreground">{analysis.firstTouchAnalysis.conclusion}</p>
                    </div>
                    
                    {/* 关键分析点 */}
                    {analysis.firstTouchAnalysis.keyPoints && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-foreground mb-3">关键分析点</h5>
                        <KeyPointsBlock keyPoints={analysis.firstTouchAnalysis.keyPoints} />
                      </div>
                    )}
                    
                    {/* 综合结论 */}
                    {analysis.firstTouchAnalysis.summaryPoints && (
                      <div className="pt-4 border-t border-border/50">
                        <h5 className="text-sm font-semibold text-foreground mb-2">综合结论</h5>
                        <ul className="space-y-1.5">
                          {analysis.firstTouchAnalysis.summaryPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-emerald-500 mt-0.5">✓</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* b. 互动行为分析 */}
              <div className="glass rounded-2xl p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  {analysis.interactionAnalysis.title}
                  <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                    {analysis.interactionAnalysis.subtitle}
                  </span>
                  <ScoreBadge score={analysis.interactionAnalysis.score} size="sm" />
                </h4>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 左侧：正文展示 */}
                  <div className="flex-shrink-0 w-full md:w-72">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-3 mb-4">
                      {post.xhs_accounts?.avatar && (
                        <img src={post.xhs_accounts.avatar} alt="" className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{post.xhs_accounts?.nickname || "未知用户"}</div>
                        <div className="text-xs text-muted-foreground">
                          {post.publish_time ? new Date(post.publish_time).toLocaleDateString("zh-CN") : ""}
                        </div>
                      </div>
                    </div>
                    
                    {/* 图片轮播 */}
                    <ImageCarousel images={images} className="mb-4" loading={imagesLoading} />
                    
                    {/* 正文内容 */}
                    <div className="glass rounded-xl p-3 max-h-32 overflow-auto custom-scrollbar">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{post.content || "暂无正文内容"}</p>
                    </div>
                  </div>
                  
                  {/* 右侧：分析结果 */}
                  <div className="flex-1">
                    {/* 分析结论 */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-foreground mb-2">分析结论</h5>
                      <p className="text-sm text-foreground">{analysis.interactionAnalysis.conclusion}</p>
                    </div>
                    
                    {/* 详细判断 */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{analysis.interactionAnalysis.judgment}</p>
                    </div>
                    
                    {/* 关键分析点 */}
                    {analysis.interactionAnalysis.keyPoints && (
                      <KeyPointsBlock keyPoints={analysis.interactionAnalysis.keyPoints} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2.2 美感和合规分析 */}
            <div className="mt-6 space-y-6">
              <h3 className="text-base font-semibold text-foreground border-l-4 border-amber-500 pl-3">美感和合规分析</h3>
              
              <div className="glass rounded-2xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 左侧：图片轮播 */}
                  <div className="flex-shrink-0 w-full md:w-72">
                    <ImageCarousel images={images} loading={imagesLoading} />
                  </div>
                  
                  {/* 右侧：两个分析块 */}
                  <div className="flex-1 space-y-4">
                    <DimensionBlock
                      dimension={analysis.aestheticAnalysis}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      }
                      iconColor="text-pink-500"
                    />
                    
                    <DimensionBlock
                      dimension={analysis.complianceAnalysis}
                      icon={
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      }
                      iconColor="text-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
