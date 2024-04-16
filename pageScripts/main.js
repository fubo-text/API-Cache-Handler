
// 定义一个用于存储缓存的对象，键是URL，值是相应的响应数据
const cache = {};

// 保存原生的XMLHttpRequest构造函数
const OriginalXHR = window.XMLHttpRequest;

console.log(111)

// 创建自定义XHR构造函数
function CustomXHR() {
  // 创建一个原生XHR实例
  const xhr = new OriginalXHR();

  // 存储原生的send方法
  const originalSend = xhr.send;

  // 重写send方法
  xhr.send = function(...args) {
    console.log(args,'args')
    // 添加事件监听器来处理请求完成事件
    this.addEventListener('load', function() {
      console.log(this,'this')
      if (this.status === 200) {
        // 请求成功，存储响应到缓存
        cache[this.responseURL] = this.responseText;
        console.log(cache,'cache')
      }
    });

    // 添加事件监听器来处理请求错误事件
    this.addEventListener('error', function() {
      if (cache[this.responseURL]) {
        // 请求失败，但是缓存中有值，模拟一个成功的响应
        this.status = 200; // 设置状态码为200
        this.readyState = 4; // 设置就绪状态为已完成
        this.responseText = cache[this.responseURL]; // 设置响应内容为缓存的值

        // 触发readystatechange事件来通知请求完成
        if (typeof this.onreadystatechange === 'function') {
          this.onreadystatechange();
        }
      }
    });

    // 调用原生的send方法
    originalSend.apply(this, args);
  };

  return xhr;
}

// 使用自定义的XHR替换原生的XHR
window.XMLHttpRequest = CustomXHR;