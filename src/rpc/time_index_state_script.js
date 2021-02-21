const { ownerLockInfo } = require('./helper')
const { TimeIndexStateTypeScript } = require('../utils/const')
const { remove0x } = require('../utils/hex')
const TIME_INDEX_STATE_CELL_CAPACITY = BigInt(400) * BigInt(100000000)
const TIME_INDEX_CELL_DATA_N = 12

class TimeIndexState {
    constructor(index, n = TIME_INDEX_CELL_DATA_N) {
        this.index = index,
            this.n = n
    }

    getTimeIndex(){
        return this.index
    }

    getTimeCellN(){
        return this.n
    }

    toString(){
        return `0x${Buffer.from([this.index, this.n]).toString('hex')}`
    }

    incrIndex(){
        this.index++
        if (this.index === this.n){
            this.index = 0
        }
        return this
    }
}

//parse time index state cell data, and return TimeIndexState object
//param: data, for example: '0x000c'
const timeIndexStateFromData = data => {
    data = remove0x(data)
    return new TimeIndexState(parseInt(data.substring(0, 2),16), parseInt(data.substring(2, 4),16))
}

const timeIndexStateTypeScript = args => {
    return {
        codeHash: TimeIndexStateTypeScript.codeHash,
        hashType: TimeIndexStateTypeScript.hashType,
        args,
    }
}

const generateTimeIndexStateOutput = async (args, timeIndexStateCapacity = TIME_INDEX_STATE_CELL_CAPACITY) => {
    const { ownerLockScript } = await ownerLockInfo()
    return {
        capacity: `0x${timeIndexStateCapacity.toString(16)}`,
        lock: ownerLockScript,
        type: timeIndexStateTypeScript(args),
    }
}

//
// const generateTimeIndexStateOutputs = async (inputCapacity, timeIndexStateCapacity, args) => {
//     const { ownerLockScript } = await ownerLockInfo()
//     let outputs = [
//         {
//             capacity: `0x${timeIndexStateCapacity.toString(16)}`,
//             lock: ownerLockScript,
//             type: timeIndexStateTypeScript(args),
//         },
//     ]
//     const changeCapacity = inputCapacity - FEE - timeIndexStateCapacity
//     if (changeCapacity > 0 ){
//         outputs.push({
//             capacity: `0x${changeCapacity.toString(16)}`,
//             lock: ownerLockScript,
//         })
//     }
//     return outputs
// }

// const createTimeIndexStateCell = async () => {
//     const { ownerLockScript, ownerPrivateKey } = await ownerLockInfo()
//     const liveCells = await getCells(ownerLockScript, 'lock')
//     const { inputs, capacity } = collectInputs(liveCells, TIME_INDEX_STATE_CELL_CAPACITY + FEE, '0x0')
//     const timeIndexStateArgs = inputs[0].previousOutput.txHash + '00000000'
//     const outputs = await generateTimeIndexStateOutputs( capacity, TIME_INDEX_STATE_CELL_CAPACITY, timeIndexStateArgs)
//     const cellDeps = [await secp256k1Dep(), TimeIndexStateDep]
//     const rawTx = {
//         version: '0x0',
//         cellDeps,
//         headerDeps: [],
//         inputs,
//         outputs,
//         outputsData: [new TimeIndexState(0).toString(), '0x'],
//     }
//     rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))
//     const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
//     const txHash = await ckb.rpc.sendTransaction(signedTx)
//     console.info(`Creating time index state cell tx has been sent with tx hash ${txHash}`)
//     return txHash
// }
//
// const updateTimeIndexStateCell = async () => {
//     const preTimeIndexStateCell = await getCells(TimeIndexStateTypeScript, 'type')
//     if (preTimeIndexStateCell.length > 1 ){
//         console.warn("More one previous time index state cell")
//     }
//     const timeIndexState = timeIndexStateFromData(preTimeIndexStateCell[0].output_data)
//     const timeIndexStateCapacity = BigInt(parseInt(preTimeIndexStateCell[0].output.capacity.substr( 2),16))
//     const { ownerLockScript, ownerPrivateKey } = await ownerLockInfo()
//     const liveCells = await getCells(ownerLockScript, 'lock')
//     const { inputs, capacity } = collectInputs(liveCells,  FEE, '0x0')
//
//     const preTimeIndexStateInput ={
//         previousOutput: {
//             txHash: preTimeIndexStateCell[0].out_point.tx_hash,
//             index: preTimeIndexStateCell[0].out_point.index,
//         },
//         since: '0x0',
//     }
//     inputs.push(preTimeIndexStateInput)
//
//     const outputs = await generateTimeIndexStateOutputs( capacity + timeIndexStateCapacity,
//         timeIndexStateCapacity, preTimeIndexStateCell[0].output.type.args)
//     const cellDeps = [await secp256k1Dep(), TimeIndexStateDep]
//     const rawTx = {
//         version: '0x0',
//         cellDeps,
//         headerDeps: [],
//         inputs,
//         outputs,
//         outputsData: [timeIndexState.incrIndex().toString(), '0x'],
//     }
//     rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : { lock: '', inputType: '', outputType: '' }))
//     const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
//     const txHash = await ckb.rpc.sendTransaction(signedTx)
//     console.info(`Updating time index state cell tx has been sent with tx hash ${txHash}`)
//     return txHash
// }

module.exports = {
    TIME_INDEX_STATE_CELL_CAPACITY,
    TIME_INDEX_CELL_DATA_N,
    TimeIndexState,
    timeIndexStateFromData,
    generateTimeIndexStateOutput,
}
