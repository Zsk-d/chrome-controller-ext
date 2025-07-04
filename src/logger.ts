const fs = require('fs')
const path = require('path')

const logFilePath = path.join(__dirname, 'logs', 'transfer_server.log')
fs.mkdirSync(path.dirname(logFilePath), { recursive: true })

export const getLogger = (jsFile: string): Logger => {
    const fileName = path.basename(jsFile)

    const log = (level: string, message: string, ...args: any[]) => {
        const time = new Date().toLocaleString()
        const formatted = `[${time}] [${level.toUpperCase()}] [${fileName}]: ${message} ${args && args.length > 0 ? ('[' + args.join(', ') + ']') : ''}`
        fs.appendFileSync(logFilePath, formatted + '\n')
        console.log(formatted)
    }

    return {
        info: (msg: string, ...args: any[]) => log('info', msg, ...args),
        debug: (msg: string, ...args: any[]) => log('debug', msg, ...args),
        warn: (msg: string, ...args: any[]) => log('warn', msg, ...args),
        error: (msg: string, ...args: any[]) => log('error', msg, ...args),
    }
}

// log('info', '程序已启动')
// log('warn', '注意事项')
// log('error', '发生错误')
