(function() {
  // 创建自定义XHR构造函数
  var OriginalXHR = window.XMLHttpRequest;

  function ModifiedXHR() {
      var xhr = new OriginalXHR();
      var originalOpen = xhr.open;
      var requestUrl; // 用于保存请求的URL
  
      xhr.open = function(method, url, async) {
          requestUrl = url; // 保存请求URL
          originalOpen.apply(this, arguments);
      };
  
      xhr.onreadystatechange = function() {
          var cacheKey = 'cache_' + requestUrl;
          if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                  // 请求成功，缓存数据
                  var data = xhr.responseText; // 假设响应是文本或JSON
                  sessionStorage.setItem(cacheKey, data);
              } else {
                  // 请求失败，尝试返回缓存的数据
                  var cachedData = sessionStorage.getItem(cacheKey);
                  if (cachedData) {
                      Object.defineProperty(xhr, 'status', { writable: true });
                      xhr.status = 200; // 假装请求成功了
  
                      Object.defineProperty(xhr, 'readyState', { writable: true });
                      xhr.readyState = 4;
  
                      Object.defineProperty(xhr, 'responseText', { value: cachedData });
                      Object.defineProperty(xhr, 'response', { value: cachedData });
  
                      // 确保回调仍然可以被调用
                      if (typeof xhr.onreadystatechange === "function") {
                           xhr.onreadystatechange.call(xhr);
                      }
                      return; // 阻止继续调用原回调函数
                  }
              }
          }
  
          if (typeof originalOnReadyStateChange === 'function') {
              originalOnReadyStateChange.apply(this, arguments);
          }
      };
  
      var originalOnReadyStateChange;
      Object.defineProperty(xhr, "onreadystatechange", {
          get: function() {
              return originalOnReadyStateChange;
          },
          set: function(value) {
              originalOnReadyStateChange = value;
          }
      });
  
      return xhr;
  }
  // 覆盖全局的 XMLHttpRequest
  window.XMLHttpRequest = ModifiedXHR;
})();
