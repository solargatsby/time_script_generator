require('dotenv').config()
const fs = require('fs')

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const HTTP_SERVER_PORT = process.env.HTTP_SERVER_PORT || 8080
const TIME_SCRIPT_ARGS = process.env.TIME_SCRIPT_ARGS

const AlwaysSuccessLockScript =  {
  codeHash: '0x1157470ca9de091c21c262bf0754b777f3529e10d2728db8f6b4e04cfc2fbb5f',
  hashType: 'data',
  args: '0x'
}

let AlwaysSuccessDep = {
  outPoint: {txHash: '0x46a7625a76cf7401eff1dfe4f46138be69316518c9771c9f780a428843c6b5b1', index: '0x0'},
  depType: 'code',
}

let TimeIndexStateTypeScript = {
  codeHash: '0xc21aaaedab93e2154b41048b5ab1b7df6995c9429086a90f26f0a8d5bc000411',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeIndexStateDep = {
  outPoint: {txHash: '0xf6eee73d126bc5b91d2646b1ff16d13c844f14d74c115429cc4e25ce5c369dac', index: '0x0'},
  depType: 'depGroup',
}

let TimeInfoTypeScript = {
  codeHash: '0x8ac29792710baf1bd7c598cac3ecb1d2de925fa97c8de99c7ce534529576ead4',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeInfoDep = {
  outPoint: {txHash: '0xb1a1b8b7e467a5acb575f2b50077234036dc4ca2694bab51c42ec6393101318e', index: '0x0'},
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
  AlwaysSuccessLockScript,
  AlwaysSuccessDep,
  TimeIndexStateTypeScript,
  TimeIndexStateDep,
  TimeInfoTypeScript,
  TimeInfoDep,
  saveConfig,
}
