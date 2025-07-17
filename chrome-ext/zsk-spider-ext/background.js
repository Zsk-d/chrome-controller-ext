// chrome.runtime.onInstalled.addListener(() => {
//   console.log("Extension installed and background service worker running.");
// });
// ✅ background.js（监听来自 content script 的消息）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("收到消息:", message)

  if (message.type === "greeting") {
    sendResponse({ reply: "content script" })
  }
  // 表示这是异步响应（可选）
  return true
});

// 1. 监听请求，打印尽可能多的信息
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // if(details.method === "POST"){
    //   console.log("[onBeforeRequest]", details)
    // }
  },
  { urls: ["<all_urls>"] },
  []
);
// 截图请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "requestScreenshot") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });

    // 异步响应
    return true;
  }
});


// 2. 修改请求头（例如添加自定义 Header）
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.declarativeNetRequest.updateDynamicRules({
//     addRules: [{
//       id: 1,
//       priority: 1,
//       action: {
//         type: "modifyHeaders",
//         requestHeaders: [
//           { header: "X-Custom-Header", operation: "set", value: "Zsk Injected By DNR" }
//         ]
//       },
//       condition: {
//         urlFilter: "*",
//         resourceTypes: ["xmlhttprequest"]
//       }
//     }]
//   });
// });

// 3. 监听响应头（只能查看，不能修改）
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    // console.log("[onHeadersReceived]", details)
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// 重定向规则
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.declarativeNetRequest.updateDynamicRules({
//     addRules: [{
//       id: 1,
//       priority: 1,
//       action: {
//         type: "redirect",
//         redirect: { url: "https://example.org/" }
//       },
//       condition: {
//         urlFilter: "example.com",
//         resourceTypes: ["main_frame"]
//       }
//     }],
//     removeRuleIds: [1]
//   });
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   console.log('tabs.onUpdated', tabId, changeInfo, tab);
//   if (changeInfo.status === "complete") {
//     console.log('tabs.onUpdated complete', tabId, changeInfo, tab);
//     chrome.scripting.executeScript({
//       target: { tabId },
//       files: ['inject_js/inject_xhr_hijack.js']
//     });
//   }
// });
// 建立CDP连接
async function connectToCDP(tabId, actions) {
  console.log('---------connectToCDP', tabId, actions);
  try {
    // 获取调试目标
    const targets = await new Promise((resolve) => {
      chrome.debugger.getTargets((result) => resolve(result));
    });

    const target = targets.find(t => t.tabId === tabId);
    if (!target) throw new Error('找不到调试目标');

    // 附加调试器
    await new Promise((resolve, reject) => {
      chrome.debugger.attach({ tabId }, "1.3", () => {
        chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
      });
    });

    console.log('CDP连接已建立');
    return true;
  } catch (error) {
    console.error('CDP连接失败:', error);
    return false;
  }
}

/**
 * 在 chrome 扩展环境中，用 chrome.debugger 发送触摸点击事件
 * @param {object} debuggeeId chrome.debugger.attach 的目标对象，比如 { tabId: 123 }
 * @param {number} x 触摸点击的屏幕X坐标
 * @param {number} y 触摸点击的屏幕Y坐标
 * @returns {Promise<void>}
 */


/**
 * 模拟鼠标按键
 * @param {*} params 
 * @param {*} sender 
 * @param {*} sendResponse 
 */
const impMousedownToClick = (params, sender, sendResponse) => {
  chrome.debugger.attach({ tabId: sender.tab.id }, '1.2', function () {
    console.log('接收到content的消息---------', params, sender)
    let flag = true

    const xC = params.x
    const yC = params.y
    //通过触发鼠标的按下和抬起事件来触发点击事件
    chrome.debugger.sendCommand(
      { tabId: sender.tab.id },
      'Input.dispatchMouseEvent',
      { type: 'mousePressed', x: xC, y: yC, button: 'left', clickCount: 1 },
      function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          flag = false
          return
        }
      }
    )
    chrome.debugger.sendCommand(
      { tabId: sender.tab.id },
      'Input.dispatchMouseEvent',
      {
        type: 'mouseReleased',
        x: xC,
        y: yC,
        button: 'left',
        clickCount: 1
      },
      function () {
        console.log('鼠标弹起完成_ 处理返回逻辑')
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          flag = false
          return
        }
        setTimeout(() => {
          if (flag) {
            sendResponse({ code: 200, message: '点击成功' })
          } else {
            sendResponse({ code: 500, message: '点击失败' })
          }
          chrome.debugger.detach({ tabId: sender.tab.id }, () => {
            console.log('取消attach')
          })
        }, 5000)
      }
    )
  })
}

// 封装异步的 sendCommand 辅助
function sendCommandAsync(debuggeeId, method, params) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(debuggeeId, method, params, (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(result);
    });
  });
}

