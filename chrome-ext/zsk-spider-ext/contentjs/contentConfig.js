
let evalObj = {}
// 监听eval响应
console.log('[content] 开始监听injectjs的eval响应')
window.addEventListener('PageEvalResEvent', function (event) {
    const requestData = event.detail;
    const res = requestData.res;
    console.log('获取到PageEvalResEvent响应:', res);
    if (evalObj.resolve) {
        evalObj.resolve(res)
        evalObj.resolve = null
    }
});

const ctlConfig = (() => {
    /**
     * 保存控制命令
     * cmd:{
     *  func
     * }
     */
    const eventMap = {}
    /**
     * 保存获取到的元素
     * 
     */
    const eleMap = {}

    function openDebuggerToClick(element) {
        return new Promise((resolve, reject) => {
            console.log('click目标是', element)
            const x = element.getBoundingClientRect().left + 5
            const y = element.getBoundingClientRect().top + 5

            // 根据按钮的mousedown事件来触发点击事件
            element.addEventListener(
                'mousedown',
                function (e) {
                    if (!e.isTrusted) {
                        e.preventDefault()
                        let obj = { x, y }
                        chrome.runtime.sendMessage(
                            {
                                action: 'mousedownToClick',
                                params: obj
                            },
                            function (response) {
                                console.log('响应结果是', response)
                                if (response.code === 200) {
                                    resolve('click success')
                                } else {
                                    reject('click fail')
                                }
                            }
                        )
                    }
                },
                true
            )
            // 触发click
            element.dispatchEvent(
                new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true
                })
            )
        })
    }

    function inputEvent(el, vla) {
        let evtObj = new Event('input', {
            bubbles: true
        }),
            setValue;
        try {
            setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            setValue.call(el, vla);
        } catch (e) {
            evtObj.simulated = true;
            setValue = Object.getOwnPropertyDescriptor(el.__proto__, 'value').set;
            setValue.call(el, vla)
        } finally {
            el.dispatchEvent(evtObj);
        }
    }
    const triggerKeyPress = (element, key) => {
        return new Promise((resolve, reject) => {
            if (!element || typeof key !== 'string') {
                console.warn('Invalid element or key');
                return reject('Invalid element or key');
            }

            // 确保元素可见并聚焦
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();

            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            chrome.runtime.sendMessage(
                {
                    action: 'triggerKeyPress',
                    params: { key, x, y }
                },
                (response) => {
                    if (response && response.code === 200) {
                        // 特殊处理：对于可打印字符，手动更新输入值
                        if (key.length === 1 &&
                            (element instanceof HTMLInputElement ||
                                element instanceof HTMLTextAreaElement)) {
                            // element.value += key;
                            // const inputEvent = new Event('input', {
                            //     bubbles: true,
                            //     cancelable: true
                            // });
                            // element.dispatchEvent(inputEvent);
                        }
                        resolve('keypress success');
                    } else {
                        reject('keypress failed');
                    }
                }
            );
        });
    };

    const input_value = (element, str) => {
        if (!element || typeof str !== 'string') {
            console.warn('Invalid element or key');
            return;
        }
        if ((element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
            // 发送input事件
            // 设置值
            element.value += key
            // 触发 input 事件（模拟用户输入）
            const inputEvent = new Event('input', {
                bubbles: true,
                cancelable: true
            });

            element.dispatchEvent(inputEvent);
        }
    }

    return {
        async getCtlRes(ctlCmd, args) {
            if (eventMap[ctlCmd] && eventMap[ctlCmd].func) {
                return await eventMap[ctlCmd].func(args);
            } else {
                return { status: 200 };
            }
        },
        addCtlCmd(cmd, func) {
            eventMap[cmd] = { func }
        },
        newEle(ele) {
            // 生成uuid
            let eleId = crypto.randomUUID()
            eleMap[eleId] = ele
            // 获取元素信息
            let eleJson = describeElement(ele)
            return Object.assign(eleJson, { eleId })
        },
        newEles(eles) {
            // 生成uuid
            let eleId = crypto.randomUUID()
            eleMap[eleId] = eles
            // 获取元素信息
            let index = 0
            let elesRes = []
            for (const el of eles) {
                elesRes.push(
                    Object.assign(describeElement(el), { eleIndex: index, eleId })
                )
                index++
            }
            return elesRes
        },
        getEle(eleId, eleIndex) {
            if (eleMap[eleId]) {
                let ele = eleMap[eleId]
                if (eleIndex !== null && eleIndex >= 0) {
                    if (eleIndex < ele.length) {
                        return ele[eleIndex]
                    }
                }
                return ele
            }
            return null
        },
        getParentElement(eleId, eleIndex) {
            let ele = this.getEle(eleId, eleIndex)
            if (ele) {
                let eP = ele.parentElement
                if (eP) {
                    return this.newEle(eP)
                }
            }
            return null
        },
        async eleClick(eleId, eleIndex) {
            if (eleMap[eleId]) {
                let ele = eleMap[eleId]
                if (eleIndex !== null && eleIndex >= 0) {
                    if (eleIndex < ele.length) {
                        ele = ele[eleIndex]
                    }
                }
                // ele.click()
                // 点击前先移动到元素, 防止cdp点不到元素
                ele.scrollIntoView({ block: 'center' });
                openDebuggerToClick(ele)
            } else {
                throw new Error(`元素不存在：${eleId} ${eleIndex}`)
            }
        },
        eleSendKey(eleId, eleIndex, key) {
            console.log(`发送按键到元素: ${eleId} ${eleIndex} ${key}`);
            if (eleMap[eleId]) {
                let ele = eleMap[eleId]
                if (eleIndex >= 0) {
                    if (eleIndex < ele.length) {
                        ele = ele[eleIndex]
                    }
                }
                // 准备
                triggerKeyPress(ele, key)
            } else {
                throw new Error(`元素不存在：${eleId} ${eleIndex}`)
            }
        },
        eleInput(eleId, eleIndex, str) {
            console.log(`输入文字到输入框: ${eleId} ${eleIndex} ${str}`);
            if (eleMap[eleId]) {
                let ele = eleMap[eleId]
                if (eleIndex >= 0) {
                    if (eleIndex < ele.length) {
                        ele = ele[eleIndex]
                    }
                }
                // 准备
                triggerKeyPress(ele, str)
            }
        },
        clickXY: (x, y) => {
            chrome.runtime.sendMessage(
                {
                    action: 'mousedownToClick',
                    params: { x, y }
                },
                function (response) {
                    console.log('响应结果是', response)
                }
            )
        },
        touchXY: (x, y) => {
            chrome.runtime.sendMessage(
                {
                    action: 'touchXY',
                    params: { x, y }
                },
                function (response) {
                    console.log('响应结果是', response)
                }
            )
        },
    }
})()
/**
 * 打开页面
 * args:[url]
 */
