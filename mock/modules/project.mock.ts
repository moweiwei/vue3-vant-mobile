import { defineMock } from 'vite-plugin-mock-dev-server'

// 生成当前列表的模拟数据
function generateCurrentList(page: number, pageSize: number) {
  const list = []
  const start = (page - 1) * pageSize

  for (let i = 0; i < pageSize; i++) {
    const id = start + i + 1
    list.push({
      id,
      title: `当前项目 ${id}`,
      date: '2025-05-16',
      summary: '这是一个项目的简要描述，包含了项目的核心功能和主要特点。项目采用了现代化的技术栈，具有良好的可扩展性和维护性。',
      details: `这是当前列表第 ${id} 项的详细信息。包含更多内容，例如：详细描述、额外参数、相关说明等等。项目包含了完整的前后端实现，使用了 Vue 3、TypeScript、Vite 等技术栈。项目具有响应式设计，支持移动端和桌面端访问。`,
    })
  }

  return list
}

// 生成分享列表的模拟数据
function generateSharedList(page: number, pageSize: number) {
  const list = []
  const start = (page - 1) * pageSize

  for (let i = 0; i < pageSize; i++) {
    const id = start + i + 1001 // 使用不同的起始 ID
    list.push({
      id,
      title: `分享项目 ${start + i + 1}`,
      date: '2025-05-15',
      summary: '这是一个分享项目的简要描述，由其他用户分享给你的内容。包含了项目的重要信息和使用说明。',
      details: `这是分享列表第 ${start + i + 1} 项的详细信息。这些是其他用户分享给你的内容，包含详细描述、额外参数、相关说明等等。你可以查看和使用这些分享的资源，也可以将它们保存到你的列表中。`,
    })
  }

  return list
}

export default defineMock([
  {
    url: '/api/project/list',
    method: 'GET',
    delay: 800,
    body: ({ query }) => {
      const { page = 1, pageSize = 20, type = 'current' } = query || {}
      const pageNum = Number(page)
      const size = Number(pageSize)

      // 根据类型生成不同的数据
      const totalItems = type === 'current' ? 40 : 30
      const list = type === 'current'
        ? generateCurrentList(pageNum, size)
        : generateSharedList(pageNum, size)

      const currentTotal = pageNum * size
      const hasMore = currentTotal < totalItems

      return {
        code: 0,
        data: {
          list,
          total: totalItems,
          hasMore,
        },
        msg: 'success',
      }
    },
  },
  {
    url: '/api/project/:id',
    method: 'GET',
    delay: 500,
    body: ({ params }) => {
      const { id } = params || {}
      const itemId = Number(id)

      // 根据 ID 判断是当前列表还是分享列表
      const isShared = itemId > 1000

      return {
        code: 0,
        data: {
          id: itemId,
          title: isShared ? `分享项目 ${itemId - 1000}` : `当前项目 ${itemId}`,
          date: isShared ? '2025-05-15' : '2025-05-16',
          summary: isShared
            ? '这是一个分享项目的简要描述，由其他用户分享给你的内容。'
            : '这是一个项目的简要描述，包含了项目的核心功能和主要特点。',
          details: isShared
            ? `这是分享列表第 ${itemId - 1000} 项的详细信息。这些是其他用户分享给你的内容。`
            : `这是当前列表第 ${itemId} 项的详细信息。包含更多内容和详细描述。`,
        },
        msg: 'success',
      }
    },
  },
])
