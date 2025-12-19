/**
 * 设置 card_image 相关数据库字段和 Storage 桶
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqlwechtvktkhuheoeja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I'
);

async function setup() {
  console.log('🚀 设置 card_image 相关配置...\n');

  // 1. 添加 card_image 字段到 xhs_posts 表
  console.log('1️⃣ 添加 card_image 字段...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE xhs_posts 
      ADD COLUMN IF NOT EXISTS card_image TEXT;
      
      COMMENT ON COLUMN xhs_posts.card_image IS '小红书卡片图片 URL';
    `
  });

  if (alterError) {
    // 尝试直接用 SQL
    console.log('   尝试直接执行 SQL...');
    
    // 检查字段是否已存在
    const { data: columns } = await supabase
      .from('xhs_posts')
      .select('card_image')
      .limit(1);
    
    if (columns !== null) {
      console.log('   ✅ card_image 字段已存在');
    } else {
      console.log('   ⚠️ 请手动执行以下 SQL:');
      console.log('   ALTER TABLE xhs_posts ADD COLUMN IF NOT EXISTS card_image TEXT;');
    }
  } else {
    console.log('   ✅ card_image 字段添加成功');
  }

  // 2. 检查/创建 Storage 桶
  console.log('\n2️⃣ 检查 post-cards Storage 桶...');
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'post-cards');
  
  if (bucketExists) {
    console.log('   ✅ post-cards 桶已存在');
  } else {
    const { error: bucketError } = await supabase.storage.createBucket('post-cards', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    
    if (bucketError) {
      console.log('   ❌ 创建桶失败:', bucketError.message);
    } else {
      console.log('   ✅ post-cards 桶创建成功');
    }
  }

  // 3. 检查有多少帖子需要生成卡片
  console.log('\n3️⃣ 统计需要处理的帖子...');
  
  const { count: totalWithImages } = await supabase
    .from('xhs_posts')
    .select('*', { count: 'exact', head: true })
    .gt('image_count', 0);
  
  const { count: alreadyHasCard } = await supabase
    .from('xhs_posts')
    .select('*', { count: 'exact', head: true })
    .gt('image_count', 0)
    .not('card_image', 'is', null);
  
  console.log(`   📊 有图片的帖子: ${totalWithImages || 0} 条`);
  console.log(`   📊 已有卡片图片: ${alreadyHasCard || 0} 条`);
  console.log(`   📊 需要生成: ${(totalWithImages || 0) - (alreadyHasCard || 0)} 条`);

  console.log('\n✅ 设置完成！');
}

setup().catch(console.error);
