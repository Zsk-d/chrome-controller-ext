import * as WebSocket from 'ws'
import { IncomingMessage } from 'http'

import { v4 } from 'uuid'
import fs from 'fs'
import path from 'path'

import { newChromeSession } from './chrome/launch-chrome'
import { defaultCtlConfig } from './clientConfig'

import { getLogger } from './logger'

const logger = getLogger(__filename)

const WEBSOCKET_SERVER_PROT = 8899
const wss = new WebSocket.Server({ port: WEBSOCKET_SERVER_PROT })
// 清理 ./userdata文件夹下的所有文件
const clearData = (sessionId?: string) => {
    const basePath = 'userdata/tmp'
    const targetPath = sessionId ? path.join('userdata/tmp', sessionId) : basePath

    const deleteRecursiveSync = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return

        const entries = fs.readdirSync(dirPath)
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry)
            const stat = fs.lstatSync(fullPath)

            if (stat.isDirectory()) {
                deleteRecursiveSync(fullPath) // 递归删除子目录
            } else {
                fs.unlinkSync(fullPath) // 删除文件
            }
        }

        // 最后删除空目录自身
        fs.rmdirSync(dirPath)
    }

    try {
        if (fs.existsSync(targetPath)) {
            if (sessionId) {
                // 删除指定 sessionId 子目录及其内容
                deleteRecursiveSync(targetPath)
                logger.info(`已删除userdata session: ${sessionId}`)
            } else {
                // 删除 userdata 下所有子目录和文件，但保留 userdata 目录本身
                const entries = fs.readdirSync(targetPath)
                for (const entry of entries) {
                    const fullPath = path.join(targetPath, entry)
                    const stat = fs.lstatSync(fullPath)

                    if (stat.isDirectory()) {
                        deleteRecursiveSync(fullPath)
                    } else {
                        fs.unlinkSync(fullPath)
                    }
                }
                logger.info(`已清空 userdata`)
            }
        } else {
            if (sessionId) {
                logger.info(`路径不存在: ${targetPath}`)
            }
        }
    } catch (err: any) {
        logger.error(`清理失败: ${err.message}`)
    }
}
clearData()
const clients: any = {
    /**
     * "sessionId":{
     *  "ctlWs":null.
     *  "extWs":null",
     *  "chromePid":null",
     * }
     */
}
const resolveRes = (sessionId: string, data = {}) => {
    clients[sessionId] && clients[sessionId].ctlWs.send(JSON.stringify({
        type: "ctl-res",
        data
    }))
}
const resolveExtEvent = (sessionId: string, data = {}) => {
    clients[sessionId].ctlWs.send(JSON.stringify({
        type: "ext-event",
        data
    }))
}
const resolveExtEventRes = (sessionId: string, data = {}) => {
    clients[sessionId].extWs.send(JSON.stringify({
        type: "ext-event-res",
        data
    }))
}
const waitExtWs = async (sessionId: string, timeout = 20, interval = 0.1) => {
    let now = new Date().getTime()
    await new Promise((resolve, reject) => {
        let timer = setInterval(async () => {
            // console.log('----检查extWxss状态---')
            if (clients[sessionId] && clients[sessionId].extWs) {
                // console.log('extWxs已连接')
                clearInterval(timer)
                resolve({})
            } else {
                // console.log('extWxs未连接')
                if (new Date().getTime() - now > timeout * 1000) {
                    
                    clearInterval(timer)
                    // console.log('extWxs等待超时')
                    logger.error(`session[${sessionId}] 扩展端注册超时 timeout=${timeout}s`)
                    logger.info(JSON.stringify(clients))
                    // 重启浏览器
                    killChrome(clients[sessionId], true)
                    
                    await new Promise(resolve => setTimeout(resolve, 5 * 1000));

                    let chromePid = newChromeSession(clients[sessionId].config.keepUserdata ? 'hard' : 'tmp', sessionId, clients[sessionId].config)
                    clients[sessionId].chromePid = chromePid

                    await waitExtWs(sessionId, timeout, interval)
                }
            }
        }, interval * 1000)
    })
}
const killChrome = (client: any, dontDelData?: boolean) => {
    if (client && client.chromePid) {
        try {
            process.kill(client.chromePid)
            logger.info(`Chrome ${client.chromePid} 被终止`)
        } catch (e: any) {
            logger.warn(`无法终止 Chrome ${client.chromePid}:`, e.message)
        }
        if (client.config && client.config.keepUserdata) {
        } else {
            if(!dontDelData){
                setTimeout(() => {
                    clearData(client.config.sessionId)
                }, 5000)
            }
        }
    }
}
wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress
    const port = req.socket.remotePort
    logger.info(`新Ws连接来自 IP: ${ip}, Port: ${port}`)
    let sessionId = ''

    ws.on("message", async (data) => {
        logger.info(`[Ws] 收到消息: ${data}`)
        let msg
        try {
            const str = typeof data === 'string' ? data : data.toString('utf-8')
            msg = JSON.parse(str)
        } catch {
            return ws.send(JSON.stringify({ error: "Invalid JSON" }))
        }

        // 接收[控制端]的新控制会话
        /**
         * 消息格式:
         * {
         *  type: "ctlReg",
         * }
         */
        if (msg.type === "ctlReg") {
            const config = msg.data.config ? msg.data.config : defaultCtlConfig
            // 创建新的会话id - uuid
            // 检查是否指定sessionId
            if (config.sessionId) {
                sessionId = config.sessionId
            } else {
                sessionId = v4()
            }
            clients[sessionId] = { ctlWs: ws }
            logger.info(`新控制会话创建: session: ${sessionId}`)
            clients[sessionId].config = config
            // 执行命令,开启chrome环境
            let chromePid = newChromeSession(config.keepUserdata ? 'hard' : 'tmp', sessionId, clients[sessionId].config)
            clients[sessionId].chromePid = chromePid
            logger.info('控制端注册成功: ' + JSON.stringify(msg))
            ws.send(JSON.stringify({ sessionId }))

            
            let ctlSendTimeout = clients[sessionId].config.ctlSendTimeout || 20
            let ctlSendTimeoutInterval = clients[sessionId].config.ctlSendTimeoutInterval || 0.1
            try {
                await waitExtWs(sessionId, ctlSendTimeout, ctlSendTimeoutInterval)
            } catch (error: any) {
                resolveRes(sessionId, { status: 500, msg: error.message })
            }
        } else if (msg.type === "extReg") {
            // 扩展注册
            let sid = msg.sessionId
            let tabIndex = msg.tabIndex
            if (!sid) {
                // 关闭ws连接
                ws.send(JSON.stringify({ status: 200, msg: "注册失败,无sessionId", data: null }))
                return ws.close()
            }
            if (!clients[sid]) {
                // 关闭ws连接
                ws.send(JSON.stringify({ status: 200, msg: `会话[${sid}]失效`, data: null }))
                return ws.close()
            }
            sessionId = sid
            // 注册扩展连接
            clients[sessionId].extWs = ws
            logger.info('扩展端注册成功: ' + sessionId)
            ws.send(JSON.stringify({ status: 200, msg: '扩展注册成功', data: null }))
            // 检查是否有劫持函数
            let config = clients[sessionId].config
            if (config.hijackFuncs) {
                ws.send(JSON.stringify({
                    type: "ext-set-hijack-funcs",
                    data: config.hijackFuncs
                }))
            }
            // 通知控制端 扩展端已注册
            // resolveRes(sessionId, { status:200, msg: 'ext ready' })
            return
        }
        // 接收[控制端]控制命令
        /**
         * 消息格式:
         * {
         *  type: "ctl-send",
         *  sessionId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
         *  command: "xxx",
         *  args: [],
         *  timeout: 60
         * }
         * 
         */
        // 循环等待扩展端注册, 并设置默认等待超时
        else if (sessionId && msg.type === "ctl-send" && msg.command) {
            try {

                clients[sessionId].extWs.send(JSON.stringify({
                    type: "command",
                    command: msg.command,
                    args: msg.args || []
                }))
                // 检查命令响应超时
            } catch (error: any) {
                resolveRes(sessionId, { status: 500, msg: error.message })
            }
        }
        // 扩展端的命令响应
        else if (sessionId && msg.type === "ctl-res") {
            let res = msg.data
            resolveRes(sessionId, res)
        } else if (sessionId && msg.type === "ext-event") {
            let res = msg.data
            resolveExtEvent(sessionId, res)
        } else if (sessionId && msg.type === "ext-event-res") {
            // 检查页面是否已经重新加载
            if (!clients[sessionId].extWs) {
                return
            }
            resolveExtEventRes(sessionId, msg.data)
        } else {
            ws.send(JSON.stringify({ status: 400, msg: '无效的消息类型', data: null }))
        }
    })
    // 控制端断开时
    ws.on("close", () => {
        if (!sessionId || !clients[sessionId]) return

        const client = clients[sessionId]

        // 主动关闭另一方连接（如果还存在且未被当前 ws 触发）
        if (client.extWs && client.extWs !== ws && client.extWs.readyState === WebSocket.OPEN) {
            client.extWs.close(4000, "控制端断开")
        }
        if (client.ctlWs && client.ctlWs !== ws && client.ctlWs.readyState === WebSocket.OPEN) {
            logger.info('扩展端已断开: ' + sessionId)
            // 清理扩展的ws
            client.extWs = null
            return
        }

        // 杀掉 Chrome
        killChrome(client)

        // 清理客户端
        delete clients[sessionId]
        logger.info(`------ 会话 ${sessionId} 已完全清理 ------`)
    })

})

logger.info("扩展控制服务启动, 地址: ws://localhost:" + WEBSOCKET_SERVER_PROT)