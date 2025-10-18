<script setup lang="ts">
import type { ProjectItem } from '@/api/project'
import { showToast } from 'vant'
import { getProjectList } from '@/api/project'
import { useSearchController } from '@/composables/useAsyncSearchAbort'

defineOptions({
  name: 'Specification',
})

type ListItem = ProjectItem

const router = useRouter()

// Tab 相关
const activeTab = ref(0)

// 列表加载请求ID，用于验证返回的结果是否是最新的请求
const listRequestId = {
  current: 0,
  shared: 0,
}

// 统一的列表状态管理（包含搜索和分页）
const listState = ref({
  current: {
    // 当前显示的列表（可能是搜索结果或分页列表）
    displayList: [] as ListItem[],
    // 原始分页列表（用于搜索清空后恢复）
    rawList: [] as ListItem[],
    // 搜索关键词
    searchKeyword: '',
    // 是否处于搜索模式
    isSearchMode: false,
    // 加载状态
    loading: false,
    // 是否加载完成（搜索模式下表示搜索完成，分页模式下表示无更多数据）
    finished: false,
    // 分页页码
    page: 1,
  },
  shared: {
    displayList: [] as ListItem[],
    rawList: [] as ListItem[],
    searchKeyword: '',
    isSearchMode: false,
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

// 创建搜索控制器（为每个 tab 创建独立实例）
const currentSearchController = useSearchController<ListItem>(
  async (keyword: string, signal?: AbortSignal) => {
    const res = await getProjectList({
      page: 1,
      pageSize: 50,
      type: 'current',
      keyword,
    }, { signal })
    return res.list
  },
  {
    delay: 300,
    onSuccess: (data) => {
      const state = listState.value.current
      state.displayList = data
      state.isSearchMode = true
      state.loading = false
      state.finished = true
    },
    onError: () => {
      const state = listState.value.current
      state.loading = false
      state.finished = true
      showToast('搜索失败，请重试')
    },
    onClear: () => {
      const state = listState.value.current
      state.displayList = state.rawList
      state.isSearchMode = false
      state.finished = state.rawList.length === 0 || state.page > 1
    },
  },
)

const sharedSearchController = useSearchController<ListItem>(
  async (keyword: string, signal?: AbortSignal) => {
    const res = await getProjectList({
      page: 1,
      pageSize: 50,
      type: 'shared',
      keyword,
    }, { signal })
    return res.list
  },
  {
    delay: 300,
    onSuccess: (data) => {
      const state = listState.value.shared
      state.displayList = data
      state.isSearchMode = true
      state.loading = false
      state.finished = true
    },
    onError: () => {
      const state = listState.value.shared
      state.loading = false
      state.finished = true
      showToast('搜索失败，请重试')
    },
    onClear: () => {
      const state = listState.value.shared
      state.displayList = state.rawList
      state.isSearchMode = false
      state.finished = state.rawList.length === 0 || state.page > 1
    },
  },
)

// 获取当前激活的搜索控制器
const activeSearchController = computed(() => {
  return activeTab.value === 0 ? currentSearchController : sharedSearchController
})

// 简化后的计算属性（无需状态切换）
const displayList = computed(() => activeListState.value.displayList)
const loading = computed(() => activeListState.value.loading)
const finished = computed(() => activeListState.value.finished)
const searchKeyword = computed({
  get: () => activeListState.value.searchKeyword,
  set: (val: string) => {
    activeListState.value.searchKeyword = val
  },
})
const isSearchMode = computed(() => activeListState.value.isSearchMode)

// 统一的加载列表函数（分页加载）
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
    state.rawList.push(...res.list)

    // 如果不在搜索模式，同步更新显示列表
    if (!state.isSearchMode) {
      state.displayList = state.rawList
    }

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
  const state = activeListState.value

  // 如果正在搜索，不加载更多
  if (state.isSearchMode) {
    return
  }

  const type = activeTab.value === 0 ? 'current' : 'shared'
  loadList(type)
}

// 处理搜索关键词变化
watch(searchKeyword, (keyword) => {
  const state = activeListState.value

  // 开始加载
  state.loading = true
  state.finished = false

  // 触发搜索控制器
  activeSearchController.value.search(keyword)
})

// 切换 Tab
function onTabChange() {
  // 取消所有进行中的搜索请求
  currentSearchController.cancel()
  sharedSearchController.cancel()

  // 清空搜索关键词（会自动触发 onClear 恢复显示列表）
  const currentState = listState.value.current
  const sharedState = listState.value.shared
  currentState.searchKeyword = ''
  sharedState.searchKeyword = ''

  // 重置选中状态
  selectedRadio.value = null
  activeNames.value = []

  // 如果切换到的列表为空，主动触发加载
  nextTick(() => {
    const type = activeTab.value === 0 ? 'current' : 'shared'
    const state = listState.value[type]

    if (state.rawList.length === 0 && !state.finished) {
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
  // 搜索资源会由 hook 自动清理
})

onActivated(() => {
  window.scrollTo(0, scrollTop.value)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll)
  // 清理搜索资源
  currentSearchController.cleanup()
  sharedSearchController.cleanup()
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
        v-if="isSearchMode && displayList.length === 0 && !loading"
        image="search"
        description="暂无搜索结果"
      >
        <van-button round type="primary" size="small" @click="searchKeyword = ''">
          清空搜索
        </van-button>
      </van-empty>

      <!-- 列表为空提示 -->
      <van-empty
        v-else-if="!isSearchMode && displayList.length === 0 && finished"
        image="default"
        :description="activeTab === 0 ? '暂无当前列表数据' : '暂无分享列表数据'"
      />

      <div v-else class="list-container">
        <van-collapse v-model="activeNames" class="custom-collapse">
          <van-collapse-item
            v-for="item in displayList"
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
