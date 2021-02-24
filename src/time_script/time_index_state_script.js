const {AlwaysSuccessLockScript, TimeIndexStateTypeScript} = require('../utils/config')
const {remove0x} = require('../utils/hex')
const TIME_INDEX_STATE_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
const TIME_INDEX_CELL_DATA_N = 12

class TimeIndexState {
  constructor(index, n = TIME_INDEX_CELL_DATA_N) {
    this.index = index,
    this.n = n
  }

  getTimeIndex() {
    return this.index
  }

  getTimeCellN() {
    return this.n
  }

  toString() {
    return `0x${Buffer.from([this.index, this.n]).toString('hex')}`
  }

  incrIndex() {
    this.index++
    if (this.index === this.n) {
      this.index = 0
    }
    return this
  }
}

//parse time index state cell data, and return TimeIndexState object
//param: data, for example: '0x000c'
const timeIndexStateFromData = data => {
  data = remove0x(data)
  return new TimeIndexState(parseInt(data.substring(0, 2), 16), parseInt(data.substring(2, 4), 16))
}

const timeIndexStateTypeScript = args => {
  return {
    codeHash: TimeIndexStateTypeScript.codeHash,
    hashType: TimeIndexStateTypeScript.hashType,
    args,
  }
}

const generateTimeIndexStateOutput = async (args, timeIndexStateCapacity = TIME_INDEX_STATE_CELL_CAPACITY) => {
  return {
    capacity: `0x${timeIndexStateCapacity.toString(16)}`,
    lock: AlwaysSuccessLockScript,
    type: timeIndexStateTypeScript(args),
  }
}

module.exports = {
  TIME_INDEX_STATE_CELL_CAPACITY,
  TIME_INDEX_CELL_DATA_N,
  TimeIndexState,
  timeIndexStateFromData,
  generateTimeIndexStateOutput,
}
