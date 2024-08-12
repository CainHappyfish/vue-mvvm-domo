const bucket = new WeakMap()

let activeEffect: Function

const refObj = new Proxy(data, {
  get(target, key) {
    if (!activeEffect) return target[key]
    let depsMap: Map<any, any> = bucket.get(target)
    if (!depsMap) {
      depsMap.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if (!deps) {
      deps.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)

    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    const depsMap = bucket.get(target)
    if (!depsMap) { return false }
    const effects = depsMap.get(key)
    effects && effects.forEach((fn: Function) => fn())
    return true
  }
})