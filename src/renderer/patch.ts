import { Container, KeepAliveVNode, VNode } from '../../types/renderer'
import { patchProps } from './props'
import { currentInstance, mountComponent, patchComponent } from '../components/component'

// 文本和注释的唯一标识
const Text = Symbol('Text')
const Comment = Symbol('Comment')
/**
 * 挂载元素
 * */
export function mountElement(vnode: VNode, container: Container, anchor?: Node | null) {
  // 创建HTML元素，建立vnode与DOM之间的联系
  const el: Container = vnode.el = document.createElement(vnode.type as string)

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

export function patch(oldNode: VNode | KeepAliveVNode | undefined, newNode: VNode, container: Container, anchor?: Node | null) {
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

  } else if (typeof type === 'object' || typeof type === 'function') {
    // type是object活function类型，是组件
    if (!oldNode) {
      // 如果被 KeepAlive，不重新挂载而调用_activate
      if ((newNode as KeepAliveVNode).keptAlive) {
        (newNode as KeepAliveVNode).keepAliveInstance?._activated(newNode, container, anchor)
      } else {
        mountComponent(newNode, container, anchor)
      }

    } else {
      patchComponent(oldNode, newNode)
    }
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
export function unmount(vnode: VNode | KeepAliveVNode) {
  // 如果为Fragment，则卸载所有子节点
  if (vnode.type === "Fragment") {
    if (typeof vnode.children !== 'string') {
      vnode.children.forEach(child => unmount(child))
      return
    } else {
      console.error("Fragment children is not a vnode.")
    }
  } else if (typeof vnode.type === 'object') {
    // 对于需要被 KeepAlive 的组件，我们不应该真的卸载它，而应调用该组件的父组件
    // 即 KeepAlive 组件的 _deActivate 函数使其失活
    if ((vnode as KeepAliveVNode).shouldKeepAlive && (vnode as KeepAliveVNode).keepAliveInstance) {
      (vnode as KeepAliveVNode).keepAliveInstance?._deActivated(vnode)
    }

    // 对于组件的卸载，本质上是要卸载组件所渲染的内容，即 subTree
    if (vnode.component && vnode.component.subTree &&
      currentInstance && currentInstance.unmounted
    ) {
      unmount(vnode.component.subTree)
      // 执行卸载生命周期钩子函数
      currentInstance.renderContext && currentInstance.unmounted.forEach(fn => fn.call(currentInstance?.renderContext))
    }
    return
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
    diff(oldNode, newNode, el)

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

function diff(oldNode: VNode, newNode: VNode, container: Container) {
  const oldChildren = oldNode.children
  const newChildren = newNode.children

  // 处理相同前置节点，索引startIndex指向新旧两组子节点的开头
  let startIndex = 0
  let oldVNode = oldChildren[startIndex] as VNode
  let newVNode = newChildren[startIndex] as VNode

  /* 预处理 */
  // while循环向后遍历，直到不同key值的节点
  while (oldVNode.key === newVNode.key) {
    // 先更新
    patch(oldVNode, newVNode, container)
    // 更新索引j，让其递增
    startIndex++
    oldVNode = oldChildren[startIndex] as VNode
    newVNode = newChildren[startIndex] as VNode
  }

  // 处理相同的后置节点，newEndIndex指向新子节点组的尾部，oldEndIndex指向旧子节点组的尾部
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  oldVNode = oldChildren[oldEndIndex] as VNode
  newVNode = newChildren[newEndIndex] as VNode

  // while循环向前遍历，直到不同key值的节点
  while(oldVNode.key === newVNode.key) {
    // 更新
    patch(oldVNode, newVNode, container)
    // 递减索引
    oldVNode = oldChildren[--oldEndIndex] as VNode
    newVNode = newChildren[--newEndIndex] as VNode
  }

  /* 处理新增节点 */
  if (startIndex > oldEndIndex && startIndex <= newEndIndex) {
    // 获取锚点
    const anchorIndex = newEndIndex + 1
    const anchor = anchorIndex < newEndIndex ? (newChildren[anchorIndex] as VNode).el : null
    // 挂载每个新增节点
    for (let i = startIndex; i <= newEndIndex ; i++) {
      patch(undefined, newChildren[i] as VNode, container, anchor)
    }
  } else if (startIndex > newEndIndex && startIndex <= oldEndIndex) {
    /* 删除节点 */
    // 删除不需要的节点
    for (let i = startIndex; i <= oldEndIndex ; i++) {
      unmount(oldChildren[i] as VNode)
    }
  } else {
    // 构造source数组记录未处理的节点数
    const count = newEndIndex - startIndex + 1
    const source = new Array(count)
    source.fill(-1)
    // 是否需要移动
    let moved = false
    // 当前最大索引值
    let lastIndex = 0

    // 构建索引表
    const keyIndex = {}
    for (let i = startIndex; i <= newEndIndex; i++) {
      const index = (newChildren[i] as VNode).key as string
      keyIndex[index] = i
    }

    // 记录更新过的节点数
    let patched = 0
    // 遍历旧子节点组
    for (let i = startIndex; i <= oldEndIndex; i++) {
      const oldVNode = oldChildren[i] as VNode
      // 通过索引表快速找到有相同key的新子节点
      if (oldVNode.key && patched <= count) {
        const j = keyIndex[oldVNode.key]

        if (typeof j !== 'undefined') {
          newVNode = newChildren[j] as VNode
          // 更新
          patch(oldVNode, newVNode, container)
          patched++
          // 填充source
          source[j - startIndex] = i

          // 判断是否需要移动
          if (j < lastIndex) {
            moved = true
          } else {
            lastIndex = j
          }
        } else {
          // 未找到则删除节点
          unmount(oldVNode)
        }
      } else {
        unmount(oldVNode)

        if (oldVNode.key) console.error("key doesn't exist.")
      }

    }

    // 处理节点移动
    if (moved) {
      // 计算最长递增子序列
      const seq = getSequence(source)

      // 指向最长递增子序列末尾
      let seqEnd = seq.length - 1
      // 指向未处理的节点组末尾
      let newEnd = count - 1

      for (let i = newEnd; i >= 0 ; i--) {
        // 均为新节点，挂载
        // 在新子节点组中的绝对位置索引，并获取对应的节点
        const pos = i + startIndex
        const newVNode = newChildren[pos] as VNode
        // 该节点的下一个节点的位置索引
        const nextPos = pos + 1
        // 获取锚点
        const anchor = nextPos < newChildren.length
        ? (newChildren[nextPos] as VNode).el
        : null
        if (source[i] === -1) {
          // 挂载
          patch(undefined, newVNode, container, anchor)
        }
        if (i !== seq[seqEnd]) {
          // 如果节点的索引 i 不等于 seq[seqEnd] 的值，说明该节点需要移动
          container.insertBefore(newVNode.el, anchor)
        } else {
          // 否则不需要移动， seqEnd指向下一个位置
          seqEnd--
        }
      }

    }

  }
}


/**
 * vue3中求解最长递增子序列函数，返回对于索引值
 *
 * */
function getSequence(arr: Array<any>) {
  const predecessorIndices = arr.slice(); // 用于记录序列中每个元素的前驱索引
  const sequenceIndices = [0]; // 用于存储最长递增子序列的元素索引
  let i: number, j: number, left: number, right: number, middle: number;
  const length = arr.length;

  // 遍历数组中的每个元素
  for (i = 0; i < length; i++) {
    const currentElement = arr[i];

    if (currentElement !== 0) {
      j = sequenceIndices[sequenceIndices.length - 1];

      // 如果当前元素大于序列中的最后一个元素
      if (arr[j] < currentElement) {
        predecessorIndices[i] = j; // 记录前一个元素的索引
        sequenceIndices.push(i); // 将当前元素的索引添加到序列中
        continue;
      }

      // 使用二分查找确定当前元素在序列中的插入位置
      left = 0;
      right = sequenceIndices.length - 1;
      while (left < right) {
        middle = ((left + right) / 2) | 0;
        if (arr[sequenceIndices[middle]] < currentElement) {
          left = middle + 1;
        } else {
          right = middle;
        }
      }

      // 如果需要，替换序列中的元素
      if (currentElement < arr[sequenceIndices[left]]) {
        if (left > 0) {
          predecessorIndices[i] = sequenceIndices[left - 1];
        }
        sequenceIndices[left] = i;
      }
    }
  }

  // 根据前驱索引重建最终递增子序列
  left = sequenceIndices.length;
  right = sequenceIndices[left - 1];
  while (left-- > 0) {
    sequenceIndices[left] = right;
    right = predecessorIndices[right];
  }

  return sequenceIndices;
}


