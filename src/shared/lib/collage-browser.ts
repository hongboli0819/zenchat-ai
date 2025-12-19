/**
 * 图片拼图生成器 - 浏览器版本
 *
 * 使用原生 Canvas API，适用于浏览器环境
 *
 * 功能：
 * - 1张图：直接返回原图（带序号标签）
 * - 2张图：左右拼接
 * - 3张图：四宫格（左上、右上、左下，右下留白）
 * - 4张图：四宫格
 */

// ===== 配置选项 =====
export interface CollageOptions {
  gap?: number; // 图片间隙（白边宽度），默认 10
  labelPadding?: number; // 标签内边距，默认 8
  labelFontSize?: number; // 标签字体大小，默认 28
  labelMargin?: number; // 标签距离图片边缘的距离，默认 12
  maxCellSize?: number; // 四宫格每个格子的最大尺寸，默认 600
  maxTwoImageHeight?: number; // 两张图拼接时的最大高度，默认 800
  backgroundColor?: string; // 背景色，默认 white
}

const DEFAULT_OPTIONS: Required<CollageOptions> = {
  gap: 10,
  labelPadding: 8,
  labelFontSize: 28,
  labelMargin: 12,
  maxCellSize: 600,
  maxTwoImageHeight: 800,
  backgroundColor: "white",
};

// ===== 主函数：从 URL 数组生成拼图 =====

/**
 * 从图片 URL 数组生成拼图
 *
 * @param imageUrls - 图片 URL 数组（1-4张）
 * @param options - 配置选项
 * @returns PNG Blob
 */
export async function generateCollageFromUrls(
  imageUrls: string[],
  options: CollageOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (imageUrls.length === 0) {
    throw new Error("至少需要一张图片");
  }

  if (imageUrls.length > 4) {
    imageUrls = imageUrls.slice(0, 4);
  }

  // 加载所有图片
  const images = await Promise.all(imageUrls.map((url) => loadImage(url)));

  return generateCollageInternal(images, opts);
}

/**
 * 从 HTMLImageElement 数组生成拼图
 */
export async function generateCollageFromImages(
  images: HTMLImageElement[],
  options: CollageOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (images.length === 0) {
    throw new Error("至少需要一张图片");
  }

  if (images.length > 4) {
    images = images.slice(0, 4);
  }

  return generateCollageInternal(images, opts);
}

/**
 * 从 Base64 数组生成拼图（无需网络请求！）
 *
 * @param base64Array - Base64 字符串数组（1-4张）
 * @param options - 配置选项
 * @returns PNG Blob
 */
export async function generateCollageFromBase64(
  base64Array: string[],
  options: CollageOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (base64Array.length === 0) {
    throw new Error("至少需要一张图片");
  }

  if (base64Array.length > 4) {
    base64Array = base64Array.slice(0, 4);
  }

  // 从 Base64 加载图片（本地操作，超快！）
  const images = await Promise.all(base64Array.map((b64) => loadImageFromBase64(b64)));

  return generateCollageInternal(images, opts);
}

// ===== 从 Base64 加载图片（本地，无网络）=====
function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image from base64"));
    // Base64 可以直接作为 src
    img.src = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
  });
}

// ===== 从 URL 加载图片 =====
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // 允许跨域
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ===== 内部实现 =====

function generateCollageInternal(
  images: HTMLImageElement[],
  opts: Required<CollageOptions>
): Promise<Blob> {
  let canvas: HTMLCanvasElement;

  if (images.length === 1) {
    canvas = generateSingleImage(images[0], opts);
  } else if (images.length === 2) {
    canvas = generateTwoImages(images, opts);
  } else {
    canvas = generateGridImages(images, opts);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/png",
      1.0
    );
  });
}

// ===== 生成单张图 =====
function generateSingleImage(
  image: HTMLImageElement,
  opts: Required<CollageOptions>
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // 绘制图片
  ctx.drawImage(image, 0, 0);

  // 绘制标签
  drawLabel(
    ctx,
    "1",
    image.naturalWidth - opts.labelMargin,
    opts.labelMargin,
    opts
  );

  return canvas;
}

// ===== 生成两张图（左右拼接）=====
function generateTwoImages(
  images: HTMLImageElement[],
  opts: Required<CollageOptions>
): HTMLCanvasElement {
  const [img1, img2] = images;

  // 统一高度
  const targetHeight = Math.min(
    img1.naturalHeight,
    img2.naturalHeight,
    opts.maxTwoImageHeight
  );

  // 计算缩放后的宽度
  const width1 = Math.round(
    (img1.naturalWidth / img1.naturalHeight) * targetHeight
  );
  const width2 = Math.round(
    (img2.naturalWidth / img2.naturalHeight) * targetHeight
  );

  const totalWidth = width1 + opts.gap + width2;
  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  // 填充白色背景
  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, totalWidth, targetHeight);

  // 绘制图片1（左侧）
  ctx.drawImage(img1, 0, 0, width1, targetHeight);
  drawLabel(ctx, "1", width1 - opts.labelMargin, opts.labelMargin, opts);

  // 绘制图片2（右侧）
  ctx.drawImage(img2, width1 + opts.gap, 0, width2, targetHeight);
  drawLabel(
    ctx,
    "2",
    width1 + opts.gap + width2 - opts.labelMargin,
    opts.labelMargin,
    opts
  );

  return canvas;
}

// ===== 生成四宫格 =====
function generateGridImages(
  images: HTMLImageElement[],
  opts: Required<CollageOptions>
): HTMLCanvasElement {
  const cellSize = opts.maxCellSize;
  const totalSize = cellSize * 2 + opts.gap;

  const canvas = document.createElement("canvas");
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext("2d")!;

  // 填充白色背景
  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, totalSize, totalSize);

  // 四宫格位置映射
  const positions = [
    { x: 0, y: 0 }, // 左上
    { x: cellSize + opts.gap, y: 0 }, // 右上
    { x: 0, y: cellSize + opts.gap }, // 左下
    { x: cellSize + opts.gap, y: cellSize + opts.gap }, // 右下
  ];

  // 绘制每张图片
  for (let i = 0; i < Math.min(images.length, 4); i++) {
    const pos = positions[i];
    const img = images[i];

    // 使用 cover 模式绘制（居中裁剪）
    drawImageCover(ctx, img, pos.x, pos.y, cellSize, cellSize);

    // 绘制标签
    drawLabel(
      ctx,
      String(i + 1),
      pos.x + cellSize - opts.labelMargin,
      pos.y + opts.labelMargin,
      opts
    );
  }

  return canvas;
}

// ===== 绘制序号标签（黑字白底）=====
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  rightX: number,
  topY: number,
  opts: Required<CollageOptions>
): void {
  const { labelFontSize, labelPadding } = opts;

  // 设置字体
  ctx.font = `bold ${labelFontSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // 测量文字尺寸
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = labelFontSize;

  // 计算标签框尺寸和位置
  const boxWidth = textWidth + labelPadding * 2;
  const boxHeight = textHeight + labelPadding * 2;
  const boxX = rightX - boxWidth;
  const boxY = topY;

  // 绘制白底
  ctx.fillStyle = "white";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  // 绘制边框
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  // 绘制黑字
  ctx.fillStyle = "black";
  ctx.fillText(text, boxX + labelPadding, boxY + labelPadding);
}

// ===== Cover 模式绘制图片（居中裁剪）=====
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = width / height;

  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    // 图片更宽，裁剪左右
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // 图片更高，裁剪上下
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}





