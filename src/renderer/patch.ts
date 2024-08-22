import { Container, VNode } from '../../types/renderer'
import { patchProps } from './props'

// 文本和注释的唯一标识
const Text = Symbol('Text')
const Comment = Symbol('Comment')
/**
 * 挂载元素
 * */
export function mountElement(vnode: VNode, container: Container) {
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
  container.appendChild(el)

}

export function patch(oldNode: VNode | undefined, newNode: VNode, container: Container) {
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
      mountElement(newNode, container)
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
    if (Array.isArray(oldNode.children)) {
      // 涉及到diff算法，暂时搁置
      oldNode.children.forEach((child: VNode) => { unmount(child) })
      newNode.children.forEach((child: VNode) => { patch(undefined, child, el) })
    } else {
      // 旧节点可能是没有子节点或文本子节点，清空容器并重新挂载新子节点
      el.textContent = ""
      newNode.children.forEach((child: VNode) => { patch(undefined, child, el) })

    }
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


