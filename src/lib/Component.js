class Component {
  constructor(props){
    this.props = typeof(props || undefined) === "object" ? props : {};
    this.state = {};
  }
  
  setState(nextState){
    if(typeof(nextState || undefined) !== "object"){
      return;
    }
  
    // Recursively set proposed value
    let updateState = (src, dst, key) => {
      if(!src.hasOwnProperty(key)){
        return;
      }
      else if(!dst.hasOwnProperty(key)){
        dst[key] = src[key];
      }
    
      if(typeof(src[key] || undefined) === "object" && !Array.isArray(src[key])){
        Object.keys(src[key]).forEach(function(key2){
          updateState(src[key], dst[key], key2);
        });
      }
      else if(src[key] === undefined){
        if(dst[key] !== undefined) delete dst[key];
      }
      else{
        dst[key] = src[key];
      }
    };
  
    Object.keys(nextState).forEach((key) => {
      updateState(nextState, this.state, key);
    });
    
    return this.state;
  }
  
  getState(){
    return this.state;
  }
}
