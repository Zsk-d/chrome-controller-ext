(function () {
  const blockedProps = [
    'RTCPeerConnection',
    'webkitRTCPeerConnection',
    'RTCDataChannel',
    'RTCIceCandidate',
    'MediaStream',
    'MediaStreamTrack',
    'getUserMedia',
    'mediaDevices'
  ];

  blockedProps.forEach(prop => {
    if (prop in window) {
      try {
        Object.defineProperty(window, prop, {
          get() {
            console.warn(`[webrtc-block] attempt to access ${prop} was blocked`);
            return undefined;
          },
          configurable: false
        });
      } catch (e) {
        console.warn(`[webrtc-block] failed to redefine ${prop}:`, e);
      }
    }
  });

  // 额外删除 navigator.mediaDevices.getUserMedia 等
  if (navigator.mediaDevices) {
    try {
      delete navigator.mediaDevices.getUserMedia;
      delete navigator.mediaDevices.getDisplayMedia;
    } catch (e) {}
  }

  // 彻底覆盖 navigator.getUserMedia
  if ('getUserMedia' in navigator) {
    try {
      navigator.getUserMedia = undefined;
    } catch (e) {}
  }

  console.debug('[webrtc-block] WebRTC API hooks installed');
})();
