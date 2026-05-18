/**
 * PanSou 工具测试
 * 覆盖 API 请求、结果格式化和工具调用输出
 */

import { describe, expect, it, vi } from 'vitest'
import {
  formatPansouResults,
  searchPansou,
  type PansouSearchResponse,
} from '../src/pansou'

describe('searchPansou', () => {
  it('向 PanSou 搜索接口发送关键词、网盘类型和认证头', async () => {
    const response: PansouSearchResponse = {
      total: 1,
      merged_by_type: {
        quark: [
          {
            url: 'https://pan.quark.cn/s/abc',
            password: '1234',
            note: '速度与激情全集',
            source: 'plugin:test',
          },
        ],
      },
    }
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => response,
    })) as unknown as typeof fetch

    const result = await searchPansou({
      baseUrl: 'http://127.0.0.1:8888/',
      token: 'token-123',
      keyword: '速度与激情',
      cloudTypes: ['quark'],
      refresh: true,
      fetchImpl,
    })

    expect(result).toEqual(response)
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:8888/api/search',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify({
          kw: '速度与激情',
          res: 'merge',
          refresh: true,
          cloud_types: ['quark'],
        }),
      }),
    )
  })

  it('HTTP 错误时抛出可读错误', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'server error',
    })) as unknown as typeof fetch

    await expect(
      searchPansou({
        baseUrl: 'http://127.0.0.1:8888',
        keyword: '电影',
        fetchImpl,
      }),
    ).rejects.toThrow('PanSou API 请求失败：HTTP 500 server error')
  })
})

describe('formatPansouResults', () => {
  it('把 merged_by_type 格式化成模型可读文本', () => {
    const text = formatPansouResults(
      {
        total: 2,
        merged_by_type: {
          quark: [
            {
              url: 'https://pan.quark.cn/s/abc',
              password: '1234',
              note: '速度与激情全集',
              source: 'plugin:test',
            },
          ],
          baidu: [
            {
              url: 'https://pan.baidu.com/s/xyz',
              note: '速度与激情 4K',
            },
          ],
        },
      },
      { keyword: '速度与激情', maxResults: 2 },
    )

    expect(text).toContain('找到 2 条“速度与激情”的网盘资源')
    expect(text).toContain('1. [quark] 速度与激情全集')
    expect(text).toContain('链接：https://pan.quark.cn/s/abc')
    expect(text).toContain('提取码：1234')
    expect(text).toContain('来源：plugin:test')
    expect(text).toContain('2. [baidu] 速度与激情 4K')
  })

  it('没有链接时返回空结果提示', () => {
    const text = formatPansouResults(
      { total: 0, merged_by_type: {} },
      { keyword: '不存在的资源', maxResults: 5 },
    )

    expect(text).toBe('没有找到“不存在的资源”的网盘资源。')
  })
})
