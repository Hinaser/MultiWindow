class HttpHandler extends Component {
  constructor(props){
    super(props);
    
    this.state = {requestIds: {}, tabIds: {}};
  }
  
  startMonitor(){
    this.stopMonitor();
    
    chrome.webRequest.onBeforeSendHeaders.addListener(
      this.handleRequest.bind(this),
      {urls: ["*://*/*"]},
      ["blocking", "requestHeaders"]
    );
    
    chrome.webRequest.onHeadersReceived.addListener(
      this.handleResponse.bind(this),
      {urls: ["*://*/*"]},
      ["blocking", "responseHeaders"]
    );
    
    chrome.runtime.onMessage.addListener(this.handleMessageFromContent.bind(this));
  }
  
  stopMonitor(){
    let onBeforeSendHeaders = chrome.webRequest.onBeforeSendHeaders;
    onBeforeSendHeaders.hasListener(this.handleRequest) &&
      onBeforeSendHeaders.removeListener(this.handleRequest);
  
    let onHeadersReceived = chrome.webRequest.onHeadersReceived;
    onHeadersReceived.hasListener(this.handleResponse) &&
      onHeadersReceived.removeListener(this.handleResponse);
    
    let onMessage = chrome.runtime.onMessage;
    onMessage.hasListener(this.handleMessageFromContent) &&
      onMessage.removeListener(this.handleMessageFromContent);
  }
  
  handleRequest(details){
    let {tabIds, requestIds} = this.state;
    let {requestHeaders, frameId, requestId, tabId} = details;
    
    // Only requests from iframe created by the extension are handled.
    if(frameId === 0 || !tabIds.hasOwnProperty(tabId)) return;
    
    requestIds[requestId] = 1;
    this.setState({requestIds});
  }
  
  handleResponse(details){
    let {requestIds, tabIds} = this.state;
    let {responseHeaders, frameId, requestId, tabId} = details;
    
    let cspIndex = responseHeaders.findIndex(h => h.name.toLowerCase() === "content-security-policy");
    if(cspIndex > -1){
      let policies = responseHeaders[cspIndex].value;
      policies = policies.split(/\s*;\s*/);
      policies = policies.filter(p => {
        let name = p.split(/\s+/)[0];
        console.log("name", name);
        return !["frame-src", "child-src", "default-src"].includes(name);
      });
      policies.push("default-src *");
      
      responseHeaders[cspIndex].value = policies.join(";");
    }
  
    // Only requests from iframe created by the extension are handled.
    if(frameId === 0 || !tabIds.hasOwnProperty(tabId) || !requestIds.hasOwnProperty(requestId)){
      return {responseHeaders};
    }
    
    responseHeaders = responseHeaders.filter(function(h){
      return ![
        "x-frame-options",
        "content-security-policy"
      ].includes(h.name.toLowerCase());
    });
    
    return {responseHeaders};
  }
  
  handleMessageFromContent(message, messageSender){
    switch(message.type){
      case "WINDOW_CREATED":
        let tabId = messageSender.tab.id;
        let {tabIds} = this.state;
        tabIds[tabId] = 1;
        this.setState({tabIds});
        break;
      default:
        break;
    }
  }
}