ctlConfig.addCtlCmd('openPage', async (args) => {
    let [href] = args
    // 体检提交待返回的数据, 等扩展重新注册时重发
    await setStorageData('ctl-res', { type: "ctl-res", data: { status: 200, msg: href + ' 页面打开完成' } })
    // window.location.href = href;
    const a = document.createElement('a');
    a.href = href;
    a.rel = 'noreferrer';
    a.click();
    return null
});
ctlConfig.addCtlCmd('reload', async () => {
    // 体检提交待返回的数据, 等扩展重新注册时重发
    await setStorageData('ctl-res', { type: "ctl-res", data: { status: 200, msg: 'reload 完成' } })
    window.location.reload();
    return null
});
/**
 * 等待时间
 * args:[秒]
 */
ctlConfig.addCtlCmd('sleep', async (args) => {
    await new Promise(resolve => setTimeout(resolve, args[0] * 1000));
    return { status: 200, msg: 'sleep done' }
})
/**
 * 通过id获取元素
 */
ctlConfig.addCtlCmd('getElementById', async (args) => {
    let ele = document.getElementById(args[0])
    if (ele) {
        return { status: 200, data: ctlConfig.newEle(ele) }
    } else {
        return { status: 200, data: null }
    }
})

/**
 * 通过className获取元素
 */
ctlConfig.addCtlCmd('getElementsByClassName', async (args) => {
    let eles = document.getElementsByClassName(args[0])
    if (eles.length > 0) {
        return { status: 200, data: ctlConfig.newEles(eles) }
    } else {
        return { status: 200, data: [] }
    }
})
/**
 * 通过selector获取元素
 */
ctlConfig.addCtlCmd('querySelector', async (args) => {
    let ele = document.querySelector(args[0])
    if (ele) {
        return { status: 200, data: ctlConfig.newEle(ele) }
    } else {
        return { status: 200, data: null }
    }
})
/**
 * 通过selector获取元素s
 */
