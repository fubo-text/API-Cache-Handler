document.addEventListener("DOMContentLoaded", function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var currentTab = tabs[0]; // 获取当前标签页
    if (currentTab) {
      // 将获取到的标题显示在popup.html的#pageTitle元素中
      document.getElementById("pageTitle").textContent = currentTab.title;
    }
    const toggleSwitch = document.getElementById("toggleSwitch");
    const simpleTextInput = document.getElementById("simpleTextInput");
    const simpleApi = document.getElementById("simpleApi");
    chrome.storage.local
      .get(["apiAjaxInterceptor_switchOn", "apiAjaxInterceptor_inputValue"])
      .then((result) => {
        if (result.hasOwnProperty("apiAjaxInterceptor_switchOn")) {
          const switchOn = result.apiAjaxInterceptor_switchOn;
          // 如果数据获取成功，并且开关状态为true，则勾选复选框
          toggleSwitch.checked = switchOn;
          chrome.action.setBadgeText({
            text: switchOn ? "ON" : "OFF",
          });
          simpleApi.style.display = switchOn ? "" : "none";
        }

        if (result.hasOwnProperty("apiAjaxInterceptor_inputValue")) {
          const value = result.apiAjaxInterceptor_inputValue;
          simpleTextInput.value = value;
        }
      });

    const message = {
      type: "ajaxInterceptor",
      query: "setData",
      checked: false,
      value: "",
    };
    
    simpleTextInput.addEventListener("change", function(event) {
      var inputValue = event.target.value; // 获取当前输入框的值
      message.value = inputValue;
      chrome.storage.local
        .set({ apiAjaxInterceptor_inputValue: inputValue })
        .then(() => {
          console.log("value is set");
        });
      console.log(inputValue); // 在控制台打印当前值
      chrome.runtime.sendMessage(message);
    });

    toggleSwitch.onchange = function() {
      const isChecked = this.checked;
      chrome.storage.local
        .set({ apiAjaxInterceptor_switchOn: isChecked })
        .then(() => {
          console.log("value is set");
        });
      chrome.action.setBadgeText({
        text: isChecked ? "ON" : "OFF",
      });
      message.checked = isChecked;
      chrome.runtime.sendMessage(message);
      simpleApi.style.display = isChecked ? "" : "none";
    };
  });
});

// 请求数据
chrome.runtime.sendMessage({ query: "getData" }, function(response) {
  console.log("Data: " + response);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(request, "popup");
});
