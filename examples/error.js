(async () => {

  const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

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

})()
