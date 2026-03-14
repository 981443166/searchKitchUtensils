#!/bin/bash

# 部署脚本

echo "开始部署项目..."

# 安装依赖
echo "安装依赖..."
npm install

# 启动服务器
echo "启动服务器..."
node index.js

echo "部署完成！"
