
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