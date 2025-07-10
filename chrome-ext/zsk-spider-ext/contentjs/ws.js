// ext - event
const connectWS = (sessionId, isFirst) => {
    let ws = new WebSocket("ws://localhost:8899");

    // 监听eval响应
    console.log('[content] 开始监听injectjs的XHROpenEvent响应')
    window.addEventListener('XHROpenEvent', function (event) {
        const requestData = event.detail;
        // console.log('拦截到XHR-open请求:', event.detail);
        ws.send(JSON.stringify({ type: "ext-event", data: { eventName: 'XHROpenEvent', eventData: requestData } }));
    })
    console.log('[content] 开始监听injectjs的XHRSendEvent响应')
    window.addEventListener('XHRSendEvent', function (event) {
        const requestData = event.detail;
        // console.log('拦截到XHR-send请求:', requestData);
        ws.send(JSON.stringify({ type: "ext-event", data: { eventName: 'XHRSendEvent', eventData: requestData } }));
    })
    console.log('[content] 开始监听injectjs的FetchEvent响应')
    window.addEventListener('FetchEvent', function (event) {
        const requestData = event.detail;
        // console.log('拦截到Fetch请求:', requestData);
        ws.send(JSON.stringify({ type: "ext-event", data: { eventName: 'FetchEvent', eventData: requestData } }));
    });
    window.addEventListener('ClouflareTurnstileEvent', function (event) {
        const requestData = event.detail;
        ws.send(JSON.stringify({ type: "ext-event", data: { eventName: 'ClouflareTurnstileEvent', eventData: requestData } }));
    });

    ws.onopen = async () => {
        console.log("[content] ✅ WebSocket 已连接, 准备注册 " + sessionId);
        ws.send(JSON.stringify({ type: "extReg", sessionId }));
        // 
        // 检查是否有待发送的ctl响应
        if (isFirst) {
            console.log("首次启动，发送ctl-res");
            ws.send(JSON.stringify({ type: "ctl-res", data: { status: 200, msg: '被控端扩展初次注册' } }));
        } else {
            let ctlRes = await getStorageData('ctl-res')
            if (ctlRes) {
                console.log("[content] ✉️ 发送待发送的ctl响应：", ctlRes);
                ws.send(JSON.stringify(ctlRes));
                // 删除ctl响应
                await setStorageData('ctl-res', null)
            }
        }
    }

    ws.onmessage = async (event) => {
        console.log("[content] 📩 收到消息：", event.data);
        let msg = JSON.parse(event.data);
        if (msg.type === 'command') {
            let command = msg.command
            let args = msg.args
            console.log("[content] 🤖 收到控制命令", command, args);
            // 提前装载一个中断响应
            await setStorageData('ctl-res', { type: "ctl-res", data: { status: 500, msg: command + ' 命令中断' } })
            console.debug('---> ZSK SPIDER CTL EXECUTE START', command, args);
            ctlConfig.getCtlRes(command, args).then(async res => {
                if (res !== null) {
                    ws.send(JSON.stringify({ type: "ctl-res", data: res }));
                    console.debug(command, res, 'ZSK SPIDER CTL EXECUTE END <---');
                    // 清除中断数据
                    await setStorageData('ctl-res', null)
                }

            })
        } else if (msg.type == 'ext-event-res') {
            let { eventName, eventResData } = msg.data
            const resEvent = new CustomEvent(eventName + 'Res', { detail: eventResData });
            window.dispatchEvent(resEvent);
        } else if (msg.type == 'ext-set-hijack-funcs') {
            // 设定劫持函数
            console.log('收到劫持函数设定', msg.data)
            let funcs = msg.data
            Object.keys(funcs).forEach(name => {
                const resEvent = new CustomEvent(name, { detail: funcs[name] });
                window.dispatchEvent(resEvent);
            })
        }

    }
    ws.onclose = () => {
        console.log("[content] ❌ WebSocket 已断开");
        // 可重连逻辑（可选）
    };

    ws.onerror = (err) => {
        console.error("[content] ⚠️ WebSocket 错误：", err);
    };
}