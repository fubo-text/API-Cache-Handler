(function () {
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
    clearData() {
      const { storeName } = this;
      this.open().then((db) => {
        var transaction = db.transaction([storeName], "readwrite");
        var objectStore = transaction.objectStore(storeName);
        var request = objectStore.clear();

        request.onsuccess = function (e) {
          console.log("Data cleared");
        };

        request.onerror = function (e) {
          console.log("Error clearing data", e);
        };
      });
    }
  }

  const dbHelper = new IndexedDBHelper("myDatabase", "myStore");

  // 创建自定义XHR构造函数
  const OriginalXHR = window.XMLHttpRequest;
  // 保存原来的 fetch 函数
  const originalFetch = window.fetch;

  let apiUrl = "";

  async function checkedData(url, data) {
    if (!data) {
      return;
    }
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
    const xhr = new OriginalXHR();
    let _method = "";

    const modifyResponse = async () => {
      const url = this.responseURL?.split("?")[0];
      const cacheKey = "cache_" + url + "_" + _method;
      if (this.status >= 200 && this.status < 300) {
        // 请求成功，缓存数据
        let data = null;
        if (xhr.responseType === "" || xhr.responseType === "text") {
          data = xhr.responseText; // 假设响应是文本或JSON
        }
        if (!apiUrl) {
          // 读取数据
          checkedData(cacheKey, data);
        } else {
          if (this.responseURL.includes(apiUrl)) {
            checkedData(cacheKey, data);
          }
        }
      } else {
        // 读取数据
        const res = await dbHelper.get(cacheKey);
        // 请求失败，尝试返回缓存的数据
        const cachedData = res?.data;
        if (!!cachedData) {
          this.status = 200; // 假装请求成功了
          this.responseText = cachedData;
          this.response = cachedData;
          this.statusText = cachedData;
        }
      }
    };

    for (let attr in xhr) {
      if (attr === "onreadystatechange") {
        xhr.onreadystatechange = async (...args) => {
          if (this.readyState === 4) {
            // 请求成功
            await modifyResponse();
          }
          this.onreadystatechange && this.onreadystatechange.apply(this, args);
        };
        this.onreadystatechange = null;
        continue;
      } else if (attr === "onload") {
        xhr.onload = async (...args) => {
          // 请求成功
          await modifyResponse();
          this.onload && this.onload.apply(this, args);
        };
        this.onload = null;
        continue;
      } else if (attr === "open") {
        this.open = (...args) => {
          const [method] = args;
          /** 将字符转换为小写 */
          _method = method.toLowerCase();
          xhr.open && xhr.open.apply(xhr, args);
        };
        continue;
      } else if (attr === "send") {
        this.send = (...args) => {
          xhr.send && xhr.send.apply(xhr, args);
        };
        continue;
      }

      if (typeof xhr[attr] === "function") {
        this[attr] = xhr[attr].bind(xhr);
      } else {
        // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
        if (
          ["responseText", "response", "status", "statusText"].includes(attr)
        ) {
          Object.defineProperty(this, attr, {
            get: () =>
              this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
            set: (val) => (this[`_${attr}`] = val),
            enumerable: true,
          });
        } else {
          Object.defineProperty(this, attr, {
            get: () => xhr[attr],
            set: (val) => (xhr[attr] = val),
            enumerable: true,
          });
        }
      }
    }
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
    function (event) {
      const data = event.data;
      if (data.type === "ajaxInterceptor") {
        apiUrl = data.value;
        if (data.checked) {
          // 覆盖全局的 XMLHttpRequest
          window.XMLHttpRequest = ModifiedXHR;
          window.fetch = modifiedFetch;
        } else {
          dbHelper.clearData();
          window.XMLHttpRequest = OriginalXHR;
          window.fetch = originalFetch;
        }
      }
    },
    false
  );
})();
