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
