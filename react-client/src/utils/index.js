export const sendMessage = (message, callback) => {
  if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(message, callback);
  } else {
      // 模拟响应或提供替代逻辑
  }
}