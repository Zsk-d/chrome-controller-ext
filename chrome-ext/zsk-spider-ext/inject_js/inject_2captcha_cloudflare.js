// cloudflare turnstile
console.log(`cloudflare turnstile js注入`)
let turnstileStart = Date.now()
const i = setInterval(() => {
  if (window.turnstile) {
    clearInterval(i)
    window.turnstile.render = (a, b) => {
      let p = {
        type: "TurnstileTaskProxyless",
        websiteKey: b.sitekey,
        websiteURL: window.location.href,
        data: b.cData,
        pagedata: b.chlPageData,
        action: b.action,
        userAgent: navigator.userAgent
      }
      console.log(JSON.stringify(p))
      setTimeout(() => {
        const event = new CustomEvent('ClouflareTurnstileEvent', { detail: p });
        window.dispatchEvent(event);
      }, 1000)
      // 发送event事件, 进行解码
      window.tsCallback = b.callback
      return 'foo'
    }
  }
  else if (Date.now() - turnstileStart > 30 * 1000) {
    console.log('cloudflare turnstile 不存在')
    clearInterval(i)
  }
}, 10)