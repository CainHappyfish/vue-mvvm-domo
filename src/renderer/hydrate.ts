import { Container, VNode } from '../../types/renderer'
import { mountComponent } from '../components/component'
import { patchProps } from './props'

/**
 * 客户端激活节点函数
 * */
export function hydrateNode(node: Node | null, vnode: VNode, container: Container) {
  const { type } = vnode

  // vnode.el 引用真实 DOM
  vnode.el = node as Container

  // 检查虚拟 DOM 的类型，如果是组件，则调用 mountComponent 函数完成激活
  if (typeof type === 'object') {
    mountComponent(vnode, container, null)
  } else if (typeof type === 'string') {
    // 检查真实 DOM 的类型与虚拟 DOM 的类型是否匹配
    if (node?.nodeType !== 1) {
      console.error('mismatch', node, vnode)
    } else {
      // 普通元素则调用hydrateElement
      hydrateElement(node as Container, vnode)
    }
  }

  // 重要：hydrateNode 函数需要返回当前节点的下一个兄弟节点，以便继续进行后续的激活操作
  return (node as Node).nextSibling
}

/**
 * 普通元素的激活
 * */
export function hydrateElement(el: Container, vnode: VNode) {
  if (vnode.props) {
    for (const key in vnode.props) {
      // 只有事件类型的 props 需要处理
      if (/^on/.test(key)) {
        patchProps(el, key, null, vnode.props[key])
      }
    }
  }

  // 递归激活子节点
  if (Array.isArray(vnode.children)) {
    let nextNode = el.firstChild
    const len = vnode.children.length
    for (let i = 0 ; i < len; i++) {
      // 每当激活一个子节点，hydrateNode 函数都会返回当前子节点的下一个兄弟节点
      nextNode = hydrateNode(nextNode, vnode.children[i], el)
    }
  }
}
