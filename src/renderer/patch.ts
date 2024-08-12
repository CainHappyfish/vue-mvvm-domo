import { Container, VNode } from '../../types/renderer'
import { patchProps } from './props'

/**
 * 挂载元素
 * */
export function mountElement(vnode: VNode, container: Container) {
  // 创建HTML元素
  const el: Container = document.createElement(vnode.type)

  // 遍历props，将属性、事件添加到元素
  if (vnode.props) {
    for (const key in vnode.props) {
      /* 添加props到元素的属性、事件中 */
      patchProps(vnode, container, key)
    }

  }
  if (typeof vnode.children === 'string') {
    /* 如果子节点是字符串，则说明是文本节点*/
  } else if (Array.isArray(vnode.children)) {
    /* 如果子节点是数组，则递归调用renderer，遍历所有子节点 */
    vnode.children.forEach((child: VNode) => mountElement(child, el))
  } else {
    console.log("Wrong Type")
  }

  // 将元素添加到挂载点下
  container.appendChild(el)

}