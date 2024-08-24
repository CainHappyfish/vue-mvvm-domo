import { Container, VNode } from '../../types/renderer'
import { patchProps } from './props'

// 文本和注释的唯一标识
const Text = Symbol('Text')
const Comment = Symbol('Comment')
/**
 * 挂载元素
 * */
export function mountElement(vnode: VNode, container: Container, anchor?: Node | null) {
  // 创建HTML元素，建立vnode与DOM之间的联系
  const el: Container = vnode.el = document.createElement(vnode.type)

  // 遍历props，将属性、事件添加到元素
  if (vnode.props) {
    for (const key in vnode.props) {
      /* 添加props到元素的属性、事件中 */
      patchProps(container, key, null, vnode.props[key])
    }

  }
  if (typeof vnode.children === 'string') {
    /* 如果子节点是字符串，则说明是文本节点*/
    el.textContent = vnode.children
  } else if (Array.isArray(vnode.children)) {
    /* 如果子节点是数组，则递归调用mountElement，遍历所有子节点 */
    vnode.children.forEach((child: VNode) => patch(undefined, child, el))
  } else {
    console.log("Wrong Type")
  }

  // 将元素添加到挂载点下
  if (anchor) {
    container.insertBefore(el, anchor)
  }
  container.appendChild(el)

}

export function patch(oldNode: VNode | undefined, newNode: VNode, container: Container, anchor?: Node | null) {
  // 如果旧节点存在，则对比新旧节点的type
  if (oldNode && oldNode.type !== newNode.type) {
    // 类型不同则卸载
    unmount(oldNode)
    oldNode = undefined
  }
  const { type } = newNode
  // type是string类型，是普通元素
  if (typeof type === 'string') {
    // 如果不存在旧虚拟节点，则需要挂载，调用mountElement
    if (!oldNode) {
      mountElement(newNode, container, anchor)
    } else {
      // 存在旧虚拟节点，更新
      patchElement(oldNode, newNode)

    }

  } else if (typeof type === 'object') {
    // type是object类型，是组件
  } else if (type === Text) {
    // 文本节点
    if (!oldNode) {
      // 创建文本节点
      if (typeof newNode.children === 'string') {
        const el = newNode.el = document.createTextNode(newNode.children)
        container.appendChild(el)
      } else {
        console.error("Text children is not a string.")
      }
    }
  } else if (type === Comment) {
    // 文本节点
    if (!oldNode) {
      // 创建文本节点
      if (typeof newNode.children === 'string') {
        const el = newNode.el = document.createComment(newNode.children)
        container.appendChild(el)
      } else {
        console.error("Comment children is not a string.")
      }
    }
  } else if (type === 'Fragment') {
    // 旧节点不存在，挂载Fragment的子节点
    if (!oldNode) {
      if (typeof newNode.children !== 'string') {
        newNode.children.forEach((child: VNode) => {patch(undefined, child, container)})
      } else {
        console.error("Fragment children is not a vnode.")
      }
    } else {
      // 旧节点存在，更新Fragment的子节点
      patchChild(oldNode, newNode, container)
    }
  }
}

/**
 * 卸载节点
 * */
export function unmount(vnode: VNode) {
  // 如果为Fragment，则卸载所有子节点
  if (vnode.type === "Fragment") {
    if (typeof vnode.children !== 'string') {
      vnode.children.forEach(child => unmount(child))
      return
    } else {
      console.error("Fragment children is not a vnode.")
    }
  }

  const parent = vnode.el.parentNode
  if (parent) parent.removeChild(vnode.el)
}

/**
 * 更新元素
 * */
export function patchElement(oldNode: VNode, newNode: VNode) {
  const el = newNode.el = oldNode.el as Container
  const oldProps = oldNode.props
  const newProps = newNode.props
  // 更新props
  for (const key in newProps) {
    if (newProps[key] !== oldProps[key]) {
      patchProps(el, key, oldProps[key], newProps[key])
    }
  }
  // 将旧Props中不存在于新Props中的属性去掉
  for (const key in oldProps) {
    if (!(key in newProps)) {
      patchProps(el, key, oldProps[key], null)
    }
  }

  // 更新子节点
  patchChild(oldNode, newNode, el)
}

export function patchChild(oldNode: VNode, newNode: VNode, el: Container) {
  /* 判断新子节点的类型是否为文字节点 */
  if (typeof newNode.children === 'string') {
    // 旧子节点的类型有三种：没有子节点、文本子节点、一组子节点
    // 当就子节点为一组子节点时，才需要逐个卸载
    if (Array.isArray(oldNode.children)) {
      oldNode.children.forEach((child: VNode) => { unmount(child) })
    }

    // 最后将新的文本节点内容设置给容器元素
    el.textContent = newNode.children
  } else if (Array.isArray(newNode.children)) {
    /* 新子节点是一组子节点 */
    patchKeyedChildren(oldNode, newNode, el)


  } else {
    if (Array.isArray(oldNode.children)) {
      // 没有新子节点的情况，直接卸载就可以了
      oldNode.children.forEach((child: VNode) => { unmount(child) })
    } else if (typeof oldNode.children === 'string') {
      // 文本节点的情况，直接清空
      el.textContent = ""
    }
  }
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


