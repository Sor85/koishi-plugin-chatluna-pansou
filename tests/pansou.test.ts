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
import { createPansouSearchTool } from '../src/tool'
import { toPansouCloudTypeLimitConfig } from '../src/cloud-types'

describe('toPansouCloudTypeLimitConfig', () => {
  it('把配置页稳定 key 映射为 PanSou 网盘类型 key', () => {
    expect(
      toPansouCloudTypeLimitConfig({
        baidu: 1,
        pan115: 2,
        pan123: 3,
      }),
    ).toMatchObject({
      baidu: 1,
      '115': 2,
      '123': 3,
    })
  })
})

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

  it('兼容 PanSou 返回 code/message/data 包装结构', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        code: 0,
        message: 'success',
        data: {
          total: 162,
          merged_by_type: {
            '115': [
              {
                url: 'https://115cdn.com/s/swfppuq3zrk?password=t58d',
                password: 't58d',
                note: '盗梦空间',
                source: 'tg:leoziyuan',
              },
            ],
          },
        },
      }),
    })) as unknown as typeof fetch

    const result = await searchPansou({
      baseUrl: 'http://127.0.0.1:8888',
      keyword: '盗梦空间',
      fetchImpl,
    })

    expect(result.total).toBe(162)
    expect(result.merged_by_type?.['115']?.[0]?.note).toBe('盗梦空间')
  })

  it('向 PanSou 透传完整可选请求参数', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ total: 0, merged_by_type: {} }),
    })) as unknown as typeof fetch

    await searchPansou({
      baseUrl: 'http://127.0.0.1:8888',
      keyword: '盗梦空间',
      channels: ['tgsearchers3'],
      conc: 2,
      refresh: true,
      res: 'all',
      src: 'plugin',
      plugins: ['jikepan'],
      cloudTypes: ['115'],
      ext: { title_en: 'Inception' },
      filter: {
        include: ['4K'],
        exclude: ['预告'],
      },
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:8888/api/search',
      expect.objectContaining({
        body: JSON.stringify({
          kw: '盗梦空间',
          res: 'all',
          channels: ['tgsearchers3'],
          conc: 2,
          refresh: true,
          src: 'plugin',
          plugins: ['jikepan'],
          cloud_types: ['115'],
          ext: { title_en: 'Inception' },
          filter: {
            include: ['4K'],
            exclude: ['预告'],
          },
        }),
      }),
    )
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

  it('当响应只有 results 时从 results[].links 格式化资源', () => {
    const text = formatPansouResults(
      {
        total: 1,
        results: [
          {
            message_id: '1',
            unique_id: 'tg-1',
            channel: 'tgsearchers3',
            datetime: '2026-01-01T00:00:00Z',
            title: '盗梦空间',
            content: '盗梦空间 4K',
            links: [
              {
                type: '115',
                url: 'https://115.com/s/example',
                password: 'abcd',
                datetime: '2026-01-01T00:00:00Z',
                work_title: '盗梦空间',
              },
            ],
            tags: ['电影'],
            images: ['https://example.com/image.jpg'],
          },
        ],
      },
      { keyword: '盗梦空间', maxResults: 5 },
    )

    expect(text).toContain('找到 1 条“盗梦空间”的网盘资源')
    expect(text).toContain('1. [115] 盗梦空间')
    expect(text).toContain('链接：https://115.com/s/example')
    expect(text).toContain('提取码：abcd')
    expect(text).toContain('来源：tg:tgsearchers3')
  })

  it('支持按网盘类型限制返回数量', () => {
    const text = formatPansouResults(
      {
        total: 5,
        merged_by_type: {
          baidu: [
            { url: 'https://pan.baidu.com/s/1', note: '百度 1' },
            { url: 'https://pan.baidu.com/s/2', note: '百度 2' },
          ],
          aliyun: [
            { url: 'https://www.aliyundrive.com/s/1', note: '阿里 1' },
            { url: 'https://www.aliyundrive.com/s/2', note: '阿里 2' },
            { url: 'https://www.aliyundrive.com/s/3', note: '阿里 3' },
          ],
        },
      },
      {
        keyword: '测试',
        maxResults: 10,
        maxResultsByCloudType: {
          baidu: 1,
          aliyun: 2,
        },
      },
    )

    expect(text).toContain('1. [baidu] 百度 1')
    expect(text).not.toContain('百度 2')
    expect(text).toContain('2. [aliyun] 阿里 1')
    expect(text).toContain('3. [aliyun] 阿里 2')
    expect(text).not.toContain('阿里 3')
  })
})

describe('createPansouSearchTool', () => {
  it('支持自定义工具描述', () => {
    const tool = createPansouSearchTool({
      toolName: 'pansou_search',
      toolDescription: '用 PanSou 搜索网盘资源。',
      baseUrl: 'http://127.0.0.1:8888',
      maxResults: 5,
    })

    expect(tool.description).toBe('用 PanSou 搜索网盘资源。')
  })

  it('工具调用 PanSou 并返回格式化结果', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        total: 1,
        merged_by_type: {
          quark: [
            {
              url: 'https://pan.quark.cn/s/fanren',
              note: '凡人修仙传',
            },
          ],
        },
      }),
    })) as unknown as typeof fetch
    const tool = createPansouSearchTool({
      toolName: 'pansou_search',
      baseUrl: 'http://127.0.0.1:8888',
      maxResults: 5,
      fetchImpl,
    })

    const text = await (tool as any)._call({ keyword: '凡人修仙传' })

    expect(text).toContain('找到 1 条“凡人修仙传”的网盘资源')
    expect(text).toContain('https://pan.quark.cn/s/fanren')
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('支持 ChatLuna Agent 使用 invoke 调用工具', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        total: 1,
        merged_by_type: {
          aliyun: [
            {
              url: 'https://www.aliyundrive.com/s/abc',
              note: '测试资源',
            },
          ],
        },
      }),
    })) as unknown as typeof fetch
    const tool = createPansouSearchTool({
      toolName: 'pansou_search',
      baseUrl: 'http://127.0.0.1:8888',
      maxResults: 5,
      fetchImpl,
    })

    const text = await tool.invoke({ keyword: '测试资源' })

    expect(text).toContain('找到 1 条“测试资源”的网盘资源')
    expect(text).toContain('https://www.aliyundrive.com/s/abc')
  })

  it('工具捕获请求错误并返回给模型', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 502,
      text: async () => 'bad gateway',
    })) as unknown as typeof fetch
    const tool = createPansouSearchTool({
      toolName: 'pansou_search',
      baseUrl: 'http://127.0.0.1:8888',
      maxResults: 5,
      fetchImpl,
    })

    const text = await (tool as any)._call({ keyword: '电影' })

    expect(text).toBe('PanSou 搜索失败：PanSou API 请求失败：HTTP 502 bad gateway')
  })
})
