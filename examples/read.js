(async () => {

  const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

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

})()
