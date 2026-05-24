# koishi-plugin-chatluna-pansou

这是一个给 ChatLuna 使用的 Koishi 插件，用来把 PanSou 网盘搜索 API 注册为模型工具。
插件只调用 PanSou API，不负责部署 PanSou 服务本身。

## 前置条件

本插件只调用 PanSou API，不负责部署 PanSou 服务本身。使用前需要先部署 PanSou 后端。

推荐使用 Docker 部署：

```bash
docker run -d --name pansou -p 8888:8888 ghcr.io/fish2018/pansou:latest
```

默认 API 地址为：

```text
http://127.0.0.1:8888
```

如果 Koishi 和 PanSou 不在同一台机器，请把插件配置里的 PanSou API 根地址改为 PanSou 所在服务器地址，例如：

```text
http://服务器IP:8888
```

后端项目：[fish2018/pansou](https://github.com/fish2018/pansou)

## 配置项

- `baseUrl`：PanSou API 根地址，默认 `http://127.0.0.1:8888`。
- `token`：PanSou 启用认证时填写 JWT Token；未启用认证可留空。
- `toolName`：注册到 ChatLuna 的工具名，默认 `pansou_search`。
- `toolDescription`：注册到 ChatLuna 的工具描述，会显示在工具名称下方。
- `maxResults`：默认返回给模型的结果总数量，默认 `5`。
- `defaultCloudTypes`：默认网盘类型范围；勾选表示仅搜索所选类型，不勾选则搜索全部。可选项包括百度网盘、阿里云盘、夸克网盘、天翼云盘、115网盘、迅雷网盘、UC网盘、移动云盘、PikPak、123网盘、磁力链接、电驴链接。
- `maxResultsByCloudType`：单个网盘类型最多返回数量，`0` 表示不单独限制。例如百度网盘填 `1`、阿里云盘填 `2`，则百度最多返回 1 条，阿里云最多返回 2 条。
- `timeout`：请求超时时间，单位毫秒，默认 `30000`。

## 工具入参

模型调用 `pansou_search` 时可传：

- `keyword`：必填，搜索关键词。
- `channels`：可选，搜索频道列表。
- `conc`：可选，并发搜索数量。
- `res`：可选，结果类型：`all`、`results`、`merge`，默认 `merge`。
- `src`：可选，数据来源：`all`、`tg`、`plugin`。
- `plugins`：可选，指定搜索插件列表。
- `cloudTypes`：可选，网盘类型过滤，例如 `["quark", "baidu"]`。
- `ext`：可选，传给 PanSou 插件的扩展参数。
- `filter`：可选，过滤配置，例如 `{"include":["4K"],"exclude":["预告"]}`。
- `maxResults`：可选，本次最多返回多少条。
- `refresh`：可选，是否强制刷新 PanSou 缓存。
