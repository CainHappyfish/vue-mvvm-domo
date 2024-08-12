import { Container, VNode } from '../../types/renderer'

export function patchProps(vnode:VNode, el: Container, key: string) {
  if (/^on/.test(key)) {
    // const event = key.substring(2).toLowerCase()
    // const invokers = el._invokers || (el._invokers = {})
    // let invoker: Invoker = invokers[event]
    el.addEventListener(key.substring(2).toLowerCase(), () => {
      vnode.props[key]()
    })
  } else if (key === "class") {
    // 静态class属性
    el.classList.add(key)
  } else if (key === "__class__") {
    // 动态class属性
  } else if (key === "style") {
    // 静态style属性
    el.style.cssText = vnode.props[key]
  } else if (key === "__style__") {
    // 动态style属性
  }
}