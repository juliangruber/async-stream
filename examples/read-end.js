var co = require('co');
var wait = require('co-wait');

co(function*(){

  function genStream(){
    var i = 0;
    return function*(end){
      if (end || ++i == 3) return cleanup();
      yield wait(1000);
      return Date.now()+'';
    }
  
    function cleanup(){
      console.log('cleaning up');
    }
  }
  
  var data;
  var read = genStream();
  
  console.log('data: %s', yield read());
  console.log('data: %s', yield read());
  yield read(true);
  console.log('done reading');

})();