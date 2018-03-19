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
  
  let refreshProviders = () => {
    getSearchProviders().then(providers => {
      let template = document.querySelector("#searchProvider-template");
      let table = document.querySelector(".provider-list");
    
      if(!Array.isArray(providers) || providers.length < 1){
        return;
      }
      
      table.querySelectorAll(".row").forEach(el => el.remove());
    
      let providerElements = providers.map(p => {
        let nameElement = template.content.querySelector(".name");
        let baseUrlElement = template.content.querySelector(".baseurl");
        let actionElement = template.content.querySelector(".action");
      
        nameElement.textContent = p.name;
        baseUrlElement.textContent = p.baseurl;
      
        let clone = document.importNode(template.content, true);
        table.appendChild(clone);
      });
      
      document.querySelector("html").style.height = document.body.offsetHeight;
    });
  };
  
  refreshProviders();
  
  let createSubWindowBtn = document.querySelector(".createSubWindow");
  
  createSubWindowBtn.addEventListener("click", evt => {
    requestIframe();
  });
  
  let addProviderBtn = document.querySelector(".add-provider .add");
  
  addProviderBtn.addEventListener("click", evt => {
    let template = document.querySelector("#addProvider-template");
    let table = document.querySelector(".provider-list");
    let clone = document.importNode(template.content, true);
    table.appendChild(clone);
    
    let checkBtn = document.querySelector(".add-provider .check");
    let cancelBtn = document.querySelector(".add-provider .cancel");
    
    addProviderBtn.style.display = "none";
    checkBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  
    checkBtn.addEventListener("click", evt => {
      let row = document.querySelector(".provider-list .adding");
      let name = row.querySelector(".name input").value;
      let baseurl = row.querySelector(".baseurl input").value;
      
      if(!name || !baseurl){
        alert("Invalid");
        return;
      }
  
      row.remove();
  
      addProviderBtn.style.display = "inline-block";
      checkBtn.style.display = "none";
      cancelBtn.style.display = "none";
  
      setSearchProviders({name, baseurl}).then(()=>{
        refreshProviders()
      });
    });
  
    cancelBtn.addEventListener("click", evt => {
      let row = document.querySelector(".provider-list .adding");
      row.remove();
      
      addProviderBtn.style.display = "inline-block";
      checkBtn.style.display = "none";
      cancelBtn.style.display = "none";
  
      refreshProviders();
    });
  });
}

function requestIframe(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    let tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {type: "CREATE_WINDOW"});
  });
}

function getSearchProviders(){
  return new Promise((resolve, reject) => {
    let key = "providers";
    
    chrome.storage.sync.get([key], (items) => {
      let providers = items[key];
      resolve(providers);
    });
  });
}

function setSearchProviders({name, baseurl}){
  return new Promise((resolve, reject) => {
    getSearchProviders().then(providers => {
      if(!Array.isArray(providers)) providers = [];
      
      let index = providers.findIndex(p => p.name === name);
      if(index > -1){
        providers[index].baseurl = baseurl;
      }
      else{
        providers.push({name, baseurl});
      }
      
      chrome.storage.sync.set({providers}, ()=> {
        resolve();
      });
    })
  });
}
