<script setup lang="ts">
import { rootRouteList } from '@/config/routes'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

/**
 * Get page title
 * Located in src/locales/json
 */
const title = computed(() => {
  // 如果有路由名称，使用路由名称
  if (route.name && typeof route.name === 'string' && !route.name.startsWith('/')) {
    return t(`navbar.${route.name}`)
  }

  // 降级方案：如果 route.name 是路径格式，尝试从路径推断
  // 例如：/scroll-cache/ -> ScrollCache
  if (route.name && typeof route.name === 'string' && route.name.startsWith('/')) {
    // 从路径提取名称：/scroll-cache/ -> scroll-cache
    const pathName = route.name.replace(/^\/|\/$/g, '')
    // 转换为 PascalCase：scroll-cache -> ScrollCache
    const routeName = pathName.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
    return t(`navbar.${routeName}`)
  }

  return t('navbar.Undefined')
})

/**
 * Show the left arrow
 * If route name is in rootRouteList, hide left arrow
 */
const showLeftArrow = computed(() => {
  if (route.name && rootRouteList.includes(route.name)) {
    return false
  }

  return true
})

function onBack() {
  if (window.history.state.back) {
    history.back()
  }
  else {
    router.replace('/')
  }
}
</script>

<template>
  <VanNavBar
    :title="title"
    :fixed="true"
    :left-arrow="showLeftArrow"
    placeholder clickable
    @click-left="onBack"
  />
</template>

<style scoped>
:deep(.van-nav-bar) {
  z-index: 2;
}
</style>
