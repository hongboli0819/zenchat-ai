/**
 * 图片格式转换
 * 使用 Canvas API 将任意格式图片转换为 PNG Base64
 */

/**
 * 根据文件名获取 MIME 类型
 */
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
  };
  return mimeTypes[ext] || "image/png";
}

/**
 * 将任意格式图片转换为 PNG Base64
 * 使用 Canvas API
 */
export async function convertToPngBase64(
  imageData: Uint8Array,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. 创建 Blob URL
    const mimeType = getMimeType(fileName);
    const blob = new Blob([imageData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // 2. 创建 Image 对象
    const img = new Image();

    img.onload = () => {
      try {
        // 3. 创建 Canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // 4. 获取 2D 上下文并绘制图片
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("无法创建 Canvas 上下文"));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0);

        // 5. 转换为 PNG Base64
        const base64 = canvas.toDataURL("image/png");

        // 6. 清理资源
        URL.revokeObjectURL(url);

        resolve(base64);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法加载图片: ${fileName}, 错误: ${event}`));
    };

    // 设置跨域属性（对于某些情况可能需要）
    img.crossOrigin = "anonymous";

    // 开始加载图片
    img.src = url;
  });
}

/**
 * 批量转换图片
 */
export async function convertImagesToPngBase64(
  images: { name: string; data: Uint8Array }[],
  onProgress?: (current: number, total: number) => void
): Promise<{ name: string; base64: string }[]> {
  const results: { name: string; base64: string }[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress?.(i + 1, images.length);

    try {
      const base64 = await convertToPngBase64(img.data, img.name);
      results.push({ name: img.name, base64 });
    } catch (err) {
      console.error(`转换图片失败: ${img.name}`, err);
      // 继续处理其他图片，不中断
    }
  }

  return results;
}


