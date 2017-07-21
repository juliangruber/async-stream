(async () => {

  const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

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

})()
