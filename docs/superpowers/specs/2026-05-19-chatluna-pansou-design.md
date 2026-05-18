# ChatLuna PanSou 工具设计

## 背景

在空目录中新建 `koishi-plugin-chatluna-pansou`，为 ChatLuna 注册一个模型工具，让模型可以通过用户自建的 PanSou API 搜索网盘资源。

## 假设

- 用户会自行部署 PanSou 服务，插件只负责调用 API，不内置 PanSou 服务。
- 默认 API 地址为 `http://127.0.0.1:8888`。
- PanSou 认证是可选项；如果用户配置 token，插件在请求中加入 `Authorization: Bearer <token>`。
- 初版只做搜索工具，不做链接有效性检测。

## 方案

插件启动后创建 `ChatLunaPlugin` 实例，并在 Koishi ready 阶段注册 `pansou_search` 工具。工具使用 Zod 定义入参，入参包含搜索关键词、可选网盘类型、可选结果数量、可选刷新缓存开关。

工具调用 `POST /api/search`，固定请求 `res: "merge"`，再把 `merged_by_type` 中的链接压平成简洁文本。返回内容控制条数，避免模型上下文被过长结果占满。

## 配置

- `baseUrl`：PanSou API 根地址。
- `token`：可选 JWT。
- `toolName`：工具名，默认 `pansou_search`。
- `maxResults`：默认返回结果数量。
- `defaultCloudTypes`：默认网盘类型过滤。
- `timeout`：请求超时时间。

## 错误处理

关键词为空时直接返回提示文本。API 不通、HTTP 非 2xx、响应结构异常时返回简短错误文本，并写入 Koishi 日志。

## 测试

测试覆盖：

- PanSou 搜索请求体和认证头。
- `merged_by_type` 到文本的格式化。
- 空结果提示。
- HTTP 错误提示。

