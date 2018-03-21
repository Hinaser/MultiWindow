void function(){
// Configurations
  let defaultSubWindowStyle = {
    display: "block",
    "box-sizing": "content-box",
    width: "300px",
    height: "300px",
    "background-color": "rgba(255,255,255,1)",
    position: "fixed",
    opacity: "0.95",
    bottom: "20px",
    right: "20px",
    padding: "0",
    border: "1px solid rgba(33,33,33,.4)",
    "z-index": "99999999",
    cursor: ["grab", "-webkit-grab"],
    "box-shadow": "6px 6px 12px rgba(130,130,130,.3)",
  };
  
  let defaultSheetStyle = {
    display: "none",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    "background": "transparent",
    "border": "none",
    "z-index": "99999998",
  };
  
  let defaultResizerStyle = {
    display: "block",
    width: "10px",
    height: "10px",
    "background-color": "rgba(255,255,255,0)",
    position: "absolute",
    "z-index": "999999999",
  };
  
  let defaultHeaderStyle = {
    display: "block",
    "box-sizing": "border-box",
    "font-size": "1rem",
    border: "0px none transparent",
    "border-bottom": "1px solid #ccc",
    width: "100%",
    padding: ".3rem 0",
    "background-color": "rgba(240,240,240,.8)",
  };
  
  let defaultInputStyle = {
    height: "30px",
    "line-height": "30px",
    width: "calc(100% - 30px - 1rem)",
    display: "inline-block",
    "font-size": "14px",
    "box-sizing": "border-box",
    padding: "0 .4rem",
    "margin-left": "1rem",
    "vertical-align": "middle",
    border: "1px solid #ccc",
    "border-radius": "3px",
    "background-color": "#fff",
  };
  
  let defaultRemoveBtnStyle = {
    "box-sizing": "border-box",
    height: "30px",
    "line-height": "30px",
    width: "30px",
    display: "inline-block",
    "vertical-align": "middle",
    "text-align": "center",
    "cursor": "pointer",
  };
  
  let defaultBodyStyle = {
    display: "block",
    height: "calc(100% - 30px - 0.6rem - 1px)",
    position: "relative",
  };
  
  let defaultIframeStyle = {
    display: "block",
    width: "100%",
    height: "100%",
    padding: "0",
    border: "0px none transparent",
  };
  
  let prefix = "___multiwindow_";
  
  let defaultSearchProvider = {
    name: "Google",
    baseurl: "https://google.com/search?q={{input}}",
  };

// Main execution context
  main();

/////////// Functions ////////////////
  function main(){
    chrome.runtime.onMessage.addListener(onMessageFromBackground);
  }
  
  function onMessageFromBackground(message, sender, sendResponse){
    if(message.type === "CREATE_WINDOW"){
      getConfig().then(config => {
        let homepage = config.homepage || "about:blank";
        let providers = config.providers;
        
        let searchProvider;
        if(providers){
          searchProvider= providers.find(p => p.default)
        }
  
        if(!searchProvider) searchProvider = defaultSearchProvider;
        
        let {rememberWindowSize} = config;
        let {windowSize} = config;
        
        let subWindow = new SubWindow({searchProvider, rememberWindowSize, windowSize});
        let windowElement = subWindow.create({src: homepage}).subWindow;
        document.body.appendChild(windowElement);
  
        chrome.runtime.sendMessage({type: "WINDOW_CREATED"});
      });
    }
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
  
  class SubWindow {
    constructor(props){
      if(typeof(props || undefined) !== "object") props = {};
      
      this.index = typeof(this.constructor.index) === "number" ? this.constructor.index++ : 0;
      this.components = {};
      this.searchProvider = props.searchProvider || defaultSearchProvider;
      this.rememberWindowSize = props.rememberWindowSize;
      this.windowSize = props.windowSize;
      
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if(changes.rememberWindowSize){
          this.rememberWindowSize = changes.rememberWindowSize.newValue;
        }
      });
  
      ["create", "createHeader", "createBody", "createIframe", "createResizer",
        "replaceIframe", "handleDragStart", "handleDragEnd", "destroy"]
        .forEach(method => {
          this[method] = this[method].bind(this);
        });
    }
    
    create(attributes = {}){
      let {handleDragStart, handleDragEnd,
        createHeader, createBody} = this;
      let {src, style} = attributes;
    
      if(!style) style = getStyle(defaultSubWindowStyle);
      if(!src) src = "/";
      
      let subWindow = document.createElement("div");
      subWindow.id = prefix + "sub-window" + this.index;
      subWindow.style = style;
      
      if(this.rememberWindowSize && this.windowSize && this.windowSize.width && this.windowSize.height){
        subWindow.style.width = this.windowSize.width + "px";
        subWindow.style.height = this.windowSize.height + "px";
      }
    
      let headerComponents = createHeader();
      let bodyComponents = createBody({src});
      
      Object.keys(headerComponents).forEach(c => {
        this.components[c] = headerComponents[c];
      });
  
      Object.keys(bodyComponents).forEach(c => {
        this.components[c] = bodyComponents[c];
      });
  
      let styleElement = document.createElement("style");
      styleElement.textContent = `#${prefix}sub-window${this.index} * {all: initial}`;
      styleElement.style.display = "none";
      
      let {header} = headerComponents;
      let {body} = bodyComponents;
      let {resizer} = this.createResizer();
      
      subWindow.appendChild(styleElement);
      subWindow.appendChild(header);
      subWindow.appendChild(body);
      Object.keys(resizer).forEach(key => {
        subWindow.appendChild(resizer[key]);
      });
      
      if(!this.constructor.sheet){
        this.constructor.sheet = this.createSheet();
      }
  
      subWindow.appendChild(this.constructor.sheet);
  
      subWindow.draggable = true;
      subWindow.addEventListener('dragstart', handleDragStart, false);
      subWindow.addEventListener('dragend', handleDragEnd, false);
      
      this.components.resizer = resizer;
      this.components.subWindow = subWindow;
    
      return {subWindow};
    }
    
    destroy(){
      let subWindow = this.components.subWindow;
      subWindow.remove();
      subWindow = null;
      
      Object.keys(this.components).forEach(key => {
        this.components[key] = null;
      });
    }
    
    createResizer(){
      let resizerTemplate = document.createElement("div");
      resizerTemplate.style = getStyle(defaultResizerStyle);
      resizerTemplate.draggable = false;
      let resizerSize = parseInt(defaultResizerStyle.width);
  
      let resizer = {
        top: resizerTemplate.cloneNode(),
        topRight: resizerTemplate.cloneNode(),
        right: resizerTemplate.cloneNode(),
        bottomRight: resizerTemplate.cloneNode(),
        bottom: resizerTemplate.cloneNode(),
        bottomLeft: resizerTemplate.cloneNode(),
        left: resizerTemplate.cloneNode(),
        topLeft: resizerTemplate.cloneNode(),
      };
      
      let resizeState = {
        active: false,
        direction: null,
        top: null,
        left: null,
      };
      
      let onMouseDownOnResizer = (event) => {
        resizeState.active = true;
        resizeState.direction = event.target.style.cursor.substr(0, 2);
        resizeState.top = event.screenY;
        resizeState.left = event.screenX;
        
        this.components.iframe.style.pointerEvents = "none";
        this.components.subWindow.draggable = false;
        this.constructor.sheet.style.display = "block";
        
        event.stopPropagation();
      };
      
      let onMouseUpOnWindow = (events) => {
        if(resizeState.active){
          this.components.iframe.style.pointerEvents = "auto";
          this.components.subWindow.draggable = true;
          resizeState.active = false;
          this.constructor.sheet.style.display = "none";
          
          if(this.rememberWindowSize){
            let rect = this.components.subWindow.getBoundingClientRect();
            saveWindowSize(rect);
          }
        }
      };
  
      let that = this;
      let onMouseMoveOnWindow = (event) => {
        if((event.buttons & 1) === 0){ // If left mouse button is not clicked.
          resizeState.active = false;
          return;
        }
        
        if(!resizeState.active){
          return;
        }
        
        let move = {
          top: event.screenY - resizeState.top,
          left: event.screenX - resizeState.left,
        };
  
        resizeState.top = event.screenY;
        resizeState.left = event.screenX;
        
        let subWindow = that.components.subWindow;
  
        event.stopPropagation();
  
        switch(resizeState.direction){
          case "n-":
            subWindow.style.top = (parseInt(subWindow.style.top) + move.top) + "px";
            subWindow.style.height = (parseInt(subWindow.style.height) - move.top) + "px";
            break;
          case "ne":
            subWindow.style.top = (parseInt(subWindow.style.top) + move.top) + "px";
            subWindow.style.height = (parseInt(subWindow.style.height) - move.top) + "px";
            subWindow.style.width = (parseInt(subWindow.style.width) + move.left) + "px";
            break;
          case "e-":
            subWindow.style.width = (parseInt(subWindow.style.width) + move.left) + "px";
            break;
          case "se":
            subWindow.style.height = (parseInt(subWindow.style.height) + move.top) + "px";
            subWindow.style.width = (parseInt(subWindow.style.width) + move.left) + "px";
            break;
          case "s-":
            subWindow.style.height = (parseInt(subWindow.style.height) + move.top) + "px";
            break;
          case "sw":
            subWindow.style.height = (parseInt(subWindow.style.height) + move.top) + "px";
            subWindow.style.left = (parseInt(subWindow.style.left) + move.left) + "px";
            subWindow.style.width = (parseInt(subWindow.style.width) - move.left) + "px";
            break;
          case "w-":
            subWindow.style.left = (parseInt(subWindow.style.left) + move.left) + "px";
            subWindow.style.width = (parseInt(subWindow.style.width) - move.left) + "px";
            break;
          case "nw":
            subWindow.style.top = (parseInt(subWindow.style.top) + move.top) + "px";
            subWindow.style.height = (parseInt(subWindow.style.height) - move.top) + "px";
            subWindow.style.left = (parseInt(subWindow.style.left) + move.left) + "px";
            subWindow.style.width = (parseInt(subWindow.style.width) - move.left) + "px";
            break;
          default:
            break;
        }
      };
      
      window.addEventListener("mousemove", onMouseMoveOnWindow);
      window.addEventListener("mouseup", onMouseUpOnWindow);
  
      resizer.top.id = prefix + "resizer-t" + this.index;
      resizer.top.style.top = (-resizerSize) + "px";
      resizer.top.style.left = `calc(50% - ${resizerSize/2}px)`;
      resizer.top.style.cursor = "n-resize";
      resizer.top.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.topRight.id = prefix + "resizer-tr" + this.index;
      resizer.topRight.style.top = (-resizerSize) + "px";
      resizer.topRight.style.right = (-resizerSize) + "px";
      resizer.topRight.style.cursor = "ne-resize";
      resizer.topRight.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.right.id = prefix + "resizer-r" + this.index;
      resizer.right.style.top = `calc(50% - ${resizerSize/2}px)`;
      resizer.right.style.right = (-resizerSize) + "px";
      resizer.right.style.cursor = "e-resize";
      resizer.right.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.bottomRight.id = prefix + "resizer-br" + this.index;
      resizer.bottomRight.style.bottom= (-resizerSize) + "px";
      resizer.bottomRight.style.right= (-resizerSize) + "px";
      resizer.bottomRight.style.cursor = "se-resize";
      resizer.bottomRight.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.bottom.id = prefix + "resizer-b" + this.index;
      resizer.bottom.style.bottom = (-resizerSize) + "px";
      resizer.bottom.style.left = `calc(50% - ${resizerSize/2}px)`;
      resizer.bottom.style.cursor = "s-resize";
      resizer.bottom.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.bottomLeft.id = prefix + "resizer-bl" + this.index;
      resizer.bottomLeft.style.bottom = (-resizerSize) + "px";
      resizer.bottomLeft.style.left = (-resizerSize) + "px";
      resizer.bottomLeft.style.cursor = "sw-resize";
      resizer.bottomLeft.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.left.id = prefix + "resizer-l" + this.index;
      resizer.left.style.top = `calc(50% - ${resizerSize/2}px)`;
      resizer.left.style.left = (-resizerSize) + "px";
      resizer.left.style.cursor = "w-resize";
      resizer.left.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      resizer.topLeft.id = prefix + "resizer-tl" + this.index;
      resizer.topLeft.style.top = (-resizerSize) + "px";
      resizer.topLeft.style.left = (-resizerSize) + "px";
      resizer.topLeft.style.cursor = "nw-resize";
      resizer.topLeft.addEventListener("mousedown", onMouseDownOnResizer.bind(this));
      
      return {resizer};
    }
  
    createIframe(attributes = {}){
      let {src, style} = attributes;
      
      if(!src) src = "about:blank";
      if(!style) style = getStyle(defaultIframeStyle);
    
      let iframe = document.createElement("iframe");
      iframe.id = prefix + "iframe" + this.index;
      iframe.src = src;
      iframe.style = style;
      
      return {iframe};
    }
  
    replaceIframe(attributes = {}){
      let {iframe} = this.createIframe(attributes);
      let oldIframe = this.components.iframe;
      let body = this.components.body;
    
      body.replaceChild(iframe, oldIframe);
      this.components.iframe = iframe;
      
      return {iframe};
    }
  
    createHeader(attributes = {}){
      let header = document.createElement("header");
      header.style = getStyle(defaultHeaderStyle);
    
      let {input} = this.createInput();
      
      let removeBtn = document.createElement("span");
      removeBtn.id = prefix + "remove" + this.index;
      removeBtn.style = getStyle(defaultRemoveBtnStyle);
      removeBtn.textContent = "x";
      removeBtn.addEventListener("click", (event) => {
        this.destroy();
      });
    
      header.appendChild(input);
      header.appendChild(removeBtn);
      header.addEventListener("dragstart", (event) => {
        event.stopPropagation();
        event.preventDefault();
      }, true);
    
      return {header, input, removeBtn};
    }
    
    createInput(){
      let input = document.createElement("input");
      input.id = prefix + "searchbox" + this.index;
      input.style = getStyle(defaultInputStyle);
      input.placeholder = chrome.i18n.getMessage("inputPlaceholder");
      input.value = "";
      input.addEventListener("keyup", (event) => {
        let value = input.value;
        
        if(event.key === "Enter"){
          let src;
          
          if(isValidUrl(value)){
            src = value;
          }
          else{
            src = this.searchProvider.baseurl.replace("{{input}}", encodeURIComponent(value));
          }
          
          this.replaceIframe({src});
          return;
        }
      }, false);
      input.addEventListener("dragstart", (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, true);
      
      return {input};
    }
  
    createBody(attributes = {}){
      let {src, style} = attributes;
    
      if(!style) style = getStyle(defaultBodyStyle);
    
      let body = document.createElement("div");
      body.id = prefix + "body" + this.index;
      body.style = style;
    
      let {iframe} = this.createIframe({src});
      body.appendChild(iframe);
    
      return {body, iframe};
    }
    
    createSheet(attributes = {}){
      let {style} = attributes;
      if(!style) style = getStyle(defaultSheetStyle);
      
      let sheet = document.createElement("div");
      sheet.style = style;
      
      return sheet;
    }
  
    handleDragStart(e){
      //e.dataTransfer.setData('text/plain', 'This text may be dragged');
      
      this.startPosition = {
        top: e.screenY,
        left: e.screenX,
      };
    }
  
    handleDragEnd(e){
      let position = this.components.subWindow.getClientRects()[0];
      let move = {
        top: e.screenY - this.startPosition.top,
        left: e.screenX - this.startPosition.left,
      };
      
      let subWindow = this.components.subWindow;
      subWindow.style.top = (position.top + move.top) + "px";
      subWindow.style.left = (position.left + move.left) + "px";
      subWindow.style.right = null;
      subWindow.style.bottom = null;
    
      e.preventDefault();
    }
  }
  
  SubWindow.index = 0;
  
  function getConfig(){
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, items => {
        resolve(items);
      });
    });
  }
  
  function saveWindowSize({width, height}){
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({windowSize: {height, width}}, resolve);
    });
  }
  
  function getHomepage(){
    return new Promise((resolve, reject) => {
      let key = "homepage";
      chrome.storage.sync.get([key], (items)=> {
        resolve(items[key]);
      });
    });
  }
  
  function getStyle(styleObj){
    return Object.keys(styleObj).reduce((acc, val) => {
      if(Array.isArray(styleObj[val])){
        return acc + styleObj[val].reduce((acc2, val2) => acc2 + ";" + val + ":" + val2, "");
      }
      return acc + ";" + val + ":" + styleObj[val];
    }, "");
  }
  
  function isValidUrl(string){
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}();
