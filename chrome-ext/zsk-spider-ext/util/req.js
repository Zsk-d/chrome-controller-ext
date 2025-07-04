// 同步发送msg content -> bg
const sendMsgToBg = async (msg) => {
    return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(msg, (response) => {
            resolve(response);
        });
    });
}
function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}
function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}