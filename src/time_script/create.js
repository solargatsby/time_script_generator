const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { CKB_NODE_RPC, TimeIndexStateDep, TimeInfoDep } = require('../utils/config')
const { secp256k1Dep, getCells, collectInputs, ownerLockInfo } = require('./helper')
const { TIME_INDEX_STATE_CELL_CAPACITY, TimeIndexState, generateTimeIndexStateOutput }  = require('./time_index_state_script')
const { TIME_INFO_CELL_CAPACITY, TimeInfo, generateTimeInfoOutputs } = require('./time_info_script')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(1000)

const createTimeCell = async () => {
    const { ownerLockScript, ownerPrivateKey } = await ownerLockInfo()
    const liveCells = await getCells(ownerLockScript, 'lock')
    const needCapacity = TIME_INDEX_STATE_CELL_CAPACITY + TIME_INFO_CELL_CAPACITY + FEE
    const { inputs, capacity } = collectInputs(liveCells, needCapacity, '0x0')

    const timeScriptArgs = inputs[0].previousOutput.txHash + '00000000'
    const timeIndexStateOutput = await generateTimeIndexStateOutput(timeScriptArgs)
    const timeInfoOutput = await generateTimeInfoOutputs(timeScriptArgs)
    let outputs = [timeIndexStateOutput, timeInfoOutput]

    if (capacity !== needCapacity ){
        outputs.push({
            capacity: `0x${(capacity - needCapacity).toString(16)}`,
            lock: ownerLockScript,
        })
    }

    const timeIndex = 0
    const timeNow = new Date()
    const timestamp = Math.floor(timeNow.getTime()/1000)

    // const outputs = await generateTimeIndexStateOutputs( capacity, TIME_INDEX_STATE_CELL_CAPACITY, timeScriptArgs)
    const cellDeps = [await secp256k1Dep(), TimeIndexStateDep, TimeInfoDep]
    const rawTx = {
        version: '0x0',
        cellDeps,
        headerDeps: [],
        inputs,
        outputs,
        outputsData: [new TimeIndexState(timeIndex).toString(), new TimeInfo(timestamp, timeIndex).toString(), '0x'],
    }
    rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))
    const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
    const txHash = await ckb.rpc.sendTransaction(signedTx)
    console.info(`Creating time cell tx has been sent with tx hash:${txHash} timeIndex:${timeIndex} timestamp: ${timestamp} (${timeNow})`)
    console.info(`Time cell args:${timeScriptArgs}`)
    return {txHash, timeScriptArgs}
}

module.exports = {
    createTimeCell
}