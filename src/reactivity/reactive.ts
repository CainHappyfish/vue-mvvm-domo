import { trigger, track } from '../core'

const reactiveMap = new Map()
export function reactive(data: {[key: string | symbol]: any}) {
  const existedProxy = reactiveMap.get(data)
  if (existedProxy) {
    return existedProxy
  }
  const proxy = createReactive(data)
  reactiveMap.set(data, proxy)
  return proxy
}

// 查找方法
const Methods =  ["includes", "indexOf", "lastIndexOf"]
// 追踪方法
const trackMethods = ["push", "pop", "shift", "unshift", "splice"]
// 追踪标记
let shouldTrack = true
// 重写方法数组
const arrayInstrumentation: {[index: string]: any} = {}

trackMethods.forEach((method: any) => {
  const originMethod = Array.prototype[method]

  arrayInstrumentation[method] = function(...args: any): any {
    shouldTrack = false
    let res = originMethod.apply(this, args)
    shouldTrack = true
    return res
  }
})

Methods.forEach((method: any) => {
  const originMethod = Array.prototype[method]

  arrayInstrumentation[method] = function(...args: any): any {
    let res = originMethod.apply(this, args)

    if (res === false) {
      res = originMethod.apply(this.raw, args)
    }

    return res
  }

})

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

      // 拦截代理操作
      if (Array.isArray(target) && arrayInstrumentation.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentation, key, receiver)
      }

      // 如果 key 的类型是 symbol，则不进行追踪
      if (!isReadonly && typeof key !== "symbol") {
        track(target, key, "GET", shouldTrack)
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

      // 如果代理目标是数组，判断索引大小是否大于数组大小，如果大于为添加操作，小于为设置操作
      const type = Array.isArray(target) ?
        Number(key) < target.length ? "SET": "ADD" :
        Object.prototype.hasOwnProperty.call(target, key) ? "SET" : "ADD"

      const res = Reflect.set(target, key, newVal, receiver)

      if (isShallow) {
          return res
      }

      if (receiver.raw === target) {
        if (oldVal !== newVal && (oldVal === newVal || oldVal === newVal)) {
          // 传递新的length值
          trigger(target, key, type, newVal)

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
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
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