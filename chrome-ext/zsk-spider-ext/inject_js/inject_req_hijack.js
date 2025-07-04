// 此文件用于劫持XMLHttpRequest 和 fetch 对象，拦截所有请求，并修改请求头和请求体
(function () {
    console.log('--------------xhr 劫持开始');
    if (window.hasXHRHijacked) return;
    window.hasXHRHijacked = true;

    // 存储原始方法
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // 覆盖open方法
    XMLHttpRequest.prototype.open = function (method, url) {
        this._requestMethod = method;
        this._requestURL = url;
        return originalOpen.apply(this, arguments);
    };

    // 覆盖send方法
    XMLHttpRequest.prototype.send = function (body) {
        const startTime = Date.now();
        const xhr = this;

        // 添加事件监听器
        const handleReadyStateChange = () => {
            if (xhr.readyState === 4) {
                const duration = Date.now() - startTime;
                const requestData = {
                    method: xhr._requestMethod,
                    url: xhr._requestURL,
                    status: xhr.status,
                    requestBody: body,
                    responseText: xhr.responseText,
                    duration: duration,
                    timestamp: new Date()
                }

                // 发送自定义事件
                const event = new CustomEvent('XHREvent', { detail: requestData });
                window.dispatchEvent(event);
            }
        };

        this.addEventListener('readystatechange', handleReadyStateChange);
        return originalSend.apply(this, arguments);
    };
    // fetch 劫持
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        // 克隆响应体
        const cloned = response.clone();
        cloned.text().then(body => {
            console.log("响应内容：", body);
            const event = new CustomEvent('FetchEvent', { detail: {
                args: args,
                body: body
            } });
            window.dispatchEvent(event);
        });

        return response;
    };
})();
