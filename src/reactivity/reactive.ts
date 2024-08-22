import { trigger, track } from '../core'
import { iterationMethod, keysIterationMethod, valuesIterationMethod } from './utils/instrumentation'

const reactiveMap = new Map()

// 查找方法
const searchMethods =  ["includes", "indexOf", "lastIndexOf"]
// 栈方法
const stackMethods = ["push", "pop", "shift", "unshift", "splice"]
// 追踪标记
let shouldTrack = true
// 重写方法数组
const arrayInstrumentation: {[index: string]: any} = {}
// Set, Map方法
const setMethods = ["add", "delete", "set", "get"]
// 操作独立标记
const ITERATE_KEY = Symbol()

// 追踪方法处理
stackMethods.forEach((method: any) => {
  const originMethod = Array.prototype[method]

  arrayInstrumentation[method] = function(...args: any): any {
    shouldTrack = false
    let res = originMethod.apply(this, args)
    shouldTrack = true
    return res
  }
})

// 查找方法处理
searchMethods.forEach((method: any) => {
  const originMethod = Array.prototype[method]

  arrayInstrumentation[method] = function(...args: any): any {
    let res = originMethod.apply(this, args)

    if (res === false) {
      res = originMethod.apply(this.raw, args)
    }

    return res
  }

})

// Set Map交互操作处理
const mutableInstrumentation: {[index: string | symbol]: any} = {

  add(key: string | symbol): any {
    // this指向代理对象，获取原始对象
    const target = this.raw
    // 判断值是否存在
    const hadKey = target.has(key)
    const res = target.add(key)

    if (!hadKey) {
      trigger(target, key, "ADD")
    }
    return res
  },

  delete(key: string | symbol): any {
    const target = this.raw
    // 判断值是否存在
    const hadKey = target.has(key)
    const res = target.delete(key)

    if (hadKey) {
      trigger(target, key, "DELETE")
    }
    return res
  },

  get(key: any) {
    const target = this.raw
    const hadKey = target.has(key)
    track(target, key)

    if (hadKey) {
      const result = target.get(key)
      return typeof result === "object" ? reactive(result) : result
    }
  },

  set(key: any, value: any) {
    const target = this.raw
    const hadKey = target.has(key)

    const oldVal = target.get(key)

    // 获取原始数据
    const rawVal = value.raw || value
    target.set(key, rawVal)

    if (!hadKey) {
      trigger(target, key, "ADD")
    } else if (oldVal !== value && (oldVal === oldVal || value === value)) {
      trigger(target, key, "SET")
    }

  },

  forEach(callback: Function, thisArg?: any) {
    // wrap用于包装响应式数据
    const wrap = (val: any) => typeof val === 'object' && val !== null ? reactive(val) : val
    const target = this.raw
    // forEach遍历也和size有关，用size打标记
    track(target, ITERATE_KEY, "SIZE")

    target.forEach((v: any, k: any) => {
      callback.call(thisArg, wrap(v), wrap(k), this)
    })
  },

  [Symbol.iterator]: iterationMethod,
  entries: iterationMethod,
  values: valuesIterationMethod,
  keys: keysIterationMethod
}

function createReactive(data: {[key: string | symbol]: any}, isShallow = false, isReadonly = false): any {
  return new Proxy(data, {
    // 读取操作
    get(target, key: string | symbol, receiver: any) {
      if (key === "raw") {
        return target
      }

      // 处理Set和Map的size读取
      if (key === "size") {
        track(target, ITERATE_KEY, "SIZE")
        return Reflect.get(target, key, target)
      }

      // 拦截查找操作
      if (Array.isArray(target) && arrayInstrumentation.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentation, key, receiver)
      }

      // 如果 key 的类型是 symbol，则不进行追踪
      if (!isReadonly && typeof key !== "symbol" && !setMethods.includes(key)) {
        track(target, key, "GET", shouldTrack)
      }

      // 处理Set或Map的操作
      let res = Reflect.get(target, key, receiver)
      if (typeof key === "string" && setMethods.includes(key) || Symbol.iterator in target) {
        // track(target, ITERATE_KEY, "ADD") 不需要
        // console.log("target: ", target, "key: ",key)

        return mutableInstrumentation[key]
      }


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
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
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

export function reactive<T extends {[key: string | symbol]: any}>(data: T): T {
  const existedProxy = reactiveMap.get(data)
  if (existedProxy) {
    return existedProxy
  }
  const proxy = createReactive(data)
  reactiveMap.set(data, proxy)
  return proxy
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