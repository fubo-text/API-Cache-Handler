document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var currentTab = tabs[0]; // 获取当前标签页
    if (currentTab) {
      // 将获取到的标题显示在popup.html的#pageTitle元素中
      document.getElementById('pageTitle').textContent = currentTab.title;
    }
  });
});