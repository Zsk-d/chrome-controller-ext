(function spoofTimezone(timeZone = "Asia/Tokyo", offsetMinutes = -540) {
    console.log(`开始注入时区：${timeZone}`)
  try {
    // 1. 伪造 Intl.DateTimeFormat().resolvedOptions().timeZone
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const options = originalResolvedOptions.call(this);
      options.timeZone = timeZone;
      return options;
    };
    Intl.DateTimeFormat.prototype.resolvedOptions.toString = () => "function resolvedOptions() { [native code] }";

    // 2. 伪造 getTimezoneOffset
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function () {
      return offsetMinutes;
    };
    Date.prototype.getTimezoneOffset.toString = () => "function getTimezoneOffset() { [native code] }";

    // 3. 伪造 toString，返回指定时区的字符串
    const originalToString = Date.prototype.toString;
    Date.prototype.toString = function () {
      try {
        return new Intl.DateTimeFormat("en-US", {
          timeZone,
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short"
        }).format(this);
      } catch (e) {
        return originalToString.call(this);
      }
    };
    Date.prototype.toString.toString = () => "function toString() { [native code] }";
  } catch (e) {
    console.warn("Timezone spoofing failed:", e);
  }
})("Asia/Tokyo", -540);
