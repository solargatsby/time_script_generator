const CKB = require('@nervosnetwork/ckb-sdk-core').default
const {scriptToHash, rawTransactionToHash} = require('@nervosnetwork/ckb-sdk-utils')
const {secp256k1Dep, getCells, collectInputs, ownerLockInfo, getNextTimeStamp} = require('./helper')
const {
  CKB_NODE_RPC,
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimeIndexStateDep,
  TimeIndexStateTypeScript,
  TimeInfoDep,
  TimeInfoTypeScript
} = require('../utils/config')
const {
  timeIndexStateFromData,
  generateTimeIndexStateOutput
} = require('./time_index_state_script')
const {
  TIME_INFO_CELL_CAPACITY,
  TimeInfo,
  timeInfoFromData,
  generateTimeInfoOutputs
} = require('./time_info_script')
const {uin32ToHex} = require('../utils/hex')
const {logger} = require('../utils/log')

const ckb = new CKB(CKB_NODE_RPC)
const FEE = BigInt(10000)

const getCurrentTimeIndexStateCell = async () => {
  let curTimeIndexStateCells = await getCells(TimeIndexStateTypeScript, 'type')
  if (!curTimeIndexStateCells || curTimeIndexStateCells.length === 0) {
    return {curTimeIndexStateCell: null, curTimeIndexState: null}
  }
  if (curTimeIndexStateCells.length > 1) {
    console.warn('More one current time index state cell')
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

const generateTimeInfoSince = timestamp => {
  return `0x40000000${uin32ToHex(timestamp)}`
}

const updateTimeCell = async () => {
  const {curTimeIndexStateCell, curTimeIndexState} = await getCurrentTimeIndexStateCell()
  if (!curTimeIndexStateCell) {
    throw ('Cannot found current time index state cell')
  }
  const nextTimeIndexState = curTimeIndexState.incrIndex()
  const {timeInfoCell: preTimeInfoCell} = await getTimeInfoCell(nextTimeIndexState.getTimeIndex())
  const timeIndexStateCapacity = BigInt(parseInt(curTimeIndexStateCell.output.capacity.substr(2), 16))
  const timeInfoCapacity = preTimeInfoCell ? BigInt(parseInt(preTimeInfoCell.output.capacity.substr(2), 16)) : TIME_INFO_CELL_CAPACITY

  const {ownerLockScript, ownerPrivateKey} = await ownerLockInfo()
  const liveCells = await getCells(ownerLockScript, 'lock', {output_data_len_range:['0x0','0x1']})
  const needCapacity = (preTimeInfoCell ? BigInt(0) : TIME_INFO_CELL_CAPACITY) + FEE
  const {inputs, capacity} = collectInputs(liveCells, needCapacity, '0x0')
  const nextTimestamp = await getNextTimeStamp()

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
      since: generateTimeInfoSince(nextTimestamp),
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

  const nextTimeInfo = new TimeInfo(nextTimestamp, nextTimeIndexState.getTimeIndex())
  const cellDeps = [await secp256k1Dep(), AlwaysSuccessDep, TimeIndexStateDep, TimeInfoDep]
  const rawTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData: [nextTimeIndexState.toString(), nextTimeInfo.toString(), '0x'],
  }
  rawTx.witnesses = rawTx.inputs.map((_, i) => (i > 0 ? '0x' : {lock: '', inputType: '', outputType: ''}))
  const keys = new Map()
  keys.set(scriptToHash(ownerLockScript), ownerPrivateKey)
  keys.set(scriptToHash(AlwaysSuccessLockScript), null)
  const signedWitnesses = ckb.signWitnesses(keys)({
    transactionHash: rawTransactionToHash(rawTx),
    witnesses: rawTx.witnesses,
    inputCells: rawTx.inputs.map((input, index) => {
      return {
        outPoint: input.previousOutput,
        lock: index === 0 ? ownerLockScript : AlwaysSuccessLockScript,
      }
    }),
    skipMissingKeys: true,
  })
  const signedTx = { ...rawTx, witnesses: signedWitnesses }

  logger.debug(JSON.stringify(signedTx, undefined, 2))
  const txHash = await ckb.rpc.sendTransaction(signedTx)
  logger.info(`Updating time cell txHash:${txHash} timeIndex:${nextTimeInfo.getTimeIndex()} timestamp:${nextTimestamp}`)
  return {txHash, TimeIndexState: nextTimeIndexState, TimeInfo: nextTimeInfo}
}

module.exports = {
  getCurrentTimeIndexStateCell,
  getTimeInfoCell,
  getCurrentTimeInfo,
  updateTimeCell,
}
