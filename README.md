# HJJ 义齿加工订单管理系统

义齿加工订单管理系统，专为口腔义齿加工企业设计，实现订单全流程可视化管理。

## 项目介绍

本系统是一个面向义齿加工企业的订单管理平台，支持从订单接收、模型扫描、蜡型制作、铸造、上瓷、上釉、精修、质检到发货交付的全流程跟踪。系统提供实时订单看板、优先级管理、进度监控、返工追踪等核心功能，帮助企业提升生产效率、确保交付质量。

### 核心功能

- **订单看板**：实时展示所有加工订单状态，支持多维度筛选
- **统计概览**：在制订单、加急订单、今日交付、返工订单等关键指标
- **进度跟踪**：可视化展示订单各加工阶段及历史记录
- **优先级管理**：特急（STAT）、加急（URGENT）、普通（STANDARD）三级优先级
- **返工管理**：完整的返工记录追踪，包括返工原因、纠正措施、负责人
- **智能排序**：按优先级和交付日期自动排序，确保重要订单优先处理
- **多条件搜索**：支持订单号、患者编号、诊所、医生等模糊搜索
- **牙位图表**：直观的牙位标识，展示修复体位置和类型

### 业务流程

系统覆盖义齿加工完整生命周期：

```
接单 → 模型扫描 → 蜡型制作 → 铸造 → 上瓷 → 上釉 → 精修 → 质检 → 发货 → 交付
```

## 技术栈

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4.x | 渐进式 JavaScript 框架，使用 Composition API |
| TypeScript | 5.3.x | 类型安全的 JavaScript 超集 |
| Vite | 5.0.x | 下一代前端构建工具 |
| Vue Router | 4.2.x | Vue.js 官方路由管理器 |
| Tailwind CSS | 3.4.x | 实用优先的 CSS 框架 |
| Lucide Vue Next | 0.511.x | 精美的图标库 |
| clsx | 2.1.x | 条件 className 构造工具 |
| tailwind-merge | 3.3.x | Tailwind 类名合并工具 |

### 开发工具

- **ESLint** - 代码质量检查
- **Vue TSC** - Vue 3 TypeScript 类型检查
- **Volar** - Vue 3 IDE 支持

### 部署技术

- **Docker** - 容器化部署
- **Nginx** - 生产环境 Web 服务器

## 目录结构

```
hjj-2/
├── frontend/                 # 前端业务代码
│   ├── .vscode/             # VSCode 配置
│   ├── public/              # 静态资源
│   │   └── favicon.svg
│   ├── src/
│   │   ├── assets/          # 静态资源文件
│   │   ├── components/      # 可复用组件
│   │   │   ├── Empty.vue           # 空状态组件
│   │   │   ├── OrderCard.vue       # 订单卡片组件
│   │   │   ├── PriorityBadge.vue   # 优先级标签组件
│   │   │   ├── StageTimeline.vue   # 加工阶段时间线
│   │   │   ├── StatCard.vue        # 统计卡片组件
│   │   │   ├── StatusBadge.vue     # 状态标签组件
│   │   │   └── ToothChart.vue      # 牙位图表组件
│   │   ├── composables/     # 组合式函数
│   │   │   └── useTheme.ts         # 主题管理
│   │   ├── config/          # 配置文件
│   │   │   └── teeth.ts            # 牙位配置
│   │   ├── lib/             # 工具库
│   │   │   └── utils.ts            # 通用工具函数
│   │   ├── mock/            # 模拟数据
│   │   │   └── orders.ts           # 订单模拟数据
│   │   ├── pages/           # 页面组件
│   │   │   ├── Dashboard.vue       # 订单看板页
│   │   │   ├── HomePage.vue        # 首页
│   │   │   └── OrderDetail.vue     # 订单详情页
│   │   ├── router/          # 路由配置
│   │   │   └── index.ts
│   │   ├── types/           # TypeScript 类型定义
│   │   │   └── index.ts
│   │   ├── App.vue          # 根组件
│   │   ├── main.ts          # 应用入口
│   │   └── style.css        # 全局样式
│   ├── index.html           # HTML 入口
│   ├── package.json         # 依赖配置
│   ├── vite.config.ts       # Vite 配置
│   ├── tailwind.config.js   # Tailwind 配置
│   ├── postcss.config.js    # PostCSS 配置
│   └── tsconfig.json        # TypeScript 配置
├── .dockerignore           # Docker 忽略文件
├── .gitignore              # Git 忽略文件
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # Docker 镜像构建配置
├── nginx.conf              # Nginx 配置
└── README.md               # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm >= 9.0.0

### 本地开发

1. **进入前端目录**

```bash
cd frontend
```

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动。

4. **代码检查**

```bash
npm run lint
```

5. **类型检查**

```bash
npm run check
```

6. **生产构建**

```bash
npm run build
```

构建产物将生成在 `frontend/dist` 目录。

7. **预览生产构建**

```bash
npm run preview
```

## Docker 部署

### 使用 Docker Compose（推荐）

1. **构建并启动容器**

```bash
docker-compose up -d --build
```

2. **访问应用**

打开浏览器访问 `http://localhost`

3. **查看容器日志**

```bash
docker-compose logs -f
```

4. **停止容器**

```bash
docker-compose down
```

### 单独使用 Docker

1. **构建镜像**

```bash
docker build -t hjj-frontend .
```

2. **运行容器**

```bash
docker run -d -p 80:80 --name hjj-frontend hjj-frontend
```

### Docker 说明

- 采用多阶段构建，最终镜像仅包含 Nginx 和静态资源，镜像体积小
- 使用 Nginx 作为 Web 服务器，启用 Gzip 压缩和静态资源缓存
- 支持 Vue Router 的 History 模式，正确处理路由
- 容器自动重启，保证服务可用性

## 业务说明

### 订单状态

| 状态 | 说明 |
|------|------|
| pending | 待处理，订单已接收尚未开始 |
| in-progress | 进行中，订单正在加工 |
| completed | 已完成，订单已交付 |
| returned | 已返工，存在质量问题需要返工 |

### 优先级

| 优先级 | 标识 | 说明 |
|--------|------|------|
| STAT | 特急 | 最高优先级，当天需完成 |
| URGENT | 加急 | 高优先级，需优先处理 |
| STANDARD | 普通 | 正常优先级 |

### 修复体类型

- 牙冠（Crown）
- 贴面（Veneer）
- 嵌体（Inlay）
- 高嵌体（Onlay）
- 桥（Bridge）
- 种植冠（Implant Crown）
- 活动义齿（Full/Partial Denture）

### 材料类型

- 二氧化锆（Zirconia）
- 二硅酸锂（Emax）
- 烤瓷熔附金属（PFM）
- 复合树脂（Composite）
- 树脂基托（Acrylic）

## 开发指南

### 组件开发规范

1. 使用 `<script setup lang="ts">` 语法
2. 组件命名采用大驼峰（PascalCase）
3. Props 必须定义类型和默认值
4. 事件命名采用 kebab-case
5. 使用 Tailwind CSS 进行样式开发

### 路由定义

路由配置在 `frontend/src/router/index.ts`，目前包含：

- `/` - 首页
- `/dashboard` - 订单看板
- `/order/:id` - 订单详情

### 类型定义

所有业务类型定义在 `frontend/src/types/index.ts`，包括：

- `Order` - 订单
- `Clinic` - 诊所
- `Patient` - 患者
- `WorkItem` - 加工项目
- `StageHistory` - 阶段历史
- `ReturnRecord` - 返工记录

## License

Private
