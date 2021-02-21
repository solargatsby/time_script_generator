const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { CKB_NODE_RPC } = require('../utils/config')
const {
    secp256k1Dep,
    getCells,
    collectInputs,
    ownerLockInfo
} = require('./helper')
const {
    TimeIndexStateDep, TimeIndexStateTypeScript,
    TimeInfoDep, TimeInfoTypeScript
} = require('../utils/const')
const {
    TIME_INDEX_CELL_DATA_N,
    timeIndexStateFromData,
    generateTimeIndexStateOutput
}  = require('./time_index_state_script')
const {
    TIME_INFO_CELL_CAPACITY,
    TIME_INFO_UPDATE_INTERVAL,
    TimeInfo,
    timeInfoFromData,
    generateTimeInfoOutputs
} = require('./time_info_script')
const { int2Hex } = require('../utils/hex')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(1000)

const getPreTimeIndexStateCell = async () => {
    let preTimeIndexStateCells = await getCells(TimeIndexStateTypeScript, 'type')
    if (!preTimeIndexStateCells || preTimeIndexStateCells.length === 0){
        throw ("Cannot found previous time index state cell")
    }
    if  (preTimeIndexStateCells.length > 1 ){
        console.warn("More one previous time index state cell")
    }
    const preTimeIndexStateCell = preTimeIndexStateCells[0]
    const preTimeIndexState = timeIndexStateFromData(preTimeIndexStateCell.output_data)
    return {preTimeIndexStateCell, preTimeIndexState}
}

const getPreTimeInfoCell = async (timeIndex) => {
    let preTimeInfoCells = await getCells(TimeInfoTypeScript,'type')
    if (preTimeInfoCells.length === 0){
        return { preTimeInfoCell: null, preTimeInfo: null}
    }
    let preTimeInfoCell
    let preTimeInfo
    for (let idx in preTimeInfoCells){
        const timeInfoCell = preTimeInfoCells[idx]
        const timeInfo = timeInfoFromData(timeInfoCell.output_data)
        if (timeInfo.getTimeIndex() === timeIndex){
            preTimeInfoCell = timeInfoCell
            preTimeInfo = timeInfo
            break
        }
    }
    return {preTimeInfoCell, preTimeInfo}
}

const generateTimeInfoSince = preUpdateTime => {
    const since =   1 << 62 + preUpdateTime + (TIME_INDEX_CELL_DATA_N + 1)* TIME_INFO_UPDATE_INTERVAL
    return int2Hex(since, 8)
}

const updateTimeCell = async () => {
    const {preTimeIndexStateCell, preTimeIndexState} = await getPreTimeIndexStateCell()
    const timeIndexState = preTimeIndexState.incrIndex()
    const {preTimeInfoCell, preTimeInfo} = await getPreTimeInfoCell(timeIndexState.getTimeIndex())

    const timeIndexStateCapacity = BigInt(parseInt(preTimeIndexStateCell.output.capacity.substr( 2),16))
    const timeInfoCapacity = preTimeInfoCell ? BigInt(parseInt(preTimeInfoCell.output.capacity.substr( 2),16)):TIME_INFO_CELL_CAPACITY

    const { ownerLockScript, ownerPrivateKey } = await ownerLockInfo()
    const liveCells = await getCells(ownerLockScript, 'lock')
    const needCapacity = preTimeInfoCell ? BigInt(0) : TIME_INFO_CELL_CAPACITY + FEE
    const { inputs, capacity } = collectInputs(liveCells, needCapacity, '0x0')

    inputs.push({
        previousOutput: {
            txHash: preTimeIndexStateCell.out_point.tx_hash,
            index: preTimeIndexStateCell.out_point.index,
        },
        since: '0x0',
    })
    if (preTimeInfoCell){
        inputs.push({
            previousOutput: {
                txHash: preTimeInfoCell.out_point.tx_hash,
                index: preTimeInfoCell.out_point.index,
            },
            since: generateTimeInfoSince(preTimeInfo.getTimestamp()),
        })
    }
    let outputs = [await generateTimeIndexStateOutput(preTimeIndexStateCell.output.type.args, timeIndexStateCapacity),
        await generateTimeInfoOutputs(preTimeIndexStateCell.output.type.args, timeInfoCapacity)]

    if (capacity !== needCapacity ){
        outputs.push({
            capacity: `0x${(capacity - needCapacity).toString(16)}`,
            lock: ownerLockScript,
        })
    }
    const timestamp = Math.floor(new Date().getTime()/1000)
    const timeInfo = new TimeInfo(timestamp, timeIndexState.getTimeIndex())
    const cellDeps = [await secp256k1Dep(), TimeIndexStateDep, TimeInfoDep]
    const rawTx = {
        version: '0x0',
        cellDeps,
        headerDeps: [],
        inputs,
        outputs,
        outputsData: [timeIndexState.toString(), timeInfo.toString(), '0x'],
    }
    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))

    const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
    const txHash = await ckb.rpc.sendTransaction(signedTx)
    console.info(`Updating time cell tx has been sent with tx hash:${txHash} timeIndex:${timeInfo.getTimeIndex()} timestamp: ${timestamp}`)
    return txHash
}

module.exports = {
    updateTimeCell
}
