# HJJ 义齿加工订单管理系统 — 核心模块实现方案

## 一、项目概览

本系统是面向义齿加工企业的全流程订单管理平台，实现从**接单 → 模型扫描 → 蜡型制作 → 铸造/切削 → 烤瓷 → 上釉 → 精修 → 质检 → 发货 → 交付**的十阶段全流程可视化追踪。

当前项目为**纯前端 SPA**，数据来源为 Mock 层，采用 Vue 3 + TypeScript + Vite + Tailwind CSS 技术栈，Docker + Nginx 部署。

---

## 二、核心模块架构总览

```
┌─────────────────────────────────────────────────────┐
│                   App.vue (布局壳)                    │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │          │  │           Header                   │  │
│  │  Sidebar │  ├──────────────────────────────────┤  │
│  │  (导航)   │  │                                  │  │
│  │          │  │      <router-view> 页面区域        │  │
│  │          │  │  ┌──────────┬───────────────────┐  │  │
│  │          │  │  │Dashboard │   OrderDetail      │  │  │
│  │          │  │  └──────────┴───────────────────┘  │  │
│  └──────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

| 模块编号 | 模块名称 | 核心职责 | 关键文件 |
|---------|---------|---------|---------|
| M1 | 类型与常量系统 | 统一业务类型定义与枚举映射 | `types/index.ts` |
| M2 | 牙位配置系统 | 恒牙/乳牙牙位数据与查询 | `config/teeth.ts` |
| M3 | 布局与导航模块 | 侧边栏、顶栏、面包屑、角色切换 | `App.vue` |
| M4 | 订单看板模块 | 统计卡片、搜索筛选、订单卡片列表 | `pages/Dashboard.vue` |
| M5 | 订单详情模块 | 进度时间线、修复体清单、返工记录 | `pages/OrderDetail.vue` |
| M6 | 加工阶段管线模块 | 十阶段可视化进度条与详细日志 | `components/StageTimeline.vue` |
| M7 | 牙位图表模块 | 上下颌四象限牙位图、修复体标记 | `components/ToothChart.vue` |
| M8 | 统计指标模块 | 在制/加急/逾期/返工等关键指标 | `components/StatCard.vue` |
| M9 | 状态与优先级徽标模块 | 订单状态/优先级的视觉标识 | `StatusBadge.vue` / `PriorityBadge.vue` |
| M10 | 主题系统 | 亮/暗模式切换与持久化 | `composables/useTheme.ts` |
| M11 | Mock 数据层 | 模拟订单、诊所数据与查询函数 | `mock/orders.ts` |
| M12 | 基础设施 | 路由、工具函数、Docker/Nginx | `router/` `lib/` `Dockerfile` |

---

## 三、各模块详细实现方案

### M1 — 类型与常量系统

**文件**: [types/index.ts](file:///D:/project/hjj-2/frontend/src/types/index.ts)

**实现要点**:

1. **枚举型联合类型 + 中文标签映射**: 所有业务枚举均定义为 `type Union = 'a' | 'b'` 形式，配合 `Record<Union, string>` 实现中英文映射，确保类型安全与显示一致性。

   ```typescript
   export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'returned'
   export const OrderStatusLabels: Record<OrderStatus, string> = {
     'pending': '待开始', 'in-progress': '加工中', ...
   }
   ```

2. **核心业务实体**:

   | 接口 | 说明 | 关键字段 |
   |------|------|---------|
   | `Order` | 订单主实体 | `orderNumber`, `clinicId`, `workItems[]`, `currentStage`, `stageHistory[]`, `returnRecords[]` |
   | `Clinic` | 诊所 | `name`, `contactPerson`, `phone`, `clinicCode` |
   | `Patient` | 患者（匿名化） | `anonymousCode`, `gender?`, `age?` |
   | `ToothWorkItem` | 单颗修复体 | `toothNumber`, `restorationType`, `material`, `shade` |
   | `StageHistoryEntry` | 阶段日志 | `stage`, `startedAt`, `completedAt?`, `technician?`, `notes?` |
   | `ReturnRecord` | 返工记录 | `reason`, `stageReturnedFrom`, `correctiveAction`, `responsibleTechnician?` |
   | `DashboardStats` | 看板统计 | `totalOrders`, `inProgressCount`, `urgentCount`, `overdueCount`, `returnedCount` |

3. **十阶段加工管线定义** — `ProcessingStages` 数组，每个阶段包含 `stage`（枚举键）、`label`（中文名）、`description`、`estimatedDurationDays`，驱动所有阶段相关组件渲染。

4. **义齿业务枚举完整覆盖**:
   - `RestorationType`: 9 种修复类型（单冠/固定桥/贴面/嵌体/高嵌体/种植冠/活动义齿/全口义齿/正畸矫治器）
   - `MaterialType`: 8 种材料（氧化锆/E.MAX/烤瓷/全金属/复合树脂/亚克力/PEEK/纯钛）
   - `ShadeGuide`: 16 种 VITA 比色号
   - `ImpressionMethod`: 4 种取模方式

---

### M2 — 牙位配置系统

**文件**: [config/teeth.ts](file:///D:/project/hjj-2/frontend/src/config/teeth.ts)

**实现要点**:

1. **FDI 牙位编号体系**: 按 FDI 国际牙科联合会标准组织 32 颗恒牙（11-48）和 20 颗乳牙（51-85），每颗牙包含 `number`、`name`、`quadrant`（四象限）、`isPrimary` 属性。

2. **四象限分区**: `upper-right` / `upper-left` / `lower-left` / `lower-right`，用于 [ToothChart](file:///D:/project/hjj-2/frontend/src/components/ToothChart.vue) 组件的牙位图渲染。

3. **查询工具函数**:
   - `getToothByNumber(number)` — 按牙号查找
   - `getTeethByQuadrant(quadrant, primary?)` — 按象限筛选

4. **比色号常量**: `ShadeGuides` 数组包含 VITA Classic A1-D4 全部 16 个色号。

---

### M3 — 布局与导航模块

**文件**: [App.vue](file:///D:/project/hjj-2/frontend/src/App.vue)

**实现要点**:

1. **双区域布局**: 左侧固定侧边栏 + 右侧内容区，侧边栏支持折叠/展开，折叠时宽度 80px（仅图标），展开时 256px（图标+文字）。

2. **侧边栏导航项**: 预定义 6 个导航入口（订单看板/订单列表/诊所管理/技师排程/数据统计/系统设置），当前仅订单看板路由已实现，其余指向根路径待开发。

3. **角色切换**: 侧边栏内嵌角色选择器，支持 `dispatcher`（调度员）/ `clinic`（诊所端）/ `technician`（技师端）三种角色切换，为后续权限系统预留入口。

4. **顶栏**:
   - 面包屑导航（基于路由 `meta.title` 动态生成）
   - 全局搜索框（预留，当前无实际功能）
   - 通知铃铛（带红点提示，预留）
   - 用户信息展示

5. **页面过渡动画**: `<transition name="page-fade" mode="out-in">` 实现页面切换的淡入淡出+微位移效果。

6. **移动端适配**: 侧边栏在移动端为 overlay 模式，带半透明遮罩，点击遮罩可关闭。

---

### M4 — 订单看板模块

**文件**: [pages/Dashboard.vue](file:///D:/project/hjj-2/frontend/src/pages/Dashboard.vue)

**实现要点**:

1. **四维统计看板**（`stats` computed）:
   - **在制订单**: `status === 'in-progress' || 'pending'`
   - **加急订单**: `priority === 'urgent' || 'stat'` 且未完成
   - **今日交付**: `deliveryDate === today` 且未完成
   - **返工订单**: `returnRecords.length > 0`
   - 同步计算逾期数、今日完成数

2. **多维度筛选系统**（4 个筛选维度）:
   - 订单状态（`OrderStatus`）
   - 优先级（`OrderPriority`）
   - 合作诊所（`clinicId`）
   - 加工阶段（`ProcessingStage`）
   - 筛选激活时显示已激活数量徽标，支持一键清除

3. **模糊搜索**: 单一搜索框同时匹配订单号、患者匿名编号、诊所名称、医生姓名。

4. **智能排序**: 先按优先级（stat > urgent > standard）排序，同优先级按交付日期升序。

5. **订单卡片网格**: `lg:grid-cols-2` 双列布局，每张卡片通过 [OrderCard](file:///D:/project/hjj-2/frontend/src/components/OrderCard.vue) 组件展示，点击进入详情。

6. **空状态**: 筛选无结果时展示空状态引导，支持一键重置。

---

### M5 — 订单详情模块

**文件**: [pages/OrderDetail.vue](file:///D:/project/hhj-2/frontend/src/pages/OrderDetail.vue)

**实现要点**:

1. **三栏布局**: 左侧主内容区（2/3 宽） + 右侧信息栏（1/3 宽），响应式降级为单列。

2. **主内容区**:
   - **加工进度卡**: 含 [StageTimeline](file:///D:/project/hjj-2/frontend/src/components/StageTimeline.vue) 可视化 + 详细阶段日志（时间线形式，包含技师、开始/完成时间、备注）
   - **返工记录卡**: 当 `returnRecords.length > 0` 时显示，每条记录包含问题原因、整改措施、责任人、解决时间
   - **特殊说明卡**: 展示 `specialInstructions` 字段

3. **右侧信息栏**:
   - **牙位图**: [ToothChart](file:///D:/project/hjj-2/frontend/src/components/ToothChart.vue) 组件，高亮标记修复体牙位
   - **修复体清单**: 列出每个 `workItem` 的牙号、修复类型、材料、比色号
   - **诊所信息**: 诊所名称、编码、联系人、电话、地址
   - **患者信息**: 匿名编号、性别、年龄（隐私脱敏设计）
   - **取模与费用**: 取模方式、修复体数量、订单总金额

4. **交付倒计时**: 基于当前日期与 `deliveryDate` 计算剩余天数，逾期显示红色警示，≤2天显示黄色警告。

5. **返回导航**: 左上角返回按钮，使用 `router.back()`。

---

### M6 — 加工阶段管线模块

**文件**: [components/StageTimeline.vue](file:///D:/project/hjj-2/frontend/src/components/StageTimeline.vue)

**实现要点**:

1. **十阶段进度条**: 水平排列 10 个圆形节点，节点间以连接线串联。三种视觉状态:
   - ✅ 已完成（绿色实心 + ✓）
   - 🔵 进行中（蓝色边框 + 脉冲环 + 蓝色圆点）
   - ⚪ 未到达（灰色空心圆）

2. **紧凑模式**: `compact` prop 控制连接线宽度（16px vs 24px），用于 [OrderCard](file:///D:/project/hjj-2/frontend/src/components/OrderCard.vue) 中的缩略展示。

3. **数据驱动**: 完全由 `ProcessingStages` 常量数组和 `currentStage` prop 驱动，无需硬编码阶段数量。

---

### M7 — 牙位图表模块

**文件**: [components/ToothChart.vue](file:///D:/project/hjj-2/frontend/src/components/ToothChart.vue)

**实现要点**:

1. **四象限布局**: 上颌两象限（右上/左上）在上，下颌两象限（左下/右下）在下，中间以渐变分隔线区分，还原临床牙位图视觉。

2. **牙位形状区分**: 上颌牙使用 `rounded-t-2xl rounded-b-md`（倒梯形），下颌牙使用 `rounded-b-2xl rounded-t-md`（正梯形），模拟牙齿解剖形态。

3. **修复体标记**:
   - 有修复体的牙位: 蓝色背景 + 白色字
   - 无修复体的牙位: 白色背景 + 灰色字
   - 悬停显示 tooltip: 牙名、修复类型、材料、色号

4. **全口修复支持**: `toothNumber === 'all'` 时，顶部显示全口修复提示条。

5. **可选模式**: `selectable` prop 支持点击选择牙位，发出 `select` 事件（为后续订单创建功能预留）。

6. **修复体明细列表**: 图表下方展示所有 `workItem` 的详细列表。

7. **乳牙切换**: `showPrimary` prop 控制显示恒牙/乳牙。

---

### M8 — 统计指标模块

**文件**: [components/StatCard.vue](file:///D:/project/hjj-2/frontend/src/components/StatCard.vue)

**实现要点**:

1. **五色调体系**: `tone` prop 支持 `default` / `primary` / `success` / `warning` / `danger` 五种色调，影响图标背景色。

2. **卡片内容**: 标题 → 数值 → 趋势标记 + 描述文字 → 图标，布局为左右分栏。

3. **趋势标记**: `trend` prop 以 `+`/`-` 前缀自动着色（绿/红），用于展示同比变化。

---

### M9 — 状态与优先级徽标模块

**文件**: [StatusBadge.vue](file:///D:/project/hjj-2/frontend/src/components/StatusBadge.vue) / [PriorityBadge.vue](file:///D:/project/hjj-2/frontend/src/components/PriorityBadge.vue)

**实现要点**:

1. **StatusBadge**: 5 种状态对应 5 套配色方案（slate/blue/emerald/amber/rose），前缀彩色圆点指示灯，`border` 样式边框。

2. **PriorityBadge**: 3 种优先级对应 3 套配色（slate/orange/rose），使用 `ring-1 ring-inset` 样式，字体更粗（`font-semibold`），传递紧迫感。

---

### M10 — 主题系统

**文件**: [composables/useTheme.ts](file:///D:/project/hjj-2/frontend/src/composables/useTheme.ts)

**实现要点**:

1. **亮暗切换**: 通过 `document.documentElement.classList` 添加 `light`/`dark` 类，配合 Tailwind `darkMode: 'class'` 配置生效。

2. **持久化**: `localStorage.getItem('theme')` 读取用户偏好，`localStorage.setItem('theme', t)` 写入。

3. **系统偏好检测**: 当 localStorage 无记录时，使用 `window.matchMedia('(prefers-color-scheme: dark)')` 检测系统暗色模式。

4. **响应式 API**: 返回 `theme`（ref）、`toggleTheme`（切换函数）、`isDark`（computed），可在任意组件中使用。

---

### M11 — Mock 数据层

**文件**: [mock/orders.ts](file:///D:/project/hjj-2/frontend/src/mock/orders.ts)

**实现要点**:

1. **诊所数据**: 4 家模拟诊所，覆盖北京/上海/广州/深圳四地。

2. **订单数据**: 10 条模拟订单，覆盖以下业务场景:

   | 订单 | 修复类型 | 材料 | 优先级 | 状态 | 特点 |
   |------|---------|------|--------|------|------|
   | 001 | 单冠×2 | 氧化锆 | 常规 | 加工中(蜡型) | 数字印模，美观要求高 |
   | 002 | 种植冠 | 氧化锆 | 加急 | 加工中(烤瓷) | 数字印模 |
   | 003 | 贴面×4 | E.MAX | 常规 | 加工中(扫描) | 硅橡胶取模，美容修复 |
   | 004 | 单冠×4 | 烤瓷 | 常规 | 加工中(精修) | 双颌托盘取模 |
   | 005 | 固定桥×3 | 氧化锆 | 加急 | 加工中(质检) | 联桥修复 |
   | 006 | 单冠 | 氧化锆 | 常规 | 已返工 | 质检退回，返工记录完整 |
   | 007 | 高嵌体 | E.MAX | 常规 | 已完成 | 全流程已完成 |
   | 008 | 嵌体×2 | 复合树脂 | 常规 | 待开始 | 刚接单 |
   | 009 | 全口义齿 | 亚克力 | 常规 | 加工中(蜡型) | 全口修复 |
   | 010 | 固定桥×3 | 氧化锆 | 特急 | 加工中(上釉) | 当日试戴 |

3. **时间动态**: 使用 `daysAgo(n)` / `daysLater(n)` 相对于当天生成时间戳，确保 Mock 数据始终"新鲜"。

4. **查询函数**: `getOrderById(id)` 和 `getOrdersByClinic(clinicId)` 提供简单的数据检索能力。

---

### M12 — 基础设施

#### 路由系统

**文件**: [router/index.ts](file:///D:/project/hjj-2/frontend/src/router/index.ts)

| 路径 | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/` | `dashboard` | `Dashboard.vue` | 订单看板（默认首页） |
| `/order/:id` | `order-detail` | `OrderDetail.vue` | 订单详情 |

