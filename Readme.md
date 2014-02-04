
# co-stream

  The [co](https://github.com/visionmedia/co) generator stream spec.
  
  It's only a spec, for now we don't even need a module, like node's `stream` or
  dominictarr's [pull-stream](https://github.com/dominictarr/pull-stream).

## Misc

  Examples are wrapped inside:

```js
var co = require('co');
var wait = require('co-wait');

co(function*(){
  
  // ...
  
})();
```

  You can run the examples with node `0.11.x`:

```bash
$ node --harmony examples/<name>.js
```

  Be sure to `npm install` first!

## Semantics

  A generator stream is simply a generator function. If you're familiar with other
stream semantics: There's only readable streams, no need for writable and
transform.

### read

  On each invokation the generator function should return a String or Buffer of
data, or a falsy value when there's nothing more to be read and the stream is
done:

```js
function dates(){
  var i = 0;
  return function*(){
    if (++i == 3) return;
    yield wait(1000);
    return Date.now()+'';
  }
}

var data;
var read = dates();

while (data = yield read()) {
  console.log('data: %s', data);
}

console.log('done reading');
```

  Outputs:

```bash
$ node --harmony examples/read.js
data: 1391519193735
data: 1391519194644
data: 1391519194663
done reading
```

### end

  The generator function may take an end argument, which when true tells the
stream to clean up its underlying resources, like tcp connections or file
descriptors.

```js
function dates(){
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
var read = dates();

console.log('data: %s', yield read());
console.log('data: %s', yield read());
yield read(true);
console.log('done reading');
```

  Outputs:

```bash
$ node --harmony examples/read-end.js
data: 1391519193735
data: 1391519194644
cleaning up
done reading
```

### pipe

  "Pipe" streams into each other by letting them read from each other. Here we
  add a hex stream that converts date strings from decimal to hexadecimal:

```js
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
```

  Outputs:

```bash
$ node --harmony examples/pipe.js
data: 143fd169b4d
data: 143fd169f50
done reading
```

### errors

  Just throw inside the generator function:

```js
function errors(){
  var i = 0;
  return function*(end){
    throw new Error('not implemented');
  }
}
```

  For error handling simply let co catch all:
  
```js
co(function*(){
  var data;
  var read = errors();
  while (data = yield read()) console.log('...');
})(function(err){
  // here we get the error
});
```  

  ...or apply more granualar control:

```
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
```

  Outputs:

```bash
$ node --harmony examples/error.js
threw
```

## Streams

  Available generator streams:

  - [co-sse](https://github.com/juliangruber/co-sse) - Server-Sent Events stream

## License
  
  MIT
