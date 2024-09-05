import { createBlock, createVNode } from './vnode/vnode'
import { Block, VNode } from '../../types/renderer'

/**
 * 用于创建 vnodes
 * @param type - 节点类型
 * @param propsOrChildren - 属性
 * @param children - 子节点
 * */
export function h(type: any, propsOrChildren?: any, children?: any) {
  if (arguments.length = 2) {
    if (typeof propsOrChildren === 'object' && !Array.isArray(propsOrChildren)) {
      // 第二个 参数为单个VNode
      if (isVNode(propsOrChildren)) {
        return createVNode(type, [], [propsOrChildren])
      }
        return createVNode(type, propsOrChildren, [])
    } else {
      return createVNode(type, [], propsOrChildren)
    }
  } else {
    if (isVNode(children)) {
      children = [children]
    }
    return createVNode(type, propsOrChildren, children)
  }
}

/**
 * 判断是否是虚拟节点
 * */
function isVNode(value: any): value is VNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'props' in value &&
    'children' in value &&
    'el' in value
  );
}
