
import { DepsMap, EffectFunction, EffectOptions } from '../../../types/watchEffect'

// 副作用函数桶
const effectBucket: WeakMap<any, DepsMap> = new WeakMap<any, DepsMap>()
// 副作用函数栈
const effectStack: Array<EffectFunction> = new Array<EffectFunction>()
// 循环副作用标记
const iterateBucket: WeakMap<any, any> = new WeakMap<any, any>()

let activeEffect: EffectFunction
// 操作类型
const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}


/**
 * watchEffect: 监听副作用
 * @param {EffectFunction} fn - 被监听的副作用函数
 * @param {EffectOptions} options - 副作用函数选项，默认为空
 * */
export function watchEffect(fn: EffectFunction, options: EffectOptions = {}): EffectFunction {
  const effectFn: EffectFunction = () => {
    // 清楚不需要的副作用
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(activeEffect)
    // 手动执行副作用函数可以拿到返回值
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]

    return res
  }

  effectFn.options = options
  effectFn.deps = []

  if (!options.lazy) {
    effectFn()
  }

  return effectFn
}

/**
 * track：追踪响应式数据变化，收集副作用
 * @param {any} target - 追踪数据
 * @param {string | symbol} key - 发生变化的键值
 * @param {string} type - 操作类型
 * @param {boolean} shouldTrack - 是否追踪
 * */
export function track(target: any, key: string | symbol, type?: string, shouldTrack: boolean = true) {
	if (!activeEffect || !shouldTrack) {
    return
  }

  if (type === "ADD" || type === "DELETE") {
    iterateBucket.set(target, key)
  }

  let depsMap = effectBucket.get(target) as DepsMap

  if (!depsMap) {
    effectBucket.set(target, (depsMap = new Map()))
  }
  // 获取依赖集合
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set<EffectFunction>()))
  }
  deps.add(activeEffect)

  if (!activeEffect.deps) {
    activeEffect.deps = []
  }
  activeEffect.deps.push(deps)
}

/**
 * trigger: 触发副作用函数重新执行
 * @param {any} target - 触发对象
 * @param {string | symbol} key - 发生变化的键值
 * @param {string} type - 操作类型
 * @param {number} newVal - 新的数组索引
 * */
export function trigger(target: any, key: string | symbol, type: string, newVal?: number | string) {
  const depsMap = effectBucket.get(target)
  if (!depsMap) { return false }
  // 获取与key相关联的所有副作用
  const effects = depsMap.get(key)

  // 要执行的副作用集合
  const effectsToRun = new Set(effects)

  effects && effects.forEach(effectFn => {
    // 避免重复调用自身引发栈溢出
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })

  // 添加/删除属性
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    const ITERATE_KEY = iterateBucket.get(target)
    // 获取与 ITERATE_KEY相关联的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)

    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })

  }

  // 对象是数组，且增加了数组元素
  if (type === TriggerType.ADD && Array.isArray(target)) {
    const lengthEffects = depsMap.get("length")
    lengthEffects && lengthEffects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  // 对象是数组，且修改了length属性
  if (key === "length" && Array.isArray(target) && newVal) {
    depsMap.forEach((effects, key) => {
      if (key.toString() >= newVal) {
        effects.forEach(effectFn => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
          }
        })
      }
    })
  }

  effectsToRun.forEach((effectFn) => {
    // 如果存在调度器，则使用调度器执行副作用函数
    const EffectFunctionOptions = effectFn.options as EffectOptions
    if (EffectFunctionOptions && EffectFunctionOptions.scheduler) {
      EffectFunctionOptions.scheduler(effectFn)
    } else {
      effectFn()
    }
  })

}

/**
 * cleanup: 清除依赖集合
 * @param {EffectFunction} effectFn - 要清理依赖集合的副作用函数
 * */
export function cleanup(effectFn: EffectFunction) {
  if (effectFn.deps) {
    for (let deps of effectFn.deps) {
      deps.delete(effectFn)
    }
    effectFn.deps = []
  }
}