import request from '@/utils/request'

export interface ProjectItem {
  id: number
  title: string
  date: string
  summary: string
  details: string
}

export interface ProjectListParams {
  page: number
  pageSize: number
  type: 'current' | 'shared' // current: 当前列表, shared: 分享列表
  keyword?: string // 搜索关键词（可选）
}

export interface ProjectListRes {
  list: ProjectItem[]
  total: number
  hasMore: boolean
}

interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

/**
 * 获取项目列表
 */
export async function getProjectList(
  params: ProjectListParams,
  options?: { signal?: AbortSignal },
): Promise<ProjectListRes> {
  const res = await request.get<ApiResponse<ProjectListRes>>('/project/list', {
    params,
    signal: options?.signal,
  })
  return res.data
}

/**
 * 获取项目详情
 */
export async function getProjectDetail(id: number): Promise<ProjectItem> {
  const res = await request.get<ApiResponse<ProjectItem>>(`/project/${id}`)
  return res.data
}
