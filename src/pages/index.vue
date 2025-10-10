<script setup lang="ts">
import type { PickerColumn } from 'vant'
import { languageColumns, locale } from '@/utils/i18n'

const { t } = useI18n()
const router = useRouter()

// 项目根路由默认进入 /specification 页面
onMounted(() => {
  // 如果是从根路径进入（没有 history），自动跳转到 specification
  if (!window.history.state.back) {
    router.replace('/specification')
  }
})

const checked = computed({
  get: () => isDark.value,
  set: () => toggleDark(),
})

const menuItems = computed(() => ([
  { title: t('navbar.Mock'), route: 'mock' },
  { title: t('navbar.Charts'), route: 'charts' },
  { title: t('navbar.UnoCSS'), route: 'unocss' },
  { title: t('navbar.Counter'), route: 'counter' },
  { title: t('navbar.KeepAlive'), route: 'keepalive' },
  { title: t('navbar.Specification'), route: 'specification' },
  { title: '微信授权', route: 'wechat-access' },
  { title: t('navbar.404'), route: 'unknown' },
]))

const showLanguagePicker = ref(false)
const languageValues = ref<Array<string>>([locale.value])
const language = computed(() => languageColumns.find(l => l.value === locale.value).text)

function onLanguageConfirm(event: { selectedOptions: PickerColumn }) {
  locale.value = event.selectedOptions[0].value as string
  showLanguagePicker.value = false
}
</script>

<template>
  <van-cell-group :title="$t('home.settings')" :border="false" :inset="true">
    <van-cell center :title="$t('home.darkMode')">
      <template #right-icon>
        <van-switch
          v-model="checked"
          size="20px"
          aria-label="on/off Dark Mode"
        />
      </template>
    </van-cell>

    <van-cell
      is-link
      :title="$t('home.language')"
      :value="language"
      @click="showLanguagePicker = true"
    />
  </van-cell-group>

  <van-cell-group :title="$t('home.examples')" :border="false" :inset="true">
    <template v-for="item in menuItems" :key="item.route">
      <van-cell :title="item.title" :to="item.route" is-link />
    </template>
  </van-cell-group>

  <van-popup v-model:show="showLanguagePicker" position="bottom">
    <van-picker
      v-model="languageValues"
      :columns="languageColumns"
      @confirm="onLanguageConfirm"
      @cancel="showLanguagePicker = false"
    />
  </van-popup>
</template>

<route lang="json5">
{
  name: 'Home'
}
</route>
