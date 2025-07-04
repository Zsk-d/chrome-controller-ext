const connectWS = (sessionId, isFirst) => {
    let ws = new WebSocket("ws://localhost:8899");

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