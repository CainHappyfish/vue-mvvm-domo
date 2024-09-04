import { Container, Renderer, VNode } from '../../types/renderer'
import { patch, unmount } from './patch'
import { hydrateNode } from './hydrate'

// /**
//  * 根据组件虚拟 DOM 树构建真实的 DOM 树
//  * @param {VNode} vnode - 虚拟DOM对象
//  * @param {Container} container - 一个真实 DOM 元素，作为挂载点，渲染器会把虚拟 DOM 渲染到该挂载点下。
//  * */
// export function renderer(vnode: VNode, container: Container) {
//
//
// }


export function createRenderer(): Renderer {
  function render(vnode: VNode, container: Container) {
    if (vnode) {
      // 新 vnode 存在，将其与旧 vnode 一起传递给 patch 函数
      patch(container._vnode, vnode, container)
    } else {
      if (container._vnode) {
        // 旧 vnode 存在，且新 vnode 不存在，说明是卸载（unmount）操作
        // 只需要将 container 内的 DOM 清空即可
        unmount(vnode)
      }
    }

    container._vnode = vnode
  }

  function hydrate(vnode: VNode, container: Container) {
    hydrateNode(container.firstChild, vnode, container)
  }

  return {
    render,
    hydrate
  }
}
