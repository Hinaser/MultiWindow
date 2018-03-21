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
        let rowTemplate = document.importNode(template.content, true);
        let stateElement = rowTemplate.querySelector(".state");
        let nameElement = rowTemplate.querySelector(".name");
        let baseUrlElement = rowTemplate.querySelector(".baseurl");
        let actionElement = rowTemplate.querySelector(".action");
      
        if(p.default){
          stateElement.classList.add("active");
        }
        else{
          stateElement.classList.remove("active");
        }
        
        nameElement.textContent = p.name;
        baseUrlElement.textContent = p.baseurl;
      
        table.appendChild(rowTemplate);
      });
      resetHeight();
      
      let defaultBtns = document.querySelectorAll(".provider-list .state");
      defaultBtns.forEach(btn => {
        btn.addEventListener("click", evt => {
          let row = evt.target.parentElement;
          let isActive = row.querySelector(".state.active");
          
          if(isActive) return;
          
          let nameElement = row.querySelector(".name");
          let name = nameElement.textContent;
          setSearchProviders({name, isDefault: true}).then(()=>{
            refreshProviders();
          });
        });
      });
    
      let editBtns = document.querySelectorAll(".provider-list .modify");
      let editBtnAction = evt => {
        if(evt.target.tagName.toLowerCase() !== "i") return;
  
        let row = evt.target.parentElement.parentElement;
        let nameElement = row.querySelector(".name");
        let baseurlElement = row.querySelector(".baseurl");
        let name = nameElement.textContent;
        let baseurl = baseurlElement.textContent;
        
        let doUpdate = () => {
          let row = evt.target.parentElement.parentElement;
          let nameInput = row.querySelector("input.name");
          let baseurlInput = row.querySelector("input.baseurl");
          let name = nameInput.value;
          let oldName = nameInput.dataset.oldName;
          let baseurl = baseurlInput.value;
          
          setSearchProviders({name, baseurl, oldName})
            .then(()=>{
              refreshProviders();
            })
            .catch(message => {
              alert(message);
            })
          ;
        };
        
        if(row.querySelector("input")){
          doUpdate();
          return;
        }
        
        let onInput = e => {
          if(e.key === "Enter"){
            doUpdate();
          }
        };
  
        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = name;
        nameInput.className = "name";
        nameInput.dataset.oldName = name;
        nameInput.addEventListener("keyup", onInput);
  
        let baseurlInput = document.createElement("input");
        baseurlInput.type = "text";
        baseurlInput.value = baseurl;
        baseurlInput.className = "baseurl";
        baseurlInput.addEventListener("keyup", onInput);
  
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
  
  let addProvider = () => {
    let row = document.querySelector(".provider-list .adding");
    let name = row.querySelector(".name input").value;
    let baseurl = row.querySelector(".baseurl input").value;
    let cancelBtn = document.querySelector(".add-provider .cancel");
  
    if(!name || !baseurl){
      alert(chrome.i18n.getMessage("nameOrUrlIsEmpty"));
      return;
    }
  
    row.remove();
  
    addProviderBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
    cancelBtn.style.display = "none";
  
    setSearchProviders({name, baseurl})
      .then(()=>{
        refreshProviders()
      })
      .catch(message => {
        alert(message);
      })
    ;
  };
  
  let addProviderBtn = document.querySelector(".add-provider .add");
  
  addProviderBtn.addEventListener("click", evt => {
    let template = document.querySelector("#addProvider-template");
    let row = document.importNode(template.content, true);
    let table = document.querySelector(".provider-list");
    table.appendChild(row);
    
    let inputs = table.querySelectorAll(".adding input");
    console.log(inputs);
    inputs.forEach(input => {
      input.addEventListener("keyup", e => {
        if(e.key === "Enter"){
          addProvider();
        }
      });
    });
    
    let checkBtn = document.querySelector(".add-provider .check");
    let cancelBtn = document.querySelector(".add-provider .cancel");
    
    addProviderBtn.style.display = "none";
    checkBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  });
  
  let checkBtn = document.querySelector(".add-provider .check");
  checkBtn.addEventListener("click", evt => {
    if(evt.target !== checkBtn) return;
    
    addProvider();
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

function setSearchProviders({name, baseurl, isDefault, remove, oldName}){
  return new Promise((resolve, reject) => {
    if(!name) return reject(chrome.i18n.getMessage("REQUIRE_NAME"));
    
    if(baseurl && !isValidUrl(baseurl)) return reject(chrome.i18n.getMessage("INVALID_URL"));
    
    getSearchProviders().then(providers => {
      if(!Array.isArray(providers)) providers = [];
      
      if(remove === true){
        providers = providers.filter(p => p.name !== name);
      }
      else if(oldName && name !== oldName){
        let index = providers.findIndex(p => p.name === oldName);
        let indexNewName = providers.findIndex(p => p.name === name);
        
        if(indexNewName > -1){
          return reject(chrome.i18n.getMessage("NAME_ALREADY_USED"));
        }
  
        if(index > -1){
          providers[index].name = name;
          
          if(baseurl){
            providers[index].baseurl = baseurl;
          }
          if(isDefault){
            providers[index].default = true;
            providers.forEach((p, i) => {
              if(i !== index) delete providers[i].default;
            });
          }
        }
      }
      else{
        let index = providers.findIndex(p => p.name === name);
        if(index > -1){
          if(baseurl){
            providers[index].baseurl = baseurl;
          }
          if(isDefault){
            providers[index].default = true;
            providers.forEach((p, i) => {
              if(i !== index) delete providers[i].default;
            });
          }
        }
        else{
          if(providers.length > 0){
            providers.push({name, baseurl});
          }
          else
          {
            providers.push({name, baseurl, default: true});
          }
        }
      }
      
      chrome.storage.sync.set({providers}, ()=> {
        resolve();
      });
    })
  });
}

function isValidUrl(string){
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}