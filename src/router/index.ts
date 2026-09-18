import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/home.vue'
import Profile from '../views/profile.vue'
import Sort from '../views/sort.vue'

// Pages - Local Tools
import BTreeVisual from '../views/pages/tools/BTreeVisual.vue'
import EftTool from '../views/pages/tools/EftTool.vue'
import EncryptionGraph from '../views/pages/tools/EncryptionGraph.vue'
import DrumPad from '../views/pages/tools/DrumPad.vue'
import Kalimba from '../views/pages/tools/Kalimba.vue'
import SortViz from '../views/pages/tools/SortViz.vue'
import Img2Ascii from '../views/pages/tools/Img2Ascii.vue'
import Pixelate from '../views/pages/tools/Pixelate.vue'
import FloydSteinberg from '../views/pages/tools/FloydSteinberg.vue'
import PathfindingVisualize from '../views/pages/tools/PathfindingVisualize.vue'
import PhotoPatina from '../views/pages/tools/PhotoPatina.vue'
import PianoKeys from '../views/pages/tools/PianoKeys.vue'

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
        component: Profile,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 个人中心'
        }
    },
    // Tools Routes
    {
        path: '/tools/btree-visual',
        name: 'btree-visual',
        component: BTreeVisual,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 二叉树可视化'
        }
    },
    {
        path: '/tools/eft-tool',
        name: 'eft-tool',
        component: EftTool,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 英文字体转换'
        }
    },
    {
        path: '/tools/encryption-graph',
        name: 'encryption-graph',
        component: EncryptionGraph,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 图片混淆'
        }
    },
    {
        path: '/tools/drum-pad',
        name: 'drum-pad',
        component: DrumPad,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- Drum Pad 鼓机'
        }
    },
    {
        path: '/tools/kalimba',
        name: 'kalimba',
        component: Kalimba,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- Kalimba 拇指琴'
        }
    },
    {
        path: '/tools/sort-viz',
        name: 'sort-viz',
        component: SortViz,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 排序算法可视化'
        }
    },
    {
        path: '/tools/img2ascii',
        name: 'img2ascii',
        component: Img2Ascii,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 图片转 ASCII'
        }
    },
    {
        path: '/tools/pixelate',
        name: 'pixelate',
        component: Pixelate,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- Pixelate · 图片像素化'
        }
    },
    {
        path: '/tools/floyd-steinberg',
        name: 'floyd-steinberg',
        component: FloydSteinberg,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- Dithering · Floyd–Steinberg'
        }
    },
    {
        path: '/tools/pathfinding-visualize',
        name: 'pathfinding-visualize',
        component: PathfindingVisualize,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 路径寻找可视化'
        }
    },
    {
        path: '/tools/photo-patina',
        name: 'photo-patina',
        component: PhotoPatina,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 电子包浆 · JPEG 二次压缩'
        }
    },
    {
        path: '/tools/piano-keys',
        name: 'piano-keys',
        component: PianoKeys,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- Piano Keys'
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