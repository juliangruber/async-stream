var co = require('co');
var wait = require('co-wait');

co(function*(){

  function dates(){
    var i = 0;
    return function*(end){
      if (end || ++i == 3) return;
      yield wait(1000);
      return Date.now()+'';
    }
  }
  
  function hex(fn){
    return function*(end){
      var str = yield fn(end);
      if (!str) return;
      return parseInt(str, 10).toString(16);
    }
  }
  
  var data;
  var read = hex(dates());
  
  while (data = yield read()) {
    console.log('data: %s', data);
  }
  
  console.log('done reading');

})();