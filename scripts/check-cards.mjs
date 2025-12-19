import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqlwechtvktkhuheoeja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I'
);

async function check() {
  console.log('📊 检查卡片生成状态...\n');

  // 1. 有图片的帖子总数
  const { count: totalWithImages } = await supabase
    .from('xhs_posts')
    .select('*', { count: 'exact', head: true })
    .gt('image_count', 0);

  // 2. 有卡片的帖子数
  const { count: hasCard } = await supabase
    .from('xhs_posts')
    .select('*', { count: 'exact', head: true })
    .gt('image_count', 0)
    .not('card_image', 'is', null);

  // 3. 没有卡片的帖子
  const { data: missingCards, count: missingCount } = await supabase
    .from('xhs_posts')
    .select('id, post_id, title', { count: 'exact' })
    .gt('image_count', 0)
    .is('card_image', null)
    .limit(10);

  console.log('='.repeat(50));
  console.log(`📷 有图片的帖子总数: ${totalWithImages}`);
  console.log(`🎴 已有卡片的帖子: ${hasCard}`);
  console.log(`❌ 缺少卡片的帖子: ${missingCount}`);
  console.log('='.repeat(50));

  if (missingCount > 0) {
    console.log('\n缺少卡片的帖子（前10个）:');
    missingCards.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.post_id} - ${p.title?.slice(0, 30) || '无标题'}...`);
    });
  } else {
    console.log('\n✅ 所有符合条件的帖子都已有卡片！');
  }
}

check();
