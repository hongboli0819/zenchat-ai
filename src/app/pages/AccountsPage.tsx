import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SparklesIcon } from "@/shared/ui/Icon";
import { useAccountsWithStats, useOverviewStats } from "@/shared/lib/queries";

interface AccountsPageProps {
  onBack: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"interactions" | "posts" | "likes">("interactions");
  const pageSize = 20;

  // 使用 TanStack Query hooks
  const { data: accounts = [], isLoading, refetch } = useAccountsWithStats();
  const { data: stats } = useOverviewStats();

  // 过滤和排序
  const filteredAccounts = useMemo(() => {
    let result = accounts;
    
    // 搜索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.nickname?.toLowerCase().includes(term) ||
          a.xhs_id?.toLowerCase().includes(term)
      );
    }
    
    // 排序
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "posts":
          return (b.total_posts || 0) - (a.total_posts || 0);
        case "likes":
          return (b.total_likes || 0) - (a.total_likes || 0);
        case "interactions":
        default:
          return (b.total_interactions || 0) - (a.total_interactions || 0);
      }
    });
    
    return result;
  }, [accounts, searchTerm, sortBy]);

  const totalCount = filteredAccounts.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 分页数据
  const data = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    }
    return num.toLocaleString();
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">加载账号数据...</p>
        </div>
      </div>
    );
  }

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
            <SparklesIcon className="w-4 h-4 text-tiffany-600" />
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">账号管理</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
            title="刷新数据"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        <div className="text-sm text-muted-foreground">
            共 <span className="font-semibold text-tiffany-600">{totalCount}</span> 个账号
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-tiffany-600">{totalCount}</div>
            <div className="text-xs text-muted-foreground mt-1">活跃账号</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{(stats?.postsWithImages || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总作品数</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{formatNumber(stats?.totalLikes || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">总获赞</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{formatNumber(stats?.totalInteractions || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">总互动</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-8 py-3 border-b border-border/40 flex flex-wrap gap-3 items-center flex-shrink-0">
        <div className="flex-1 min-w-[200px]">
        <input
          type="text"
            placeholder="搜索昵称、小红书号..."
          value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          className="w-full px-4 py-2 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent"
        />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "interactions" | "posts" | "fans")}
            className="px-3 py-2 glass rounded-xl text-sm bg-transparent cursor-pointer"
          >
            <option value="interactions">按互动量排序</option>
            <option value="posts">按作品数排序</option>
            <option value="likes">按获赞数排序</option>
          </select>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-4 custom-scrollbar relative">
        {isLoading && data.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((account, index) => (
            <div
              key={account.id}
              onClick={() => navigate(`/accounts/${account.id}`)}
              className="glass rounded-xl p-4 hover:bg-card/60 transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/10"
            >
                {/* 排名 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                {/* 头像 */}
                  <div className="relative">
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${account.nickname}`;
                      }}
                    />
                  ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-tiffany-400 to-tiffany-600 flex items-center justify-center text-primary-foreground font-bold">
                        {account.nickname?.charAt(0) || "?"}
                      </div>
                    )}
                    {/* 排名角标 */}
                    {(currentPage - 1) * pageSize + index + 1 <= 3 && (
                      <div
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-background ${
                          (currentPage - 1) * pageSize + index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                            : (currentPage - 1) * pageSize + index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400"
                            : "bg-gradient-to-br from-amber-600 to-amber-700"
                        }`}
                      >
                        {(currentPage - 1) * pageSize + index + 1}
                    </div>
                  )}
                </div>

                  <div>
                    <h3 className="font-medium text-foreground">{account.nickname}</h3>
                    {account.xhs_id && (
                      <p className="text-xs text-muted-foreground">小红书号: {account.xhs_id}</p>
                    )}
                  </div>
                </div>
                
                    {account.profile_url && (
                      <a
                        href={account.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-tiffany-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                      </a>
                    )}
                  </div>

              {/* 数据统计 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-blue-500">{account.total_posts || 0}</div>
                  <div className="text-xs text-muted-foreground">作品数</div>
                  </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-purple-500">{formatNumber(account.total_interactions || 0)}</div>
                  <div className="text-xs text-muted-foreground">互动量</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-red-500">{formatNumber(account.total_likes || 0)}</div>
                  <div className="text-xs text-muted-foreground">获赞</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-tiffany-500">{formatNumber(account.total_favorites || 0)}</div>
                  <div className="text-xs text-muted-foreground">收藏</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-muted-foreground">没有找到匹配的账号</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 md:px-8 py-3 border-t border-border/40 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 glass rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60 transition-all"
          >
            上一页
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              第 <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages} 页
            </span>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 glass rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60 transition-all"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};
