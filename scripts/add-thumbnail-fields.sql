-- =============================================
-- 为图片表添加缩略图字段
-- 执行方式：在 Supabase SQL Editor 中运行
-- =============================================

-- 1. post_images 表新增缩略图字段
ALTER TABLE post_images 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

-- 2. xhs_posts 表新增卡片和拼图的缩略图字段
ALTER TABLE xhs_posts 
ADD COLUMN IF NOT EXISTS card_image_thumbnail TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS merge_image_thumbnail TEXT DEFAULT NULL;

-- 3. 添加索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_post_images_thumbnail_null 
ON post_images (id) 
WHERE thumbnail_url IS NULL;

-- 验证字段已添加
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'post_images' AND column_name = 'thumbnail_url';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'xhs_posts' AND column_name IN ('card_image_thumbnail', 'merge_image_thumbnail');

