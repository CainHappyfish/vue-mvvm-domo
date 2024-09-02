import { Container, VNode } from '../../types/renderer'
import { patch, patchChild } from '../renderer/patch'
import { move, teleport } from './components'

export const Teleport: teleport = {
  _isTeleport: true,

  process(oldVNode: VNode, newVNode: VNode, container: Container, anchor: Node | null) {
    // 如果旧 VNode 不存在，则挂载，否则更新
    if (!oldVNode) {
      // 获取挂载点
      const target = typeof newVNode.props?.to === 'string'
        ? document.querySelector(newVNode.props.to)
        : newVNode.props.to
      // 将 newVnode.children 渲染到指定挂载点
        (newVNode.children as VNode[]).forEach((child: VNode) => patch(undefined, child, target, anchor))

    } else {
      // 更新
      patchChild(oldVNode, newVNode, container)
      // 如果新旧to值不同则需要移动
      if (newVNode.props.to !== oldVNode.props.to) {
        // 获取新的容器
        const newTarget = typeof newVNode.props.to === 'string'
        ? document.querySelector(newVNode.props.to)
        : newVNode.props.to
        // 移动到新容器
        (newVNode.children as VNode[]).forEach((child: VNode) => move(child, newTarget))
      }
    }
  }
}