main();

function main(){
  try{
    document.querySelectorAll("[data-text]").forEach(el => {
      let textId = el.dataset.text;
      el.textContent = chrome.i18n.getMessage(textId);
    });
  }
  catch(e){
    console.log(e);
  }
  
  document.querySelector(".createSubWindow").addEventListener("click", evt => {
    requestIframe();
  });
}

function requestIframe(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {type: "CREATE_WINDOW"});
  });
}
