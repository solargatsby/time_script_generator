require('dotenv').config()
const fs = require('fs')

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const HTTP_SERVER_PORT = process.env.HTTP_SERVER_PORT || 8080
const TIME_SCRIPT_ARGS = process.env.TIME_SCRIPT_ARGS

let TimeIndexStateTypeScript = {
  codeHash: '0xa7d6f10511f39842f9f2ff8444b6abeeef99960f2120faf8999f3145719e5794',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeIndexStateDep = {
  outPoint: {txHash: '0x78b9d0d9e9059d5cce0421e7224b48f62cb50f765ef1baa4056bc998698619f6', index: '0x0'},
  depType: 'depGroup',
}

let TimeInfoTypeScript = {
  codeHash: '0x7e96be462e2391b428b183f762e64d6299377cd79e71d4d51bb5af2bfe8f400d',
  hashType: 'type',
  args: TIME_SCRIPT_ARGS,
}

const TimeInfoDep = {
  outPoint: {txHash: '0x64b5e2c5ffa496866bd808537726b6070a5780365763862f62e19255d0308e1d', index: '0x0'},
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
