import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import AdminDashboard from './views/AdminDashboard.vue';
import CreateSurvey from './views/CreateSurvey.vue';
import SurveyAnswer from './views/SurveyAnswer.vue';
import SurveyResults from './views/SurveyResults.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
  },
  {
    path: '/admin/create',
    name: 'CreateSurvey',
    component: CreateSurvey,
  },
  {
    path: '/survey/:id',
    name: 'SurveyAnswer',
    component: SurveyAnswer,
    props: true,
  },
  {
    path: '/admin/results/:id',
    name: 'SurveyResults',
    component: SurveyResults,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;