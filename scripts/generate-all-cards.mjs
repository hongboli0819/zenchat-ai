/**
 * 批量生成所有帖子的卡片图片 - 优化版
 * 
 * 优化点：
 * 1. 使用 Base64 嵌入图片，避免网络加载超时
 * 2. 添加重试机制（最多3次）
 * 3. 并行处理（3个同时）
 * 4. 更短的超时时间
 * 5. 失败记录和统计
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

// Supabase 配置
const supabase = createClient(
  'https://qqlwechtvktkhuheoeja.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I'
);

// 配置
const CONFIG = {
  MAX_RETRIES: 3,
  CONCURRENCY: 3,
  PAGE_TIMEOUT: 10000,
  IMAGE_FETCH_TIMEOUT: 15000,
};

// 下载图片并转为 Base64（修复连接池问题）
async function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    let req = null;
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (req) req.destroy();
        reject(new Error('图片下载超时'));
      }
    }, CONFIG.IMAGE_FETCH_TIMEOUT);

    const protocol = url.startsWith('https') ? https : http;
    
    // 关键修复：agent: false 禁用连接池，避免连接被复用导致卡死
    req = protocol.get(url, { agent: false }, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        clearTimeout(timeout);
        response.destroy(); // 关闭当前连接
        fetchImageAsBase64(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        clearTimeout(timeout);
        resolved = true;
        response.destroy();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const buffer = Buffer.concat(chunks);
          const contentType = response.headers['content-type'] || 'image/png';
          const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
          resolve(base64);
        }
      });
      response.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(err);
        }
      });
    });
    
    req.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

// 生成占位图 Base64（当图片加载失败时使用）
function getPlaceholderImage() {
  // 简单的灰色占位图
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM3MyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjgwIiBoZWlnaHQ9IjM3MyIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE0Ij7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
}

function getPlaceholderAvatar() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjI0Ij7wn5GkPC90ZXh0Pjwvc3ZnPg==';
}

// 生成卡片 HTML（使用 Base64 图片）
function generateCardHTML(data) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background: transparent;
    }
    .xhs-card {
      width: 280px;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
    .xhs-card-cover {
      width: 100%;
      overflow: hidden;
      background: #f5f5f5;
    }
    .xhs-card-cover img {
      width: 100%;
      height: auto;
      display: block;
    }
    .xhs-card-content {
      padding: 12px;
    }
    .xhs-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 10px;
      min-height: 40px;
    }
    .xhs-card-user {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .xhs-card-user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }
    .xhs-card-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      background: #f0f0f0;
    }
    .xhs-card-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .xhs-card-username {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .xhs-card-likes {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 12px;
      flex-shrink: 0;
    }
    .xhs-card-likes svg {
      width: 16px;
      height: 16px;
    }
  </style>
</head>
<body>
  <div class="xhs-card">
    <div class="xhs-card-cover">
      <img src="${data.coverImageBase64}" alt="封面图">
    </div>
    <div class="xhs-card-content">
      <h3 class="xhs-card-title">${escapeHtml(data.title)}</h3>
      <div class="xhs-card-user">
        <div class="xhs-card-user-info">
          <div class="xhs-card-avatar">
            <img src="${data.avatarBase64}" alt="头像">
          </div>
          <span class="xhs-card-username">${escapeHtml(data.username)}</span>
        </div>
        <div class="xhs-card-likes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>${data.likes}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

// HTML 转义
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 格式化点赞数
function formatLikes(likes) {
  if (!likes || likes === 0) return '0';
  if (likes >= 10000) return (likes / 10000).toFixed(1) + '万';
  if (likes >= 1000) return (likes / 1000).toFixed(1) + '千';
  return likes.toString();
}

// 单个卡片生成（带重试）- 每次创建新页面避免复用问题
async function generateSingleCard(browser, post, firstImage, retryCount = 0) {
  const account = post.xhs_accounts;
  let page = null;
  const postId = post.post_id;
  
  try {
    // 1. 预先下载图片转为 Base64
    let coverImageBase64, avatarBase64;
    
    try {
      coverImageBase64 = await fetchImageAsBase64(firstImage.storage_url);
    } catch (e) {
      console.log(`   [${postId}] 封面图失败，用占位图`);
      coverImageBase64 = getPlaceholderImage();
    }
    
    try {
      avatarBase64 = account?.avatar 
        ? await fetchImageAsBase64(account.avatar)
        : getPlaceholderAvatar();
    } catch (e) {
      avatarBase64 = getPlaceholderAvatar();
    }

    const cardData = {
      coverImageBase64,
      avatarBase64,
      title: post.title || '无标题',
      username: account?.nickname || '未知用户',
      likes: formatLikes(post.likes)
    };

    // 2. 创建新页面（避免复用问题）
    page = await browser.newPage();
    await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 2 });

    // 3. 生成 HTML 并渲染
    const html = generateCardHTML(cardData);
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.PAGE_TIMEOUT 
    });
    
    // 短暂等待渲染完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. 截图
    const cardElement = await page.$('.xhs-card');
    const imageBuffer = await cardElement.screenshot({
      type: 'png',
      omitBackground: true
    });

    // 5. 关闭页面释放资源
    await page.close();
    page = null;

    // 6. 上传到 Storage
    const fileName = `${post.post_id}.png`;
    const { error: uploadError } = await supabase.storage
      .from('post-cards')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`上传失败: ${uploadError.message}`);
    }

    // 7. 获取公开 URL 并更新数据库
    const { data: publicUrl } = supabase.storage
      .from('post-cards')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('xhs_posts')
      .update({ card_image: publicUrl.publicUrl })
      .eq('id', post.id);

    if (updateError) {
      throw new Error(`更新数据库失败: ${updateError.message}`);
    }

    return { success: true };

  } catch (error) {
    // 确保关闭页面
    if (page) {
      try { await page.close(); } catch (e) {}
    }
    
    if (retryCount < CONFIG.MAX_RETRIES - 1) {
      console.log(`   🔄 重试 ${retryCount + 2}/${CONFIG.MAX_RETRIES}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateSingleCard(browser, post, firstImage, retryCount + 1);
    }
    return { success: false, error: error.message };
  }
}

// 主函数
async function generateAllCards() {
  console.log('🚀 开始批量生成卡片图片（优化版）...\n');
  console.log(`📋 配置: 并发=${CONFIG.CONCURRENCY}, 重试=${CONFIG.MAX_RETRIES}次\n`);

  // 1. 获取需要处理的帖子
  console.log('1️⃣ 获取需要处理的帖子...');
  
  const { data: posts, error: postsError } = await supabase
    .from('xhs_posts')
    .select(`
      id,
      post_id,
      title,
      likes,
      card_image,
      xhs_accounts (
        nickname,
        avatar
      )
    `)
    .gt('image_count', 0)
    .is('card_image', null)
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('❌ 获取帖子失败:', postsError.message);
    return;
  }

  // 获取所有帖子的首图
  const postIds = posts.map(p => p.id);
  const { data: allFirstImages } = await supabase
    .from('post_images')
    .select('post_id, storage_url')
    .in('post_id', postIds)
    .eq('image_order', 1);

  // 创建首图映射
  const firstImageMap = new Map();
  allFirstImages?.forEach(img => {
    firstImageMap.set(img.post_id, img);
  });

  // 过滤掉没有首图的帖子
  const postsWithImages = posts.filter(p => firstImageMap.has(p.id));

  console.log(`   📊 找到 ${posts.length} 个需要处理的帖子`);
  console.log(`   📷 其中 ${postsWithImages.length} 个有首图\n`);

  if (postsWithImages.length === 0) {
    console.log('✅ 没有需要处理的帖子！');
    return;
  }

  // 2. 启动浏览器
  console.log('2️⃣ 启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  console.log(`   ✅ 浏览器已启动（每次创建新页面）\n`);

  // 3. 批量处理
  console.log('3️⃣ 开始生成卡片...\n');
  
  let successCount = 0;
  let failCount = 0;
  const failedPosts = [];
  const startTime = Date.now();

  // 分批处理（并行）
  for (let i = 0; i < postsWithImages.length; i += CONFIG.CONCURRENCY) {
    const batch = postsWithImages.slice(i, i + CONFIG.CONCURRENCY);
    
    const results = await Promise.all(
      batch.map(async (post, idx) => {
        const progress = `[${i + idx + 1}/${postsWithImages.length}]`;
        const firstImage = firstImageMap.get(post.id);
        
        // 传入 browser 而不是 page
        const result = await generateSingleCard(browser, post, firstImage);
        
        if (result.success) {
          console.log(`${progress} ✅ ${post.post_id} - ${post.title?.slice(0, 20) || '无标题'}...`);
          return { success: true };
        } else {
          console.log(`${progress} ❌ ${post.post_id} - ${result.error}`);
          return { success: false, post, error: result.error };
        }
      })
    );

    results.forEach(r => {
      if (r.success) {
        successCount++;
      } else {
        failCount++;
        if (r.post) failedPosts.push({ postId: r.post.post_id, error: r.error });
      }
    });

    // 显示进度
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTime = (elapsed / (i + batch.length)).toFixed(2);
    console.log(`   ⏱️ 已用时 ${elapsed}s，平均 ${avgTime}s/个\n`);
  }

  // 4. 关闭浏览器
  await browser.close();

  // 5. 输出统计
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 处理完成！');
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  console.log(`   ⏱️ 总用时: ${totalTime}s`);
  console.log('='.repeat(50));

  if (failedPosts.length > 0) {
    console.log('\n❌ 失败的帖子:');
    failedPosts.forEach(f => {
      console.log(`   - ${f.postId}: ${f.error}`);
    });
  }
}

generateAllCards().catch(console.error);
