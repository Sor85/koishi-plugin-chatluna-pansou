/**
 * 构建配置
 * 输出 Koishi 插件运行时代码和类型声明
 */

import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'lib',
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  external: [
    'koishi',
    'koishi-plugin-chatluna',
    'koishi-plugin-chatluna/services/chat',
    '@langchain/core/tools',
    'zod',
  ],
  skipNodeModulesBundle: true,
})
