/**
 * 生成示例卡片图片
 * 使用 Puppeteer 将 HTML 卡片渲染为 PNG
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 示例数据（模拟真实帖子）
const exampleData = {
  coverImage: 'https://sns-webpic-qc.xhscdn.com/202506091447/a8a2e8f8e8e8e8e8e8e8e8e8e8e8e8e8/1040g00831gu1234567890!nd_dft_wlteh_webp_3.jpg',
  title: '上海转租（燃气小户型）一房一厅 2500!',
  avatar: 'https://sns-avatar-qc.xhscdn.com/avatar/1040g2jo31gu1234567890.jpg',
  username: 'CC沪相寓',
  likes: '1千+'
};

// 生成卡片 HTML
function generateCardHTML(data) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
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
      <img src="${data.coverImage}" alt="封面图" crossorigin="anonymous">
    </div>
    <div class="xhs-card-content">
      <h3 class="xhs-card-title">${data.title}</h3>
      <div class="xhs-card-user">
        <div class="xhs-card-user-info">
          <div class="xhs-card-avatar">
            <img src="${data.avatar}" alt="头像" crossorigin="anonymous">
          </div>
          <span class="xhs-card-username">${data.username}</span>
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

async function generateCardImage() {
  console.log('🎨 正在生成示例卡片图片...\n');

  // 使用本地图片作为示例（避免网络图片加载问题）
  const localExampleData = {
    coverImage: 'https://picsum.photos/280/373', // 3:4 比例
    title: '上海转租（燃气小户型）一房一厅 2500!',
    avatar: 'https://picsum.photos/100/100',
    username: 'CC沪相寓',
    likes: '1千+'
  };

  const html = generateCardHTML(localExampleData);

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 设置视口
  await page.setViewport({ width: 400, height: 600, deviceScaleFactor: 2 });

  // 加载 HTML
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // 等待图片加载
  await page.waitForSelector('.xhs-card-cover img');
  await new Promise(resolve => setTimeout(resolve, 1000)); // 额外等待确保图片加载

  // 获取卡片元素
  const cardElement = await page.$('.xhs-card');

  // 截图
  const outputPath = join(__dirname, '../public/card_image_example.png');
  await cardElement.screenshot({
    path: outputPath,
    type: 'png',
    omitBackground: true
  });

  await browser.close();

  console.log('✅ 卡片图片已生成！');
  console.log(`📍 位置: public/card_image_example.png\n`);
  console.log('示例数据:');
  console.log('  - 封面图: picsum.photos 随机图片');
  console.log('  - 标题:', localExampleData.title);
  console.log('  - 用户:', localExampleData.username);
  console.log('  - 点赞:', localExampleData.likes);
}

generateCardImage().catch(console.error);


