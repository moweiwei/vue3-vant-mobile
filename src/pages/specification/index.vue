<script setup lang="ts">
import type { ProjectItem } from '@/api/project'
import { showToast } from 'vant'
import { getProjectList } from '@/api/project'

defineOptions({
  name: 'Specification',
})

type ListItem = ProjectItem

const router = useRouter()

// Tab 相关
const activeTab = ref(0)

// 搜索关键词
const searchKeyword = ref('')

// 搜索请求的 AbortController，用于取消上一次未完成的搜索请求
let searchAbortController: AbortController | null = null

// 搜索请求ID，用于验证返回的结果是否是最新的请求
let searchRequestId = 0

// 列表加载请求ID，用于验证返回的结果是否是最新的请求
const listRequestId = {
  current: 0,
  shared: 0,
}

// 列表数据管理（使用对象统一管理两个 tab 的状态）
const listState = ref({
  current: {
    list: [] as ListItem[],
    loading: false,
    finished: false,
    page: 1,
  },
  shared: {
    list: [] as ListItem[],
    loading: false,
    finished: false,
    page: 1,
  },
})

// 获取当前激活的列表状态
const activeListState = computed(() => {
  return activeTab.value === 0 ? listState.value.current : listState.value.shared
})

// Radio 选中的项
const selectedRadio = ref<ListItem | null>(null)

// Popover 显示控制
const showPopover = ref(false)

// Collapse 激活的项
const activeNames = ref<number[]>([])

// 搜索框滚动控制
const searchFixed = ref(false)
const searchContainerRef = ref<HTMLElement>()

// 计算属性：根据当前 tab 获取对应的列表
const loading = computed(() => activeListState.value.loading)
const finished = computed(() => {
  // 搜索时不显示 finished 状态
  if (searchKeyword.value.trim()) {
    return true
  }
  return activeListState.value.finished
})
const rawList = computed(() => activeListState.value.list)

// 搜索结果列表（用于远程搜索）
const searchResultList = ref<ListItem[]>([])
const isSearching = ref(false)

// 防抖定时器
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// 过滤后的列表（根据搜索关键词）
const filteredList = computed(() => {
  // 如果有搜索关键词，返回搜索结果
  if (searchKeyword.value.trim()) {
    return searchResultList.value
  }
  // 否则返回原始列表
  return rawList.value
})

// 执行搜索（远程搜索）
async function performSearch(keyword: string) {
  // 取消上一次未完成的搜索请求
  if (searchAbortController) {
    searchAbortController.abort()
  }

  if (!keyword.trim()) {
    searchResultList.value = []
    isSearching.value = false
    return
  }

  // 生成新的请求ID（递增）
  searchRequestId++
  const currentRequestId = searchRequestId

  // 捕获当前的 tab 类型，避免在请求过程中 tab 切换导致类型不一致
  const currentType = activeTab.value === 0 ? 'current' : 'shared'
  const trimmedKeyword = keyword.trim()

  try {
    isSearching.value = true

    // 创建新的 AbortController
    searchAbortController = new AbortController()

    // 远程搜索：调用后端接口
    const res = await getProjectList({
      page: 1,
      pageSize: 50, // 搜索时可以返回更多结果
      type: currentType,
      keyword: trimmedKeyword,
    }, {
      signal: searchAbortController.signal,
    })

    // 关键：验证这个结果是否还是最新的请求
    // 如果请求ID不匹配，说明已经有新的搜索请求发出，丢弃这个旧结果
    if (currentRequestId !== searchRequestId) {
      // 丢弃过期的搜索结果
      return
    }

    // 再次验证当前搜索关键词是否还匹配（用户可能已经清空或修改）
    if (searchKeyword.value.trim() !== trimmedKeyword) {
      // 搜索关键词已变化，丢弃结果
      return
    }

    // 验证 tab 是否被切换
    const latestType = activeTab.value === 0 ? 'current' : 'shared'
    if (currentType !== latestType) {
      // Tab已切换，丢弃结果
      return
    }

    // 所有验证通过，更新搜索结果
    searchResultList.value = res.list
  }
  catch (error: any) {
    // 如果是主动取消的请求，不做处理
    if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
      return
    }

    // 只有在这是最新请求时才显示错误
    if (currentRequestId === searchRequestId) {
      console.error('搜索失败:', error)
      showToast('搜索失败，请重试')
    }
  }
  finally {
    // 只有在这是最新请求时才关闭 loading 状态
    if (currentRequestId === searchRequestId) {
      isSearching.value = false
    }
  }
}

// 防抖搜索函数
function debouncedSearch(keyword: string) {
  // 清除之前的定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  // 如果关键词为空，立即清空搜索结果
  if (!keyword.trim()) {
    performSearch('')
    return
  }

  // 设置新的定时器，延迟 300ms 执行搜索
  searchDebounceTimer = setTimeout(() => {
    performSearch(keyword)
  }, 300)
}

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  debouncedSearch(newKeyword)
})

