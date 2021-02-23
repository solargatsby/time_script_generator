require('dotenv').config()
const fs = require('fs')

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const HTTP_SERVER_PORT = process.env.HTTP_SERVER_PORT || 8080
const TIME_SCRIPT_ARGS = process.env.TIME_SCRIPT_ARGS

let TimeIndexStateTypeScript = {
  codeHash: '0x95e78b47aeea59f1c7fcd90daec5861333abf51b73fe8560a8979d9e80f4733e',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeIndexStateDep = {
  outPoint: {txHash: '0x33c2fa58f193fd7fb12af2f1cc280c0e19f69252b5e0053bc81ea422f3905910', index: '0x0'},
  depType: 'depGroup',
}

let TimeInfoTypeScript = {
  codeHash: '0xdbcc30faf6055246a9a6a709d951378ca50c41c88a7405c1ef3b18a52de765d8',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeInfoDep = {
  outPoint: {txHash: '0x36edff0284824b1a00e636180ec62a9e451f9686904816d2efba2ff8b137187d', index: '0x0'},
  depType: 'depGroup',
}

const saveConfig = timeScriptArgs => {
  let data = Buffer.alloc(1024)
  let offset = 0
  offset += data.write(`OWNER_PRIVATE_KEY=${OWNER_PRIVATE_KEY}\n`, offset)
  offset = offset + data.write(`CKB_NODE_RPC=${CKB_NODE_RPC}\n`, offset)
  offset = offset + data.write(`CKB_NODE_INDEXER=${CKB_NODE_INDEXER}\n`, offset)
  offset = offset + data.write(`HTTP_SERVER_PORT=${HTTP_SERVER_PORT}\n`, offset)
  offset = offset + data.write(`TIME_SCRIPT_ARGS=${timeScriptArgs}\n`, offset)

  fs.writeFile('.env',
    data.toString('utf8', 0, offset),
    function (err) {
      if (err) {
        return console.error(err)
      }
    })
}

module.exports = {
  OWNER_PRIVATE_KEY,
  CKB_NODE_RPC,
  CKB_NODE_INDEXER,
  HTTP_SERVER_PORT,
  TIME_SCRIPT_ARGS,
  TimeIndexStateTypeScript,
  TimeIndexStateDep,
  TimeInfoTypeScript,
  TimeInfoDep,
  saveConfig,
}
