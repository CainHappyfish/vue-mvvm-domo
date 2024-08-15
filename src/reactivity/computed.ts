import {track, trigger, watchEffect} from '../core'
import {Computed} from "../../types/reactivity"
import {EffectFunction} from "../../types/watchEffect"

export function computed<T>(getter: EffectFunction<T>): Computed<T> {
  // 缓存上一次计算值
  let buffer: T
  // 脏读
  let dirty = true
  const effectFn = watchEffect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true
        trigger(obj, "value", 'SET')
      }
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        buffer = effectFn()
        dirty = false
      }
      track(obj, "value")
      return buffer
    }
  }

  return obj
}

