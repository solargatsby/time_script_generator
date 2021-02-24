const remove0x = (hex) => {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

const ArrayBufferToHex = (arrayBuffer) => {
  return Array.prototype.map.call(new Uint8Array(arrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('')
}

const uin32ToHex = (u32, bigEnd = true) => {
  let buf = new ArrayBuffer(4)
  let view = new DataView(buf)
  view.setUint32(0, u32, !bigEnd)
  return ArrayBufferToHex(buf)
}

const uint8ToHex = (u8) => {
  let buf = new ArrayBuffer(1)
  let view = new DataView(buf)
  view.setUint8(0, u8)
  return ArrayBufferToHex(buf)
}

module.exports = {
  uint8ToHex,
  uin32ToHex,
  remove0x,
}
