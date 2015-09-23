# co-stream

  The [co](https://github.com/visionmedia/co) generator stream spec.
  
  This is a spec / manual and that's all you need for co streams, you don't need any modules to create a valid stream, not even for convenience.

## Examples

  Examples are wrapped inside:

```js
var co = require('co');
var wait = require('co-wait');

co(function*(){
  
  // ...
  
})();
```

  You can run the examples with node >= 0.12:

```bash
$ node examples/<name>.js
```

  Be sure to `npm install` first!

## Semantics

  A generator stream is simply a generator function. If you're familiar with other
stream semantics: There's only readable streams, no need for writables and
transforms.

  - A readable is a function: `var read = readable()`.
  - A transform is a readable that takes a stream as argument: `var read = transform(readable())`.
  - A writable is a while loop: `var data; while (data = yield read()) {}`.

It's all pulling and there's simply no need for base classes.

### read

  On each invokation the generator function should return a String or Buffer of
data, or a falsy value when there's nothing more to be read and the stream is
done:

```js
// readable stream that emits 3x the current date with 1 second delay
function dates(){
  var i = 0;
  return function*(){
    if (++i == 3) return; // end
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
$ node examples/read.js
data: 1391519193735
data: 1391519194644
data: 1391519194663
done reading
```

### end

  The generator function may take an end argument, which when truthy tells the
stream to clean up its underlying resources, like tcp connections or file
descriptors.

```js
// readable with cleanup logic

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
yield read(true); // end
console.log('done reading');
```

  Outputs:

```bash
$ node examples/read-end.js
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

// fn is the stream this reads from
function hex(fn){
  return function*(end){
    var str = yield fn(end);
    if (!str) return;
    return parseInt(str, 10).toString(16);
  }
}

var data;
// this is the pipe
var read = hex(dates());

while (data = yield read()) {
  console.log('data: %s', data);
}

console.log('done reading');
```

  Outputs:

```bash
$ node examples/pipe.js
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

  Either let co catch all errors:
  
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

```js
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
$ node examples/error.js
threw
```

  This means that a transform stream can decide itself if it wants to handle errors from it's source,
  by wrapping calls to `read` in a `try/catch`, or propagate them to the parent.

## high water mark / buffering

  Some streams - like node's or unix pipes - have the concept of high water marks / buffering, which means
  that a fast readable will be asked for data even if a slow writable isn't done consuming yet. This has
  the advantage of being potentially faster and evening out spikes in the streams' throughputs. However,
  it leads to more memory usage (in node max. 16kb per stream), complicates implementations and can
  be very unintuitive.
  
  An example where you wouldn't expect that behavior is this:

```js
http.createServer(function(req, res){
  fs.createReadStream('/dev/random').pipe(res);
});
```

  You'd think this would stop reading from the pseudo number generator `/dev/random` when the request ends,
  right? Unfortunately that's not the case. Node will read 16kb into an internal buffer first because you
  might want to later pipe that read stream into another stream and it can than immediately flush that out.
  
  In that case the buffer will be filled up pretty quickly so that's not a _huge_ problem. But imagine your
  source being slow, with low throughput. For example it could tail logs of an infrequently used system.
  In this case, with many requests to this http handler, it will keep a great number of streams open.
  
  Currently co-streams have no concept of high water mark / buffering.

## Associated libraries

  [Available generator streams](https://github.com/visionmedia/co/wiki#wiki-streams)

## License
  
  MIT
