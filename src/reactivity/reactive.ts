import { trigger, track } from '../core'

export function reactive(data: {[key: string | symbol]: any}) {
  return createReactive(data)
}

export function shallowReactive(data: {[key: string | symbol]: any}) {
  return createReactive(data, true)
}

export function readonly(data: {[key: string | symbol]: any}) {
  return createReactive(data, false, true)
}

export function shallowReadonly(data: {[key: string | symbol]: any}) {
  return createReactive(data, true, true)
}

function createReactive(data: {[key: string | symbol]: any}, isShallow = false, isReadonly = false): any {
  const ITERATE_KEY = Symbol()
  return new Proxy(data, {
    // 读取操作
    get(target, key: string | symbol, receiver: any) {
      if (key === "raw") {
        return target
      }
      if (!isReadonly) {
        track(target, key)
      }

      const res = Reflect.get(target, key, receiver)
      if (typeof res !== null && typeof res === "object") {
        return isReadonly? readonly(res) : reactive(res)
      }
      return res
    },

    // 设置操作
    set(target, key, newVal, receiver) {
      if (isReadonly) {
        console.warn(`property: ${key.toString()} is readonly`)
        return true
      }

      const oldVal = target[key]

      const type = Object.prototype.hasOwnProperty.call(target, key) ? "SET" : "ADD"

      const res = Reflect.set(target, key, newVal, receiver)

      if (isShallow) {
          return res
      }

      if (receiver.raw === target) {
        if (oldVal !== newVal && (oldVal === newVal || oldVal === newVal)) {
            trigger(target, key, type)
        }

      }

      return res
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
      if (isReadonly) {
        console.warn(`property: ${key.toString()} is readonly`)
        return true
      }

      const hadKey = Object.prototype.hasOwnProperty.call(target, key)

      const res = Reflect.deleteProperty(target, key)

      if (res && hadKey) {
        trigger(target, key, "DELETE")
      }

      return res
    }


  })
}