ctlConfig.addCtlCmd('querySelectorAll', async (args) => {
    let eles = document.querySelectorAll(args[0])
    if (eles.length > 0) {
        return { status: 200, data: ctlConfig.newEles(eles) }
    } else {
        return { status: 200, data: [] }
    }
})
/**
 * 元素点击
 */
ctlConfig.addCtlCmd('eleClick', async (args) => {
    try {
        await ctlConfig.eleClick(args[0], args[1])
        return { status: 200, msg: 'click done' }
    } catch (error) {
        return { status: 500, msg: error.message }
    }
})
/**
 * 向元素发送按键事件, input的话会输入文字
 */
ctlConfig.addCtlCmd('eleSendKey', async (args) => {
    try {
        ctlConfig.eleSendKey(args[0], args[1], args[2])
        return { status: 200, msg: 'send key done' }
    } catch (error) {
        return { status: 500, msg: error.message }
    }
})
ctlConfig.addCtlCmd('parentElement', async (args) => {
    let [eleId, eleIndex] = args
    try {
        let ele = ctlConfig.getParentElement(eleId, eleIndex)
        if (ele) {
            return { status: 200, data: ele }
        } else {
            return { status: 200, msg: '父元素不存在' }
        }
    } catch (error) {
        return { status: 500, msg: error.message }
    }
})
ctlConfig.addCtlCmd('clickXY', async (args) => {
    let [x, y] = args
    try {
        ctlConfig.clickXY(x, y)
        return { status: 200, msg: '点击完成 ' + args }
    } catch (error) {
        return { status: 500, msg: error.message }
    }
})
ctlConfig.addCtlCmd('touchXY', async (args) => {
    let [x, y] = args
    try {
        ctlConfig.touchXY(x, y)
        return { status: 200, msg: '触摸完成 ' + args }
    } catch (error) {
        return { status: 500, msg: error.message }
    }
})
/**
 * 等待获取元素
 */
const waitUntilSelector = async (args, multi) => {
    let [selector, timeout, interval] = args
    let start = new Date().getTime()
    console.log(`[${start}]开始等待元素`, selector, timeout, interval)
    const waitEle = async (selector, timeout = 10, interval = 1) => {
        return new Promise((resolve, reject) => {
            let iKey = setInterval(() => {
                // 检查是否超时
                if (new Date().getTime() - start > timeout * 1000) {
                    clearInterval(iKey)
                    console.log(`等待元素[${selector}]超时`)
                    resolve({ status: 500, msg: '元素等待超时 ' + selector })
                }
                let ele = null
                if (multi) {
                    ele = document.querySelectorAll(selector)
                } else {
                    ele = document.querySelector(selector)
                }
                if (multi ? ele.length > 0 : ele) {
                    clearInterval(iKey)
                    resolve({ status: 200, data: multi ? ctlConfig.newEles(ele) : ctlConfig.newEle(ele), msg: 'waitUntilSelector done' })
                } else {
                    console.log(`未找到元素[${selector}]`)
                }
            }, interval * 1000);
        })
    }
    let ele = await waitEle(selector, timeout, interval)
    return ele
}
ctlConfig.addCtlCmd('waitUntilSelector', async (args) => {
    return await waitUntilSelector(args, false)
})
ctlConfig.addCtlCmd('waitUntilSelectorAll', async (args) => {
    return await waitUntilSelector(args, true)
})
ctlConfig.addCtlCmd('getUrl', async (args) => {
    return { status: 200, data: window.location.href, msg: 'getUrl done' }
})
ctlConfig.addCtlCmd('getEval', async (args) => {
    let [evalStr] = args
    let res = await (async () => {
        return new Promise(resolve => {
            evalObj.resolve = resolve
            // 发送injectjs执行
            const event = new CustomEvent('PageEvalEvent', { detail: { evalStr } });
            window.dispatchEvent(event);
        })
    })()
    return { status: 200, data: res, msg: 'eval done' }
})
ctlConfig.addCtlCmd('screenshot', async (args) => {
    const response = await chrome.runtime.sendMessage({ action: "requestScreenshot" });
    return { status: 200, data: response, msg: 'screenshot done' }
})
ctlConfig.addCtlCmd('closeOtherTab', async (args) => {
    chrome.runtime.sendMessage({ action: "closeOtherTabs" });
    return { status: 200, data: {}, msg: 'closeOtherTab done' }
})
