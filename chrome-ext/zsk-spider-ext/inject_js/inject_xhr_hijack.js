/**
 * 由于xhr中不可await调用, 所以参数劫持只能提前确定
 * 事件中只可以监听
 */
(async () => {
    if (window.hasXHRHijacked) return;
    window.hasXHRHijacked = true;
    console.log('xhr 劫持开始')

    // 存储原始方法
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // 保存劫持方法
    const globalOpenHijackFuncs = []
    const globalSendHijackFuncs = []

    console.log('开始监听xhr-open劫持方法设定事件')
    window.addEventListener('xhrOpenEventHijackFunc', function (event) {
        console.log('收到XHR-open 劫持函数:', event.detail);
        const funcStr = event.detail;
        globalOpenHijackFuncs.push(eval(`(${funcStr})`))
        console.log(`现有XHR-open 劫持函数`, globalOpenHijackFuncs)
    })

    console.log('开始监听xhr-send结果劫持方法设定事件')
    window.addEventListener('xhrSendEventHijackFunc', function (event) {
        console.log('收到XHR-send 劫持函数:', event.detail);
        const funcStr = event.detail;
        globalSendHijackFuncs.push(eval(`(${funcStr})`))
        console.log(`现有XHR-send 劫持函数`, globalSendHijackFuncs)
    })

    // 覆盖open方法
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/open
     * xhrReq.open(method, url, async, user, password);
     * @param  {...any} args 
     * @returns 
     */
    XMLHttpRequest.prototype.open = function (...args) {

        // 记录原始参数
        this._requestSrcMethod = args[0];
        this._requesSrctURL = args[1];
        this._openSrcArgs = args;

        // 处理拦截方法
        if (globalOpenHijackFuncs.length > 0) {
            console.log(`执行Open劫持方法`)
            globalOpenHijackFuncs.forEach(func => {
                args = func(...args)
            });
        }

        this._requestMethod = args[0];
        this._requestURL = args[1];
        this._openArgs = args;

        // 发送open事件
        const event = new CustomEvent('XHROpenEvent', { detail: args });
        window.dispatchEvent(event);
        
        return originalOpen.apply(this, args);
    };

    // 覆盖send方法
    XMLHttpRequest.prototype.send = async function (body) {
        const startTime = Date.now();
        const xhr = this;

        // 添加事件监听器
        const handleReadyStateChange = () => {
            if (xhr.readyState === 4) {
                let responseText = xhr.responseText
                const duration = Date.now() - startTime;

                // 发送自定义事件
                const requestData = {
                    srcMethod: xhr._requestSrcMethod,
                    /**
                     * 请求地址
                     */
                    srcUrl: xhr._requestSrcURL,
                    url: xhr._requestURL,
                    method: xhr._requestMethod,
                    /**
                     * 请求地址
                     */
                    srcUrl: xhr._requestURL,
                    /**
                     * 请求状态
                     */
                    status: xhr.status,
                    /**
                     * 请求内容
                     */
                    requestBody: body,
                    /**
                     * 原响应内容
                     */
                    srcResponseText: xhr.responseText,
                    /**
                     * 发送时间
                     */
                    duration: duration,
                    /**
                     * open的参数
                     */
                    openArgs: xhr._openArgs,
                    /**
                     * 事件时间
                     */
                    timestamp: new Date()
                }

                // 处理拦截方法
                if (globalSendHijackFuncs.length > 0) {
                    console.log(`执行Send劫持方法`)
                    globalSendHijackFuncs.forEach(func => {
                        responseText = func(requestData, responseText)
                    });
                }
                // 利用 Object.defineProperty 伪装响应
                try {
                    Object.defineProperty(xhr, 'responseText', {
                        get: function () {
                            return responseText
                        }
                    });
                } catch (err) {
                    console.warn('无法修改 responseText:', err);
                }

                const event = new CustomEvent('XHRSendEvent', { detail: requestData });
                window.dispatchEvent(event);

            }
        };

        this.addEventListener('readystatechange', handleReadyStateChange);
        return originalSend.apply(this, arguments);
    };
})()