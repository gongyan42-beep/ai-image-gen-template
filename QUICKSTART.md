# 快速开始指南

## 5分钟快速部署新项目

### 1. 复制模板
```bash
cp -r ~/ai-image-gen-template/ ~/my-new-project
cd ~/my-new-project
```

### 2. 配置API KEY
```bash
cp .env.example .env
# 编辑 .env 文件,填入你的 API_KEY 和 PORT
nano .env
```

### 3. 自定义项目

#### 修改品牌信息 (必须)
`public/index.html`:
- Line 6: 修改网站标题
- Line 215: 修改品牌名 (如: "正心AI" → "你的品牌")
- Line 216: 修改副标题

#### 修改AI提示词 (按需)
`src/gemini.ts`:
- Line 24-62: 修改 prompt 模板,自定义AI生成内容

### 4. 一键部署
```bash
./deploy.sh <域名> <端口号>

# 例如:
./deploy.sh myproject.longgonghuohuo.com 3013
```

### 5. 配置Nginx
部署脚本会输出 Nginx 配置,复制到宝塔面板即可。

---

## 完整自定义选项

### A. 修改UI样式
`public/index.html`:
- Line 16-180: CSS 样式
- Line 236-311: 配置选项表单
- 可以添加/删除配置项,修改颜色主题

### B. 修改服务器逻辑
`src/server.ts`:
- Line 12: 修改默认端口
- Line 16-19: 修改文件上传限制
- Line 31-80: API 路由处理逻辑

### C. 修改图片压缩
`src/gemini.ts`:
- Line 17-18: 修改压缩尺寸 (1024px)
- Line 21: 修改压缩质量 (75%)

### D. 添加新配置参数
1. 在 `src/types.ts` 添加类型
2. 在 `src/server.ts` 接收参数
3. 在 `src/gemini.ts` 使用参数
4. 在 `public/index.html` 添加表单

---

## 常用命令

```bash
# 本地开发
npm install
npm run build
npm start

# 查看服务器日志
ssh root@<服务器IP> 'tail -f /tmp/<项目名>.log'

# 重启服务
ssh root@<服务器IP> 'killall node && cd /www/wwwroot/<域名> && nohup node dist/server.js > /tmp/<项目名>.log 2>&1 &'

# 更新代码
npm run build && scp -r dist/ root@<服务器IP>:/www/wwwroot/<域名>/
```

---

## 项目清单

- [ ] 复制模板到新目录
- [ ] 配置 .env (API_KEY, PORT)
- [ ] 修改品牌名称 (index.html)
- [ ] 自定义 AI 提示词 (gemini.ts)
- [ ] 执行部署脚本
- [ ] 配置 Nginx
- [ ] 测试网站功能
- [ ] 配置 SSL 证书

---

## 故障排查

### 服务无法启动
```bash
# 检查端口是否被占用
lsof -i:<PORT>
# 杀死占用进程
kill -9 <PID>
```

### 413 错误
降低压缩参数 (`src/gemini.ts`):
```typescript
.resize(800, 800)
.jpeg({ quality: 60 })
```

### API 调用失败
检查 API_KEY 是否正确配置:
```bash
ssh root@<服务器IP> 'cd /www/wwwroot/<域名> && cat .env'
```
