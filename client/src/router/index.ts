import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import SurveyList from '../views/admin/SurveyList.vue'
import SurveyCreate from '../views/admin/SurveyCreate.vue'
import SurveyResults from '../views/admin/SurveyResults.vue'
import SurveyAnswer from '../views/SurveyAnswer.vue'

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        name: 'SurveyList',
        component: SurveyList
      },
      {
        path: 'create',
        name: 'SurveyCreate',
        component: SurveyCreate
      },
      {
        path: 'surveys/:id/results',
        name: 'SurveyResults',
        component: SurveyResults,
        props: true
      }
    ]
  },
  {
    path: '/survey/:id',
    name: 'SurveyAnswer',
    component: SurveyAnswer,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router