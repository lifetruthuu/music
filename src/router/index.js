import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from '../components/login.vue';
import Register from '../components/register.vue';
import Index from '../components/index.vue';
import Houtai from '../components/houtai.vue';
Vue.use(VueRouter);


const routes = [
    //默认路由
    {path: '/', redirect: '/login'},
    {
        path: '/login',
        name: 'login',
        component: Login,
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
    },
    {
        path: '/index',
        name: 'index',
        component: Index,
    },
    {
        path: '/houtaiPage',
        name: 'houtaiPage',
        component: Houtai,
    },
];


const router = new VueRouter({
    mode: 'hash',
    routes
})

export default router


// router.beforeEach((to, from, next) => {
//     const token = localStorage.getItem('authToken');
//     if (to.meta.requiresAuth && !token) {
//         next('/login');
//     } else {
//         next();
//     }
// });
//
// export default router;