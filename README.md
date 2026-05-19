# koishi-plugin-chatluna-pansou

这是一个给 ChatLuna 使用的 Koishi 插件，用来把 PanSou 网盘搜索 API 注册为模型工具。
插件只调用 PanSou API，不负责部署 PanSou 服务本身。

## 前置条件

先部署 PanSou 后端 API，例如：

```bash
docker run -d --name pansou -p 8888:8888 ghcr.io/fish2018/pansou:latest
```

默认 API 地址为：

```text
http://127.0.0.1:8888
```

## 配置项

- `baseUrl`：PanSou API 根地址，默认 `http://127.0.0.1:8888`。
- `token`：PanSou 启用认证时填写 JWT Token；未启用认证可留空。
- `toolName`：注册到 ChatLuna 的工具名，默认 `pansou_search`。
- `maxResults`：默认返回给模型的结果数量，默认 `5`。
- `defaultCloudTypes`：默认网盘类型过滤，留空表示不过滤。
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
