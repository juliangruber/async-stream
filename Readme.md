# async-stream

  The async stream spec.

  This is a spec / manual and that's all you need for async streams, you don't need any modules to create a valid stream, not even for convenience.

## Semantics

  An async stream is simply a promise returning function. If you're familiar with other
stream semantics: There's only readable streams, no need for writables and
transforms.

  - A readable is a function: `var read = readable()`.
  - A transform is a readable that takes a stream as argument: `var read = transform(readable())`.
  - A writable is a while loop: `var data; while (data = yield read()) {}`.

It's all pulling and there's simply no need for base classes.

## Comparison to node core streams

### Reading

```js
// core
a.on('data', console.log)

// async stream
let data
while (data = await a()) console.log(data)
```

### Piping

```js
// core
source.pipe(transform).pipe(destionation)

// async stream
const read = transform(source())
let data
while (data = await read()) {}
```

### Error handling

```js
// core
source
  .on('error', handle)
  .pipe(transform)
  .on('error', handle)
  .pipe(destination)

// async stream
const read = transform(source())
try {
  let data
  while (data = await read()) {}
} catch (err) {
  handle(err)
}
```

### Implementing a source

```js
// core
const { Readable } = require('stream')
class readable extends Readable {
  _read () {
    this.push(String(Date.now()))
  }
}

// async stream
const readable = () => async () => String(Date.now())
```

### Implementing a transform

```js
// core
const { Transform } = require('stream')
class transform extends Transform {
  _transform (chunk, enc, done) {
    done(null, Number(chunk).toString(16))
  }
}

// async stream
const transform = read => async () => Number(await read()).toString(16)
```

## Examples

  All following examples are wrapped inside:

```js
(async () => {

  const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

  // ...

})()
```

  You can run the examples with node >= 7.6:

```bash
$ node examples/<name>.js
```

  Be sure to `npm install` first!

### read

  On each invocation the stream should return a String or Buffer of
data, or a falsy value when there's nothing more to be read and the stream is
done:

```js
// readable stream that emits 3x the current date with 1 second delay
const dates = () => {
  let i = 0
  return async () => {
    if (++i == 3) return // end
    await sleep(1000)
    return String(Date.now())
  }
}

let data
const read = dates()

while (data = await read()) {
  console.log('data: %s', data)
}

console.log('done reading')
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

  The async function may take an end argument, which when truthy tells the
stream to clean up its underlying resources, like tcp connections or file
descriptors.

```js
// readable stream with cleanup logic
const dates = () => {
  let i = 0
  const cleanup = () => console.log('cleaning up')

  return async end => {
    if (end || ++i == 3) return cleanup()
    await sleep(1000)
    return String(Date.now())
  }
}

let data
const read = dates()

console.log(`data: ${await read()}`)
console.log(`data: ${await read()}`)
await read(true)
console.log('done reading')
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
const dates = () => {
  let i = 0
  return async end => {
    if (end || ++i == 3) return
    await sleep(1000)
    return String(Date.now())
  }
}

const hex = fn => async end => {
  const str = await fn(end)
  if (!str) return
  return Number(str).toString(16)
}

let data
const read = hex(dates())

while (data = await read()) {
  console.log(`data: ${data}`)
}

console.log('done reading')
```

  Outputs:

```bash
$ node examples/pipe.js
data: 143fd169b4d
data: 143fd169f50
done reading
```

### errors

  Just throw inside the async function:

```js
const errors = () => async end => {
  throw new Error('not implemented')
}

let data
const read = errors()

while (true) {
  try {
    data = await read()
  } catch (err) {
    console.error('threw')
    break
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

  Currently async-streams have no concept of high water mark / buffering.

## License

  MIT
