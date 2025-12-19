import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqlwechtvktkhuheoeja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I'
);

async function verify() {
  const { data, error } = await supabase
    .from('xhs_posts')
    .select('id, post_id, title, card_image')
    .limit(3);
  
  if (error) {
    console.log('❌ 错误:', error.message);
  } else {
    console.log('✅ card_image 字段已添加成功！');
    console.log('示例数据:', JSON.stringify(data, null, 2));
  }
}

verify();
