// 1. 覆盖navigator.webdriver属性
const newProto = navigator.__proto__;
delete newProto.webdriver;  // 从原型链删除
navigator.__proto__ = newProto;

// 2. 删除window对象中的自动化痕迹
delete window.chrome;
delete window.domAutomation;
delete window.domAutomationController;

// 7. 覆盖console.debug方法（某些网站通过console.debug检测）
const originalConsoleDebug = console.debug;
console.debug = function () {
    if (arguments[0] && arguments[0].includes('WebDriver')) {
        return;
    }
    originalConsoleDebug.apply(console, arguments);
};

console.log('CDP指纹已成功隐藏');