(function () {
    console.log(`canvas 混淆开始...`, window.location.href)
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;

    // 伪装 toDataURL
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

    const fakeToDataURL = function () {
        const context = this.getContext("2d");
        const { width, height } = this;
        const imageData = context.getImageData(0, 0, width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i + 3] !== 0) { // 透明像素不动
                imageData.data[i] += getNoise();
                imageData.data[i + 1] += getNoise();
                imageData.data[i + 2] += getNoise();
            }
        }
        context.putImageData(imageData, 0, 0);
        return originalToDataURL.apply(this, arguments);
    };
    // 伪造 toString 方法：看起来像原生函数
    Object.defineProperty(fakeToDataURL, 'toString', {
        value: function () {
            return 'function toDataURL() { [native code] }';
        },
        writable: false,
        configurable: true,
        enumerable: false
    });

    // 替换原生方法
    HTMLCanvasElement.prototype.toDataURL = fakeToDataURL;

    // 伪装 getImageData（像素读取）
    CanvasRenderingContext2D.prototype.getImageData = new Proxy(getImageData, {
        apply: function (target, thisArg, args) {
            const imageData = Reflect.apply(target, thisArg, args);
            // 改进后的像素处理逻辑
            for (let i = 0; i < imageData.data.length; i += 4) {
                const alpha = imageData.data[i + 3];
                if (alpha !== 0) {
                    imageData.data[i] += getNoise(); // R
                    imageData.data[i + 1] += getNoise(); // G
                    imageData.data[i + 2] += getNoise(); // B
                }
            }
            return imageData;
        }
    });

    // 随机微小值（避免肉眼可见）
    function getNoise() {
        return Math.floor(Math.random() * 50)
    }
})()
