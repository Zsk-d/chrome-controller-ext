// 浏览器空闲时执行（通常在页面加载结束之后），默认值，适合非关键操作。
const regExt = async () => {
  let sessionId = await getStorageData('sessionId');
  let isFirst = false
  if (!sessionId) {
    const parsed = new URL(window.location.href);
    sessionId = parsed.searchParams.get('sessionId');
    await setStorageData('sessionId', sessionId);
    isFirst = true
  }
  connectWS(sessionId, isFirst)
}

(async function () {
  console.log("⭐ zsk Idle 脚本注入! ⭐");
  // 示例：修改页面标题
  document.title += " [zs已加载]";

  await regExt()

  // chrome.runtime.sendMessage(
  //     {
  //       action: 'runCDPAutomation',
  //       actions: [{ type: 'navigate' }]
  //     })
})();