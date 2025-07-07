import { spawn } from 'child_process'
import path from 'path'
import { getChromePath } from './get-chrome-path'
import { getLogger } from '../logger'

const logger = getLogger(__filename)
const locMap: any = {
    'JP': `--lang=ja-JP`
}

/**
 * 创建浏览器对象
 * @param sessionId 浏览器sessionid, 对应浏览器userdata
 * @param opions 浏览器参数
 * @returns 浏览器窗口pid
 */
export const newChromeSession = (dir: string, sessionId: string, opions: ChromeOption): number | undefined => {
    let {
        windowSize = '1920,1080',
        maximized = false,
        disableSystemProxy = false,
        proxy = null,
        loc = null,
        chromePath = null
    } = opions || {}

    // Chrome 可执行路径
    if (!chromePath) {
        chromePath = getChromePath()
    }
    if (!chromePath) {
        logger.error('未找到 Chrome 可执行文件')
        throw new Error('未找到 Chrome 可执行文件, 请在options中传递可用的chrome.exe路径')
    }

    // chrome启动参数
    let extPath = path.resolve('./chrome-ext/zsk-spider-ext')
    let paramsStr = ''

    const args = [
        `--user-data-dir=${path.resolve('userdata/' + dir + '/' + sessionId)}`,
        `--load-extension=${extPath}`,
        `--disable-extensions-except=${extPath}`,
        '--no-first-run',
        '--no-default-browser-check',
        `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`,
        `--disable-features=WebRtcHideLocalIpsWithMdns`,
        `--window-position=0,0`,
        `--disable-popup-blocking`,
        `--disable-notifications`,
        `--no-default-browser-check`,
        `--disable-features=PasswordManager`,
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
    ]

    if (maximized) {
        args.push('--start-maximized')
    } else {
        if (windowSize) {
            args.push(`--window-size=${windowSize}`)
        }
    }
    if (proxy) {
        args.push(`--proxy-server=${proxy}`)
    }
    if (disableSystemProxy) {
        args.push('--no-proxy-server')
    }

    if (loc && locMap[loc]) {
        // 有指定伪装位置, 根据位置设定浏览器的 时区,语言
        args.push(locMap[loc])
        paramsStr += `&loc=${loc}`
    }
    args.push('--new-window',)
    args.push('https://www.browserscan.net/zh?sessionId=' + sessionId + paramsStr)
    const chrome = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore'
    })

    chrome.unref()
    logger.info('Chrome 启动参数', JSON.stringify(args))
    logger.info('Chrome 启动成功，PID:', chrome.pid)
    return chrome.pid
}