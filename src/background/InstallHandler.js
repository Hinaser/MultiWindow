void function onInstall(){
  chrome.runtime.onInstalled.addListener(onInstalled);
  
  function onInstalled(details){
    switch(details.reason){
      case "install": return onExtensionInstalled(details);
      case "update": return onExtensionUpdated(details);
      case "browser_update": return onBrowserUpdated(details);
      case "shared_module_update": return onSharedModuleUpdated(details);
      default: break;
    }
  }
  
  function onExtensionInstalled(details){
    chrome.storage.sync.get(null, items => {
      if(typeof(items||undefined) === "object" && Array.isArray(items.providers) && items.providers.length > 0){
        return;
      }
      
      let providers = [
        {name: "Google", baseurl: "https://google.com/search?q={{input}}", default: true},
        {name: "Yahoo", baseurl: "https://search.yahoo.co.jp/search?p={{input}}"},
        {name: "English to 日本語", baseurl: "https://eow.alc.co.jp/search?q={{input}}"},
      ];
      chrome.storage.sync.set({providers});
    });
  }
  
  function onExtensionUpdated(details){
  
  }
  
  function onBrowserUpdated(details){
  
  }
  
  function onSharedModuleUpdated(details){
  
  }
}();
