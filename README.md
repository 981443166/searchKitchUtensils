# 厨具搜索网站

一个基于 Node.js + Express + SQLite + Tailwind CSS 的厨具搜索网站，支持前台分类浏览、搜索查询，以及后台管理员鉴权、物品/分类增删改查等功能。

## 功能特点

- **前台功能**：
  - 首页推荐物品展示
  - 分类浏览
  - 物品列表
  - 物品详情
  - 搜索功能

- **后台功能**：
  - 管理员登录（密码加密 + JWT 认证）
  - 物品管理（增删改查）
  - 分类管理（增删改查）

- **技术栈**：
  - Node.js + Express
  - SQLite 数据库
  - Tailwind CSS
  - JWT 认证
  - Handlebars 模板引擎

## 快速开始

### 1. 克隆项目

```bash
git clone <仓库地址>
cd searchKitchUtensils
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务器

```bash
node index.js
```

服务器将在 http://localhost:3000 上运行。

### 4. 访问网站

- 前台：http://localhost:3000
- 后台：http://localhost:3000/login

默认管理员账号：admin
默认管理员密码：admin123

## 数据库结构

### categories 表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL UNIQUE
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### items 表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- description: TEXT
- price: REAL
- category_id: INTEGER
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### admins 表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- username: TEXT NOT NULL UNIQUE
- password: TEXT NOT NULL
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 部署到阿里云服务器

### 1. 准备工作

- 阿里云服务器（ECS）
- Node.js 环境
- Git

### 2. 部署步骤

1. **登录服务器**
   ```bash
   ssh root@服务器IP
   ```

2. **安装 Node.js**
   ```bash
   # 安装 Node.js 16
   curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
   apt-get install -y nodejs
   ```

3. **克隆项目**
   ```bash
   git clone <仓库地址>
   cd searchKitchUtensils
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **启动服务器**
   ```bash
   # 使用 PM2 管理进程
   npm install -g pm2
   pm2 start index.js --name "kitchen-utensils"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

6. **配置防火墙**
   ```bash
   # 开放 3000 端口
   firewall-cmd --zone=public --add-port=3000/tcp --permanent
   firewall-cmd --reload
   ```

7. **访问网站**
   在浏览器中访问 http://服务器IP:3000

## 项目结构

```
searchKitchUtensils/
├── src/
│   ├── controllers/         # 控制器
│   │   ├── itemController.js
│   │   ├── categoryController.js
│   │   └── authController.js
│   ├── models/              # 数据模型
│   │   └── db.js
│   ├── routes/              # 路由
│   │   └── index.js
│   └── middleware/          # 中间件
├── views/                   # 模板文件
│   ├── layouts/
│   │   └── main.handlebars
│   ├── items/
│   ├── categories/
│   └── admin/
├── public/                  # 静态文件
├── database.db              # SQLite 数据库
├── index.js                 # 主入口文件
├── package.json
├── .gitignore
├── deploy.sh
└── README.md
```

## 注意事项

- 本项目使用 SQLite 数据库，适合小到中等规模的数据量（5000 条数据量级）。
- 生产环境建议使用 PM2 或其他进程管理工具来管理服务器进程。
- 建议在生产环境中修改默认的 JWT 密钥。
- 建议在生产环境中修改默认的管理员密码。
