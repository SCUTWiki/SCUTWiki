---
title: 新手网站搭建学习指导
slug: Web_make_Now
section: 大学主模块
updatedAt: 2026-11-28
summary: 了解到现在有很多 AI + X 的活动或竞赛，根据笔者搭建本站的经验整理的入门指导。
links:
  - https://blog.csdn.net/2603_97351629/article/details/169646287
files: []
---

## 静态前端网页快速建成

可以先从**菜鸟教程**了解网站的基本概念，弄清楚 HTML、CSS、JavaScript 三者各自负责什么。HTML 学到「属性」那一章即可，想深入再继续。

接下来找到 **Vue.js 的官方网址**，跟着教程学如何部署。滑到最底部，找到「边学边做」，学完就能掌握个大概，然后跳到「示例」部分。

- 额外学习 `RouterLink` 的组件写法
- `script` 和 `template` 可以自己研究怎么写
- `Style Scope`（样式作用域）可以交给 AI 完善

## 部署与域名

如果只想做静态前端网站，**买国外域名即可**，国内域名需要备案。

常见做法是用 GitHub Pages 或其他托管平台展示前端，然后在购买域名的网站里，把 DNS 指向托管平台给出的地址。这里以 Netlify 为例。

## 去掉 Netlify 水印

Netlify 免费版右下角会有 “Powered by Netlify” 徽章，可以用 CSS 注入法隐藏：

参考：[Netlify 免费版如何隐藏右下角 “Powered by Netlify” 徽章（CSDN）](https://blog.csdn.net/2603_97351629/article/details/169646287)
