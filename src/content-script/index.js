void function(){
// Configurations
  let defaultSubWindowStyle = {
    "box-sizing": "content-box",
    width: "300px",
    height: "300px",
    "background-color": "rgba(255,255,255,1)",
    position: "fixed",
    opacity: "0.95",
    top: "0",
    left: "0",
    padding: "0",
    border: "10px solid rgba(20,250,80,0.3)",
    "z-index": "99999999",
    cursor: ["grab", "-webkit-grab"],
  };
  
  let defaultResizerStyle = {
    width: "10px",
    height: "10px",
    "background-color": "rgba(255,255,255,0)",
    position: "absolute",
    "z-index": "999999999"
  };
  
  let defaultHeaderStyle = {
    "box-sizing": "border-box",
    "font-size": "1rem",
    border: "0px none transparent",
    "border-bottom": "1px solid #ccc",
    width: "100%",
    padding: ".3rem 0",
  };
  
  let defaultInputStyle = {
    height: "1.7rem",
    width: "calc(100% - 2rem)",
    display: "inline-block",
    "font-size": ".8rem",
    "box-sizing": "border-box",
    padding: ".2rem .4rem",
    "vertical-align": "middle",
  };
  
  let defaultRemoveBtnStyle = {
    "box-sizing": "border-box",
    height: "1.7rem",
    width: "2rem",
    display: "inline-block",
    "vertical-align": "middle",
    "text-align": "center",
  };
  
  let defaultBodyStyle = {
    height: "calc(100% - 1.7rem - 0.6rem - 1px)",
    position: "relative",
  };
  
  let defaultIframeStyle = {
    width: "100%",
    height: "100%",
    padding: "0",
    border: "0px none transparent",
  };
  
  let prefix = "___multiwindow_";

// Main execution context
  main();

/////////// Functions ////////////////
  function main(){
    chrome.runtime.onMessage.addListener(onMessageFromBackground);
  }
  
  function onMessageFromBackground(message, sender, sendResponse){
    if(message.type === "CREATE_WINDOW"){
      let subWindow = new SubWindow();
      let windowElement = subWindow.create({src: "https://google.com"}).subWindow;
      document.body.appendChild(windowElement);
    }
  }
  
  class SubWindow {
    constructor(){
      this.index = typeof(this.constructor.index) === "number" ? this.constructor.index++ : 0;
      this.components = {};
  
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
      subWindow.draggable = true;
    
      let headerComponents = createHeader();
      let bodyComponents = createBody({src});
      
      Object.keys(headerComponents).forEach(c => {
        this.components[c] = headerComponents[c];
      });
  
      Object.keys(bodyComponents).forEach(c => {
        this.components[c] = bodyComponents[c];
      });
      
      let {header} = headerComponents;
      let {body} = bodyComponents;
  
      subWindow.appendChild(header);
      subWindow.appendChild(body);
    
      subWindow.addEventListener('dragstart', handleDragStart, false);
      subWindow.addEventListener('dragend', handleDragEnd, false);
      
      let {resizer} = this.createResizer();
      
      Object.keys(resizer).forEach(key => {
        subWindow.appendChild(resizer[key]);
      });
      
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
      
      let that = this;
      
      let onMouseDown = (event) => {
        this.startPosition = {
          top: event.screenY,
          left: event.screenX,
        };
        
        console.log("mousedown", this.startPosition);
        
        event.stopPropagation();
      };
      
      let onMouseMove = (event) => {
        if((event.buttons & 1) === 0){ // If left mouse button is clicked.
          return;
        }
        
        let move = {
          top: event.screenY - this.startPosition.top,
          left: event.screenX - this.startPosition.left,
        };
        
        if(Math.abs(move.top) > 10 || Math.abs(move.left) > 10){
          event.stopPropagation();
          console.log("drag", {pos: this.startPosition, scY: event.screenY, scX: event.screenX});
          return;
        }
  
        console.log("drag", this.startPosition);
  
        let subWindow = that.components.subWindow;
        
        if(!event.target) return;
  
        this.startPosition = {
          top: event.screenY,
          left: event.screenX,
        };
  
        event.stopPropagation();
  
        switch(event.target.style.cursor.substr(0, 2)){
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
            subWindow.style.height = (parseInt(subWindow.style.height) - move.top) + "px";
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
        }
      };
      
      let onDrag = (event) => {
        console.log(event);
        event.stopPropagation();
        event.preventDefault();
      };
  
      resizer.top.id = prefix + "resizer-t" + this.index;
      resizer.top.style.top = (-resizerSize) + "px";
      resizer.top.style.left = `calc(50% - ${resizerSize/2}px)`;
      resizer.top.style.cursor = "n-resize";
      resizer.top.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.top.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.top.addEventListener("dragstart", onDrag);
      resizer.top.addEventListener("dragend", onDrag);
      
      resizer.topRight.id = prefix + "resizer-tr" + this.index;
      resizer.topRight.style.top = (-resizerSize) + "px";
      resizer.topRight.style.right = (-resizerSize) + "px";
      resizer.topRight.style.cursor = "ne-resize";
      resizer.topRight.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.topRight.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.topRight.addEventListener("dragstart", onDrag);
      resizer.topRight.addEventListener("dragend", onDrag);
      
      resizer.right.id = prefix + "resizer-r" + this.index;
      resizer.right.style.top = `calc(50% - ${resizerSize/2}px)`;
      resizer.right.style.right = (-resizerSize) + "px";
      resizer.right.style.cursor = "e-resize";
      resizer.right.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.right.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.right.addEventListener("dragstart", onDrag);
      resizer.right.addEventListener("dragend", onDrag);
      
      resizer.bottomRight.id = prefix + "resizer-br" + this.index;
      resizer.bottomRight.style.bottom= (-resizerSize) + "px";
      resizer.bottomRight.style.right= (-resizerSize) + "px";
      resizer.bottomRight.style.cursor = "se-resize";
      resizer.bottomRight.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.bottomRight.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.bottomRight.addEventListener("dragstart", onDrag);
      resizer.bottomRight.addEventListener("dragend", onDrag);
      
      resizer.bottom.id = prefix + "resizer-b" + this.index;
      resizer.bottom.style.bottom = (-resizerSize) + "px";
      resizer.bottom.style.left = `calc(50% - ${resizerSize/2}px)`;
      resizer.bottom.style.cursor = "s-resize";
      resizer.bottom.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.bottom.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.bottom.addEventListener("dragstart", onDrag);
      resizer.bottom.addEventListener("dragend", onDrag);
      
      resizer.bottomLeft.id = prefix + "resizer-bl" + this.index;
      resizer.bottomLeft.style.bottom = (-resizerSize) + "px";
      resizer.bottomLeft.style.left = (-resizerSize) + "px";
      resizer.bottomLeft.style.cursor = "sw-resize";
      resizer.bottomLeft.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.bottomLeft.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.bottomLeft.addEventListener("dragstart", onDrag);
      resizer.bottomLeft.addEventListener("dragend", onDrag);
      
      resizer.left.id = prefix + "resizer-l" + this.index;
      resizer.left.style.top = `calc(50% - ${resizerSize/2}px)`;
      resizer.left.style.left = (-resizerSize) + "px";
      resizer.left.style.cursor = "w-resize";
      resizer.left.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.left.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.left.addEventListener("dragstart", onDrag);
      resizer.left.addEventListener("dragend", onDrag);
      
      resizer.topLeft.id = prefix + "resizer-tl" + this.index;
      resizer.topLeft.style.top = (-resizerSize) + "px";
      resizer.topLeft.style.left = (-resizerSize) + "px";
      resizer.topLeft.style.cursor = "nw-resize";
      resizer.topLeft.addEventListener("mousedown", onMouseDown.bind(this));
      resizer.topLeft.addEventListener("mousemove", onMouseMove.bind(this));
      resizer.topLeft.addEventListener("dragstart", onDrag);
      resizer.topLeft.addEventListener("dragend", onDrag);
      
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
      return {iframe};
    }
  
    createHeader(attributes = {}){
      let header = document.createElement("header");
      header.style = getStyle(defaultHeaderStyle);
    
      let input = document.createElement("input");
      input.id = prefix + "omnibox" + this.index;
      input.style = getStyle(defaultInputStyle);
      input.placeholder = window.location.protocol + "//";
      input.value = window.location.protocol + "//";
      input.addEventListener("keyup", (event) => {
        if(event.key === "Enter"){
          this.replaceIframe({src: input.value});
        }
      }, false);
      input.addEventListener("dragstart", (event) => {
        event.stopPropagation();
      }, true);
    
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
  
    handleDragStart(e){
      if(!e.target.isEqualNode(this.components.subWindow)) return;
      
      e.dataTransfer.setData('text/plain', 'This text may be dragged');
      
      this.startPosition = {
        top: e.screenY,
        left: e.screenX,
      };
    }
  
    handleDragEnd(e){
      if(!e.target.isEqualNode(this.components.subWindow)) return;
      
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
  
  function getStyle(styleObj){
    return Object.keys(styleObj).reduce((acc, val) => {
      if(Array.isArray(styleObj[val])){
        return acc + styleObj[val].reduce((acc2, val2) => acc2 + ";" + val + ":" + val2, "");
      }
      return acc + ";" + val + ":" + styleObj[val];
    }, "");
  }
}();
