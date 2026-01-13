import { GenerationConfig } from './types';
import axios from 'axios';
import sharp from 'sharp';

const API_BASE_URL = 'https://api.acedata.cloud';
const MODEL = 'nano-banana-pro';  // 使用 Ace Data Cloud 的 Nano Banana Pro 模型

// 获取 API KEY（在运行时读取，而不是模块加载时）
const getApiKey = () => process.env.API_KEY || '';

// 压缩图片并转换为 Base64
const fileToBase64 = async (buffer: Buffer, mimeType: string): Promise<string> => {
  try {
    // 使用 sharp 压缩图片
    // 限制最大尺寸为 1024px，质量 75%（更激进的压缩以避免413错误）
    const compressedBuffer = await sharp(buffer)
      .resize(1024, 1024, {
        fit: 'inside',  // 保持宽高比，不超过1024px
        withoutEnlargement: true  // 不放大小图片
      })
      .jpeg({ quality: 75 })  // 转为JPEG格式，质量75%
      .toBuffer();

    const originalSize = (buffer.length / 1024 / 1024).toFixed(2);
    const compressedSize = (compressedBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`图片压缩: ${originalSize}MB -> ${compressedSize}MB`);

    const base64Data = compressedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Data}`;
  } catch (error) {
    console.error('图片压缩失败，使用原图:', error);
    // 如果压缩失败，使用原图
    const base64Data = buffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }
};

export const generateFashionImage = async (
  garmentFile: { buffer: Buffer; mimetype: string },
  referenceFile: { buffer: Buffer; mimetype: string } | null,
  config: GenerationConfig
): Promise<string> => {
  try {
    console.log('==================开始生成图片==================');
    console.log('配置:', JSON.stringify(config, null, 2));
    console.log('API Base URL:', API_BASE_URL);
    console.log('使用模型:', MODEL);

    // 构建详细的提示词 - 使用编辑模式
    let prompt = `Edit this garment image to create a professional fashion lookbook photo.

TASK:
Create a photorealistic fashion photograph showing a model wearing the garment from the provided image.
The garment must be preserved EXACTLY - same texture, patterns, logos, colors, and cut.

MODEL SPECIFICATIONS:
- Ethnicity: ${config.modelEthnicity}
- Gender: ${config.modelGender}
- Age Group: ${config.ageRange} years old
- Body Type: Professional fashion model proportions

SCENE & ATMOSPHERE:
- Location/Background: ${config.scene}
- Lighting/Style: ${config.style}
- Aspect Ratio: ${config.aspectRatio}
`;

    if (referenceFile) {
      prompt += `
REFERENCE POSE:
Use the second image as a reference for the model's pose and composition.
Apply the garment from the first image onto this pose.
`;
    }

    prompt += `
REQUIREMENTS:
- Maintain exact garment appearance and details
- Natural, realistic skin texture and lighting
- Professional fashion photography quality
- No distorted body parts or faces
- High resolution output

Generate the final fashion photograph.`;

    // 准备图片数组
    const imageUrls: string[] = [];

    // 添加服装图片 (必须是第一张)
    const garmentBase64 = await fileToBase64(garmentFile.buffer, garmentFile.mimetype);
    imageUrls.push(garmentBase64);

    // 如果有参考图，添加参考图
    if (referenceFile) {
      const refBase64 = await fileToBase64(referenceFile.buffer, referenceFile.mimetype);
      imageUrls.push(refBase64);
    }

    console.log('发送请求到 Nano Banana API...');
    console.log('图片数量:', imageUrls.length);
    console.log('API_KEY 存在:', !!getApiKey());

    // 调用 Nano Banana API
    const response = await axios.post(
      `${API_BASE_URL}/nano-banana/images`,
      {
        action: 'edit',  // 使用编辑模式
        model: MODEL,
        prompt: prompt,
        image_urls: imageUrls
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`
        },
        timeout: 180000 // 3分钟超时
      }
    );

    console.log('API 响应状态:', response.status);
    console.log('API 响应结构:', Object.keys(response.data));

    if (!response.data) {
      throw new Error('API 返回了空响应');
    }

    console.log('完整响应:', JSON.stringify(response.data, null, 2).substring(0, 2000));

    // Nano Banana API 响应格式处理
    // 方式1: 检查 data 数组中的图片
    if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      const firstImage = response.data.data[0];

      // 检查是否有 image_url 字段 (Nano Banana API 格式)
      if (firstImage.image_url) {
        console.log('找到图片URL:', firstImage.image_url);
        // 下载并转换为base64
        const imgResponse = await axios.get(firstImage.image_url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(imgResponse.data).toString('base64');
        const mimeType = imgResponse.headers['content-type'] || 'image/png';
        return `data:${mimeType};base64,${base64}`;
      }

      // 检查是否有 url 字段
      if (firstImage.url) {
        console.log('找到图片URL:', firstImage.url);
        // 下载并转换为base64
        const imgResponse = await axios.get(firstImage.url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(imgResponse.data).toString('base64');
        const mimeType = imgResponse.headers['content-type'] || 'image/png';
        return `data:${mimeType};base64,${base64}`;
      }

      // 检查是否有 b64_json 字段
      if (firstImage.b64_json) {
        console.log('找到base64图片');
        return `data:image/png;base64,${firstImage.b64_json}`;
      }
    }

    // 方式2: 检查 image 字段
    if (response.data.image) {
      if (typeof response.data.image === 'string') {
        if (response.data.image.startsWith('data:image')) {
          console.log('找到base64图片 (image字段)');
          return response.data.image;
        }
        if (response.data.image.startsWith('http')) {
          console.log('找到图片URL (image字段)');
          const imgResponse = await axios.get(response.data.image, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(imgResponse.data).toString('base64');
          const mimeType = imgResponse.headers['content-type'] || 'image/png';
          return `data:${mimeType};base64,${base64}`;
        }
      }
    }

    // 方式3: 检查 images 数组
    if (response.data.images && Array.isArray(response.data.images) && response.data.images.length > 0) {
      const imageUrl = response.data.images[0];
      if (typeof imageUrl === 'string') {
        if (imageUrl.startsWith('data:image')) {
          console.log('找到base64图片 (images数组)');
          return imageUrl;
        }
        if (imageUrl.startsWith('http')) {
          console.log('找到图片URL (images数组)');
          const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(imgResponse.data).toString('base64');
          const mimeType = imgResponse.headers['content-type'] || 'image/png';
          return `data:${mimeType};base64,${base64}`;
        }
      }
    }

    // 如果都没找到，抛出错误
    throw new Error(`无法从 API 响应中提取图片。响应结构: ${JSON.stringify(response.data).substring(0, 500)}`);

  } catch (error: any) {
    console.error("==================API 调用错误==================");
    console.error("错误类型:", error.name);
    console.error("错误消息:", error.message);

    if (error.response) {
      console.error("HTTP 状态码:", error.response.status);
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2).substring(0, 1000));
    }

    console.error("==================错误信息结束==================");

    throw new Error(`生成图片失败: ${error.message}`);
  }
};
