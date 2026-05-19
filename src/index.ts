/**
 * Koishi 插件入口
 * 负责配置 PanSou 搜索工具并注册到 ChatLuna
 */

import { Context, Schema } from 'koishi'
import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'
import type { ChatLunaToolMeta } from 'koishi-plugin-chatluna/llm-core/platform/types'
import {
  CLOUD_TYPE_OPTIONS,
  type CloudType,
  type CloudTypeLimitConfig,
} from './cloud-types'
import { createPansouSearchTool } from './tool'

export const name = 'chatluna-pansou'
export const inject = ['chatluna']

export interface Config extends Partial<ChatLunaPlugin.Config> {
  baseUrl: string
  token?: string
  toolName: string
  maxResults: number
  defaultCloudTypes: CloudType[]
  maxResultsByCloudType: CloudTypeLimitConfig
  timeout: number
}

const cloudTypeSchema = Schema.union(
  CLOUD_TYPE_OPTIONS.map(([value, label]) => Schema.const(value).description(label)),
) as Schema<CloudType>

const maxResultsByCloudTypeSchema = Schema.object(
  Object.fromEntries(
    CLOUD_TYPE_OPTIONS.map(([value, label]) => [
      value,
      Schema.number()
        .min(0)
        .max(20)
        .step(1)
        .default(0)
        .description(`${label}最多返回数量，0 表示不单独限制。`),
    ]),
  ) as Record<CloudType, Schema<number>>,
)
  .description('单个网盘类型最多返回数量')
  .collapse()

const DEFAULT_MAX_RESULTS_BY_CLOUD_TYPE = Object.fromEntries(
  CLOUD_TYPE_OPTIONS.map(([value]) => [value, 0]),
) as Record<CloudType, number>

export const Config: Schema<Config> = Schema.object({
  baseUrl: Schema.string()
    .default('http://127.0.0.1:8888')
    .description('PanSou API 根地址，例如 http://127.0.0.1:8888。'),
  token: Schema.string().description('PanSou 启用认证时填写 JWT Token。'),
  toolName: Schema.string()
    .default('pansou_search')
    .description('注册到 ChatLuna 的工具名称。'),
  maxResults: Schema.number()
    .min(1)
    .max(20)
    .step(1)
    .default(5)
    .description('默认返回给模型的最大结果数量。'),
  defaultCloudTypes: Schema.array(cloudTypeSchema)
    .role('checkbox')
    .default([])
    .description('默认网盘类型过滤，不勾选表示不过滤。'),
  maxResultsByCloudType: maxResultsByCloudTypeSchema
    .default(DEFAULT_MAX_RESULTS_BY_CLOUD_TYPE),
  timeout: Schema.number()
    .min(1000)
    .step(1000)
    .default(30_000)
    .description('请求 PanSou API 的超时时间，单位毫秒。'),
})

const TOOL_META: ChatLunaToolMeta = {
  source: 'extension',
  group: 'search',
  tags: ['search', 'cloud-drive', 'pansou'],
  defaultAvailability: {
    enabled: true,
    main: true,
    chatluna: true,
    characterScope: 'all',
  },
}

function createLogger(ctx: Context) {
  const logger = ctx.logger('chatluna-pansou')
  return (level: 'warn' | 'info', message: string, error?: unknown) => {
    if (error) {
      logger[level](message, error)
    } else {
      logger[level](message)
    }
  }
}

/** 注册 PanSou 搜索工具到 ChatLuna。 */
export function apply(ctx: Context, config: Config): void {
  const plugin = new ChatLunaPlugin(
    ctx,
    config as ChatLunaPlugin.Config,
    'pansou',
    false,
  )
  const log = createLogger(ctx)

  ctx.on('ready', () => {
    const toolName = config.toolName.trim() || 'pansou_search'
    plugin.registerTool(toolName, {
      selector: () => true,
      authorization: () => true,
      description:
        'Search cloud-drive resources with PanSou and return concise share links.',
      createTool: () =>
        createPansouSearchTool({
          toolName,
          baseUrl: config.baseUrl,
          token: config.token,
          maxResults: config.maxResults,
          defaultCloudTypes: config.defaultCloudTypes,
          maxResultsByCloudType: config.maxResultsByCloudType,
          timeout: config.timeout,
          log,
        }),
      meta: TOOL_META,
    })

    log('info', `PanSou 搜索工具已注册：${toolName}`)
  })
}
