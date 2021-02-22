const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {secp256k1Dep, getCells, collectInputs, ownerLockInfo} = require('./helper')
const {
    CKB_NODE_RPC,
    TimeIndexStateDep,
    TimeIndexStateTypeScript,
    TimeInfoDep,
    TimeInfoTypeScript
} = require('../utils/config')
const {
    TIME_INDEX_CELL_DATA_N,
    timeIndexStateFromData,
    generateTimeIndexStateOutput
} = require('./time_index_state_script')
const {
    TIME_INFO_CELL_CAPACITY,
    TIME_INFO_UPDATE_INTERVAL,
    TimeInfo,
    timeInfoFromData,
    generateTimeInfoOutputs
} = require('./time_info_script')
const {int2Hex} = require('../utils/hex')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(1000)

const getCurrentTimeIndexStateCell = async () => {
    let curTimeIndexStateCells = await getCells(TimeIndexStateTypeScript, 'type')
    if (!curTimeIndexStateCells || curTimeIndexStateCells.length === 0) {
        return {curTimeIndexStateCell: null, curTimeIndexState: null}
    }
    if (curTimeIndexStateCells.length > 1) {
        console.warn("More one current time index state cell")
    }
    const curTimeIndexStateCell = curTimeIndexStateCells[0]
    const curTimeIndexState = timeIndexStateFromData(curTimeIndexStateCell.output_data)
    return {curTimeIndexStateCell, curTimeIndexState}
}

const getTimeInfoCell = async (timeIndex) => {
    let timeInfoCells = await getCells(TimeInfoTypeScript, 'type')
    if (timeInfoCells.length === 0) {
        return {timeInfoCell: null, timeInfo: null}
    }
    let timeInfoCell
    let timeInfo
    for (let idx in timeInfoCells) {
        const targetTimeInfoCell = timeInfoCells[idx]
        const targetTimeInfo = timeInfoFromData(targetTimeInfoCell.output_data)
        if (targetTimeInfo.getTimeIndex() === timeIndex) {
            timeInfoCell = targetTimeInfoCell
            timeInfo = targetTimeInfo
            break
        }
    }
    return {timeInfoCell, timeInfo}
}

const getCurrentTimeInfo = async () => {
    const {curTimeIndexStateCell, curTimeIndexState} = await getCurrentTimeIndexStateCell()
    if (!curTimeIndexStateCell) {
        return
    }

    const {timeInfo: curTimeInfo} = await getTimeInfoCell(curTimeIndexState.getTimeIndex())
    return curTimeInfo
}

const generateTimeInfoSince = preUpdateTime => {
    const since = preUpdateTime + (TIME_INDEX_CELL_DATA_N + 1) * TIME_INFO_UPDATE_INTERVAL
    return `0x40${int2Hex(since, 14)}`
}

const updateTimeCell = async () => {
    const {curTimeIndexStateCell, curTimeIndexState} = await getCurrentTimeIndexStateCell()
    if (!curTimeIndexStateCell) {
        throw ("Cannot found current time index state cell")
    }
    const nextTimeIndexState = curTimeIndexState.incrIndex()
    const {
        timeInfoCell: preTimeInfoCell,
        timeInfo: preTimeInfo
    } = await getTimeInfoCell(nextTimeIndexState.getTimeIndex())
    const timeIndexStateCapacity = BigInt(parseInt(curTimeIndexStateCell.output.capacity.substr(2), 16))
    const timeInfoCapacity = preTimeInfoCell ? BigInt(parseInt(preTimeInfoCell.output.capacity.substr(2), 16)) : TIME_INFO_CELL_CAPACITY

    const {ownerLockScript, ownerPrivateKey} = await ownerLockInfo()
    const liveCells = await getCells(ownerLockScript, 'lock', {output_data_len_range:['0x0','0x1']})
    const needCapacity = (preTimeInfoCell ? BigInt(0) : TIME_INFO_CELL_CAPACITY) + FEE
    const {inputs, capacity} = collectInputs(liveCells, needCapacity, '0x0')

    inputs.push({
        previousOutput: {
            txHash: curTimeIndexStateCell.out_point.tx_hash,
            index: curTimeIndexStateCell.out_point.index,
        },
        since: '0x0',
    })
    if (preTimeInfoCell) {
        inputs.push({
            previousOutput: {
                txHash: preTimeInfoCell.out_point.tx_hash,
                index: preTimeInfoCell.out_point.index,
            },
            since: generateTimeInfoSince(preTimeInfo.getTimestamp()),
        })
    }
    let outputs = [
        await generateTimeIndexStateOutput(curTimeIndexStateCell.output.type.args, timeIndexStateCapacity),
        await generateTimeInfoOutputs(curTimeIndexStateCell.output.type.args, timeInfoCapacity)
    ]

    if (capacity !== needCapacity) {
        outputs.push({
            capacity: `0x${(capacity - needCapacity).toString(16)}`,
            lock: ownerLockScript,
        })
    }
    const timeNow = new Date()
    const timestamp = Math.floor(timeNow.getTime() / 1000)
    const nextTimeInfo = new TimeInfo(timestamp, nextTimeIndexState.getTimeIndex())
    const cellDeps = [await secp256k1Dep(), TimeIndexStateDep, TimeInfoDep]
    const rawTx = {
        version: '0x0',
        cellDeps,
        headerDeps: [],
        inputs,
        outputs,
        outputsData: [nextTimeIndexState.toString(), nextTimeInfo.toString(), '0x'],
    }
    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : {lock: '', inputType: '', outputType: ''}))
    const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
    const txHash = await ckb.rpc.sendTransaction(signedTx)
    console.info(`Updating time cell tx has been sent with tx hash:${txHash} timeIndex:${nextTimeInfo.getTimeIndex()} timestamp: ${timestamp} (${timeNow})`)
    return txHash
}

module.exports = {
    getCurrentTimeIndexStateCell,
    getTimeInfoCell,
    getCurrentTimeInfo,
    updateTimeCell,
}
