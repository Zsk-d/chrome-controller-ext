import path from 'path'
import fs from 'fs'

const logLevelList = ['debug', 'info', 'warn', 'error']
const logFiles: any = {}
for (const level of logLevelList) {
    logFiles[level] = path.join(__dirname, 'logs', `chrome-controller-client-${level}.log`)
    fs.mkdirSync(path.dirname(logFiles[level]), { recursive: true })
}

export const getLogger = (jsFile: string, consoleLevel: string = 'info'): Logger => {
    const fileName = path.basename(jsFile)

    const log = (level: string, message: string, ...args: any[]) => {
        const time = new Date().toLocaleString()
        const formatted = `[${time}] [${level.toUpperCase()}] [${fileName}]: ${message} ${args && args.length > 0 ? ('[' + args.join(', ') + ']') : ''}`
        fs.appendFileSync(logFiles[level], formatted + '\n')
        if (logLevelList.slice(logLevelList.indexOf(consoleLevel)).indexOf(level) > -1) {
            console.log(formatted)
        }
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
