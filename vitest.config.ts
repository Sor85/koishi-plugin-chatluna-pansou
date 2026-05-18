/**
 * 测试配置
 * 指定 Vitest 运行 TypeScript 单元测试
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