- 使用 `createWebHistory`（HTML5 History 模式）
- 全局前置守卫：动态设置 `document.title`，格式为 `{页面标题} - 义齿加工订单管理系统`
- Nginx 配置 `try_files $uri $uri/ /index.html` 支持 History 模式

#### 工具函数

**文件**: [lib/utils.ts](file:///D:/project/hjj-2/frontend/src/lib/utils.ts)

- `cn(...inputs)`: 基于 `clsx` + `tailwind-merge` 的类名合并工具，解决 Tailwind 类冲突问题

#### 部署架构

**文件**: [Dockerfile](file:///D:/project/hjj-2/Dockerfile) / [docker-compose.yml](file:///D:/project/hjj-2/docker-compose.yml) / [nginx.conf](file:///D:/project/hjj-2/nginx.conf)

- **多阶段构建**: `node:20-alpine` 构建 → `nginx:alpine` 运行，最终镜像仅含静态资源
- **Nginx 配置**: SPA 路由兜底 + 静态资源长缓存（1年） + Gzip 压缩
- **Docker Compose**: 单服务 `frontend`，映射 80 端口，`unless-stopped` 重启策略

---

## 四、数据流与组件依赖关系

```
App.vue
 ├── Sidebar (navItems, currentRole)
 ├── Header (breadcrumbs, search, bell, user)
 └── <router-view>
      ├── Dashboard.vue
      │    ├── StatCard × 4 (stats computed ← MockOrders)
      │    ├── Search + Filters (4维度)
      │    └── OrderCard × N (filteredOrders)
      │         ├── StatusBadge
      │         ├── PriorityBadge
      │         └── StageTimeline (compact)
      │
      └── OrderDetail.vue
           ├── StageTimeline (full)
           ├── 返工记录区
           ├── 特殊说明区
           ├── ToothChart (workItems → 牙位标记)
           ├── 修复体清单
           ├── 诊所信息
           ├── 患者信息
           └── 取模与费用
```

**数据流向**:
```
MockOrders → Dashboard(stats + filteredOrders) → OrderCard → 点击 → OrderDetail(stageHistory + workItems + returnRecords)
```

---

## 五、当前实现状态与待完善方向

### ✅ 已实现

| 模块 | 完成度 | 说明 |
|------|--------|------|
| 类型与常量系统 | 100% | 全部业务枚举与实体类型定义完整 |
| 牙位配置系统 | 100% | FDI 编号、四象限、查询函数 |
| 布局与导航 | 80% | 侧边栏/顶栏/面包屑已实现，部分导航项指向占位 |
| 订单看板 | 95% | 统计/搜索/筛选/排序完整，缺少新建订单入口 |
| 订单详情 | 95% | 进度/返工/修复体/诊所/患者信息完整，缺少状态操作按钮 |
| 加工阶段管线 | 100% | 十阶段可视化 + 紧凑模式 |
| 牙位图表 | 95% | 四象限+标记+tooltip+明细，可选模式预留 |
| 统计指标 | 100% | 五色调卡片完整 |
| 状态/优先级徽标 | 100% | 配色与样式完整 |
| 主题系统 | 90% | 亮暗切换+持久化，暗色样式未完全覆盖 |
| Mock 数据层 | 80% | 10条订单+4家诊所，查询函数简单 |
| 基础设施 | 100% | 路由/Docker/Nginx 完整 |

### 🔲 待完善

| 优先级 | 方向 | 说明 |
|--------|------|------|
| P0 | **后端 API 对接** | 引入 HTTP 客户端（如 axios），将 Mock 数据层替换为真实 API 调用 |
| P0 | **状态操作** | 订单详情页增加"推进阶段""暂停""返工"等操作按钮 |
| P1 | **订单创建** | 新建订单表单页，含诊所选择、牙位选择、修复体配置 |
| P1 | **权限系统** | 基于角色（调度员/诊所/技师）的页面与操作权限控制 |
| P1 | **技师排程** | 技师工作台，查看分配给自己的订单与任务 |
| P1 | **数据统计** | 产量统计、返工率分析、平均加工周期等报表 |
| P2 | **通知系统** | 加急/逾期/返工等关键事件的站内通知与推送 |
| P2 | **诊所管理** | CRUD 诊所信息与联系人 |
| P2 | **暗色模式完善** | 所有组件补充 `dark:` 变体样式 |
| P3 | **国际化** | 提取中文文案为 i18n 资源文件 |
| P3 | **数据可视化** | 引入图表库（如 ECharts），实现统计面板图表 |

---

## 六、技术栈依赖清单

| 包名 | 版本 | 用途 |
|------|------|------|
| `vue` | ^3.4.15 | 核心框架，Composition API |
| `vue-router` | ^4.2.5 | SPA 路由 |
| `typescript` | ~5.3.3 | 类型安全 |
| `vite` | ^5.0.12 | 构建工具 |
| `tailwindcss` | ^3.4.1 | 原子化 CSS |
| `clsx` | ^2.1.1 | 条件类名构造 |
| `tailwind-merge` | ^3.3.0 | Tailwind 类名去重合并 |
| `lucide-vue-next` | ^0.511.0 | 图标库 |
| `@vitejs/plugin-vue` | ^5.0.3 | Vite Vue 插件 |
| `vue-tsc` | ^1.8.27 | Vue TS 类型检查 |
| `eslint` | ^8.56.0 | 代码检查 |

---

## 七、关键业务规则

1. **优先级排序**: `stat`（特急）> `urgent`（加急）> `standard`（常规），所有列表默认按此排序
2. **逾期判定**: `deliveryDate < today` 且 `status !== 'completed'`
3. **返工流程**: 质检阶段退回 → 记录返工原因与整改措施 → 重新进入对应加工阶段 → `stageHistory` 追加新条目
4. **患者脱敏**: 仅展示匿名编号（`YK-YYYY-MMDD-X`），不展示真实姓名
5. **全口修复标记**: `toothNumber === 'all'` 时，牙位图显示全口提示条而非逐颗标记
6. **阶段推进**: `stageHistory` 数组中最后一条无 `completedAt` 的条目即为当前进行中阶段