/**
 * 通过 chrome.debugger 发送触摸点击事件
 * @param {{tabId:number}} debuggeeId
 * @param {{x:number,y:number}} coords
 * @returns {Promise<void>}
 */
async function sendTouchClickInternal(debuggeeId, coords) {
  await sendCommandAsync(debuggeeId, 'Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: coords.x, y: coords.y }],
    modifiers: 0,
  });

  await new Promise(r => setTimeout(r, 50));

  await sendCommandAsync(debuggeeId, 'Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
    modifiers: 0,
  });
}

/**
 * 供消息监听调用，自动 attach 并执行触摸点击
 * @param {{tabId:number,x:number,y:number}} params 
 * @param {chrome.runtime.MessageSender} sender
 * @param {(response:any) => void} sendResponse
 */
async function sendTouchClick(params, sender, sendResponse) {
  const debuggeeId = { tabId: params.tabId ?? sender.tab?.id };
  if (!debuggeeId.tabId) {
    sendResponse({ success: false, error: '无法获取 tabId' });
    return;
  }

  try {
    // attach 目标 tab
    await new Promise((resolve, reject) => {
      chrome.debugger.attach(debuggeeId, '1.3', () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });

    // 执行触摸点击
    await sendTouchClickInternal(debuggeeId, params);

    // detach
    chrome.debugger.detach(debuggeeId);

    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message || error });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'mousedownToClick') {
    const { params } = request;
    impMousedownToClick(params, sender, sendResponse);
  } else if (request.action === 'triggerKeyPress') {
    const { params } = request;
    impTriggerKeyPress(params, sender, sendResponse);
  } else if (request.action === 'touchXY') {
    sendTouchClick(request.params, sender, sendResponse);
  }
  return true; // 保持异步响应
});

// 新增键盘事件实现
// 新增键盘事件处理函数
const impTriggerKeyPress = (params, sender, sendResponse) => {
  chrome.debugger.attach({ tabId: sender.tab.id }, '1.2', () => {
    const keyMap = {
      'Enter': { code: 'Enter', keyCode: 13 },
      'Escape': { code: 'Escape', keyCode: 27 },
      'Tab': { code: 'Tab', keyCode: 9 },
      'ArrowUp': { code: 'ArrowUp', keyCode: 38 },
      'ArrowDown': { code: 'ArrowDown', keyCode: 40 },
      'ArrowLeft': { code: 'ArrowLeft', keyCode: 37 },
      'ArrowRight': { code: 'ArrowRight', keyCode: 39 },
      'Backspace': { code: 'Backspace', keyCode: 8 },
      'Delete': { code: 'Delete', keyCode: 46 },
      'Space': { code: 'Space', keyCode: 32 },
      '.': { code: 'Period', keyCode: 190 },  // 点号的特殊处理
    };

    // 获取键位配置（特殊键或默认字符）
    const keyConfig = keyMap[params.key] || {
      code: params.key.length === 1 ? `Key${params.key.toUpperCase()}` : params.key,
      keyCode: params.key.charCodeAt(0)
    };

    // 发送keyDown事件
    chrome.debugger.sendCommand(
      { tabId: sender.tab.id },
      'Input.dispatchKeyEvent',
      {
        type: 'keyDown',
        x: params.x,
        y: params.y,
        text: params.key.length === 1 ? params.key : '',
        key: params.key,
        code: keyConfig.code,
        windowsVirtualKeyCode: keyConfig.keyCode,
        isKeypad: false,
        isSystemKey: false
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error('KeyDown error:', chrome.runtime.lastError.message);
          cleanup(sendResponse, sender.tab.id, false);
          return;
        }

        // 发送keyUp事件
        setTimeout(() => {
          chrome.debugger.sendCommand(
            { tabId: sender.tab.id },
            'Input.dispatchKeyEvent',
            {
              type: 'keyUp',
              x: params.x,
              y: params.y,
              key: params.key,
              code: keyConfig.code,
              windowsVirtualKeyCode: keyConfig.keyCode
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error('KeyUp error:', chrome.runtime.lastError.message);
                cleanup(sendResponse, sender.tab.id, false);
              } else {
                cleanup(sendResponse, sender.tab.id, true);
              }
            }
          );
        }, 50); // 更短的延迟（50ms）
      }
    );
  });
};

// 清理函数
const cleanup = (sendResponse, tabId, success) => {
  chrome.debugger.detach({ tabId }, () => {
    sendResponse({
      code: success ? 200 : 500,
      message: success ? '按键成功' : '按键失败'
    });
  });
}