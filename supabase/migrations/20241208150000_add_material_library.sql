-- =========================================
-- 素材库功能数据库迁移
-- =========================================

-- =========================================
-- 1. ZIP 上传任务表
-- =========================================
CREATE TABLE IF NOT EXISTS zip_upload_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                      -- ZIP 文件名
  status TEXT DEFAULT 'processing' 
    CHECK (status IN ('processing', 'completed', 'failed')),
  total_units INTEGER DEFAULT 0,           -- 总单元数
  processed_units INTEGER DEFAULT 0,       -- 已处理单元数
  matched_posts INTEGER DEFAULT 0,         -- 匹配成功的帖子数
  unmatched_count INTEGER DEFAULT 0,       -- 未匹配的数量
  file_structure JSONB,                    -- 合并后的文件层级结构
  result_summary JSONB,                    -- 处理结果摘要
  error_message TEXT,                      -- 错误信息
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_zip_tasks_status ON zip_upload_tasks(status);
CREATE INDEX IF NOT EXISTS idx_zip_tasks_created_at ON zip_upload_tasks(created_at DESC);

-- 更新触发器
DROP TRIGGER IF EXISTS zip_upload_tasks_updated_at ON zip_upload_tasks;
CREATE TRIGGER zip_upload_tasks_updated_at
  BEFORE UPDATE ON zip_upload_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 策略
ALTER TABLE zip_upload_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read on zip_upload_tasks" ON zip_upload_tasks;
CREATE POLICY "Allow anonymous read on zip_upload_tasks"
  ON zip_upload_tasks FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated all on zip_upload_tasks" ON zip_upload_tasks;
CREATE POLICY "Allow authenticated all on zip_upload_tasks"
  ON zip_upload_tasks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 允许匿名用户插入和更新（开发环境）
DROP POLICY IF EXISTS "Allow anon insert on zip_upload_tasks" ON zip_upload_tasks;
CREATE POLICY "Allow anon insert on zip_upload_tasks"
  ON zip_upload_tasks FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on zip_upload_tasks" ON zip_upload_tasks;
CREATE POLICY "Allow anon update on zip_upload_tasks"
  ON zip_upload_tasks FOR UPDATE TO anon USING (true);

-- =========================================
-- 2. 帖子图片表（图片存储在 Supabase Storage）
-- =========================================
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES xhs_posts(id) ON DELETE CASCADE,
  xhs_post_id TEXT NOT NULL,               -- 小红书帖子 ID（用于匹配）
  task_id UUID REFERENCES zip_upload_tasks(id) ON DELETE SET NULL,
  image_order INTEGER NOT NULL DEFAULT 0,  -- 排序序号 (1, 2, 3...)
  original_name TEXT,                      -- 原始文件名
  storage_path TEXT NOT NULL,              -- Supabase Storage 路径
  storage_url TEXT,                        -- 完整的访问 URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_xhs_post_id ON post_images(xhs_post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_task_id ON post_images(task_id);
CREATE INDEX IF NOT EXISTS idx_post_images_order ON post_images(post_id, image_order);

-- RLS 策略
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read on post_images" ON post_images;
CREATE POLICY "Allow anonymous read on post_images"
  ON post_images FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated all on post_images" ON post_images;
CREATE POLICY "Allow authenticated all on post_images"
  ON post_images FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert on post_images" ON post_images;
CREATE POLICY "Allow anon insert on post_images"
  ON post_images FOR INSERT TO anon WITH CHECK (true);

-- =========================================
-- 3. 修改 xhs_posts 表：新增图片计数字段
-- =========================================
ALTER TABLE xhs_posts ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- =========================================
-- 4. 创建 Supabase Storage Bucket（需要在控制台手动创建）
-- =========================================
-- Bucket 名称: post-images
-- 公开访问: 是
-- 
-- 或者通过 SQL 创建（需要 service_role 权限）：
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('post-images', 'post-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 5. Storage 策略（需要在 Supabase 控制台配置）
-- =========================================
-- 允许所有人读取:
-- CREATE POLICY "Public Read" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'post-images');
-- 
-- 允许认证用户上传:
-- CREATE POLICY "Auth Upload" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'post-images');

