const {ownerLockInfo} = require('./helper')
const {TimeInfoTypeScript} = require('../utils/config')
const {TIME_INDEX_CELL_DATA_N} = require('./time_index_state_script')
const {int2Hex, remove0x} = require('../utils/hex')

const TIME_INFO_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
const TIME_INFO_UPDATE_INTERVAL = 60 //s

class TimeInfo {
    constructor(timestamp, index, n = TIME_INDEX_CELL_DATA_N) {
        this.timestamp = timestamp;
        this.n = n;
        this.index = index;
    }

    getTimeIndex() {
        return this.index
    }

    getTimestamp() {
        return this.timestamp
    }

    getTimeCellN() {
        return this.n
    }

    toString() {
        return `0x${int2Hex(this.index, 2)}${int2Hex(this.timestamp, 8)}`
    }
}

//parse time info cell data, and return TimeInfo object
//param: data, for example: '0x00603109e4'
const timeInfoFromData = data => {
    data = remove0x(data)
    return new TimeInfo(parseInt(data.substring(2, 10), 16), parseInt(data.substring(0, 2), 16))
}

const timeInfoTypeScript = args => {
    return {
        codeHash: TimeInfoTypeScript.codeHash,
        hashType: TimeInfoTypeScript.hashType,
        args,
    }
}

const generateTimeInfoOutputs = async (args, timeIndexStateCapacity = TIME_INFO_CELL_CAPACITY) => {
    const {ownerLockScript} = await ownerLockInfo()
    return {
        capacity: `0x${timeIndexStateCapacity.toString(16)}`,
        lock: ownerLockScript,
        type: timeInfoTypeScript(args),
    }
}

module.exports = {
    TIME_INFO_CELL_CAPACITY,
    TIME_INFO_UPDATE_INTERVAL,
    TimeInfo,
    timeInfoFromData,
    timeInfoTypeScript,
    generateTimeInfoOutputs,
}

