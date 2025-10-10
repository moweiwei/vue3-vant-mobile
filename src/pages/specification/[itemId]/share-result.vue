<script setup lang="ts">
import { showSuccessToast, showToast } from 'vant'
import QRCode from 'qrcode'

defineOptions({
  name: 'ShareResult',
})

const route = useRoute()

// 从路由参数获取分享信息
const itemId = computed(() => route.params.itemId as string)
const itemTitle = computed(() => route.query.itemTitle as string || '')
const validity = computed(() => route.query.validity as string || '7')
const password = computed(() => route.query.password as string || '')
const description = computed(() => route.query.description as string || '')

// 生成分享链接
const shareLink = computed(() => {
  const baseUrl = window.location.origin
  const params = new URLSearchParams({
    v: validity.value,
  })
  if (password.value) {
    params.append('pwd', password.value)
  }
  return `${baseUrl}/specification/${itemId.value}/share-access?${params.toString()}`
})

// 二维码 canvas ref
const qrcodeCanvas = ref<HTMLCanvasElement>()
const qrcodeDataUrl = ref('')

// 生成二维码
async function generateQRCode() {
  if (!qrcodeCanvas.value)
    return

  try {
    await QRCode.toCanvas(qrcodeCanvas.value, shareLink.value, {
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // 同时生成 DataURL 用于下载
    qrcodeDataUrl.value = qrcodeCanvas.value.toDataURL('image/png')
  }
  catch (error) {
    console.error('生成二维码失败:', error)
    showToast('生成二维码失败')
  }
}

// 复制链接
async function copyLink() {
  try {
    // 使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareLink.value)
      showSuccessToast('链接已复制')
    }
    else {
      // 降级方案：使用传统方法
      const textarea = document.createElement('textarea')
      textarea.value = shareLink.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showSuccessToast('链接已复制')
    }
  }
  catch (error) {
    console.error('复制失败:', error)
    showToast('复制失败，请手动复制')
  }
}

// 复制提取码
async function copyPassword() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(password.value)
      showSuccessToast('提取码已复制')
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.value = password.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showSuccessToast('提取码已复制')
    }
  }
  catch (error) {
    console.error('复制失败:', error)
    showToast('复制失败')
  }
}

// 保存二维码
function saveQRCode() {
  if (!qrcodeDataUrl.value) {
    showToast('二维码未生成')
    return
  }

  try {
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `share-qrcode-${itemId.value}.png`
    link.href = qrcodeDataUrl.value
    link.click()
    showSuccessToast('二维码已保存')
  }
  catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  }
}

// 分享到其他平台
function shareToOthers() {
  // 使用 Web Share API（如果支持）
  if (navigator.share) {
    navigator.share({
      title: itemTitle.value || '分享',
      text: description.value || '我分享了一个资源给你',
      url: shareLink.value,
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('分享失败:', error)
      }
    })
  }
  else {
    showToast('当前浏览器不支持分享功能')
  }
}

// 有效期文本
const validityText = computed(() => {
  const map: Record<string, string> = {
    '1': '1天',
    '7': '7天',
    '30天': '30天',
    'forever': '永久有效',
  }
  return map[validity.value] || '7天'
})

onMounted(() => {
  generateQRCode()
})
</script>

<template>
  <div class="share-result-page">
    <!-- 成功提示 -->
    <div class="success-header">
      <van-icon name="passed" color="#07c160" size="64" />
      <h2>分享链接已生成</h2>
      <p>{{ itemTitle || `项目 #${itemId}` }}</p>
    </div>

    <!-- 二维码区域 -->
    <div class="qrcode-section">
      <div class="qrcode-container">
        <canvas ref="qrcodeCanvas" />
      </div>
      <p class="qrcode-tip">
        扫描二维码查看分享内容
      </p>
      <van-button type="primary" plain size="small" @click="saveQRCode">
        <van-icon name="down" />
        保存二维码
      </van-button>
    </div>

    <!-- 分享信息 -->
    <van-cell-group inset class="share-info">
      <van-cell title="分享链接" :label="shareLink" is-link @click="copyLink">
        <template #right-icon>
          <van-button type="primary" size="small" @click.stop="copyLink">
            复制
          </van-button>
        </template>
      </van-cell>

      <van-cell v-if="password" title="提取码" center>
        <template #value>
          <span class="password-text">{{ password }}</span>
        </template>
        <template #right-icon>
          <van-button type="primary" size="small" @click="copyPassword">
            复制
          </van-button>
        </template>
      </van-cell>

      <van-cell title="有效期" :value="validityText" />

      <van-cell v-if="description" title="分享描述" :label="description" />
    </van-cell-group>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button type="primary" block @click="shareToOthers">
        <van-icon name="share-o" />
        分享到其他平台
      </van-button>

      <van-button plain block style="margin-top: 12px;" @click="$router.back()">
        完成
      </van-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.share-result-page {
  padding: 16px;
  min-height: calc(100vh - 100px);
  background: var(--van-background);
}

.success-header {
  text-align: center;
  padding: 32px 16px;
  background: var(--van-background-2);
  border-radius: 12px;
  margin-bottom: 24px;

  h2 {
    margin: 16px 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--van-text-color);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--van-text-color-2);
  }
}

.qrcode-section {
  text-align: center;
  padding: 24px;
  background: var(--van-background-2);
  border-radius: 12px;
  margin-bottom: 24px;
}

.qrcode-container {
  display: inline-block;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  canvas {
    display: block;
  }
}

.qrcode-tip {
  margin: 16px 0 12px;
  font-size: 14px;
  color: var(--van-text-color-2);
}

.share-info {
  margin-bottom: 24px;

  .van-cell {
    :deep(.van-cell__label) {
      word-break: break-all;
    }
  }

  .password-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--van-primary-color);
    letter-spacing: 2px;
  }
}

.action-buttons {
  padding-bottom: 16px;

  .van-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}
</style>

<route lang="json5">
{
  name: 'ShareResult',
  meta: {
    keepAlive: false
  },
}
</route>
