import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import OrderDetail from '@/pages/OrderDetail.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '订单看板' },
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
