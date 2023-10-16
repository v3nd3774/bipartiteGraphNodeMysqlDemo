export function updateConfig(k, v, parent) {
  var obj = {
    [`${k}`]: v
  }
  return Object.assign(
    {},
    parent,
    obj
  )
}
