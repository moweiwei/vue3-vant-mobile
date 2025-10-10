<script setup lang="ts">
defineOptions({
  name: 'Unauthorized',
})

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  }
  else {
    router.replace('/')
  }
}

function retryAuth() {
  router.replace('/wechat/access')
}
</script>

<template>
  <div class="unauthorized-container">
    <div class="content-wrapper">
      <van-empty
        image="error"
        description=""
      >
        <template #image>
          <div class="custom-image">
            <van-icon name="warning-o" size="80" color="#ee0a24" />
          </div>
        </template>

        <template #description>
          <div class="error-info">
            <h2 class="error-title">
              无权访问
            </h2>
            <p class="error-message">
              抱歉，您暂时没有访问该页面的权限
            </p>
            <div class="error-tips">
              <p>可能的原因：</p>
              <ul>
                <li>未获得授权或授权已过期</li>
                <li>网络连接异常</li>
                <li>授权凭证无效</li>
              </ul>
            </div>
          </div>
        </template>
      </van-empty>

      <div class="action-buttons">
        <van-button
          type="primary"

          round block
          @click="retryAuth"
        >
          <van-icon name="replay" />
          重新授权
        </van-button>

        <van-button

          round block
          style="margin-top: 12px;"
          @click="goBack"
        >
          返回上一页
        </van-button>
      </div>

      <div class="help-text">
        如有疑问，请联系管理员
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.unauthorized-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--van-background);
  padding: 20px;
}

.content-wrapper {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.custom-image {
  margin-bottom: 16px;
  animation: shake 0.5s ease-in-out;
}

.error-info {
  padding: 0 16px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--van-text-color);
  margin: 16px 0 8px;
}

.error-message {
  font-size: 15px;
  color: var(--van-text-color-2);
  margin: 8px 0 16px;
  line-height: 1.6;
}

.error-tips {
  background: var(--van-background-2);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
  text-align: left;

  p {
    font-size: 14px;
    font-weight: 500;
    color: var(--van-text-color-2);
    margin-bottom: 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 13px;
      color: var(--van-text-color-3);
      line-height: 1.8;
      padding-left: 16px;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--van-primary-color);
      }
    }
  }
}

.action-buttons {
  margin-top: 32px;
  padding: 0 16px;
}

.help-text {
  margin-top: 24px;
  font-size: 12px;
  color: var(--van-text-color-3);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}
</style>

<route lang="json5">
{
  name: 'Unauthorized',
  meta: {
    title: '无权访问',
  },
}
</route>
