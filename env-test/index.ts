import { DepsMap, EffectFunction } from '../types/watchEffect'

const data: { [index: string | symbol]: any } = {
  ok: true,
  text: "TEST"
}
let activeEffect: EffectFunction
const effectBucket: WeakMap<any, DepsMap> = new WeakMap()

const refObj = new Proxy(data, {
	get(target, key) {
      // console.log(target)
      track(target, key)
      return target[key]
    },

    set(target, key, newVal) {
      target[key] = newVal
      trigger(target, key)
      return true
    }
})

export function track(target: any, key: string | symbol) {
	if (!activeEffect) return target[key]

  let depsMap = effectBucket.get(target)

  if (!depsMap) {
    effectBucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
}

export function trigger(target: any, key: string | symbol) {
  const depsMap = effectBucket.get(target)
    if (!depsMap) { return false }
    const effects = depsMap.get(key)
    effects && effects.forEach((fn) => fn())
}

effect(() => {
  console.log(refObj.text)
  document.body.innerText = refObj.ok ? refObj.text : "not"
})

setTimeout(() => {
  refObj.text = "PROXIED"
  console.log(refObj.text)
}, 1000)

function effect(fn: EffectFunction) {
  activeEffect = fn
  fn()
}
