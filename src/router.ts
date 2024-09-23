import { createRouter, createWebHistory } from 'vue-router';
import { getConnectionStatus } from '@rongcloud/imlib-next';

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('./components/Login.vue')
  },
  {
    path: '/main',
    name: 'main',
    component: () => import('./components/Main.vue'),
    children: [
      {
        path: '',
        name: 'chat',
        component: () => import('./components/Chat.vue')
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('./components/Contacts.vue')
      },
      {
        path: 'setting',
        name: 'setting',
        component: () => import('./components/Setting.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  // 刷新直接回到登入页面
  try {
    if (to.name !== 'login' && !from.name) {
      next({ name: 'login' });
    } else {
      next();
    }
  } catch (error) {
    console.log('router.beforeEach', error);
    next({ name: 'login' });
  }
});

export default router;