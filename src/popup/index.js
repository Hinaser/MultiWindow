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
      
      table.querySelectorAll(".row").forEach(el => el.remove());
  
      if(!Array.isArray(providers) || providers.length < 1){
        resetHeight();
        return;
      }
  
      let providerElements = providers.map(p => {
        let nameElement = template.content.querySelector(".name");
        let baseUrlElement = template.content.querySelector(".baseurl");
        let actionElement = template.content.querySelector(".action");
      
        nameElement.textContent = p.name;
        baseUrlElement.textContent = p.baseurl;
      
        let clone = document.importNode(template.content, true);
        table.appendChild(clone);
      });
      resetHeight();
    
      let editBtns = document.querySelectorAll(".provider-list .modify");
      let editBtnAction = evt => {
        if(evt.target.tagName.toLowerCase() !== "i") return;
  
        let row = evt.target.parentElement.parentElement;
        let nameElement = row.querySelector(".name");
        let baseurlElement = row.querySelector(".baseurl");
        let name = nameElement.textContent;
        let baseurl = baseurlElement.textContent;
        
        let onInput = e => {
          if(e.key === "Enter"){
            let row = evt.target.parentElement.parentElement;
            let nameElement = row.querySelector(".name");
            let baseurlElement = row.querySelector(".baseurl");
            let name = nameElement.textContent;
            let baseurl = baseurlElement.textContent;
            
            setSearchProviders({name, baseurl});
            refreshProviders();
          }
        };
  
        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = name;
        nameInput.className = "name";
        nameInput.addEventListener("click", onInput);
  
        let baseurlInput = document.createElement("input");
        baseurlInput.type = "text";
        baseurlInput.value = baseurl;
        baseurlInput.className = "baseurl";
        baseurlInput.addEventListener("click", onInput);
  
        let addProviderBtn = document.querySelector(".add-provider .add");
        addProviderBtn.style.display = "none";
  
        let modifyBtns = document.querySelectorAll(".provider-list .modify");
        modifyBtns.forEach(btn => {
          btn.style.display = "none";
        });
        evt.target.style.display = "inline-block";
  
        let removeBtns = document.querySelectorAll(".provider-list .remove");
        removeBtns.forEach(btn => {
          btn.style.display = "none";
        });
        
        let cancelBtn = row.querySelector(".cancel");
        cancelBtn.style.display = "inline-block";
  
        row.replaceChild(nameInput, nameElement);
        row.replaceChild(baseurlInput, baseurlElement);
        row.classList.add("editing");
      };
      
      editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", editBtnAction, true);
      });
  
      let removeBtns = document.querySelectorAll(".provider-list .remove");
      removeBtns.forEach(removeBtn => {
        removeBtn.addEventListener("click", evt => {
          let row = evt.target.parentElement.parentElement;
          let nameElement = row.querySelector(".name");
          let name = nameElement.textContent;
          setSearchProviders({name, remove: true}).then(()=>{
            refreshProviders();
          });
        });
      });
      
      let cancelBtns = document.querySelectorAll(".provider-list .cancel");
      cancelBtns.forEach(cancelBtn => {
        cancelBtn.addEventListener("click", evt => {
          refreshProviders();
        });
      });
      
      let addProviderBtn = document.querySelector(".add-provider .add");
      addProviderBtn.style.display = "inline-block";
      
      let editing = document.querySelector(".row.editing");
      if(editing){
        editing.classList.remove("editing");
      }
  
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
  
  });
  
  let checkBtn = document.querySelector(".add-provider .check");
  checkBtn.addEventListener("click", evt => {
    let row = document.querySelector(".provider-list .adding");
    let name = row.querySelector(".name input").value;
    let baseurl = row.querySelector(".baseurl input").value;
    let cancelBtn = document.querySelector(".add-provider .cancel");
    
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
  
  let cancelBtn = document.querySelector(".add-provider .cancel");
  cancelBtn.addEventListener("click", evt => {
    let row = document.querySelector(".provider-list .adding");
    let checkBtn = document.querySelector(".add-provider .check");
    row.remove();
    
    addProviderBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
    cancelBtn.style.display = "none";
    
    refreshProviders();
  });
}

function resetHeight(){
  let mainDiv = document.querySelector("#main");
  let contentHeight = mainDiv.offsetHeight + "px";
  document.body.style.height = contentHeight;
  document.querySelector("html").style.height = contentHeight;
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

function setSearchProviders({name, baseurl, remove}){
  return new Promise((resolve, reject) => {
    getSearchProviders().then(providers => {
      if(!Array.isArray(providers)) providers = [];
      
      if(remove === true){
        providers = providers.filter(p => p.name !== name);
      }
      else{
        let index = providers.findIndex(p => p.name === name);
        if(index > -1){
          providers[index].baseurl = baseurl;
        }
        else{
          providers.push({name, baseurl});
        }
      }
      
      chrome.storage.sync.set({providers}, ()=> {
        resolve();
      });
    })
  });
}
