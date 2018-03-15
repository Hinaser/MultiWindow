let $createWindowBtn = document.querySelector("#createWindow");
$createWindowBtn.addEventListener("click", e => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {type: "CREATE_WINDOW"});
  });
});

