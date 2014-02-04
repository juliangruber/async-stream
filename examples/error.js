var co = require('co');
var wait = require('co-wait');

co(function*(){
  function errors(){
    return function*(end){
      throw new Error('not implemented');
    }
  }
  
  var data;
  var read = errors();
  
  while (true) {
    try {
      var data = yield read();
    } catch (err) {
      console.error('threw');
      break;
    }
  }
})();