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

export type CloudTypeLimitConfig = Partial<Record<CloudType, number>>
