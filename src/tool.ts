/**
 * ChatLuna PanSou 工具
 * 将 PanSou 搜索能力包装成 LangChain StructuredTool
 */

import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import {
  formatPansouResults,
  searchPansou,
  type SearchPansouOptions,
} from './pansou'

export interface PansouSearchToolOptions {
  toolName: string
  baseUrl: string
  token?: string
  maxResults: number
  defaultCloudTypes?: string[]
  timeout?: number
  fetchImpl?: typeof fetch
  log?: (level: 'warn' | 'info', message: string, error?: unknown) => void
}

const pansouSearchSchema = z.object({
  keyword: z.string().min(1, 'keyword is required').describe('要搜索的资源关键词。'),
  cloudTypes: z
    .array(z.string().min(1))
    .optional()
    .describe('可选网盘类型过滤，如 quark、baidu、aliyun。'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('本次最多返回多少条结果，默认使用插件配置。'),
  refresh: z.boolean().optional().describe('是否强制刷新 PanSou 缓存。'),
})

export type PansouSearchToolInput = z.infer<typeof pansouSearchSchema>

function buildSearchOptions(
  config: PansouSearchToolOptions,
  input: PansouSearchToolInput,
): SearchPansouOptions {
  return {
    baseUrl: config.baseUrl,
    keyword: input.keyword,
    token: config.token,
    cloudTypes: input.cloudTypes ?? config.defaultCloudTypes,
    refresh: input.refresh,
    timeout: config.timeout,
    fetchImpl: config.fetchImpl,
  }
}

/** 创建可注册到 ChatLuna 的 PanSou 搜索工具实例。 */
export function createPansouSearchTool(
  config: PansouSearchToolOptions,
): StructuredTool {
  const tool = {
    name: config.toolName || 'pansou_search',
    description:
      'Search cloud-drive resources with PanSou and return concise share links, passwords, cloud types, and sources.',
    schema: pansouSearchSchema,
    async _call(input: PansouSearchToolInput) {
      try {
        const keyword = input.keyword.trim()
        if (!keyword) return '搜索关键词不能为空。'

        const response = await searchPansou(buildSearchOptions(config, input))
        return formatPansouResults(response, {
          keyword,
          maxResults: input.maxResults ?? config.maxResults,
        })
      } catch (error) {
        config.log?.('warn', 'PanSou 搜索失败', error)
        return `PanSou 搜索失败：${(error as Error).message}`
      }
    },
  }

  return tool as unknown as StructuredTool
}
