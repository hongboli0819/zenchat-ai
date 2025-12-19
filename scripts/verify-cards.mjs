import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqlwechtvktkhuheoeja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I'
);

async function verify() {
  const { data, count } = await supabase
    .from('xhs_posts')
    .select('post_id, title, card_image', { count: 'exact' })
    .not('card_image', 'is', null)
    .limit(3);
  
  console.log('✅ 已生成卡片图片的帖子数量:', count);
  console.log('\n示例:');
  data.forEach((d, i) => {
    console.log(`${i+1}. ${d.title?.slice(0, 30)}...`);
    console.log(`   ${d.card_image}\n`);
  });
}

verify();
