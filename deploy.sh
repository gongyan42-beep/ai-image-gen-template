#!/bin/bash

# AI 图片生成网站一键部署脚本
# 使用方法: ./deploy.sh <域名> <端口号> [服务器IP] [SSH密钥路径]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -lt 2 ]; then
    echo -e "${RED}使用方法: $0 <域名> <端口号> [服务器IP] [SSH密钥路径]${NC}"
    echo "例如: $0 newproject.example.com 3013 118.25.13.91 ~/.ssh/id_rsa"
    exit 1
fi

DOMAIN=$1
PORT=$2
SERVER_IP=${3:-"118.25.13.91"}  # 默认服务器IP
SSH_KEY=${4:-"/Users/gusuping/ssh_key_temp"}  # 默认SSH密钥路径

PROJECT_NAME=$(basename $DOMAIN .longgonghuohuo.com)
REMOTE_DIR="/www/wwwroot/$DOMAIN"

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}开始部署 AI 图片生成网站${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "域名: ${YELLOW}$DOMAIN${NC}"
echo -e "端口: ${YELLOW}$PORT${NC}"
echo -e "服务器: ${YELLOW}$SERVER_IP${NC}"
echo ""

# 1. 检查 .env 文件
echo -e "${YELLOW}[1/7]${NC} 检查 .env 文件..."
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: .env 文件不存在!${NC}"
    echo "请创建 .env 文件并配置 API_KEY 和 PORT"
    exit 1
fi

# 更新 .env 中的端口号
sed -i.bak "s/^PORT=.*/PORT=$PORT/" .env
echo -e "${GREEN}✓${NC} .env 文件检查完成"

# 2. 本地构建
echo -e "${YELLOW}[2/7]${NC} 执行本地构建..."
npm run build
echo -e "${GREEN}✓${NC} 构建完成"

# 3. 创建服务器目录
echo -e "${YELLOW}[3/7]${NC} 创建服务器目录..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP "mkdir -p $REMOTE_DIR"
echo -e "${GREEN}✓${NC} 服务器目录已创建"

# 4. 上传文件
echo -e "${YELLOW}[4/7]${NC} 上传文件到服务器..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no -r \
    dist/ src/ public/ package.json tsconfig.json .env \
    root@$SERVER_IP:$REMOTE_DIR/
echo -e "${GREEN}✓${NC} 文件上传完成"

# 5. 安装依赖
echo -e "${YELLOW}[5/7]${NC} 在服务器上安装依赖..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP \
    "cd $REMOTE_DIR && npm install --production"
echo -e "${GREEN}✓${NC} 依赖安装完成"

# 6. 停止旧进程并启动新服务
echo -e "${YELLOW}[6/7]${NC} 启动服务..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP << EOF
    # 查找并杀死占用端口的进程
    PID=\$(lsof -ti:$PORT || true)
    if [ ! -z "\$PID" ]; then
        echo "停止端口 $PORT 上的旧进程..."
        kill -9 \$PID || true
    fi

    # 启动新服务
    cd $REMOTE_DIR
    nohup node dist/server.js > /tmp/${PROJECT_NAME}.log 2>&1 &

    # 等待服务启动
    sleep 3

    # 检查服务是否启动成功
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "服务启动成功!"
    else
        echo "警告: 服务可能未正常启动,请检查日志"
    fi
EOF
echo -e "${GREEN}✓${NC} 服务已启动"

# 7. 显示 Nginx 配置提示
echo -e "${YELLOW}[7/7]${NC} Nginx 配置提示"
echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}部署完成!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "访问地址: ${YELLOW}https://$DOMAIN${NC}"
echo -e "健康检查: ${YELLOW}http://$DOMAIN/health${NC}"
echo -e "日志路径: ${YELLOW}/tmp/${PROJECT_NAME}.log${NC}"
echo ""
echo -e "${YELLOW}请在宝塔面板添加网站并配置 Nginx:${NC}"
echo ""
echo "location / {"
echo "    proxy_pass http://127.0.0.1:$PORT;"
echo "    proxy_http_version 1.1;"
echo "    proxy_set_header Upgrade \$http_upgrade;"
echo "    proxy_set_header Connection 'upgrade';"
echo "    proxy_set_header Host \$host;"
echo "    proxy_set_header X-Real-IP \$remote_addr;"
echo "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "    proxy_cache_bypass \$http_upgrade;"
echo ""
echo "    proxy_connect_timeout 600;"
echo "    proxy_send_timeout 600;"
echo "    proxy_read_timeout 600;"
echo "    client_max_body_size 20M;"
echo "}"
echo ""
echo -e "${YELLOW}查看服务器日志:${NC}"
echo "ssh -i $SSH_KEY root@$SERVER_IP 'tail -f /tmp/${PROJECT_NAME}.log'"
echo ""
echo -e "${GREEN}===========================================${NC}"
