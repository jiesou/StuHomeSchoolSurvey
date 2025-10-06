import { createRouter, createWebHistory } from 'vue-router'

// 获取管理员密钥
const getAdminSecret = () => {
  return sessionStorage.getItem('adminSecret') || import.meta.env.VITE_ADMIN_SECRET || ''
}

const routes = [
  {
    path: '/',
    redirect: () => {
      const secret = getAdminSecret()
      return `/admin-${secret}`
    }
  },
  {
    path: '/admin-:secret',
    component: () => import('../views/AdminLayout.vue'),
    beforeEnter: (to: any) => {
      const secret = to.params.secret
      if (secret) {
        sessionStorage.setItem('adminSecret', secret)
      }
    },
    children: [
      {
        path: '',
        name: 'SurveyList',
        component: () => import('../views/admin/SurveyList.vue')
      },
      {
        path: 'create',
        name: 'SurveyCreate',
        component: () => import('../views/admin/SurveyCreate.vue')
      },
      {
        path: 'edit/:id',
        name: 'SurveyEdit',
        component: () => import('../views/admin/SurveyCreate.vue')
      },
      {
        path: 'surveys/:id/results',
        name: 'SurveyResults',
        component: () => import('../views/admin/SurveyResults.vue'),
        props: true
      }
    ]
  },
  {
    path: '/survey/:id',
    name: 'SurveyAnswer',
    component: () => import('../views/SurveyAnswer.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router