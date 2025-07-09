(() => {
    // fetch 劫持

    const globalFetchArgsHijackFuncs = []
    const globalFetchResHijackFuncs = []

    window.addEventListener('fetchArgsHijackFunc', function (event) {
        console.log('收到Fetch-args 劫持函数', event.detail);
        const funcStr = event.detail;
        globalFetchArgsHijackFuncs.push(eval(`(${funcStr})`))
        console.log(`现有Fetch-args 劫持函数`, globalFetchArgsHijackFuncs)
    })

    window.addEventListener('fetchResHijackFunc', function (event) {
        console.log('收到Fetch-res 劫持函数', event.detail);
        const funcStr = event.detail;
        globalFetchResHijackFuncs.push(eval(`(${funcStr})`))
        console.log(`现有Fetch-res 劫持函数`, globalFetchResHijackFuncs)
    })

    console.log("fetch 劫持开始");
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        let [input, init] = args;

        // === 请求参数劫持（修改 URL、headers） ===
        if (globalFetchArgsHijackFuncs.length > 0) {
            console.log(`执行Fetch-args劫持方法`)
            globalFetchArgsHijackFuncs.forEach(func => {
                [input, init] = func(input, init)
            });
        }

        // 执行原始 fetch 请求
        const response = await originalFetch.call(this, input, init)

        // 响应劫持：克隆响应体并读取文本
        const cloned = response.clone()
        const bodyText = await cloned.text()

        // 这里可以修改响应内容
        let modifiedBody = bodyText

        // try {
        //     // 尝试解析 JSON 并修改字段
        //     const json = JSON.parse(bodyText);
        //     json.intercepted = true; // 注入字段
        //     modifiedBody = JSON.stringify(json);
        // } catch (e) {
        //     // 非 JSON 的响应内容，可做字符串替换
        //     modifiedBody = bodyText.replace(/原词/g, '新词');
        // }

        if (globalFetchResHijackFuncs.length > 0) {
            console.log(`执行Fetch-res劫持方法`)
            globalFetchResHijackFuncs.forEach(func => {
                modifiedBody = func(args, modifiedBody)
            })
        }

        // 派发事件(可供扩展监听)
        window.dispatchEvent(new CustomEvent('FetchEvent', {
            detail: {
                url: input,
                requestInit: init,
                originalBody: bodyText,
                modifiedBody: modifiedBody
            }
        }))

        // 返回修改后的响应体(Response 只读，需新构造)
        return new Response(modifiedBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        })
    };
})()