import { Ref, WatchCallbackFn, WatchOptions } from '../../types/reactivity'
import { watchEffect } from '../core'
import { EffectFunction } from '../../types/watchEffect'


/**
 * watch： 用于观测一个响应式数据
 * @param {any | Function | Ref} target - 观测目标
 * @param {WatchCallbackFn} callback - 回调函数
 * @param {WatchOptions} options - 可选，默认为空
 * */
export function watch<T>(target: T | (() => T) | Ref<T>, callback: WatchCallbackFn<T>, options: WatchOptions = {}) {
  let getter: Function

  if (typeof target === 'function') {
    getter = target
  } else {
    // 递归遍历，建立响应式
    getter = () => traverse(target)
  }

  let oldVal: T, newVal: T
  let expiredEffects: EffectFunction
  // 储存过期的回调
  const onInvalidate = (fn: EffectFunction) => {
    expiredEffects = fn
  }
  // 用调度器触发回调
  const schedule = () => {
    if (expiredEffects) {
      expiredEffects()
    }
    newVal = effectFn()
    // 将 onInvalidate 作为回调函数的第三个参数，以便用户使用
    callback(newVal, oldVal, onInvalidate)
    oldVal = newVal

  }

  // 监听副作用函数
  const effectFn = watchEffect(() => getter(), {
    lazy: true,
    scheduler: () => {
      if (options.flush === 'post') {
        // 如果flush为post则将其放到微任务队列执行
        const p = Promise.resolve()
        p.then(schedule)
      } else {
        schedule()
      }
    }
  })

  if (options.immediate) {
    schedule()
  } else {
    oldVal = effectFn()
  }
}

/**
 * traverse: 递归创建响应式
 * @param {any} value - 要被转化为响应式的值
 * @param {Set<any>} traversed - 存储转化为响应式后的数据
 * */
function traverse(value: any, traversed: Set<any> = new Set()) {
    // 目前只考虑数组
	if (typeof value !== 'object' || value === null || traversed.has(value)) { return }
	traversed.add(value)

    for (const key in value) {
        traverse(value[key], traversed)
    }
}