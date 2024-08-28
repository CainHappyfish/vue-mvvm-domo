import { Container, Invoker } from '../../types/renderer'


/**
 * 判断某个属性是否需要通过setAttribute方式设置，处理DOM props只读属性form等
 * @param el 目标dom
 * @param key 目标属性名
 */
export function shouldSetAsDomProps(el: Container, key: string): boolean {
    if (key === 'form' && el.tagName === 'INPUT') return false
    return key in el
}

export function patchProps(el: Container, key: string, oldVal: any, newVal: any) {
  // 判断是否存在对应的DOM props
  if (key in el) {
    /* 判断是否有DOM操作属性 */
    if (shouldSetAsDomProps(el, key)){
      // 获取类型
      const type = typeof el[key]
      // 如果是布尔类型，并且 newVal 是空字符串，则将值矫正为 true, 如disabled
      if (type === "boolean" || newVal === "") {
        el[key] = true
      } else {
        el[key] = newVal
      }
    } else if (key === 'class') {
      el.className = newVal || ""
    } else if (/^on/.test(key)) {
      /* 事件处理 */
      const eventName = key.substring(2).toLowerCase()
      // 获取所有事件处理函数，如果不存在则新建一个
      const invokers = el._invokers || (el._invokers = {})
      let invoker: Invoker = invokers[eventName]

      if(newVal) {
        /* 如果invoker不存在，则初始化 */
        if (!invoker) {
          // 将事件处理函数缓存到el._invokers
          invoker = el._invokers[eventName] = (event: Event) => {
            // timestamp是触发事件的时间戳，如果其早于事件处理函数的绑定事件，则不执行事件处理函数
            if (invoker.attachTime && event.timeStamp < invoker.attachTime) return

            if (Array.isArray(invoker.value)) {
              // 如果 invoker.value 是数组，则遍历它并逐个调用事件处理函数
              invoker.value.forEach(fn => fn(event))
            } else {
              // 否则直接调用
              if (invoker.value) {
                invoker.value(event)
              }
            }
          }
          invoker.value = newVal
          // 记录绑定时间
          invoker.attachTime = performance.now()
          el.addEventListener(eventName, invoker)
        } else {
          // 有invoker直接更新
          invoker.value = newVal
        }

      } else if (invoker) {
        /* 如果没有新的事件绑定函数，移除原有事件监听 */
        el.removeEventListener(eventName, invoker)
      }

    } else {
      el.setAttribute(key, newVal)
    }

  }

}


/**
 * 序列化class属性为字符串
 * @param {string | {[index: string | symbol]: boolean} | Array<any>} classSeries - 属性数据类型，可以是字符串、对象、数组
 * */
export function normalize(classSeries: string | {[index: string | symbol]: boolean} | Array<any>) {
  const className: Array<string> = []
  if (typeof classSeries == 'string') {
    return classSeries
  } else if (typeof classSeries === 'object' && !Array.isArray(classSeries)) {
    return normalizeObject(classSeries)
  } else if (Array.isArray(classSeries)) {
    return normalizeArray(classSeries)
  } else {
    console.error("class/style type should be string, object or array.")
    return
  }

  /**
   * 标准化对象
   * */
  function normalizeObject(classSeries: {[index: string | symbol]: boolean}) {
    const objectString: Array<string> = []
    Object.keys(classSeries).forEach((key: string | symbol) => {
      if (typeof classSeries[key] !== 'boolean') {
        console.error(`class/style value ${String(key)} must be a boolean.`)
        return false
      }
      if (classSeries[key]) {
        objectString.push(String(key))
      }

    })
    return objectString.join(" ")
  }

  /**
   * 标准化数组
   * */
  function normalizeArray(classSeries: Array<any>) {
    classSeries.forEach((item: any) => {
      if (typeof item === 'string') {
        className.push(item)
      } else if (typeof item === 'object') {
        if (normalizeObject(item)) {
          className.push(normalizeObject(item))
        }
      } else {
        console.error(`class/style value ${item} must be a string or object.`)
      }
      console.log(item, className)
    })

    return className.join(" ")
  }


}

/**
 * 解析组件 props 和 attrs 数据
 * */
export function resolveProps(options:  Record<string | symbol, any>, propsData: object) {
  const props = {}
  const attrs = {}

  // 遍历为组件传递的 props 数据
  for (const key in propsData) {
    if (key in options || key.startsWith("on")) {
      // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，props合法
      props[key] = propsData[key]

    } else {
      // 否则将其作为 attrs
      attrs[key] = propsData[key]
    }
  }

  // 返回 props 和 attrs 数据
  return [ props, attrs ]
}