import { createRouter, createWebHistory } from 'vue-router'
import AdminSurveyList from '../views/AdminSurveyList.vue'
import AdminCreateSurvey from '../views/AdminCreateSurvey.vue'
import AdminSurveyResults from '../views/AdminSurveyResults.vue'
import UserSurveyForm from '../views/UserSurveyForm.vue'

const routes = [
  {
    path: '/',
    redirect: '/admin/surveys'
  },
  {
    path: '/admin/surveys',
    name: 'AdminSurveyList',
    component: AdminSurveyList
  },
  {
    path: '/admin/surveys/create',
    name: 'AdminCreateSurvey',
    component: AdminCreateSurvey
  },
  {
    path: '/admin/surveys/:id/results',
    name: 'AdminSurveyResults',
    component: AdminSurveyResults,
    props: true
  },
  {
    path: '/survey/:id',
    name: 'UserSurveyForm',
    component: UserSurveyForm,
    props: true
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})