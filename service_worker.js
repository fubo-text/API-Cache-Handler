let contentLoadedIds = [];
let lastPanelPosition = 0;

chrome.scripting.getRegisteredContentScripts(
  { ids: ["testing-scripts-gen"] },
  async (scripts) => {
    if (scripts && scripts.length) {
      await chrome.scripting.unregisterContentScripts({
        ids: ["testing-scripts-gen"],
      });
    }
    chrome.scripting.registerContentScripts([
      {
        id: "testing-scripts-gen",
        js: ["./content.js"],
        matches: ["<all_urls>"],
        runAt: "document_start",
        allFrames: true,
      },
    ]);
  }
);

// 当用户点击扩展图标时，触发下面的函数
chrome.action.onClicked.addListener(function(tab) {
  // 查询当前激活的且在当前窗口的标签页
  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   handleContentSend(tabs[0].id, "toggle")
  // })
});

// 页面关闭，移除id
chrome.tabs.onRemoved.addListener(function(tabId) {
  contentLoadedIds = contentLoadedIds.filter((id) => id !== tabId);
});

function handleContentSend(tabId, params = null) {
  if (contentLoadedIds.includes(tabId)) {
    chrome.tabs.sendMessage(tabId, params);
  } else {
    chrome.scripting
      .executeScript({
        target: { tabId, allFrames: true },
        files: ["content.js"],
      })
      .then(() => {
        chrome.tabs.sendMessage(tabId, params);
      });
  }
}

let savedData = null;
// 接收popup传来的信息，转发给content.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.query == "getData") {
    sendResponse({ data: savedData });
  } else if (msg.query == "setData") {
    savedData = msg.data;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs.length) {
      handleContentSend(tabs[0].id, { ...msg, to: "content" });
    }
  });
});
