# 番茄榜单接口 Worker

这个文件夹放的是给“脑洞生成器”用的轻量榜单接口。

## 作用

- 抓取番茄小说排行榜页面
- 提取书名、简介、标签、分类、在读数据
- 生成一段可直接注入脑洞提示词的榜单摘要
- 解决 GitHub Pages 前端无法直接跨站抓榜单的问题

## 路由

部署后提供这个 GET 接口：

`/api/fanqie/trends?keyword=年代&genre=女频-年代文&subgenre=年代甜宠&limit=10`

返回 JSON 结构：

```json
{
  "ok": true,
  "keyword": "年代",
  "genre": "女频-年代文",
  "subgenre": "年代甜宠",
  "selectedCategories": [
    { "name": "年代", "href": "/rank/0_2_79" }
  ],
  "items": [
    {
      "title": "示例书名",
      "author": "示例作者",
      "intro": "示例简介",
      "status": "连载中",
      "readingCount": "123.4万人在读",
      "category": "年代",
      "tags": ["年代", "甜宠"],
      "url": "https://fanqienovel.com/..."
    }
  ],
  "summary": "可直接注入提示词的榜单摘要",
  "fetchedAt": "2026-04-04T00:00:00.000Z"
}
```

## Cloudflare Workers 部署

最简单。

1. 新建一个 Worker
2. 把 `fanqie-rank-worker.js` 内容贴进去
3. 发布
4. 拿到你的域名，比如：
   `https://your-worker.workers.dev/api/fanqie/trends`
5. 回到网页端 `API 设置`
6. 把它填进 `榜单接口 URL`

## 前端如何使用

网页端脑洞生成器里有一个开关：

- `结合当前番茄榜高位作品做脑洞对标`

开启后会：

1. 先请求这个 Worker
2. 把返回的 `summary + items` 注入脑洞生成提示词
3. 在脑洞生成器结果区上方展示本次抓到的榜单摘要

## 注意

- 这是测试版接口，解析逻辑用了“结构化数据优先、文本兜底”的方案
- 如果番茄页面结构大改，可能需要再调解析规则
- 建议后续给 Worker 再加缓存和失败回退
