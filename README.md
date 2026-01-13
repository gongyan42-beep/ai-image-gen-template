# AI 图片生成网站部署模板

这是一个基于 Nano Banana API 的 AI 图片生成网站通用模板,已经优化好图片压缩和所有配置。

## 项目特点

- ✅ 自动图片压缩 (1024px, 75%质量)
- ✅ TypeScript + Node.js + Express
- ✅ 支持文件上传和参数配置
- ✅ 完整的错误处理
- ✅ 宝塔面板部署配置
- ✅ 避免 413 错误的优化

## 快速部署新项目

### 1. 创建新项目
```bash
# 复制模板到新项目目录
cp -r ai-image-gen-template/ <新项目名>
cd <新项目名>

# 安装依赖
npm install
```

### 2. 配置环境变量
```bash
# 创建 .env 文件
cat > .env << EOF
API_KEY=<你的Nano Banana API密钥>
PORT=<端口号,如3013>
EOF
```

### 3. 修改项目信息
修改以下文件中的项目特定信息:

**package.json:**
```json
{
  "name": "<新项目名>",
  "description": "<项目描述>"
}
```

**public/index.html:**
- 标题 (line 6): 改成你的项目名称
- 页面标题 h1 (line 215): 改成你的品牌名
- 副标题 (line 216): 改成你的项目描述

**src/gemini.ts:**
- prompt 模板 (line 24-62): 根据你的具体需求修改 AI 提示词
- 可以修改图片生成的具体要求和风格

### 4. 本地测试
```bash
# 构建
npm run build

# 运行
npm start

# 访问
open http://localhost:<PORT>
```

### 5. 部署到服务器

#### 方式一: 使用部署脚本 (推荐)
```bash
# 使用模板中的部署脚本
./deploy.sh <域名> <端口号>

# 例如:
./deploy.sh newproject.example.com 3013
```

#### 方式二: 手动部署
```bash
# 1. 上传文件到服务器
scp -r . root@<服务器IP>:/www/wwwroot/<域名>/

# 2. 登录服务器
ssh root@<服务器IP>

# 3. 安装依赖并启动
cd /www/wwwroot/<域名>
npm install
npm run build
killall node  # 停止旧进程
nohup node dist/server.js > /tmp/<项目名>.log 2>&1 &
```

### 6. 配置 Nginx (宝塔面板)

在宝塔面板添加站点后,修改 Nginx 配置:

```nginx
location / {
    proxy_pass http://127.0.0.1:<PORT>;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;

    # 增加超时和文件大小限制
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    client_max_body_size 20M;
}
```

## 项目结构

```
.
├── src/
│   ├── server.ts        # Express 服务器主文件
│   ├── gemini.ts        # Nano Banana API 调用 (修改这里的 prompt)
│   └── types.ts         # TypeScript 类型定义
├── public/
│   └── index.html       # 前端页面 (修改品牌和UI)
├── dist/                # 构建输出目录
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
├── .env                 # 环境变量 (不要提交到 git)
└── README.md            # 本文档
```

## 自定义项目

### 修改 AI 提示词
编辑 `src/gemini.ts` 的 `generateFashionImage` 函数中的 prompt 模板:

```typescript
let prompt = `你的自定义提示词...

根据你的具体需求修改:
- 生成的内容类型
- 风格要求
- 质量标准
- 特殊要求
`;
```

### 修改前端界面
编辑 `public/index.html`:
- 修改品牌名称和标题
- 调整配置选项
- 修改样式和颜色
- 添加或删除配置项

### 修改服务器配置
编辑 `src/server.ts`:
- 调整文件上传限制
- 修改端口号
- 添加新的 API 路由

## 常见问题

### 413 Payload Too Large 错误
- ✅ 模板已经包含自动压缩功能
- 如果还有问题,在 `src/gemini.ts` 中降低压缩参数:
  ```typescript
  .resize(800, 800)  // 降低到 800px
  .jpeg({ quality: 60 })  // 降低质量到 60%
  ```

### 服务器端口被占用
```bash
# 查看端口占用
lsof -i :<PORT>

# 杀死进程
kill -9 <PID>

# 或杀死所有 node 进程
killall node
```

### 查看服务器日志
```bash
# 查看最新日志
tail -f /tmp/<项目名>.log

# 查看完整日志
cat /tmp/<项目名>.log
```

## API 配置

当前使用 Ace Data Cloud 的 Nano Banana API:
- API Base URL: `https://api.acedata.cloud`
- Model: `nano-banana-pro`
- 需要在 .env 中配置 API_KEY

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **图片处理**: Sharp (自动压缩)
- **文件上传**: Multer
- **AI API**: Nano Banana API (Ace Data Cloud)
- **部署**: 宝塔面板 + Nginx

## 更新日志

### v1.0.0 (2024-12-10)
- ✅ 初始模板创建
- ✅ 图片自动压缩 (1024px, 75%)
- ✅ 完整的部署流程
- ✅ Nano Banana API 集成
