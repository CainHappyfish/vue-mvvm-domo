
import { DepsMap, EffectFunction } from '../../../types/watchEffect'

// 副作用函数桶
const effectBucket: WeakMap<any, DepsMap> = new WeakMap()
let activeEffect: EffectFunction


export function watchEffect(fn: EffectFunction) {
  const effectFn: EffectFunction = () => {
    cleanup(effectFn)
    activeEffect = fn
    fn()
  }

  effectFn.deps = []

  effectFn()
}

export function track(target: any, key: string | symbol) {
	if (!activeEffect) return target[key]

  let depsMap = effectBucket.get(target) as DepsMap

  if (!depsMap) {
    effectBucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)

  if (!activeEffect.deps) {
    activeEffect.deps = []
  }
  activeEffect.deps.push(deps)
}

export function trigger(target: any, key: string | symbol) {
  const depsMap = effectBucket.get(target)
  if (!depsMap) { return false }
  const effects = depsMap.get(key)

  const effectsToRun = new Set(effects)
  effectsToRun.forEach((effectFn) => effectFn())

}

export function cleanup(effectFn: EffectFunction) {
  if (effectFn.deps) {
    for (let deps of effectFn.deps) {
      deps.delete(effectFn)
    }
    effectFn.deps = []
  }
}