(function() {
  class IndexedDBHelper {
    constructor(dbName, storeName, version) {
      this.dbName = dbName;
      this.storeName = storeName;
      this.dbVersion = version || 1;
      this.db = null;
    }

    open() {
      return new Promise((resolve, reject) => {
        if (this.db) {
          resolve(this.db);
          return;
        }

        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          this.db = event.target.result;
          if (!this.db.objectStoreNames.contains(this.storeName)) {
            this.db.createObjectStore(this.storeName, {
              keyPath: "url",
              unique: true,
            });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          reject("Database error: " + event.target.errorCode);
        };
      });
    }

    add(data) {
      return this.open().then((db) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
          const request = store.add(data);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }

    get(id) {
      return this.open().then((db) => {
        const transaction = db.transaction([this.storeName]);
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }

    update(id, newData) {
      return this.open().then((db) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
          const request = store.put({ ...newData, id: id });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }

    delete(id) {
      return this.open().then((db) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }

    close() {
      if (this.db) {
        this.db.close();
      }
    }
  }

  const dbHelper = new IndexedDBHelper("myDatabase", "myStore");

  // 创建自定义XHR构造函数
  const OriginalXHR = window.XMLHttpRequest;
  // 保存原来的 fetch 函数
  const originalFetch = window.fetch;

  let apiUrl = "";

  async function checkedData(url, data) {
    // 读取数据
    const result = await dbHelper.get(url);
    console.log("Data received:", result);
    if (!result) {
      // 添加数据
      dbHelper.add({ data, url }).then((url) => {
        console.log("Data added with ID:", url);
      });
    } else {
      // 更新数据
      dbHelper.update(url, { data, url }).then(() => {
        console.log("Data updated");
      });
    }
  }

  function ModifiedXHR() {
    console.log(11111);
    var xhr = new OriginalXHR();
    var originalOpen = xhr.open;
    var requestUrl; // 用于保存请求的URL

    xhr.open = function(method, url, async) {
      requestUrl = url; // 保存请求URL
      originalOpen.apply(this, arguments);
    };

    xhr.onreadystatechange = async function() {
      var cacheKey = "cache_" + requestUrl;
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // 请求成功，缓存数据
          let data = null;
          if (xhr.responseType === "blob") {
            console.log(xhr.response);
            data = xhr.response;
          } else {
            data = xhr && xhr.responseText; // 假设响应是文本或JSON
          }
          if (!apiUrl) {
            // 读取数据
            checkedData(cacheKey, data);
            // sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } else {
            if (requestUrl.includes(apiUrl)) {
              checkedData(cacheKey, data);
              // sessionStorage.setItem(cacheKey, JSON.stringify(data));
            }
          }
        } else {
          // 读取数据
          const res = await dbHelper.get(cacheKey);
          // 请求失败，尝试返回缓存的数据
          var cachedData = res.data;
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
      return Promise.resolve(
        new Response(new Blob([cachedData]), {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    } else {
      // 没有缓存则正常发起请求
      return originalFetch(resource, init).then((response) => {
        if (response.ok) {
          // 请求成功，克隆响应对象进行缓存
          response
            .clone()
            .text()
            .then((content) => {
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
