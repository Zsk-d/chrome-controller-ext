import { spawn } from 'child_process'
import path from 'path'
import { getChromePath } from './get-chrome-path'
import { getLogger } from '../logger'

const logger = getLogger(__filename)
const locMap: any = {
    'JP': `--lang=ja-JP`,
    'CO': `--lang=es-CO`,
    'IT': `--lang=it-IT`,
    'CZ': `--lang=cs-CZ`,
    'US': `--lang=en-US`,
    'KR': `--lang=ko-KR`,
    'RU': `--lang=ru-RU`,
    'BR': `--lang=pt-BR`,
    'ID': `--lang=id-ID`,
    'TH': `--lang=th-TH`,
    'VN': `--lang=vi-VN`,
    'ES': `--lang=es-ES`,
    'FR': `--lang=fr-FR`,
    'DE': `--lang=de-DE`,
    'TR': `--lang=tr-TR`,
    'PH': `--lang=en-PH`,
    'UA': `--lang=uk-UA`,
    'PL': `--lang=pl-PL`,
    'IN': `--lang=en-IN`,

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
        chromePath = null,
        windowPosition = '0,0',
        xhrHijack = false,
        fetchHijack = false,
        tcaptchaGoogle = false,
        tcaptchaCloudflare = false,
        extPath = null,
        openPage = null,
        headless = false,
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
    // let extPath = path.resolve('./chrome-ext/zsk-spider-ext')
    let paramsStr = ''

    const args = [
        `--user-data-dir=${path.resolve('userdata/' + dir + '/' + sessionId)}`,
        '--no-first-run',
        '--no-default-browser-check',
        `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`,
        `--disable-features=WebRtcHideLocalIpsWithMdns`,
        `--window-position=${windowPosition}`,
        `--disable-popup-blocking`,
        // `--disable-notifications`,
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
    if (headless) {
        args.push('--headless=new')
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
    if (xhrHijack) {
        paramsStr += `&xhrHijack=true`
    }
    if (fetchHijack) {
        paramsStr += `&fetchHijack=true`
    }
    if (tcaptchaGoogle) {
        paramsStr += `&tcaptchaGoogle=true`
    }
    if (tcaptchaCloudflare) {
        paramsStr += `&tcaptchaCloudflare=true`
    }
    if (openPage) {
        args.push('--new-window')
        args.push(openPage)
    }

    if (extPath) {
        args.push(`--load-extension=${extPath}`,)
        args.push(`--disable-extensions-except=${extPath}`,)

        args.push('--new-window',)
        args.push('https://ipinfo.io/json?sessionId=' + sessionId + paramsStr)
    }
    const chrome = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore'
    })

    chrome.unref()
    logger.info('Chrome 启动参数', JSON.stringify(args))
    logger.info('Chrome 启动成功，PID:', chrome.pid)
    return chrome.pid
}