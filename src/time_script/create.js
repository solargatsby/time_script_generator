const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {CKB_NODE_RPC, AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep} = require('../utils/config')
const {secp256k1Dep, getCells, collectInputs, ownerLockInfo} = require('./helper')
const {
  TIME_INDEX_STATE_CELL_CAPACITY,
  TimeIndexState,
  generateTimeIndexStateOutput
} = require('./time_index_state_script')
const {TIME_INFO_CELL_CAPACITY, TimeInfo, generateTimeInfoOutputs} = require('./time_info_script')
const {logger} = require('../utils/log')
const {uin32ToHex} = require('../utils/hex')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(10000)

const createTimeCell = async () => {
  const {ownerLockScript, ownerPrivateKey} = await ownerLockInfo()
  const liveCells = await getCells(ownerLockScript, 'lock', {output_data_len_range:['0x0','0x1']})
  const needCapacity = TIME_INDEX_STATE_CELL_CAPACITY + TIME_INFO_CELL_CAPACITY + FEE
  const {inputs, capacity} = collectInputs(liveCells, needCapacity, '0x0')

  const timeScriptArgs = inputs[0].previousOutput.txHash + uin32ToHex(inputs[0].previousOutput.index,false)
  const timeIndexStateOutput = await generateTimeIndexStateOutput(timeScriptArgs)
  const timeInfoOutput = await generateTimeInfoOutputs(timeScriptArgs)
  let outputs = [timeIndexStateOutput, timeInfoOutput]

  if (capacity !== needCapacity) {
    outputs.push({
      capacity: `0x${(capacity - needCapacity).toString(16)}`,
      lock: ownerLockScript,
    })
  }

  const timeIndex = 0
  const timestamp = Math.floor(new Date().getTime() / 1000)

  const cellDeps = [await secp256k1Dep(), AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep]
  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [new TimeIndexState(timeIndex).toString(), new TimeInfo(timestamp, timeIndex).toString(), '0x'],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : {lock: '', inputType: '', outputType: ''}))
  const signedTx = ckb.signTransaction(ownerPrivateKey)(rawTx)
  const txHash = await ckb.rpc.sendTransaction(signedTx)
  logger.info(`Creating time cell txHash:${txHash} timeIndex:${timeIndex} timestamp:${timestamp}`)
  logger.info(`Time cell args:${timeScriptArgs}`)
  return {txHash, timeScriptArgs}
}

module.exports = {
  createTimeCell
}
