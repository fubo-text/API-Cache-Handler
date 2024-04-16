chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === 'XHR_INTERCEPTOR') {
      // 处理拦截到的XHR数据
      console.log('从内容脚本接收到的消息:', request.data);
      sendResponse({status: "数据已接收"});
    }
  }
);