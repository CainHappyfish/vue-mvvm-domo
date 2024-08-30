import { Ref } from '../../types/reactivity'
import { reactive } from './reactive'

export function toRefs(obj: {[index: string | symbol]: any}, key: any): Ref<any> {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val
    }
  }

  Object.defineProperty(wrapper, '_is_Ref_', {
    value: true
  })

  return wrapper
}

export function proxyRef(target: any): any {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      // 如果读取的值是 ref，则返回它的 value 属性值
      return value._is_Ref_ ? value.value : value
    },

    set(target, key, newVal, receiver) {
      const value = target[key]
      if (value._is_Ref_) {
        value.value = newVal
        return true
      }
      return Reflect.set(target, key, newVal, receiver)
    }
  })
}

export function ref<T>(data: T): Ref<T> {
  const wrapper: Ref<T> = {
    value: data
  }

  Object.defineProperty(wrapper, '_is_Ref_', {
    value: true
  })

  return reactive(wrapper)
}
