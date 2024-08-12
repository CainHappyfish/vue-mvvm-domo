/**
 * 数据劫持：递归遍历所有对象
 * @param {Object} data 劫持对象
 *
 * */

export function dataProxy(data: { [index: string | number | symbol]: unknown }) {
  Object.keys(data).forEach(key => {
    let val: unknown = data[key]
    if (!val || typeof val !== 'object') {
      return
    }
    Object.defineProperty(data, key, {
      get() {
        return val
      },
      set(v: never) {
        if (v === val) return
        val = v
        dataProxy(v)
      }
    })
  })
}
