import React, { useState } from 'react';
import { AccountRanking, PostRanking } from './types';

interface RankingTabsProps {
  publishRanking: AccountRanking[];
  performanceRanking: PostRanking[];
  efficiencyRanking: AccountRanking[];
  loading?: boolean;
  onAccountClick?: (accountId: string) => void;
  onPostClick?: (postId: string) => void;
}

type TabType = 'publish' | 'performance' | 'efficiency';

export const RankingTabs: React.FC<RankingTabsProps> = ({
  publishRanking,
  performanceRanking,
  efficiencyRanking,
  loading,
  onAccountClick,
  onPostClick,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('publish');

  const tabs = [
    { id: 'publish' as const, label: '发布榜', icon: '📤', description: '发布数量排名' },
    { id: 'performance' as const, label: '表现榜', icon: '🔥', description: '单帖互动量排名' },
    { id: 'efficiency' as const, label: '综合榜', icon: '👑', description: '篇均互动排名' },
  ];

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-lg">🥇</span>;
    if (index === 1) return <span className="text-lg">🥈</span>;
    if (index === 2) return <span className="text-lg">🥉</span>;
    return (
      <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">
        {index + 1}
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      {/* Tab Headers */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-tiffany-500 text-primary-foreground shadow-md shadow-tiffany-500/30'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2">
        {activeTab === 'publish' && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              该时间范围内发布最多的账号
            </div>
            {publishRanking.slice(0, 10).map((account, index) => (
              <div
                key={account.id}
                onClick={() => onAccountClick?.(account.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                {getRankBadge(index)}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {account.avatar ? (
                    <img src={account.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {account.nickname.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{account.nickname}</div>
                  <div className="text-xs text-muted-foreground">
                    总互动 {formatNumber(account.totalInteractions)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-tiffany-600">{account.postCount}</div>
                  <div className="text-xs text-muted-foreground">篇</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              互动量最高的帖子
            </div>
            {performanceRanking.slice(0, 10).map((post, index) => (
              <div
                key={post.id}
                onClick={() => onPostClick?.(post.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                {getRankBadge(index)}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {post.coverUrl ? (
                    <img src={post.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {post.title || '无标题'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {post.accountName}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="text-red-500">❤️ {formatNumber(post.likes)}</span>
                    <span className="text-amber-500">⭐ {formatNumber(post.favorites)}</span>
                    <span className="text-blue-500">💬 {formatNumber(post.comments)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{formatNumber(post.interactions)}</div>
                  <div className="text-xs text-muted-foreground">互动</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'efficiency' && (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              篇均互动量最高的账号（总互动÷帖子数）
            </div>
            {efficiencyRanking.slice(0, 10).map((account, index) => (
              <div
                key={account.id}
                onClick={() => onAccountClick?.(account.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
              >
                {getRankBadge(index)}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {account.avatar ? (
                    <img src={account.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {account.nickname.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{account.nickname}</div>
                  <div className="text-xs text-muted-foreground">
                    {account.postCount} 篇 · 总互动 {formatNumber(account.totalInteractions)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">{formatNumber(account.avgInteractions)}</div>
                  <div className="text-xs text-muted-foreground">篇均</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};


