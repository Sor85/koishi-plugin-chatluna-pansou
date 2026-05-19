/**
 * ChatLuna PanSou 工具
 * 将 PanSou 搜索能力包装成 LangChain StructuredTool
 */

import { DynamicStructuredTool, StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import {
  formatPansouResults,
  searchPansou,
  type SearchPansouOptions,
} from './pansou'
import type { PansouCloudTypeLimitConfig } from './cloud-types'

export interface PansouSearchToolOptions {
  toolName: string
  baseUrl: string
  token?: string
  maxResults: number
  defaultCloudTypes?: string[]
  maxResultsByCloudType?: PansouCloudTypeLimitConfig
  timeout?: number
  fetchImpl?: typeof fetch
  log?: (level: 'warn' | 'info', message: string, error?: unknown) => void
}

const pansouSearchSchema = z.object({
  keyword: z.string().min(1, 'keyword is required').describe('要搜索的资源关键词。'),
  channels: z
    .array(z.string().min(1))
    .optional()
    .describe('可选 Telegram 频道列表，不提供则使用 PanSou 默认配置。'),
  conc: z.number().int().positive().optional().describe('可选并发搜索数量。'),
  res: z
    .enum(['all', 'results', 'merge'])
    .optional()
    .describe('可选结果类型：all、results、merge，默认 merge。'),
  src: z
    .enum(['all', 'tg', 'plugin'])
    .optional()
    .describe('可选数据来源：all、tg、plugin，默认 all。'),
  plugins: z
    .array(z.string().min(1))
    .optional()
    .describe('可选插件列表，不提供则使用 PanSou 默认配置。'),
  cloudTypes: z
    .array(z.string().min(1))
    .optional()
    .describe('可选网盘类型过滤，如 quark、baidu、aliyun。'),
  ext: z.record(z.unknown()).optional().describe('可选扩展参数，传递给 PanSou 插件。'),
  filter: z
    .object({
      include: z.array(z.string().min(1)).optional(),
      exclude: z.array(z.string().min(1)).optional(),
    })
    .optional()
    .describe('可选过滤配置，include 为包含关键词，exclude 为排除关键词。'),
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
    channels: input.channels,
    conc: input.conc,
    res: input.res,
    src: input.src,
    plugins: input.plugins,
    cloudTypes: input.cloudTypes ?? config.defaultCloudTypes,
    ext: input.ext,
    filter: input.filter,
    refresh: input.refresh,
    timeout: config.timeout,
    fetchImpl: config.fetchImpl,
  }
}

/** 创建可注册到 ChatLuna 的 PanSou 搜索工具实例。 */
export function createPansouSearchTool(
  config: PansouSearchToolOptions,
): StructuredTool {
  return new DynamicStructuredTool({
    name: config.toolName || 'pansou_search',
    description:
      'Search cloud-drive resources with PanSou and return concise share links, passwords, cloud types, and sources.',
    schema: pansouSearchSchema,
    async func(input: PansouSearchToolInput) {
      try {
        const keyword = input.keyword.trim()
        if (!keyword) return '搜索关键词不能为空。'

        const response = await searchPansou(buildSearchOptions(config, input))
        return formatPansouResults(response, {
          keyword,
          maxResults: input.maxResults ?? config.maxResults,
          maxResultsByCloudType: config.maxResultsByCloudType,
        })
      } catch (error) {
        config.log?.('warn', 'PanSou 搜索失败', error)
        return `PanSou 搜索失败：${(error as Error).message}`
      }
    },
  })
}
