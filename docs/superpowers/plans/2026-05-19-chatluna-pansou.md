# ChatLuna PanSou Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个 Koishi 插件，把 PanSou 网盘搜索注册为 ChatLuna 模型工具。

**Architecture:** `src/pansou.ts` 负责 API 请求和结果格式化，`src/tool.ts` 负责 LangChain StructuredTool，`src/index.ts` 负责 Koishi/ChatLuna 注册和配置。测试直接覆盖纯函数和工具调用行为，避免依赖真实 PanSou 服务。

**Tech Stack:** TypeScript、Koishi、koishi-plugin-chatluna、@langchain/core、zod、vitest、tsup。

---

### 文件结构

- Create: `package.json`，定义构建、测试、类型检查命令。
- Create: `tsconfig.json`，TypeScript 编译配置。
- Create: `tsup.config.ts`，输出 `lib/index.js` 和类型声明。
- Create: `vitest.config.ts`，测试配置。
- Create: `src/index.ts`，插件入口、配置和 ChatLuna 工具注册。
- Create: `src/pansou.ts`，PanSou API 客户端和结果格式化。
- Create: `src/tool.ts`，ChatLuna 可调用工具。
- Create: `tests/pansou.test.ts`，API 请求和格式化测试。
- Create: `README.md`，最小使用说明。

### Task 1: 工程骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`

- [x] **Step 1: 创建基础工程配置**

写入最小 TypeScript 插件工程配置，脚本包含 `build`、`typecheck`、`test`。

- [x] **Step 2: 安装依赖**

Run: `npm install`

Expected: 生成 `node_modules` 与 `package-lock.json`。

### Task 2: PanSou 客户端 TDD

**Files:**
- Create: `tests/pansou.test.ts`
- Create: `src/pansou.ts`

- [x] **Step 1: 写失败测试**

测试 `searchPansou()` 会向 `/api/search` 发送正确 JSON，并带上 token。

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/pansou.test.ts`

Expected: FAIL，提示无法导入 `src/pansou`。

- [x] **Step 3: 实现最小客户端**

实现 `searchPansou()`、`formatPansouResults()` 和相关类型。

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/pansou.test.ts`

Expected: PASS。

### Task 3: ChatLuna 工具注册

**Files:**
- Create: `src/tool.ts`
- Create: `src/index.ts`

- [x] **Step 1: 写工具行为测试**

测试工具 `_call()` 接收关键词后返回格式化结果。

- [x] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/pansou.test.ts`

Expected: FAIL，提示工具函数不存在。

- [x] **Step 3: 实现工具和插件入口**

实现 `createPansouSearchTool()`，并在 `apply()` 中通过 `ChatLunaPlugin.registerTool()` 注册。

- [x] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/pansou.test.ts`

Expected: PASS。

### Task 4: 文档与验证

**Files:**
- Create: `README.md`

- [x] **Step 1: 写最小 README**

说明依赖 PanSou 服务、配置项和工具用途。

- [x] **Step 2: 运行完整验证**

Run: `npm run typecheck && npm test && npm run build`

Expected: 全部 exit 0。
