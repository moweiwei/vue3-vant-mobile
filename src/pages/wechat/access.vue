<script setup lang="ts">
import { showNotify } from 'vant'
import { getToken, setToken } from '@/utils/auth'
import { getWechatAccessToken, verifyToken } from '@/api/user'

defineOptions({
  name: 'WechatAccess',
})

const router = useRouter()
const route = useRoute()

// 加载状态
const loading = ref(true)
const loadingText = ref('正在验证身份...')

// 处理鉴权逻辑
async function handleAuth() {
  try {
    // 1. 检查本地是否有 token
    const localToken = getToken()

    if (localToken) {
      // 2. 有 token，验证是否过期
      loadingText.value = '验证 Token 有效性...'
      try {
        await verifyToken()
        // Token 有效，直接跳转
        loadingText.value = '验证成功，即将跳转...'
        await new Promise(resolve => setTimeout(resolve, 500))
        router.replace('/scroll-cache')
        return
      }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (error) {
        // Token 过期，继续获取新 token
        // console.log('Token 已过期，尝试获取新 token')
      }
    }

    // 3. 没有 token 或 token 过期，尝试获取新 token
    loadingText.value = '获取访问凭证...'
    const code = route.query.code as string // 从 URL 获取微信授权 code

    const { data } = await getWechatAccessToken(code)

    if (data && data.token) {
      // 4. 获取成功，存储到本地
      setToken(data.token)
      loadingText.value = '授权成功，即将跳转...'
      await new Promise(resolve => setTimeout(resolve, 500))
      router.replace('/scroll-cache')
    }
    else {
      // 5. 获取失败，跳转到无权访问页面
      router.replace('/unauthorized')
    }
  }
  catch (error: any) {
    console.error('鉴权失败:', error)
    // 显示错误提示
    showNotify({
      type: 'danger',
      message: error?.message || '授权失败',
      duration: 2000,
    })
    // 延迟跳转到无权访问页面
    setTimeout(() => {
      router.replace('/unauthorized')
    }, 2000)
  }
  finally {
    loading.value = false
  }
}

// 页面加载时执行鉴权
onMounted(() => {
  handleAuth()
})
</script>

<template>
  <div class="wechat-access-container">
    <div class="loading-wrapper">
      <van-loading
        size="48px"
        type="spinner"
        color="#1989fa"
        vertical
      >
        <template #icon>
          <van-icon name="checked" size="48" color="#1989fa" class="loading-icon" />
        </template>
        {{ loadingText }}
      </van-loading>

      <div class="tips">
        <p>正在为您建立安全连接</p>
        <p class="sub-tips">
          请稍候...
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.wechat-access-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading-wrapper {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 48px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  min-width: 280px;

  :deep(.van-loading) {
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }

  .loading-icon {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

.tips {
  margin-top: 24px;
  color: #666;

  p {
    margin: 8px 0;
    font-size: 14px;
  }

  .sub-tips {
    font-size: 12px;
    color: #999;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}
</style>

<route lang="json5">
{
  name: 'WechatAccess',
  meta: {
    title: '微信授权',
  },
}
</route>
