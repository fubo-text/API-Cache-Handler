// 运行于content script环境
const injectScriptFile = (file) => {
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement('script');
  scriptTag.setAttribute('type', 'text/javascript');
  scriptTag.setAttribute('src', chrome.runtime.getURL(file));
  container.insertBefore(scriptTag, container.children[0]);
  container.removeChild(scriptTag);
};

// 注入inject.js
injectScriptFile('inject.js');

// 接收来自inject.js的消息
window.addEventListener('message', event => {
  if (event.source == window && event.data.type && (event.data.type == 'XHR_INTERCEPTOR')) {
    // 在这里处理截获到的数据
    console.log('捕获到的数据:', event.data.data);
  }
});


chrome.runtime.sendMessage({ type: 'request', method: '/post', url:'/path/name' });