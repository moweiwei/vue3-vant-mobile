import { onUnmounted } from 'vue'
import { debounce } from 'lodash-es'

export interface UseSearchControllerOptions {
  /**
   * 防抖延迟时间（毫秒）
   */
  delay?: number
  /**
   * 搜索成功回调
   */
  onSuccess?: (data: any[], keyword: string) => void
  /**
   * 搜索错误回调
   */
  onError?: (error: any) => void
  /**
   * 搜索清空回调（当关键词为空时触发）
   */
  onClear?: () => void
}

/**
 * 统一状态管理版搜索控制器
 * 只负责搜索请求的控制（防抖、取消、竞态），不维护状态
 *
 * 特性：
 * - 防抖：避免频繁请求
 * - 请求取消：自动取消上次未完成的请求
 * - 竞态保护：使用 requestId 确保只处理最新请求的结果
 * - 自动清理：组件卸载时自动清理资源
 * - 职责单一：不维护状态，由组件统一管理
 *
 * @param fetcher 搜索函数，接收关键词和 AbortSignal，返回搜索结果
 * @param options 配置选项
 */
export function useSearchController<T = any>(
  fetcher: (keyword: string, signal?: AbortSignal) => Promise<T[]>,
  options: UseSearchControllerOptions = {},
) {
  const {
    delay = 400,
    onSuccess,
    onError,
    onClear,
  } = options

  let controller: AbortController | null = null
  let requestId = 0
  let debouncedSearch: any = null

  /**
   * 执行搜索（内部方法）
   */
  const _search = async (keyword: string) => {
    const id = ++requestId
    const trimmedKeyword = keyword.trim()

    // 取消上一次请求
    if (controller) {
      controller.abort()
    }
    controller = new AbortController()
    const { signal } = controller

    // 空关键词，触发清空回调
    if (!trimmedKeyword) {
      onClear?.()
      return
    }

    try {
      const data = await fetcher(trimmedKeyword, signal)

      // 双保险：只处理最新请求的结果
      if (id === requestId) {
        onSuccess?.(data, trimmedKeyword)
      }
    }
    catch (err: any) {
      // 请求被取消，不做处理
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return
      }

      // 只有最新请求才触发错误回调
      if (id === requestId) {
        console.error('Search error:', err)
        onError?.(err)
      }
    }
  }

  /**
   * 手动触发搜索（带防抖）
   */
  const search = (keyword: string) => {
    if (!debouncedSearch) {
      debouncedSearch = debounce(_search, delay)
    }
    debouncedSearch(keyword)
  }

  /**
   * 立即搜索（不防抖）
   */
  const searchNow = (keyword: string) => {
    // 取消防抖
    if (debouncedSearch?.cancel) {
      debouncedSearch.cancel()
    }
    _search(keyword)
  }

  /**
   * 取消所有进行中的请求
   */
  const cancel = () => {
    // 取消防抖
    if (debouncedSearch?.cancel) {
      debouncedSearch.cancel()
    }
    // 取消请求
    if (controller) {
      controller.abort()
      controller = null
    }
    // 递增请求 ID，使所有旧请求失效
    requestId++
  }

  /**
   * 清理资源（组件卸载时调用）
   */
  const cleanup = () => {
    cancel()
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    search,
    searchNow,
    cancel,
    cleanup,
  }
}
