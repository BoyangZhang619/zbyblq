import { createRouter, createWebHistory } from 'vue-router'

// 主页面
import HomeView from '@/modules/discovery/views/HomeView.vue'
import CategoryView from '@/modules/discovery/views/CategoryView.vue'
import ProfileView from '@/modules/profile/views/ProfileView.vue'

// 工具页
import BTreeVisual from '@/modules/tools/btree-visual/index.vue'
import EftTool from '@/modules/tools/eft-tool/index.vue'
import EncryptionGraph from '@/modules/tools/encryption-graph/index.vue'
import DrumPad from '@/modules/tools/drum-pad/index.vue'
import Kalimba from '@/modules/tools/kalimba/index.vue'
import SortViz from '@/modules/tools/sort-viz/index.vue'
import Img2Ascii from '@/modules/tools/img2ascii/index.vue'
import Pixelate from '@/modules/tools/pixelate/index.vue'
import FloydSteinberg from '@/modules/tools/floyd-steinberg/index.vue'
import PathfindingVisualize from '@/modules/tools/pathfinding-visualize/index.vue'
import PhotoPatina from '@/modules/tools/photo-patina/index.vue'
import PianoKeys from '@/modules/tools/piano-keys/index.vue'

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
        component: HomeView,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 主页'
        }
    },
    {
        path: '/sort',
        name: 'sort',
        component: CategoryView,
        meta: {
            title: '『𝑍𝐵𝑌𝐵𝐿𝑄』- 分类'
        }
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
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