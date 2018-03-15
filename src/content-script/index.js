let onMessageFromBackground = (message, sender, sendResponse) => {
  if(message.type === "CREATE_WINDOW"){
    let iframe = document.createElement("iframe");
    iframe.src = "https://github.com/";
    iframe.style = "width:300px;height:300px;background-color:rgba(255,255,255,.8);position:fixed;top:0;left:0;padding:0;border:0px none transparent;";
    document.body.appendChild(iframe);
  }
};

chrome.runtime.onMessage.addListener(onMessageFromBackground);
