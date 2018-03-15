class HttpHandler extends Component {
  constructor(props){
    super(props);
    
    this.state = {requestIds: {}};
  }
  
  startMonitor(){
    this.stopMonitor();
    
    chrome.webRequest.onBeforeSendHeaders.addListener(
      this.handleRequest.bind(this),
      {urls: "*://*/*"},
      ["blocking", "requestHeaders"]
    );
    
    chrome.webRequest.onHeadersReceived.addListener(
      this.handleResponse.bind(this),
      {urls: "*://*/*"},
      ["blocking", "responseHeaders"]
    );
  }
  
  stopMonitor(){
    const onBeforeSendHeaders = chrome.webRequest.onBeforeSendHeaders;
    onBeforeSendHeaders.hasListener(this.handleRequest) &&
    onBeforeSendHeaders.removeListener(this.handleRequest);
    
    const onHeadersReceived = chrome.webRequest.onHeadersReceived;
    onHeadersReceived.hasListener(this.handleResponse) &&
    onHeadersReceived.removeListener(this.handleResponse);
  }
  
  handleRequest(details){
    let {requestHeaders, frameId, requestId} = details;
    
    if(frameId === 0) return;
    
    let accessControlRequestHeaders = requestHeaders.find(h => (
      h.name.toLowerCase() === "access-control-request-headers"
    ));
    
    if(accessControlRequestHeaders){
      let requestIds = this.state.requestIds;
      requestIds[requestId] = requestHeaders.value;
      this.setState({requestIds});
    }
  }
  
  handleResponse(details){
    let {responseHeaders, frameId, requestId} = details;
  
    if(frameId === 0) return;
    
    let allowOrigin = {name: "Access-Control-Allow-Origin", value: "*"};
    let allowMethods = {name: "Access-Control-Allow-Methods", value: "GET, PATCH, PUT, POST, DELETE, HEAD, OPTIONS"};
    let allowHeaders = {name: "Access-Control-Allow-Headers", value: "*"};
    
    if(this.state.requestIds.hasOwnProperty(requestId)){
      allowHeaders.value = this.state.requestIds[requestId] || "*";
      this.setState({requestIds: {[requestId]: undefined}});
    }
    else{
      allowHeaders = null;
    }
    
    responseHeaders = responseHeaders.filter(function(h){
      return ![
        "access-control-allow-origin",
        "access-control-allow-methods",
        "access-control-allow-headers"
      ].includes(h.name.toLowerCase());
    });
    
    allowOrigin && responseHeaders.push(allowOrigin);
    allowMethods && responseHeaders.push(allowMethods);
    allowHeaders && responseHeaders.push(allowHeaders);
    
    return {responseHeaders};
  }
}
