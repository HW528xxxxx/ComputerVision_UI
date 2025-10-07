import { createRouter, createWebHistory } from 'vue-router'
import ImageUploader from '../views/ImageUploader.vue'
import ObjectTracking from '../views/ObjectTracking.vue'

const routes = [
  { path: '/analysis', name: 'ImageUploader', component: ImageUploader },
  { path: '/tracking', name: 'ObjectTracking', component: ObjectTracking },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
