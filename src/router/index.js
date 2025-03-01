import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from '../components/login.vue';
import Register from '../components/register.vue';
import Index from '../components/index.vue';
import Houtai from '../components/houtai.vue';
import SongDetailPage from '../components/qiantaiPage/songDetailPage.vue'
import SingerDetailPage from '../components/qiantaiPage/singerDetailPage.vue'
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
    {
        path: '/song/:id',
        name: 'SongDetail',
        component: SongDetailPage,
        props: true
    },
    {
        path: '/singer/:singerId',
        name: 'SingerDetail',
        component: SingerDetailPage,
        props: true
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