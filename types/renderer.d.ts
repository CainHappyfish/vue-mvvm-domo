
export type Renderer = {
  renderer: (vNode: VNode, container: Container) => any
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
  _vnode?: VNode,
  _invokers?: {[index: string]: Invoker}
}

/**
 * 处理事件函数
 * */
export interface Invoker extends Function {
  (event: Event): unknown | void,
  value?: (event: Event) => unknown | void,
  attachTime?: number
}