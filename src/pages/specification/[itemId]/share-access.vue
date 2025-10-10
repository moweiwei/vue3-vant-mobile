<script setup lang="ts">
import { showToast } from 'vant'

defineOptions({
  name: 'ShareAccess',
})

const route = useRoute()
const router = useRouter()

// 从路由参数获取分享 ID
const itemId = computed(() => route.params.itemId as string)
const validity = computed(() => route.query.v as string || '')
const requirePassword = computed(() => !!route.query.pwd)
const correctPassword = computed(() => route.query.pwd as string || '')

// 用户输入的提取码
const inputPassword = ref('')
const loading = ref(false)

// 分享内容（模拟数据）
const shareContent = ref<any>(null)

// 验证提取码并获取内容
async function handleAccess() {
  if (requirePassword.value && !inputPassword.value) {
    showToast('请输入提取码')
    return
  }

  if (requirePassword.value && inputPassword.value !== correctPassword.value) {
    showToast('提取码错误')
    return
  }

  loading.value = true

  // 模拟 API 请求
  setTimeout(() => {
    shareContent.value = {
      id: itemId.value,
      title: `分享项目 ${itemId.value}`,
      date: '2025-05-16',
      summary: '这是一个分享的项目内容，包含详细的信息和资源。',
      details: '详细内容：这里是完整的项目信息，包含各种详细描述、参数配置、使用说明等内容。用户可以查看和使用这些分享的资源。',
    }
    loading.value = false
  }, 1000)
}

// 保存到我的列表
function saveToMyList() {
  showToast('已保存到我的列表')
  setTimeout(() => {
    router.push('/specification')
  }, 1000)
}

// 有效期文本
const validityText = computed(() => {
  const map: Record<string, string> = {
    1: '1天',
    7: '7天',
    30: '30天',
    forever: '永久有效',
  }
  return map[validity.value] || '7天'
})
</script>

<template>
  <div class="share-access-page">
    <!-- 分享信息头部 -->
    <div class="share-header">
      <van-icon name="share-o" size="48" color="var(--van-primary-color)" />
      <h2>查看分享内容</h2>
      <p>项目 ID: {{ itemId }}</p>
      <p>有效期：{{ validityText }}</p>
    </div>

    <!-- 未验证状态：需要输入提取码 -->
    <div v-if="requirePassword && !shareContent" class="password-section">
      <van-cell-group inset>
        <van-field
          v-model="inputPassword"
          label="提取码"
          placeholder="请输入提取码"
          maxlength="8"
          clearable
          center
        >
          <template #button>
            <van-button
              type="primary"
              size="small"
              :loading="loading"
              @click="handleAccess"
            >
              确定
            </van-button>
          </template>
        </van-field>
      </van-cell-group>

      <div class="tips">
        <van-icon name="info-o" />
        <span>请输入分享者提供的提取码</span>
      </div>
    </div>

    <!-- 无需提取码，直接显示获取按钮 -->
    <div v-else-if="!requirePassword && !shareContent" class="access-section">
      <van-button
        type="primary"
        size="large"
        block
        :loading="loading"
        @click="handleAccess"
      >
        查看分享内容
      </van-button>
    </div>

    <!-- 已验证：显示分享内容 -->
    <div v-if="shareContent" class="content-section">
      <van-cell-group inset>
        <van-cell title="项目名称" :value="shareContent.title" />
        <van-cell title="分享日期" :value="shareContent.date" />
        <van-cell title="项目简介" :label="shareContent.summary" />
      </van-cell-group>

      <van-cell-group inset style="margin-top: 16px;">
        <van-cell title="详细内容" />
        <div class="content-details">
          <p>{{ shareContent.details }}</p>
        </div>
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-section">
        <van-button type="primary" block size="large" @click="saveToMyList">
          <van-icon name="plus" />
          保存到我的列表
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.share-access-page {
  padding: 16px;
  min-height: calc(100vh - 100px);
  background: var(--van-background);
}

.share-header {
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
    margin: 4px 0;
    font-size: 14px;
    color: var(--van-text-color-2);
  }
}

.password-section {
  .tips {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 16px;
    padding: 12px;
    font-size: 14px;
    color: var(--van-text-color-3);

    .van-icon {
      font-size: 16px;
    }
  }
}

.access-section {
  padding: 24px 0;
}

.content-section {
  .van-cell-group {
    margin-bottom: 16px;
  }
}

.content-details {
  padding: 16px;
  background: var(--van-background);

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--van-text-color-2);
  }
}

.action-section {
  margin-top: 24px;
  padding: 16px 0;

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
  name: 'ShareAccess',
  meta: {
    keepAlive: false
  },
}
</route>
