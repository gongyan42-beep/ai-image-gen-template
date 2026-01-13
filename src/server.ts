import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { generateFashionImage } from './gemini';
import { GenerationConfig } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// 配置 multer 用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 根路由 - 返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API 路由 - 生成图片
app.post('/api/generate', upload.fields([
  { name: 'garment', maxCount: 1 },
  { name: 'reference', maxCount: 1 }
]), async (req, res) => {
  console.log('==================收到生成请求==================');
  console.log('时间:', new Date().toISOString());
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log('上传的文件:', Object.keys(files || {}));

    if (!files.garment || files.garment.length === 0) {
      return res.status(400).json({ error: '请上传服装图片' });
    }

    const garmentFile = {
      buffer: files.garment[0].buffer,
      mimetype: files.garment[0].mimetype
    };

    const referenceFile = files.reference && files.reference.length > 0
      ? {
          buffer: files.reference[0].buffer,
          mimetype: files.reference[0].mimetype
        }
      : null;

    const config: GenerationConfig = {
      modelEthnicity: req.body.modelEthnicity || 'Asian',
      modelGender: req.body.modelGender || 'Female',
      ageRange: req.body.ageRange || '20-30',
      scene: req.body.scene || 'Studio with neutral background',
      style: req.body.style || 'Professional fashion photography lighting',
      aspectRatio: req.body.aspectRatio || '1:1'
    };

    const resultImage = await generateFashionImage(garmentFile, referenceFile, config);

    res.json({
      success: true,
      image: resultImage
    });

  } catch (error: any) {
    console.error('生成图片失败:', error);
    res.status(500).json({
      error: '生成图片失败',
      message: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
});
