/**
 * PanSou 网盘类型定义
 * 统一维护配置项、请求参数和结果限制使用的类型列表
 */

export const CLOUD_TYPE_OPTIONS = [
  ['baidu', '百度网盘'],
  ['aliyun', '阿里云盘'],
  ['quark', '夸克网盘'],
  ['tianyi', '天翼云盘'],
  ['115', '115网盘'],
  ['xunlei', '迅雷网盘'],
  ['uc', 'UC网盘'],
  ['mobile', '移动云盘'],
  ['pikpak', 'PikPak'],
  ['123', '123网盘'],
  ['magnet', '磁力链接'],
  ['ed2k', '电驴链接'],
] as const

export type CloudType = (typeof CLOUD_TYPE_OPTIONS)[number][0]

export const CLOUD_TYPE_LIMIT_OPTIONS = [
  ['baidu', 'baidu', '百度网盘'],
  ['aliyun', 'aliyun', '阿里云盘'],
  ['quark', 'quark', '夸克网盘'],
  ['tianyi', 'tianyi', '天翼云盘'],
  ['pan115', '115', '115网盘'],
  ['xunlei', 'xunlei', '迅雷网盘'],
  ['uc', 'uc', 'UC网盘'],
  ['mobile', 'mobile', '移动云盘'],
  ['pikpak', 'pikpak', 'PikPak'],
  ['pan123', '123', '123网盘'],
  ['magnet', 'magnet', '磁力链接'],
  ['ed2k', 'ed2k', '电驴链接'],
] as const

export type CloudTypeLimitKey = (typeof CLOUD_TYPE_LIMIT_OPTIONS)[number][0]

export type CloudTypeLimitConfig = Partial<Record<CloudTypeLimitKey, number>>

export type PansouCloudTypeLimitConfig = Partial<Record<CloudType, number>>

/** 将配置页使用的稳定 key 转换成 PanSou 网盘类型 key。 */
export function toPansouCloudTypeLimitConfig(
  config?: CloudTypeLimitConfig,
): PansouCloudTypeLimitConfig | undefined {
  if (!config) return undefined

  const result: PansouCloudTypeLimitConfig = {}
  for (const [configKey, cloudType] of CLOUD_TYPE_LIMIT_OPTIONS) {
    const limit = config[configKey]
    if (typeof limit === 'number') result[cloudType] = limit
  }

  return result
}
