/**
 * 同步发送msg content -> bg
 * @param {*} msg 
 * @returns 
 */
const sendMsgToBg = async (msg) => {
  return await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      resolve(response);
    });
  })
}
/**
 * 从chromeStorage中获取数据
 * @param {*} key 
 * @returns 
 */
const getStorageData = (key) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] || null)
    });
  })
}
/**
 * 保存数据到chromeStorage
 * @param {*} key 
 * @param {*} value 
 * @returns 
 */
const setStorageData = (key, value) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve()
    });
  });
}
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
/**
 * 获取扩展选项
 */
const loadExtOptions = async () => {
  // 先检查chromeStorage中
  let params = await getStorageData('extOptions') || {}
  if (params && params.sessionId) {
    console.log('zsk扩展读取参数', params)
    return params
  }
  const parsed = new URL(window.location.href);
  // 保存所有参数
  for (const [key, value] of parsed.searchParams.entries()) {
    params[key] = value;
  }
  // 只有sessionId的才保留
  if (!params.sessionId) {
    return null
  }
  await setStorageData('extOptions', params)
  console.log('zsk扩展读取参数', params)
  return params
}

const getCurrentTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab
}
const getCurrentHref = () => {
  return window.location.href
}
