import { Container, VNode } from '../../types/renderer'

export interface keepAlive {
  _isKeepAlive: boolean
  props: object
  setup: Function
}

export interface teleport {
  _isTeleport: boolean
  process: Function
}

export interface transition {
  beforeEnter: Function
  enter: Function
  leave: Function
}

/**
 * Teleport节点移动函数
 * */
export function move(vnode: VNode, container: Container, anchor?: Node | null) {
  const target = vnode.component
  ? vnode.component.subTree.el
  : vnode.el

  if (anchor) {
    container.insertBefore(target, anchor)
  }
  container.appendChild(target)
}