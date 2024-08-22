import { track } from '../../core'
import { reactive } from '../reactive'
// 操作独立标记
const ITERATE_KEY = Symbol()
export function iterationMethod(this: any) {
  const target = this.raw
  let iterator: any = target[Symbol.iterator]()
  // if (key === "values") {
  //   iterator = target.values()
  // } else if (key === "keys") {
  //   iterator = target.keys()
  // }


  // wrap响应式包装
  const wrap = (val: any) => typeof val === 'object'  && val !== null ? reactive(val) : val

  track(target, ITERATE_KEY, "SIZE")

  if (target instanceof Map) {
    return {
      next() {
        const {value, done} = iterator.next()
        return {
          // 如果value不是undefined则进行wrap
          value: value ? [wrap(value[0]), wrap(value[1])] : value,
          done
        }
      },
      [Symbol.iterator]() {
        return this
      }
    }
  } else if (target instanceof Set) {
    return {
      next() {
        const {value, done} = iterator.next()
        return {
          // 如果value不是undefined则进行wrap
          value: value ? wrap(value) : value,
          done
        }
      },
      [Symbol.iterator]() {
        return this
      }
    }
  }
}

export function valuesIterationMethod(this: any) {
  const target = this.raw
  let iterator: any = target.values()

  // wrap响应式包装
  const wrap = (val: any) => typeof val === 'object'  && val !== null ? reactive(val) : val

  track(target, ITERATE_KEY, "SIZE")

  return {
    next() {
      const {value, done} = iterator.next()
      return {
        // 如果value不是undefined则进行wrap
        value: wrap(value),
        done
      }
    },
    [Symbol.iterator]() {
      return this
    }
  }

}

const MAP_KEY_ITERATE_KEY = Symbol()
export function keysIterationMethod(this: any) {
  const target = this.raw
  let iterator: any = target.keys()

  // wrap响应式包装
  const wrap = (val: any) => typeof val === 'object'  && val !== null ? reactive(val) : val

  track(target, MAP_KEY_ITERATE_KEY, "SIZE")

  return {
    next() {
      const {value, done} = iterator.next()
      return {
        // 如果value不是undefined则进行wrap
        value: wrap(value),
        done
      }
    },
    [Symbol.iterator]() {
      return this
    }
  }
}


