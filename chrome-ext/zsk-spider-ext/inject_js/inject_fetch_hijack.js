(() => {
    // fetch 劫持
    console.log("fetch 劫持开始");
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);

        // 克隆响应体
        const cloned = response.clone();
        cloned.text().then(body => {
            console.log("响应内容：", body);
            const event = new CustomEvent('FetchEvent', {
                detail: {
                    args: args,
                    body: body
                }
            });
            window.dispatchEvent(event);
        });
        return response;
    };
})()