/**
 * PanSou API 客户端
 * 负责请求搜索接口并格式化网盘链接结果
 */

export interface PansouMergedLink {
  url: string
  password?: string
  note?: string
  datetime?: string
  source?: string
  images?: string[]
}

export interface PansouResultLink {
  type: string
  url: string
  password?: string
  datetime?: string
  work_title?: string
}

export interface PansouSearchResult {
  message_id?: string
  unique_id?: string
  channel?: string
  datetime?: string
  title?: string
  content?: string
  links?: PansouResultLink[]
  tags?: string[]
  images?: string[]
}

export interface PansouSearchResponse {
  total?: number
  merged_by_type?: Record<string, PansouMergedLink[]>
  results?: PansouSearchResult[]
}

export interface PansouApiResponse {
  code?: number
  message?: string
  data?: PansouSearchResponse
}

export interface SearchPansouOptions {
  baseUrl: string
  keyword: string
  token?: string
  channels?: string[]
  conc?: number
  res?: 'all' | 'results' | 'merge'
  src?: 'all' | 'tg' | 'plugin'
  plugins?: string[]
  cloudTypes?: string[]
  ext?: Record<string, unknown>
  filter?: {
    include?: string[]
    exclude?: string[]
  }
  refresh?: boolean
  timeout?: number
  fetchImpl?: typeof fetch
}

export interface FormatPansouResultsOptions {
  keyword: string
  maxResults: number
}

interface PansouFlatLink extends PansouMergedLink {
  type: string
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

function compactStringList(values?: string[]): string[] | undefined {
  const result = values?.map((value) => value.trim()).filter(Boolean)
  return result?.length ? result : undefined
}

function hasObjectValues(value?: Record<string, unknown>): boolean {
  return value != null && Object.keys(value).length > 0
}

function normalizePansouResponse(
  response: PansouSearchResponse | PansouApiResponse,
): PansouSearchResponse {
  if ('data' in response && response.data) {
    if (typeof response.code === 'number' && response.code !== 0) {
      throw new Error(`PanSou API 返回错误：${response.message ?? response.code}`)
    }
    return response.data
  }

  return response as PansouSearchResponse
}

/** 调用 PanSou 搜索接口并返回原始 JSON 响应。 */
export async function searchPansou(
  options: SearchPansouOptions,
): Promise<PansouSearchResponse> {
  const keyword = options.keyword.trim()
  if (!keyword) throw new Error('搜索关键词不能为空。')

  const fetcher = options.fetchImpl ?? fetch
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = options.token?.trim()
  if (token) headers.Authorization = `Bearer ${token}`

  const body: Record<string, unknown> = {
    kw: keyword,
    res: options.res ?? 'merge',
  }

  const channels = compactStringList(options.channels)
  if (channels) body.channels = channels

  if (typeof options.conc === 'number') body.conc = options.conc
  if (typeof options.refresh === 'boolean') body.refresh = options.refresh
  if (options.src) body.src = options.src

  const plugins = compactStringList(options.plugins)
  if (plugins) body.plugins = plugins

  const cloudTypes = compactStringList(options.cloudTypes)
  if (cloudTypes) body.cloud_types = cloudTypes

  if (hasObjectValues(options.ext)) body.ext = options.ext
  if (hasObjectValues(options.filter)) body.filter = options.filter

  const controller = new AbortController()
  const timeout = options.timeout ?? 30_000
  const timer =
    timeout > 0
      ? setTimeout(() => {
          controller.abort()
        }, timeout)
      : undefined

  try {
    const response = await fetcher(`${normalizeBaseUrl(options.baseUrl)}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const suffix = text.trim() ? ` ${text.trim()}` : ''
      throw new Error(`PanSou API 请求失败：HTTP ${response.status}${suffix}`)
    }

    const data = (await response.json()) as PansouSearchResponse | PansouApiResponse
    return normalizePansouResponse(data)
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function flattenMergedLinks(response: PansouSearchResponse): PansouFlatLink[] {
  const mergedLinks = Object.entries(response.merged_by_type ?? {}).flatMap(([type, links]) =>
    links
      .filter((link) => typeof link.url === 'string' && link.url.trim())
      .map((link) => ({ ...link, type })),
  )

  if (mergedLinks.length > 0) return mergedLinks

  return (response.results ?? []).flatMap((result) =>
    (result.links ?? [])
      .filter((link) => typeof link.url === 'string' && link.url.trim())
      .map((link) => ({
        type: link.type,
        url: link.url,
        password: link.password,
        note: link.work_title ?? result.title ?? result.content,
        datetime: link.datetime ?? result.datetime,
        source: result.channel ? `tg:${result.channel}` : undefined,
        images: result.images,
      })),
  )
}

/** 将 PanSou merged_by_type 响应转换为模型容易阅读的文本。 */
export function formatPansouResults(
  response: PansouSearchResponse,
  options: FormatPansouResultsOptions,
): string {
  const keyword = options.keyword.trim()
  const links = flattenMergedLinks(response)

  if (links.length === 0) {
    return `没有找到“${keyword}”的网盘资源。`
  }

  const maxResults = Math.max(1, options.maxResults)
  const visibleLinks = links.slice(0, maxResults)
  const suffix =
    links.length > visibleLinks.length ? `，展示前 ${visibleLinks.length} 条` : ''
  const blocks = visibleLinks.map((link, index) => {
    const note = link.note?.trim() || link.url
    const lines = [`${index + 1}. [${link.type}] ${note}`, `链接：${link.url}`]

    if (link.password?.trim()) lines.push(`提取码：${link.password.trim()}`)
    if (link.source?.trim()) lines.push(`来源：${link.source.trim()}`)

    return lines.join('\n')
  })

  return [`找到 ${links.length} 条“${keyword}”的网盘资源${suffix}：`, ...blocks].join(
    '\n\n',
  )
}
