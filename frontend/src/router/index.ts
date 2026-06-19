import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import OrderDetail from '@/pages/OrderDetail.vue'
import OrderForm from '@/pages/OrderForm.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '订单看板' },
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
