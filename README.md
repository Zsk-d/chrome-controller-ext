# 原理
- 建立websocket server, 接受控制端(client)和被控端(chrome扩展)的ws client注册, 并转发ws消息
- 控制端(client)发送启动命令, 服务使用chrome.exe 命令行启动, 追加启动参数, 并加载控制扩展
- 访问初始页面, 启动参数追加扩展配置, 扩展启动后 加载配置 以 装载相关功能
- 控制端发送命令, 扩展接收执行并返回响应结果
# 支持破解的人机验证
## Cloudflare Turnstile 
![cloudflare](https://github.com/Zsk-d/chrome-controller-ext/blob/prod/img/a58b37bb71f0d06b3064f0b72c33c320.png)
## Google reCAPTCHA V2
![gogle](https://github.com/Zsk-d/chrome-controller-ext/blob/prod/img/bf830d499937183de306c52fec6e6fb9.png)
# 机器人检测结果
![1](https://github.com/Zsk-d/chrome-controller-ext/blob/prod/img/53cdcce5eb7055493885909a7f8aab9e.png)
![2](https://github.com/Zsk-d/chrome-controller-ext/blob/prod/img/71742cc9e69b73c393c12f2cde537c1f.png)
# index.ts 消息中转服务
```
监听端口: WEBSOCKET_SERVER_PROT
```
### 消息类型
- 控制端注册: ctlReg
- 被控端注册: extReg
- 控制端命令: ctl-send
- 被控命令响应: ctl-res
- 扩展端事件: ext-event
# chrome/launch-chrome.ts chrome 启动工具
提供启动参数设定
# chrome/get-chrome-path.ts 查找chrome路径工具
# chrome-ext/zsk-spider-ext 被控端扩展
- background.js: 提供cdp 点击/触摸/发送按键 功能
- contentjs/doc_start.js: document start 时机注入脚本, 与页面js环境隔离
- contentjs/doc_idle.js: document idle 时机注入脚本, 与页面js环境隔离, 加载配置/注入页面脚本
- contentjs/contentConfig.js: doc_idle.js同时期引入, 定义扩展操作
- contentjs/ws.js: doc_idle.js同时期引入, 启动wesocket连接/注册扩展/接收中转服务的控制命令/监听页面注入js发出的事件/
# inject_js/ 页面js注入
- inject_2captcha_cloudflare.js: cloudflare 人机验证劫持js
- inject_2captcha_google.js: google v2人机验证劫持js
- inject_eval.js: 实现eval控制命令, 页面执行eval
- inject_fetch_hijack.js: fetch劫持注入js, 实现fetch 请求args劫持, 响应劫持
- inject_hide_cdp.js: cdp指纹隐藏
- inject_XX_timezone.js: 对应位置隐藏注入脚本
- inject_mix_canvas.js: canvas 指纹混淆注入脚本
- inject_webrtc_patch.js: webrtc屏蔽注入脚本
- inject_xhr_hijack.js: xhr劫持注入js, 实现xhr 的 open参数劫持/send响应text劫持
# util/ele.js
页面元素构建工具, 具体参数见describeElement返回值


# Chrome Controller Ext 项目开发与说明文档

## 项目概述

Chrome Controller Ext 是一个基于 WebSocket 的 Chrome 浏览器远程控制系统，允许外部客户端通过 WebSocket 服务器控制 Chrome 浏览器实例。该项目主要包含两个部分：

1. **WebSocket 服务器** (`src/server.ts`) - 作为中转服务器，管理控制端和被控端的连接
2. **Chrome 扩展程序** (`chrome-ext/zsk-spider-ext`) - 负责执行来自控制端的命令

## 架构设计

### 整体架构
```
控制端(Client) <---> WebSocket服务器 <---> Chrome扩展 <---> Chrome浏览器
```

### 核心组件

#### 1. WebSocket 服务器 (`src/server.ts`)
- 监听端口 `8899`
- 管理控制端和扩展端的连接
- 转发控制命令和响应

##### 消息类型：
- `ctlReg`: 控制端注册
- `extReg`: 扩展端注册  
- `ctl-send`: 控制端命令
- `ctl-res`: 控制端响应
- `ext-event`: 扩展端事件

#### 2. Chrome 启动器 (`src/chrome/launch-chrome.ts`)
- 自动查找 Chrome 安装路径
- 使用特定参数启动 Chrome 实例
- 支持代理、区域设置、用户数据目录等配置

#### 3. Chrome 扩展 (`chrome-ext/zsk-spider-ext`)
- **background.js**: 提供 CDP 调试接口，支持点击/按键/截图等操作
- **contentjs/**: 注入页面的内容脚本
- **inject_js/**: 注入页面的 JavaScript 代码，用于劫持各种 API

## 功能特性

### 1. 远程控制功能
- 打开网页 (`openPage`)
- 页面元素操作（点击、输入等）
- 执行 JavaScript 代码 (`getEval`)
- 截图功能 (`screenshot`)
- 页面刷新 (`reload`)

### 2. 人机验证绕过
- **Cloudflare Turnstile** 支持
- **Google reCAPTCHA V2** 支持

### 3. 浏览器指纹隐藏
- 隐藏 CDP 检测 ([inject_hide_cdp.js](/chrome-ext/zsk-spider-ext/inject_js/inject_hide_cdp.js))
- Canvas 指纹混淆 ([inject_mix_canvas.js](/chrome-ext/zsk-spider-ext/inject_js/inject_mix_canvas.js))
- WebRTC IP 隐藏 ([inject_webrtc_patch.js](/chrome-ext/zsk-spider-ext/inject_js/inject_webrtc_patch.js))
- XHR/Fetch 请求劫持 ([inject_xhr_hijack.js](/chrome-ext/zsk-spider-ext/inject_js/inject_xhr_hijack.js), [inject_fetch_hijack.js](/chrome-ext/zsk-spider-ext/inject_js/inject_fetch_hijack.js))

### 4. 区域设置支持
支持多种地区的时间和语言设置：
- JP (日本): `--lang=ja-JP`
- CO (哥伦比亚): `--lang=es-CO`
- IT (意大利): `--lang=it-IT`
- CZ (捷克): `--lang=cs-CZ`
- ES (西班牙): `--lang=es-ES`
- FR (法国): `--lang=fr-FR`

## 技术实现细节

### 1. WebSocket 通信协议

#### 控制端注册流程：
```
控制端 -> 服务器: {type: "ctlReg", data: {config}}
服务器 -> 控制端: {sessionId: "xxx"}
服务器 -> 启动 Chrome 实例
```

#### 扩展端注册流程：
```
扩展端 -> 服务器: {type: "extReg", sessionId: "xxx"}
服务器 -> 扩展端: 确认消息
服务器 -> 控制端: 通知扩展已就绪
```

#### 命令执行流程：
```
控制端 -> 服务器: {type: "ctl-send", command: "xxx", args: [...]}
服务器 -> 等待扩展端连接
服务器 -> 扩展端: {type: "command", command: "xxx", args: [...]}
扩展端 -> 服务器: {type: "ctl-res", data: {...}}
服务器 -> 控制端: 响应数据
```

### 2. Chrome 调试协议 (CDP) 集成

扩展通过 Chrome 的调试协议实现底层操作：
- 鼠标点击：`Input.dispatchMouseEvent`
- 键盘事件：`Input.dispatchKeyEvent`
- 触摸事件：`Input.dispatchTouchEvent`

### 3. 内容脚本机制

#### 执行时机：
- [doc_start.js](/chrome-ext/zsk-spider-ext/contentjs/doc_start.js): `document_start` 时机注入
- [doc_end.js](/chrome-ext/zsk-spider-ext/contentjs/doc_end.js): `document_end` 时机注入
- [doc_idle.js](/chrome-ext/zsk-spider-ext/contentjs/doc_idle.js): `document_idle` 时机注入

#### 注入脚本功能：
- [inject_xhr_hijack.js](/chrome-ext/zsk-spider-ext/inject_js/inject_xhr_hijack.js): XHR 请求劫持
- [inject_fetch_hijack.js](/chrome-ext/zsk-spider-ext/inject_js/inject_fetch_hijack.js): Fetch API 劫持
- [inject_2captcha_cloudflare.js](/chrome-ext/zsk-spider-ext/inject_js/inject_2captcha_cloudflare.js): Cloudflare 验证劫持
- [inject_2captcha_google.js](/chrome-ext/zsk-spider-ext/inject_js/inject_2captcha_google.js): Google reCAPTCHA 劫持

## 配置选项

### 服务器配置 (`src/clientConfig.ts`)
```typescript
export const defaultCtlConfig = {
  // 控制消息发送后等待扩展端连接的超时时间(秒)
  ctlSendTimeout: 60,
  // 控制消息发送后等待扩展端响应的间隔时间(秒)
  ctlSendTimeoutInterval: 0.1
}
```

### Chrome 启动参数 (`src/chrome/launch-chrome.ts`)
- `windowSize`: 窗口尺寸，默认 "1920,1080"
- `maximized`: 是否最大化窗口
- `proxy`: 代理设置
- `loc`: 区域设置
- `xhrHijack`: XHR 劫持开关
- `fetchHijack`: Fetch 劫持开关
- `tcaptchaGoogle`: Google 验证支持
- `tcaptchaCloudflare`: Cloudflare 验证支持

## 使用场景

### 1. 自动化测试
通过远程控制 Chrome 实例进行自动化测试，支持各种页面交互操作。

### 2. 数据采集
利用浏览器环境进行反爬虫对抗，绕过各类人机验证系统。

### 3. 浏览器指纹绕过
通过多种技术手段隐藏浏览器指纹特征，避免被识别为自动化工具。

## 安装与运行

### 依赖安装
```bash
npm install
```

### 启动服务器
```bash
npm run build  # 编译 TypeScript
node dist/server.js  # 启动 WebSocket 服务器
```

### 加载扩展
1. 在 Chrome 浏览器中打开 `chrome://extensions/`
2. 启用开发者模式
3. 加载 `chrome-ext/zsk-spider-ext` 目录

## 扩展开发指南

### 添加新的控制命令
在 [contentConfig.js](/chrome-ext/zsk-spider-ext/contentjs/contentConfig.js) 中添加新的控制命令：

```javascript
ctlConfig.addCtlCmd('customCommand', async (args) => {
    // 实现命令逻辑
    return { status: 200, data: result };
});
```

### 添加新的注入脚本
1. 在 `inject_js/` 目录下创建新的注入脚本
2. 更新 [manifest.json](/chrome-ext/zsk-spider-ext/manifest.json) 中的 `web_accessible_resources` 配置

### 事件处理机制
项目使用自定义事件机制处理页面和扩展之间的通信：
- `XHROpenEvent`: XHR 打开事件
- `XHRSendEvent`: XHR 发送事件
- `FetchEvent`: Fetch 事件
- `ClouflareTurnstileEvent`: Cloudflare 验证事件

## 注意事项

1. **安全性**: 此项目涉及浏览器自动化控制，使用时需遵守相关法律法规
2. **稳定性**: WebSocket 连接可能因网络问题断开，需要适当的重连机制
3. **兼容性**: 不同版本的 Chrome 可能会有不同的 API 行为
4. **性能**: 启动多个 Chrome 实例会消耗较多系统资源

## 维护与贡献

项目提供了完整的日志记录功能，便于调试和问题排查。如需扩展功能，建议遵循现有的代码结构和通信协议。