// 统一的加载列表函数
async function loadList(type: 'current' | 'shared') {
  const state = listState.value[type]

  // 生成新的请求ID
  listRequestId[type]++
  const currentRequestId = listRequestId[type]

  // 捕获当前页码，避免在请求过程中被修改
  const currentPage = state.page

  try {
    state.loading = true

    const res = await getProjectList({
      page: currentPage,
      pageSize: 10,
      type,
    })

    // 验证这个结果是否还是最新的请求
    if (currentRequestId !== listRequestId[type]) {
      // 丢弃过期的列表加载结果
      return
    }

    // 验证页码是否还匹配（防止在请求过程中被重置）
    if (state.page !== currentPage) {
      // 页码已变化，丢弃结果
      return
    }

    // 所有验证通过，更新列表数据
    state.list.push(...res.list)

    // 更新状态
    state.finished = !res.hasMore

    // 如果还有更多数据，页码加1
    if (res.hasMore) {
      state.page++
    }
  }
  catch (error) {
    // 只有在这是最新请求时才显示错误
    if (currentRequestId === listRequestId[type]) {
      console.error(`加载${type === 'current' ? '当前' : '分享'}列表失败:`, error)
      showToast('加载失败，请重试')
      state.finished = true
    }
  }
  finally {
    // 只有在这是最新请求时才关闭 loading 状态
    if (currentRequestId === listRequestId[type]) {
      state.loading = false
    }
  }
}

// 触发加载的函数
function onLoad() {
  // 如果正在搜索，不加载更多
  if (searchKeyword.value.trim()) {
    activeListState.value.loading = false
    return
  }

  const type = activeTab.value === 0 ? 'current' : 'shared'
  activeListState.value.loading = true
  loadList(type)
}

// 切换 Tab
function onTabChange() {
  // 取消正在进行的搜索
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  // 清除防抖定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }

  // 递增搜索请求ID，使所有旧请求的结果失效
  searchRequestId++

  // 清空搜索关键词和结果
  searchKeyword.value = ''
  searchResultList.value = []
  isSearching.value = false

  // 重置选中状态
  selectedRadio.value = null
  activeNames.value = []

  // 如果切换到的列表为空，主动触发加载
  nextTick(() => {
    const type = activeTab.value === 0 ? 'current' : 'shared'
    const state = listState.value[type]

    if (state.list.length === 0 && !state.finished) {
      loadList(type)
    }
  })
}

// 处理 Radio 选择
function handleRadioChange(item: ListItem) {
  if (selectedRadio.value?.id === item.id) {
    // 如果点击已选中的，显示 Popover
    showPopover.value = true
  }
  else {
    // 选中新的 Radio
    selectedRadio.value = item
    showPopover.value = true
  }
}

// 处理分享
function handleShare() {
  if (selectedRadio.value) {
    showPopover.value = false
    // 跳转到分享配置页面（使用动态路由）
    router.push({
      path: `/specification/${selectedRadio.value.id}/share-config`,
      query: {
        itemTitle: selectedRadio.value.title,
      },
    })
  }
}

// 处理 Collapse 点击
function handleCollapseClick(itemId: number) {
  const index = activeNames.value.indexOf(itemId)
  if (index > -1) {
    activeNames.value.splice(index, 1)
  }
  else {
    activeNames.value.push(itemId)
  }
}

const scrollTop = ref(0)

// 处理滚动事件
function handleScroll() {
  const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  // Tab 高度约 44px，当滚动超过 44px 时固定搜索框
  searchFixed.value = scrollY > 44
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)

  // 清理搜索相关资源
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  // 递增请求ID，使所有旧请求失效
  searchRequestId++
})

onActivated(() => {
  window.scrollTo(0, scrollTop.value)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll)

  // 清理搜索相关资源
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  // 递增请求ID，使所有旧请求失效
  searchRequestId++
})

onBeforeRouteLeave(() => {
  scrollTop.value
    = window.scrollY
      || document.documentElement.scrollTop
      || document.body.scrollTop
})
</script>

