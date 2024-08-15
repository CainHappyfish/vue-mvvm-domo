import { trigger, track } from '../core'

export function reactive(data: {[key: string | symbol]: any}) {
  const ITERATE_KEY = Symbol()
  return new Proxy(data, {
    // 读取操作
    get(target, key: string | symbol, receiver: any) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },

    // 设置操作
    set(target, key: string | symbol, newVal) {
      target[key] = newVal
      trigger(target, key, "SET")
      return true
    },

    // in操作符
    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },

    // for ... in 循环操作
    ownKeys(target: any) {
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },

    // 删除操作
    deleteProperty(target: any, key: string | symbol) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)

      const res = Reflect.deleteProperty(target, key)

      if (res && hadKey) {
        trigger(target, key, "DELETE")
      }

      return res
    }


  })
}