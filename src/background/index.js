//import HttpHandler from "./HTTPHandler"

let resetContextMenu = function(){
  chrome.contextMenus.removeAll(() => {
    chrome.storage.sync.get(null, config => {
      let defaultSearchProvider = {
        name: "Google",
        baseurl: "https://google.com/search?q={{input}}",
      };
      let providers = config.providers;
    
      let searchProvider;
      if(providers){
        searchProvider= providers.find(p => p.default);
      }
      else{
        searchProvider = defaultSearchProvider;
      }
    
      chrome.contextMenus.create({
        type: "normal",
        title: chrome.i18n.getMessage("SearchSelection", [searchProvider.name]),
        contexts: ["selection"],
        onclick: (info, tab) => {
          let {selectionText} = info;
          if(!selectionText) return;
        
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            let tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, {
              type: "CREATE_WINDOW",
              searchText: selectionText
            });
          });
        }
      });
    });
  });
};

let main = function(){
  let httpHandler = new HttpHandler();
  httpHandler.startMonitor();
  
  resetContextMenu();
  
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if(changes.providers){
      resetContextMenu();
    }
  });
};

main();