/**
 * 文档刚开始解析时，DOM 尚未构建，可以阻止页面加载内容（例如脚本注入屏蔽广告）
 * @param {*} loc 
 * @returns 
 */
const getTimeZoneInjectJs = (loc) => {
  return {
    'JP': injectScript('inject_js/inject_JP_timezone.js')
  }[loc]
}

/**
 * 注入xhr劫持脚本
 */
const injectXhrHijack = () => {
  injectScript('inject_js/inject_xhr_hijack.js')
}

/**
 * 拦截Fetch请求
 */
const injectFetchHijack = () => {
  injectScript('inject_js/inject_fetch_hijack.js')
}

(async function () {

  // js 注入
  injectScript('inject_js/inject_webrtc_patch.js')
  injectScript('inject_js/inject_hide_cdp.js')


  // if (!getCurrentHref().startsWith('https://www.browserscan.net')) {
  //   return
  // }
  console.log("⭐ zsk Start 脚本注入! ⭐", getCurrentHref());

  // 读取参数
  let extOptions = await loadExtOptions()
  if (!extOptions) {
    return
  }

  // eval 2captcha 注入
  injectScript('inject_js/inject_eval.js')
  injectScript('inject_js/inject_2captcha.js')

  // 检查浏览器时区设定
  let loc = extOptions.loc
  if (loc) {
    console.log('存在时区配置', loc);
    injectScript(getTimeZoneInjectJs(loc))
  }

  // 检查fetch劫持
  if (extOptions.xhrHijack) {
    console.log('存在xhr劫持配置')
    injectXhrHijack()
  }

  // 检查xhr劫持
  if (extOptions.fetchHijack) {
    console.log('存在fetch劫持配置')
    injectFetchHijack()
  }
})()