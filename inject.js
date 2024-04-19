(function() {
  // 创建自定义XHR构造函数
  const OriginalXHR = window.XMLHttpRequest;
  // 保存原来的 fetch 函数
  const originalFetch = window.fetch;

  let apiUrl = "";

  function ModifiedXHR() {
    console.log(11111);
    var xhr = new OriginalXHR();
    var originalOpen = xhr.open;
    var requestUrl; // 用于保存请求的URL

    xhr.open = function(method, url, async) {
      requestUrl = url; // 保存请求URL
      originalOpen.apply(this, arguments);
    };

    xhr.onreadystatechange = function() {
      var cacheKey = "cache_" + requestUrl;
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // 请求成功，缓存数据
          var data = xhr.responseText; // 假设响应是文本或JSON
          if (!apiUrl) {
            sessionStorage.setItem(cacheKey, data);
          } else {
            if (requestUrl.includes(apiUrl)) {
              sessionStorage.setItem(cacheKey, data);
            }
          }
        } else {
          // 请求失败，尝试返回缓存的数据
          var cachedData = sessionStorage.getItem(cacheKey);
          if (cachedData) {
            Object.defineProperty(xhr, "status", { writable: true });
            xhr.status = 200; // 假装请求成功了

            Object.defineProperty(xhr, "readyState", { writable: true });
            xhr.readyState = 4;

            Object.defineProperty(xhr, "responseText", { value: cachedData });
            Object.defineProperty(xhr, "response", { value: cachedData });

            // 确保回调仍然可以被调用
            if (typeof xhr.onreadystatechange === "function") {
              xhr.onreadystatechange.call(xhr);
            }
            return; // 阻止继续调用原回调函数
          }
        }
      }

      if (typeof originalOnReadyStateChange === "function") {
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
      },
    });

    return xhr;
  }

  function modifiedFetch(resource, init) {
    // 修改或检查请求参数
    const requestUrl = typeof resource === "string" ? resource : resource.url;

    // 尝试从 sessionStorage 中获取缓存
    var cacheKey = "cache_" + requestUrl;
    var cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      // 如果有缓存则直接返回缓存数据
      return Promise.resolve(new Response(new Blob([cachedData]), {
        status: 200,
        statusText: "OK",
        headers: {
          'Content-Type': 'application/json'
        }
      }));
    } else {
      // 没有缓存则正常发起请求
      return originalFetch(resource, init).then(response => {
        if (response.ok) {
          // 请求成功，克隆响应对象进行缓存
          response.clone().text().then(content => {
            sessionStorage.setItem(cacheKey, content);
          });
        }
        return response;
      });
    }
  }

  window.addEventListener(
    "message",
    function(event) {
      const data = event.data;
      if (data.type === "ajaxInterceptor") {
        apiUrl = data.value;
        if (data.checked) {
          // 覆盖全局的 XMLHttpRequest
          window.XMLHttpRequest = ModifiedXHR;
          window.fetch = modifiedFetch;
        } else {
          window.XMLHttpRequest = OriginalXHR;
          window.fetch = originalFetch;
        }
      }
    },
    false
  );
})();
