import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import OrderDetail from '@/pages/OrderDetail.vue'
import OrderForm from '@/pages/OrderForm.vue'
import ClinicList from '@/pages/ClinicList.vue'
import ClinicDetail from '@/pages/ClinicDetail.vue'
import ClinicForm from '@/pages/ClinicForm.vue'
import Workbench from '@/pages/Workbench.vue'
import TechnicianTaskList from '@/pages/TechnicianTaskList.vue'
import TechnicianDetail from '@/pages/TechnicianDetail.vue'
import ScheduleBoard from '@/pages/ScheduleBoard.vue'
import ReceiveRegister from '@/pages/ReceiveRegister.vue'
import ShipList from '@/pages/ShipList.vue'
import LogisticsDetail from '@/pages/LogisticsDetail.vue'
import LogisticsException from '@/pages/LogisticsException.vue'
import PriceRuleConfig from '@/pages/PriceRuleConfig.vue'
import OrderQuoteDetail from '@/pages/OrderQuoteDetail.vue'
import StatementList from '@/pages/StatementList.vue'
import MonthlySettlementDetail from '@/pages/MonthlySettlementDetail.vue'
import QualityInspectionList from '@/pages/QualityInspectionList.vue'
import QualityInspectionDetail from '@/pages/QualityInspectionDetail.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '订单看板' },
  },
  {
    path: '/schedule',
    name: 'schedule-board',
    component: ScheduleBoard,
    meta: { title: '今日排产看板' },
  },
  {
    path: '/technician-tasks',
    name: 'technician-task-list',
    component: TechnicianTaskList,
    meta: { title: '技师任务列表' },
  },
  {
    path: '/technician/:id',
    name: 'technician-detail',
    component: TechnicianDetail,
    meta: { title: '技师详情' },
  },
  {
    path: '/workbench',
    name: 'workbench',
    component: Workbench,
    meta: { title: '技师工作台' },
  },
  {
    path: '/clinics',
    name: 'clinic-list',
    component: ClinicList,
    meta: { title: '诊所管理' },
  },
  {
    path: '/clinic/new',
    name: 'clinic-new',
    component: ClinicForm,
    meta: { title: '新增诊所' },
  },
  {
    path: '/clinic/:id/edit',
    name: 'clinic-edit',
    component: ClinicForm,
    meta: { title: '编辑诊所' },
  },
  {
    path: '/clinic/:id',
    name: 'clinic-detail',
    component: ClinicDetail,
    meta: { title: '诊所详情' },
  },
  {
    path: '/order/new',
    name: 'order-new',
    component: OrderForm,
    meta: { title: '新建订单' },
  },
  {
    path: '/order/:id/edit',
    name: 'order-edit',
    component: OrderForm,
    meta: { title: '编辑订单' },
  },
  {
    path: '/order/:id',
    name: 'order-detail',
    component: OrderDetail,
    meta: { title: '订单详情' },
  },
  {
    path: '/logistics/receive',
    name: 'logistics-receive',
    component: ReceiveRegister,
    meta: { title: '收件登记' },
  },
  {
    path: '/logistics/ship',
    name: 'logistics-ship',
    component: ShipList,
    meta: { title: '发货管理' },
  },
  {
    path: '/logistics/detail/:id',
    name: 'logistics-detail',
    component: LogisticsDetail,
    meta: { title: '物流详情' },
  },
  {
    path: '/logistics/exception/:id',
    name: 'logistics-exception',
    component: LogisticsException,
    meta: { title: '物流异常处理' },
  },
  {
    path: '/pricing/rules',
    name: 'price-rule-config',
    component: PriceRuleConfig,
    meta: { title: '价格规则配置' },
  },
  {
    path: '/order/:orderId/quote',
    name: 'order-quote-detail',
    component: OrderQuoteDetail,
    meta: { title: '订单报价明细' },
  },
  {
    path: '/statements',
    name: 'statement-list',
    component: StatementList,
    meta: { title: '对账单列表' },
  },
  {
    path: '/settlement/:clinicId/:month',
    name: 'monthly-settlement-detail',
    component: MonthlySettlementDetail,
    meta: { title: '月度结算详情' },
  },
  {
    path: '/quality',
    name: 'quality-inspection-list',
    component: QualityInspectionList,
    meta: { title: '质检中心' },
  },
  {
    path: '/quality/:id',
    name: 'quality-inspection-detail',
    component: QualityInspectionDetail,
    meta: { title: '质检详情' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const baseTitle = '义齿加工订单管理系统'
  document.title = to.meta?.title
    ? `${to.meta.title} - ${baseTitle}`
    : baseTitle
  next()
})

export default router
