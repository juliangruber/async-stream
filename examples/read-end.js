(async () => {

  const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

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

})()
