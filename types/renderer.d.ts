import { patch, unmount } from '../src/renderer/patch'
import { EffectFunction } from './watchEffect'

export type Renderer = {
  render: (vnode: VNode, container: Container) => any
}
// export function renderer: (vNode: VNode, container: Container) => unknown


/**
 * 虚拟 DOM 节点
 * */
export interface VNode {

  type: string | componentOptions
  props: Record<symbol | string, any>
  children: string | Array<VNode>
  /**
   * DOM属性，可以是HTML元素容器，文本节点以及注释
   */
  el: Container | Text | Comment
  /**
   * 唯一标识
   * */
  key: string | number | symbol | undefined
  /**
   * 组件
   * */
  component?: ComponentInstance
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

/**
 * 组件选项
 * */
export interface componentOptions extends VNode {
  name: string
  /**
   * render: 渲染函数
   * */
  render: Function
  /**
   * data: 渲染状态数据函数
   * */
  data: Function
  /**
   * 生命周期钩子
   * */
  beforeCreate?: Function
  created?: Function
  beforeMount?: Function
  mounted?: Function
  beforeUpdate?: Function
  updated?: Function
  /**
   * 组合式API setup
   * */
  setup?: Function
}

/**
 * 组件
 * */
export interface ComponentInstance {
  /**
   * 状态数据
   * */
  state: any
  /**
   * 是否挂载
   * */
  isMounted: boolean
  /**
   * 渲染内容，存储组件的渲染函数返回的虚拟 DOM，即组件的子树
   * */
  subTree: VNode | null
  /**
   * props
   * */
  props: any
  /**
   * 插槽
   * */
  slots: object
  /**
   * 生命周期函数
   * */
  mounted: Array<EffectFunction>

}

