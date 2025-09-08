// 文档刚开始解析时，DOM 尚未构建，可以阻止页面加载内容（例如脚本注入屏蔽广告）
/**
 * 注入js到页面
 * @param {*} filePath 
 * @returns 
 */
const injectScript = (filePath) => {
  if (!filePath) {
    return
  }
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath); // 获取扩展内资源的 URL
  script.type = 'text/javascript'
  script.onload = function () {
    // this.remove() // 可选，移除注入的 script 节点
  };
  (document.head || document.documentElement).appendChild(script);
}
const getTimeZoneInjectJs = (loc) => {
  return {
    'JP': 'inject_js/inject_JP_timezone.js',
    'CO': 'inject_js/inject_CO_timezone.js',
    'IT': 'inject_js/inject_IT_timezone.js',
    'CZ': 'inject_js/inject_CZ_timezone.js',
    'ES': 'inject_js/inject_ES_timezone.js',
    'FR': 'inject_js/inject_FR_timezone.js',
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

// js 注入
// injectScript('inject_js/inject_global_config.js');
// injectScript('inject_js/inject_mix_canvas.js');
injectScript('inject_js/inject_webrtc_patch.js');
injectScript('inject_js/inject_hide_cdp.js');
injectScript('inject_js/inject_eval.js');

(async function () {
  console.log("⭐ zsk Start 脚本注入! ⭐", getCurrentHref());

  // 读取参数
  let extOptions = await loadExtOptions()
  if (!extOptions) {
    return
  }
  if (extOptions.tcaptchaGoogle) {
    injectScript('inject_js/inject_2captcha_google.js');
  }
  if (extOptions.tcaptchaCloudflare) {
    injectScript('inject_js/inject_2captcha_cloudflare.js');
  }


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