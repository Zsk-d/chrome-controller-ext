// 1. 覆盖navigator.webdriver属性
const newProto = navigator.__proto__;
delete newProto.webdriver;  // 从原型链删除
navigator.__proto__ = newProto;

// 2. 删除window对象中的自动化痕迹
delete window.chrome;
delete window.domAutomation;
delete window.domAutomationController;

// 3. 覆盖console.debug方法（某些网站通过console.debug检测）
const nativeToString = Function.prototype.toString;
const toStringMap = new WeakMap();

// 4. 劫持 toString 原型
Function.prototype.toString = new Proxy(nativeToString, {
    apply(target, thisArg) {
        // 如果是伪造过的函数，则返回伪造内容
        if (toStringMap.has(thisArg)) {
            return toStringMap.get(thisArg);
        }
        // 否则返回原始 toString
        return Reflect.apply(target, thisArg, []);
    }
});
// 修改 console.debug
const originalDebug = console.debug;
function fakeDebug(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('WebDriver')) {
        return '123';
    }
    return originalDebug.apply(this, args);
}
// 设置伪造 toString 内容
toStringMap.set(fakeDebug, 'function debug() { [native code] }');
// 替换 console.debug
console.debug = fakeDebug;

console.log('CDP指纹已隐藏', window.location.href)