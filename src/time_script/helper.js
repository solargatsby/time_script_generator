const fetch = require('node-fetch')
const CKB = require('@nervosnetwork/ckb-sdk-core').default
const { scriptToHash } = require('@nervosnetwork/ckb-sdk-utils')
const { CKB_NODE_RPC, CKB_NODE_INDEXER, OWNER_PRIVATE_KEY } = require('../utils/config')

const ckb = new CKB(CKB_NODE_RPC)

const secp256k1LockScript = async args => {
  const secp256k1Dep = (await ckb.loadDeps()).secp256k1Dep
  return {
    codeHash: secp256k1Dep.codeHash,
    hashType: secp256k1Dep.hashType,
    args,
  }
}

const generateLockArgs = privateKey => {
  const pubKey = ckb.utils.privateKeyToPublicKey(privateKey)
  return '0x' + ckb.utils.blake160(pubKey, 'hex')
}

const secp256k1LockHash = async args => {
  const lock = await secp256k1LockScript(args)
  return scriptToHash(lock)
}

const secp256k1Dep = async () => {
  const secp256k1Dep = (await ckb.loadDeps()).secp256k1Dep
  return { outPoint: secp256k1Dep.outPoint, depType: 'depGroup' }
}

const ownerLockInfo = async () => {
  const ownerLockArgs = generateLockArgs(OWNER_PRIVATE_KEY)
  return {
    ownerPrivateKey: OWNER_PRIVATE_KEY,
    ownerLockArgs: ownerLockArgs,
    ownerLockHash: await secp256k1LockHash(ownerLockArgs),
    ownerLockScript: await secp256k1LockScript(ownerLockArgs),
  }
}

//getCells from indexer, param script: lock or type, param type: 'lock' or 'type'
const getCells = async (script, type) => {
  let payload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'get_cells',
    params: [
      {
        script: {
          code_hash: script.codeHash,
          hash_type: script.hashType,
          args: script.args,
        },
        script_type: type,
      },
      'asc',
      '0x64',
    ],
  }
  const body = JSON.stringify(payload, null, '  ')
  try {
    let res = await fetch(CKB_NODE_INDEXER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
    res = await res.json()
    return res.result.objects
  } catch (error) {
    console.error('error', error)
  }
}

const collectInputs = (liveCells, needCapacity, since) => {
  let inputs = []
  let sum = BigInt(0)
  for (let cell of liveCells) {
    inputs.push({
      previousOutput: {
        txHash: cell.out_point.tx_hash,
        index: cell.out_point.index,
      },
      since,
    })
    sum = sum + BigInt(cell.output.capacity)
    if (sum >= needCapacity) {
      break
    }
  }
  if (sum < needCapacity) {
    throw Error('Capacity not enough')
  }
  return { inputs, capacity: sum }
}

module.exports = {
  secp256k1LockScript,
  secp256k1Dep,
  getCells,
  collectInputs,
  ownerLockInfo,
}
