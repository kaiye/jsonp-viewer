chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript(null, { file: 'content_script.js' }, function (r) {
    if(typeof r === 'undefined'){
      window.open('tool.html')
    }
  })
})
