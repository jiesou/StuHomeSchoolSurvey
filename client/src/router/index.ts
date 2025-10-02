import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/admin',
    component: () => import('../views/AdminLayout.vue'),
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