import { EffectFunction } from './watchEffect'
import { keepAlive, teleport, transition } from '../src/components/components'

export type Renderer = {
  render: (vnode: VNode, container: Container) => any
}
// export function renderer: (vNode: VNode, container: Container) => unknown


/**
 * 虚拟 DOM 节点
 * */
export interface VNode {

  type: string | componentOptions | FuncComponent | keepAlive | teleport
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
  /**
   * transition
   * */
  transition?: transition
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
  render?: Function
  /**
   * data: 渲染状态数据函数
   * */
  data?: Function
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
  keptAlive?: boolean
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
   * 组件渲染上下文
   * */
  renderContext?: any
  /**
   * 生命周期函数
   * */
  mounted: Array<EffectFunction>
  unmounted: Array<EffectFunction>

  /**
   * KeepAlive特殊上下文对象
   * */
  keepAliveCtx?: KeepAliveCtx

}

/**
 * 异步组件选项
 * */
export interface AsyncComponentOptions {

  /**
   * 加载器
   * */
  loader?: Function

  /**
   * 超时
   * */
  timeout?: number

  /**
   * 延时
   * */
  delay?: number

  /**
   * 出错时加载组件
   * */
  errorComponent: componentOptions

  /**
   * 加载组件
   * */
  loadComponent?: componentOptions

  /**
   * 错误回调
   * */
  onError?: Function
}

/**
 * 函数式组件
 * */
export interface FuncComponent extends Function {
  props?: Record<string, any>
}

/**
 * KeepAlive特殊上下文对象
 * */
export interface KeepAliveCtx{

  move: Function

  createElement: Function



}

/**
 * KeepAlive VNode
 * */
export interface KeepAliveVNode extends VNode {

  keptAlive?: boolean

  /**
   * 避免渲染器真的将组件卸载
   * */
  shouldKeepAlive?: boolean

  /**
   * KeepAlive 组件实例
   * */
  keepAliveInstance?: KeepAliveInstance
}

/**
 * keepAlive实例
 * */
export interface KeepAliveInstance extends ComponentInstance{
  /**
   * 内部函数，对应到KeepAlive组件的生命周期
   * */
  _activated: Function
  _deActivated: Function
}
