(function() {
  // 运行于content script环境
  const injectScriptFile = (file) => {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement("script");
    scriptTag.setAttribute("type", "text/javascript");
    scriptTag.setAttribute("src", chrome.runtime.getURL(file));
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);

    scriptTag.addEventListener('load', () => {
      chrome.storage.local.get(["apiAjaxInterceptor_switchOn", "apiAjaxInterceptor_inputValue"], (result) => {
        if (result.hasOwnProperty('apiAjaxInterceptor_switchOn')) {
          postMessage({type: 'ajaxInterceptor', to: 'pageScript', key: 'ajaxInterceptor_switchOn', checked: result.apiAjaxInterceptor_switchOn, value: result.apiAjaxInterceptor_inputValue})
        }
      })
    })
  };

  injectScriptFile("inject.js");

  // content_script.js
  chrome.runtime.onMessage.addListener((request) => {
    console.log(request, "123");
  });
})();
