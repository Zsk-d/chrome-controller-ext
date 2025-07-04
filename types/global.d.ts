export { }

declare global {
    type Logger = {
        info: Function,
        debug: Function,
        warn: Function,
        error: Function,
    }
    type ChromeOption = {

        /** 窗口大小，格式如 "1920x1080"，若未指定可在代码中默认处理 */
        windowSize?: string

        /** 是否最大化窗口（默认为 false） */
        maximized?: boolean

        /** 是否禁用系统代理设置 */
        disableSystemProxy?: boolean

        /** HTTP 代理，格式如 "host:port"，为 null 表示不使用 */
        proxy?: string

        /** 地理位置信息，字符串形式，如 "JP"、"US"，可选 */
        loc?: string

        /** Chrome 执行文件路径，不提供则 使用系统默认路径 */
        chromePath?: string
    }
}