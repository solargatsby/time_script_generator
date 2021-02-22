require('dotenv').config()
const fs = require("fs")

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const CKB_NODE_RPC = process.env.CKB_NODE_RPC || 'http://localhost:8114'
const CKB_NODE_INDEXER = process.env.CKB_NODE_INDEXER || 'http://localhost:8116'
const HTTP_SERVER_PORT = process.env.HTTP_SERVER_PORT || 8080
const TIME_SCRIPT_ARGS = process.env.TIME_SCRIPT_ARGS

let TimeIndexStateTypeScript = {
    codeHash: '0xddce240e471f6b1e44dbf483b6e091c059d74586808d61b2697c492ca0a35315',
    hashType: 'type',
    args: TIME_SCRIPT_ARGS,
}

const TimeIndexStateDep = {
    outPoint: {txHash: '0x7589ad749e643eb7f6b8302ab398ab18161a04ce32fc904b42e4b2698180af21', index: '0x0'},
    depType: 'depGroup',
}

let TimeInfoTypeScript = {
    codeHash: '0xa6d27e6fdf350b4715d3c0a2ed8cb7fa6ff956424263f708b088b4496cb4330c',
    hashType: 'type',
    args: TIME_SCRIPT_ARGS,
}

const TimeInfoDep = {
    outPoint: {txHash: '0x3dcf7be43610ba4329441a031989e8822aa5c51809da8a160827dd773b053ad8', index: '0x0'},
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
                return console.error(err);
            }
        });
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
