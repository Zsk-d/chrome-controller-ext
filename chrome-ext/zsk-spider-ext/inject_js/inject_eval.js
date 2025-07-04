console.log('eval 脚本注入')
window.addEventListener('PageEvalEvent', async (event) => {
    console.log(`eval 收到 PageEvalEvent`)
    // '(()=>{return window["testk3"]["k1"]["k1v"]})()'
    const requestData = event.detail;
    let evalStr = requestData.evalStr;
    let evalRes = null
    try {
        evalRes = eval(evalStr)
    } catch (error) {
    }
    // 发送给contentjs
    const cevent = new CustomEvent('PageEvalResEvent', {
        detail: {res: evalRes}
    });
    window.dispatchEvent(cevent);
})
