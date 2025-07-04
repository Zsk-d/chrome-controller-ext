(function () {
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const spoofCanvas = (canvas) => {
        try {
            const context = canvas.getContext("2d");
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                // 修改每个像素的RGB通道
                imageData.data[i + 0] += getRandomInt(-5, 5); // R
            }
            context.putImageData(imageData, 0, 0);
        } catch (e) {
            console.warn("Canvas spoofing error:", e);
        }
    };

    const patch = (proto, funcName) => {
        const original = proto[funcName];
        Object.defineProperty(proto, funcName, {
            value: function (...args) {
                if (this instanceof HTMLCanvasElement) {
                    spoofCanvas(this);
                }
                return original.apply(this, args);
            },
            configurable: true,
            enumerable: false,
            writable: true,
        });
    };

    patch(HTMLCanvasElement.prototype, "toDataURL");
    patch(HTMLCanvasElement.prototype, "toBlob");

    // 如果你想进一步修改 WebGL 指纹，可以 patch getParameter、getExtension 等方法
})();
