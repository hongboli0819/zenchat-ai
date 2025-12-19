-- =========================================
-- 小红书数据表结构
-- =========================================

-- 启用 uuid 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 表 1: xhs_accounts (小红书账号)
-- =========================================
CREATE TABLE IF NOT EXISTS xhs_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  xhs_id TEXT UNIQUE,                    -- 小红书号（如 Q122692334）
  xhs_user_id TEXT,                      -- 从 profile_url 解析的用户 ID
  nickname TEXT NOT NULL,
  avatar TEXT,
  profile_url TEXT,                      -- 账号主页链接
  account_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_accounts_nickname ON xhs_accounts(nickname);
CREATE INDEX IF NOT EXISTS idx_xhs_accounts_xhs_user_id ON xhs_accounts(xhs_user_id);
CREATE INDEX IF NOT EXISTS idx_xhs_accounts_profile_url ON xhs_accounts(profile_url);

-- =========================================
-- 表 2: xhs_posts (小红书帖子)
-- =========================================
CREATE TABLE IF NOT EXISTS xhs_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES xhs_accounts(id) ON DELETE CASCADE,
  platform TEXT DEFAULT '小红书',
  title TEXT,
  content TEXT,
  post_url TEXT UNIQUE,                  -- 作品原链接
  post_id TEXT,                          -- 从 post_url 解析的帖子 ID
  cover_url TEXT,                        -- 封面图链接
  note_type TEXT CHECK (note_type IN ('图文', '视频') OR note_type IS NULL),
  publish_time TIMESTAMPTZ,
  status TEXT,                           -- 作品状态（正常/异常）
  interactions INTEGER DEFAULT 0,        -- 互动量
  likes INTEGER DEFAULT 0,               -- 获赞数
  favorites INTEGER DEFAULT 0,           -- 收藏数
  comments INTEGER DEFAULT 0,            -- 评论数
  shares INTEGER DEFAULT 0,              -- 分享数
  data_period TEXT,                      -- 发布时间段
  image_count INTEGER DEFAULT 0,         -- 图片数量
  card_image TEXT,                       -- 卡片图 URL（生成后填充）
  merge_image TEXT,                      -- 拼图 URL（生成后填充）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_xhs_posts_account_id ON xhs_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_post_id ON xhs_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_publish_time ON xhs_posts(publish_time DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_interactions ON xhs_posts(interactions DESC);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_note_type ON xhs_posts(note_type);

-- =========================================
-- 表 3: post_images (帖子图片)
-- =========================================
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES xhs_posts(id) ON DELETE CASCADE,  -- 关联帖子
  xhs_post_id TEXT NOT NULL,             -- 小红书帖子 ID（从 post_url 解析）
  task_id UUID,                          -- 关联的上传任务
  image_order INTEGER DEFAULT 0,         -- 图片顺序
  original_name TEXT,                    -- 原始文件名
  storage_path TEXT NOT NULL,            -- 存储路径
  storage_url TEXT,                      -- 存储 URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_xhs_post_id ON post_images(xhs_post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_task_id ON post_images(task_id);

-- =========================================
-- 表 4: zip_upload_tasks (ZIP 上传任务)
-- =========================================
CREATE TABLE IF NOT EXISTS zip_upload_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- 任务名称
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  total_units INTEGER DEFAULT 0,         -- 总单元数
  processed_units INTEGER DEFAULT 0,     -- 已处理单元数
  matched_posts INTEGER DEFAULT 0,       -- 匹配的帖子数
  unmatched_count INTEGER DEFAULT 0,     -- 未匹配数
  file_structure JSONB,                  -- 文件结构树
  result_summary JSONB,                  -- 结果摘要
  error_message TEXT,                    -- 错误信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 触发器：自动更新 updated_at
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 账号表触发器
DROP TRIGGER IF EXISTS xhs_accounts_updated_at ON xhs_accounts;
CREATE TRIGGER xhs_accounts_updated_at
  BEFORE UPDATE ON xhs_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 帖子表触发器
DROP TRIGGER IF EXISTS xhs_posts_updated_at ON xhs_posts;
CREATE TRIGGER xhs_posts_updated_at
  BEFORE UPDATE ON xhs_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 任务表触发器
DROP TRIGGER IF EXISTS zip_upload_tasks_updated_at ON zip_upload_tasks;
CREATE TRIGGER zip_upload_tasks_updated_at
  BEFORE UPDATE ON zip_upload_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================================
-- RLS 策略（Row Level Security）
-- =========================================
-- 启用 RLS
ALTER TABLE xhs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_upload_tasks ENABLE ROW LEVEL SECURITY;

-- 允许匿名读取
CREATE POLICY "Allow anonymous read on xhs_accounts"
  ON xhs_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on xhs_posts"
  ON xhs_posts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on post_images"
  ON post_images FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read on zip_upload_tasks"
  ON zip_upload_tasks FOR SELECT
  TO anon
  USING (true);

-- 允许认证用户写入
CREATE POLICY "Allow authenticated insert on xhs_accounts"
  ON xhs_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on xhs_posts"
  ON xhs_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on post_images"
  ON post_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on zip_upload_tasks"
  ON zip_upload_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on xhs_accounts"
  ON xhs_accounts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update on xhs_posts"
  ON xhs_posts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update on post_images"
  ON post_images FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update on zip_upload_tasks"
  ON zip_upload_tasks FOR UPDATE
  TO authenticated
  USING (true);

-- =========================================
-- 视图：账号统计
-- =========================================
CREATE OR REPLACE VIEW xhs_account_stats AS
SELECT 
  a.id,
  a.xhs_id,
  a.xhs_user_id,
  a.nickname,
  a.avatar,
  a.profile_url,
  a.account_type,
  COUNT(p.id) as total_posts,
  COALESCE(SUM(p.interactions), 0) as total_interactions,
  COALESCE(SUM(p.likes), 0) as total_likes,
  COALESCE(SUM(p.favorites), 0) as total_favorites,
  COALESCE(SUM(p.comments), 0) as total_comments,
  COALESCE(SUM(p.shares), 0) as total_shares,
  a.created_at,
  a.updated_at
FROM xhs_accounts a
LEFT JOIN xhs_posts p ON a.id = p.account_id
GROUP BY a.id
ORDER BY total_interactions DESC;
