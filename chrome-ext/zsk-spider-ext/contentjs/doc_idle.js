// 浏览器空闲时执行（通常在页面加载结束之后），默认值，适合非关键操作。
const regExt = async () => {
  let extOptions = await loadExtOptions()
  let exReged = await getStorageData('exReged')
  if (!exReged) {
    await setStorageData('exReged', true)
  }
  connectWS(extOptions.sessionId, !exReged)
}

(async function () {
  console.log("⭐ zsk Idle 脚本注入! ⭐", getCurrentHref());

  let extOptions = await loadExtOptions()
  if (extOptions.title) {
    document.title = extOptions.title
  }

  await regExt()

  // chrome.runtime.sendMessage(
  //     {
  //       action: 'runCDPAutomation',
  //       actions: [{ type: 'navigate' }]
  //     })
})();