<template>
  <div class="page-container">
    <!-- Tab 切换 -->
    <van-tabs
      v-model:active="activeTab"
      @change="onTabChange"
    >
      <van-tab title="当前列表">
        <template #title>
          <div class="tab-title">
            <van-icon name="bars" />
            <span>当前列表</span>
            <!-- <van-badge v-if="currentList.length > 0" :content="currentList.length" max="99" /> -->
          </div>
        </template>
      </van-tab>
      <van-tab title="分享列表">
        <template #title>
          <div class="tab-title">
            <van-icon name="share-o" />
            <span>分享列表</span>
            <!-- <van-badge v-if="sharedList.length > 0" :content="sharedList.length" max="99" /> -->
          </div>
        </template>
      </van-tab>
    </van-tabs>

    <!-- 搜索框 -->
    <div
      ref="searchContainerRef"
      class="search-container"
      :class="{ 'is-fixed': searchFixed }"
    >
      <van-search
        v-model="searchKeyword"
        shape="round"
        :placeholder="activeTab === 0 ? '搜索当前列表' : '搜索分享列表'"
        clearable
      />
    </div>

    <!-- 占位元素，防止内容跳动 -->
    <div v-if="searchFixed" class="search-placeholder" />

    <!-- 列表内容 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      :finished-text="$t('scrollCache.finished')"
      :loading-text="$t('scrollCache.loading')"
      @load="onLoad"
    >
      <!-- 空状态提示 -->
      <van-empty
        v-if="searchKeyword && filteredList.length === 0 && !isSearching"
        image="search"
        description="暂无搜索结果"
      >
        <van-button round type="primary" size="small" @click="searchKeyword = ''">
          清空搜索
        </van-button>
      </van-empty>

      <!-- 列表为空提示 -->
      <van-empty
        v-else-if="!searchKeyword && rawList.length === 0 && finished"
        image="default"
        :description="activeTab === 0 ? '暂无当前列表数据' : '暂无分享列表数据'"
      />

      <div v-else class="list-container">
        <van-collapse v-model="activeNames" class="custom-collapse">
          <van-collapse-item
            v-for="item in filteredList"
            :key="item.id"
            :name="item.id"
            :border="false"
          >
            <template #title>
              <div class="item-header" @click.stop="handleCollapseClick(item.id)">
                <div class="radio-container" @click.stop>
                  <van-radio
                    :name="item.id"
                    :model-value="selectedRadio?.id"
                    @click="handleRadioChange(item)"
                  />
                </div>

                <div class="item-content">
                  <div class="item-top">
                    <h3 class="item-title">
                      <van-text-ellipsis :content="item.title" />
                    </h3>
                    <time class="item-date">{{ item.date }}</time>
                  </div>

                  <p class="item-summary">
                    <van-text-ellipsis :rows="2" :content="item.summary" />
                  </p>
                </div>
              </div>
            </template>

            <template #default>
              <div class="item-details">
                <p class="details-text">
                  {{ item.details }}
                </p>
                <div class="details-info">
                  <van-tag type="primary">
                    标签1
                  </van-tag>
                  <van-tag type="success">
                    标签2
                  </van-tag>
                  <van-tag type="warning">
                    标签3
                  </van-tag>
                </div>
              </div>
            </template>
          </van-collapse-item>
        </van-collapse>
      </div>
    </van-list>
  </div>

  <!-- Action Sheet 弹窗 -->
  <van-action-sheet
    v-model:show="showPopover"
    :title="selectedRadio?.title || '操作'"
  >
    <div class="action-content">
      <van-button type="primary" block @click="handleShare">
        <van-icon name="share-o" />
        分享
      </van-button>
      <van-button block style="margin-top: 12px;" @click="showPopover = false">
        取消
      </van-button>
    </div>
  </van-action-sheet>
</template>

<style scoped lang="less">
.page-container {
  min-height: 100vh;
  background: var(--van-background);
  margin: -16px;
  margin-top: -16px;
  margin-bottom: -16px;
}

// Tab 样式
.tab-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;

  .van-badge {
    margin-left: 4px;
  }
}

// 搜索框容器
.search-container {
  background: var(--van-background-2);
  padding: 8px 16px;
  transition: all 0.3s ease;
  z-index: 98;

  &.is-fixed {
    position: fixed;
    top: 46px;
    left: 0;
    right: 0;
    z-index: 99;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.van-search) {
    padding: 0;
  }
}

// 搜索框占位元素
.search-placeholder {
  height: 56px; // 搜索框的高度
}

.list-container {
  padding: 12px 16px 16px;
}

.custom-collapse {
  :deep(.van-collapse-item) {
    margin-bottom: 12px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--van-background-2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    &__title {
      padding: 0;

      &--expanded {
        .item-header {
          border-bottom: 1px solid var(--van-border-color);
        }
      }

      // 调整箭头位置，与标题对齐
      .van-cell__right-icon {
        position: absolute;
        right: 12px;
        top: 12px; // 与 item-header 的 padding-top 一致
        margin-left: 0;
      }
    }

    &__content {
      padding: 0;
      background: var(--van-background-2);
    }
  }
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  padding-right: 40px; // 为箭头留出空间
  width: 100%;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.radio-container {
  flex-shrink: 0;
  padding-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.item-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color);
  margin: 0;
  line-height: 1.4;
}

.item-date {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--van-text-color-3);
}

.item-summary {
  font-size: 14px;
  color: var(--van-text-color-2);
  line-height: 1.5;
  margin: 0;
}

.item-details {
  padding: 12px;
  padding-top: 0;
}

.details-text {
  font-size: 14px;
  color: var(--van-text-color-2);
  line-height: 1.6;
  margin: 8px 0;
}

.details-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.action-content {
  padding: 16px;
}
</style>

<route lang="json5">
{
  name: 'Specification',
  meta: {
    keepAlive: true
  },
}
</route>
