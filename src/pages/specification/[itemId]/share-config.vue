<script setup lang="ts">
import { showToast } from 'vant'

defineOptions({
  name: 'ShareConfig',
})

const route = useRoute()
const router = useRouter()

// 从路由参数获取要分享的项目信息
const itemId = computed(() => route.params.itemId as string)
const itemTitle = computed(() => route.query.itemTitle as string || '')

// 表单数据
const formData = reactive({
  validity: '7', // 有效期（天）
  requirePassword: false, // 是否需要提取码
  password: '', // 提取码
  description: '', // 分享描述
})

// 有效期选项
const validityOptions = [
  { text: '1天', value: '1' },
  { text: '7天', value: '7' },
  { text: '30天', value: '30' },
  { text: '永久有效', value: 'forever' },
]

const showValidityPicker = ref(false)

// 选择有效期
function onValidityConfirm(option: { text: string, value: string }) {
  formData.validity = option.value
  showValidityPicker.value = false
}

// 自动生成提取码
function generatePassword() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  formData.password = password
}

// 监听是否需要提取码
watch(() => formData.requirePassword, (newVal) => {
  if (newVal && !formData.password) {
    generatePassword()
  }
})

// 生成分享链接
function handleGenerateShare() {
  // 验证表单
  if (formData.requirePassword && !formData.password) {
    showToast('请输入提取码')
    return
  }

  if (formData.requirePassword && formData.password.length < 4) {
    showToast('提取码至少4位')
    return
  }

  // 跳转到分享结果页面
  router.push({
    path: `/specification/${itemId.value}/share-result`,
    query: {
      itemTitle: itemTitle.value,
      validity: formData.validity,
      password: formData.requirePassword ? formData.password : '',
      description: formData.description,
    },
  })
}
</script>

<template>
  <div class="share-config-page">
    <van-cell-group inset>
      <!-- 分享项目信息 -->
      <van-cell title="分享项目" :value="itemTitle || `项目 #${itemId}`" />

      <!-- 有效期 -->
      <van-cell
        title="有效期"
        is-link
        :value="validityOptions.find(item => item.value === formData.validity)?.text"
        @click="showValidityPicker = true"
      />

      <!-- 提取码开关 -->
      <van-cell title="设置提取码" center>
        <template #right-icon>
          <van-switch v-model="formData.requirePassword" size="20" />
        </template>
      </van-cell>

      <!-- 提取码输入 -->
      <van-field
        v-if="formData.requirePassword"
        v-model="formData.password"
        label="提取码"
        placeholder="请输入4-8位提取码"
        maxlength="8"
        clearable
      >
        <template #button>
          <van-button size="small" type="primary" @click="generatePassword">
            随机生成
          </van-button>
        </template>
      </van-field>

      <!-- 分享描述 -->
      <van-field
        v-model="formData.description"
        rows="3"
        autosize
        label="分享描述"
        type="textarea"
        maxlength="200"
        placeholder="请输入分享描述（可选）"
        show-word-limit
      />
    </van-cell-group>

    <!-- 底部按钮 -->
    <div class="footer-actions">
      <van-button type="primary" size="large" block @click="handleGenerateShare">
        <van-icon name="share-o" />
        生成分享链接
      </van-button>
    </div>

    <!-- 有效期选择器 -->
    <van-popup v-model:show="showValidityPicker" position="bottom">
      <van-picker
        :columns="validityOptions"
        @confirm="onValidityConfirm"
        @cancel="showValidityPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.share-config-page {
  padding: 16px;
  min-height: calc(100vh - 100px);
  background: var(--van-background);
}

.van-cell-group {
  margin-bottom: 16px;
}

.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: var(--van-background-2);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;

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
  name: 'ShareConfig',
  meta: {
    keepAlive: false
  },
}
</route>
