// 	文档刚开始解析时，DOM 尚未构建，可以阻止页面加载内容（例如脚本注入屏蔽广告）。
function injectScript(filePath) {
  if (!filePath) {
    return
  }
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath); // 获取扩展内资源的 URL
  script.type = 'text/javascript';
  script.onload = function () {
    this.remove(); // 可选，移除注入的 script 节点
  };
  (document.head || document.documentElement).appendChild(script);
}
const getTimeZoneInjectJs = (loc) => {
  return {
    'JP': injectScript('inject_js/inject_JP_timezone.js')
  }[loc]
}
(async function () {
  console.log("⭐ zsk Start 脚本注入! ⭐");

  // js 注入
  injectScript('inject_js/inject_webrtc_patch.js')
  // injectScript('inject_js/inject_req_hijack.js')
  injectScript('inject_js/inject_hide_cdp.js')
  injectScript('inject_js/inject_eval.js')
  injectScript('inject_js/inject_2captcha.js')
  window.addEventListener('XHREvent', function (event) {
    const requestData = event.detail;
    console.log('🚀 拦截到XHR请求:', requestData);
  });
  window.addEventListener('FetchEvent', function (event) {
    const requestData = event.detail;
    console.log('🚀 拦截到Fetch请求:', requestData);
  });

  // 检查浏览器时区设定
  // 检查是否
  let loc = await getStorageData('loc');
  if (!loc) {
    const parsed = new URL(window.location.href);
    loc = parsed.searchParams.get('loc');
    console.log('获取到的时区参数:', loc);
    if (loc) {
      console.log('设置时区为:', loc);
      await setStorageData('loc', loc);
      injectScript(getTimeZoneInjectJs(loc))
    }
  } else {
    console.log('存在时区配置', loc);
    injectScript(getTimeZoneInjectJs(loc))
  }

})();
