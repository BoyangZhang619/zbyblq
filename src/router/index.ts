import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/home.vue'
import profile from '../views/profile.vue'
import Sort from '../views/sort.vue'

const routes = [
    {
        path: '/',
        redirect: () => {
            return '/home'
        }
    },
    {
        path: '/home',
        name: 'home',
        component: Home,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 主页'
        }
    },
    {
        path: '/sort',
        name: 'sort',
        component: Sort,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 分类'
        }
    },
    {
        path: '/profile',
        name: 'profile',
        component: profile,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 个人中心'
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫，设置页面标题
// TODO: 在认证写好后添加路由守卫，检查用户是否已登录，未登录则重定向到登录页面
router.beforeEach((to, _) => {
    if (to.meta.title) {
        document.title = to.meta.title as string
    } else {
        document.title = '『𝑍𝐵𝑌𝐵𝐿𝑄』'
    }
})

export default router