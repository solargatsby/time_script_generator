const remove0x = (hex) => {
  if (hex.startsWith('0x')) {
    return hex.substring(2)
  }
  return hex
}

const int2Hex = (num, width) => {
  const hex = "0123456789abcdef";
  let s = "";
  while (num) {
    s = hex.charAt(num % 16) + s;
    num = Math.floor(num / 16);
  }
  if (typeof width === "undefined" || width <= s.length) {
    return s;
  }
  let delta = width - s.length;
  let padding = "";
  while (delta-- > 0) {
    padding += "0";
  }
  return padding + s;
}

module.exports = {
  int2Hex,
  remove0x,
}
