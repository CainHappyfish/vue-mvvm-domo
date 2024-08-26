import { patch, unmount } from '../src/renderer/patch'

export type Renderer = {
  render: (vNode: VNode, container: Container) => any
}
// export function renderer: (vNode: VNode, container: Container) => unknown


/**
 * 虚拟 DOM 节点
 * */
export interface VNode {

  type: string
  props: Record<symbol | string, any>
  children: string | Array<VNode>
  /**
   * DOM属性，可以是HTML元素容器，文本节点以及注释
   */
  el: Container | Text | Comment
  // 唯一标识
  key: string | number | symbol | undefined

}

/**
 * 用于存储元素的容器
 * */
export interface Container extends HTMLElement {
  /**
   * _vnode：当前DOM容器中的根虚拟节点
   * */
  _vnode?: VNode,
  /**
   * _invokers：存放所有事件处理函数，键是事件名称，它的
   * 值则是对应的事件处理函数
   * */
  _invokers?: {[index: string]: Invoker}
}

/**
 * 处理事件函数
 * */
export interface Invoker extends Function {
  /**
   * (event: Event): 需要执行监听的事件
   * */
  (event: Event): any,
  /**
   * value: 存储监听的事件，可选
   * */
  value?: (event: Event) => any,
  /**
   * attachTime: 事件处理函数绑定时间，可选
   * */
  attachTime?: number
}

function patchKeyedChildren(oldNode: VNode, newNode: VNode, container: Container) {
  // 获取新旧子节点组的信息
  const oldChildren = oldNode.children
  const newChildren = newNode.children
  // 索引值
  let oldStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newStartIndex = 0
  let newEndIndex = newChildren.length - 1
  // 四个索引节点
  let oldStartNode = oldChildren[oldStartIndex] as VNode
  let oldEndNode = oldChildren[oldEndIndex] as VNode
  let newStartNode = newChildren[newStartIndex] as VNode
  let newEndNode = newChildren[newEndIndex] as VNode

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartNode.key === newStartNode.key) {
      // 仍处于头部，只需要更新
      patch(oldEndNode, newStartNode, container)
      // 更新完成后更新索引
      oldEndNode = oldChildren[++oldStartIndex] as VNode
      newEndNode = newChildren[++newStartIndex] as VNode
    } else if (oldEndNode.key === newEndNode.key) {
      // 仍处于末尾，只需要更新
      patch(oldEndNode, newStartNode, container)
      // 更新完成后更新索引
      oldEndNode = oldChildren[--oldEndIndex] as VNode
      newEndNode = newChildren[--newEndIndex] as VNode

    } else if (oldStartNode.key === newEndNode.key) {
      // 先更新节点
      patch(oldEndNode, newStartNode, container)
      // 移动DOM，将旧头部节点位置移动到旧尾部节点后
      container.insertBefore(oldStartNode.el, oldEndNode.el.nextSibling)

    } else if (oldEndNode.key === newStartNode.key) {
      // 先更新节点
      patch(oldEndNode, newStartNode, container)
      // 移动DOM，将旧尾部节点位置移动到旧头部节点前
      container.insertBefore(oldStartNode.el, oldEndNode.el)

      // 移动完成后更新索引
      oldEndNode = oldChildren[--oldEndIndex] as VNode
      newStartNode = newChildren[++newStartIndex] as VNode

    } else if (!oldStartNode.key) {
      // 遇到undefined节点时，跳过
      oldStartNode = oldChildren[++oldStartIndex] as VNode
    } else if (!oldEndNode.key) {
      // 遇到undefined节点时，跳过
      oldEndNode = oldChildren[--oldEndIndex] as VNode
    } else {
      // 遍历旧子节点组，找到与新头部节点相同的子节点的索引
      if (typeof oldChildren !== 'string') {
        const indexInOld = oldChildren.findIndex(child => child.key === newStartNode.key)

        // 大于0则说明找到对应节点，将其移动到头部
        if (indexInOld > 0) {
          const vnodeToMove = oldChildren[indexInOld]
          // 更新
          patch(vnodeToMove, newStartNode, container)
          // 移动到旧头部节点oldStartNode之前
          container.insertBefore(vnodeToMove.el, oldStartNode.el)
          // 设置indexInOld处的节点为undefined，更新索引
          oldChildren[indexInOld].key = undefined
          // 更新newStartIndex到下一个位置
          newStartNode = newChildren[++newStartIndex] as VNode

        } else {
          // 将新节点挂载到头部
          patch(undefined, newStartNode, container, oldStartNode.el)
        }

      } else {
        console.error("children should be a array.")
      }
    }

    // 满足条件则说明遗漏新节点，需要挂载
    if (oldEndIndex < oldStartIndex && newStartIndex < newEndIndex) {
      for (let i = newStartIndex; i < newEndIndex; i++) {
        patch(undefined, newChildren[i] as VNode, container, oldStartNode.el)
      }
    } else if (newEndIndex < newStartIndex && oldStartIndex <= oldEndIndex) {
      // 满足条件则说明存在不需要的节点，需要卸载
      for (let i = oldStartIndex; i < newEndIndex; i++) {
        unmount(oldChildren[i] as VNode)
      }
    }


  }
}