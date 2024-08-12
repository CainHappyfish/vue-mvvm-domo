/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { VmCompiler } from './compiler'
import { Renderer } from './renderer'

/**
 * 选项式API
 * */

/**
 * 状态选项
 * */
export interface cainVmOptions {
  /**
   * HTML template
   * */
  template?: string

  /**
   * data 声明组件初始响应式状态的函数
   *
   * */
  data?: () => object

  /**
   * setup 返回响应式数据
   *
   * */
  setup?: () => object

  /**
   * computed 计算属性，声明要在组件实例上暴露的计算属性
   *
   * */
  computed?: { [funcName: string]: Function }

  /**
   * watch 数据更改时调用的侦听回调
   *
   * */
  watch?: { [funcName: string]: Function }
}

/**
 * 示例对象ViewModel，所有的data均挂载在ViewModel上
 * */
export interface cainVm {
  /**
   * HTML模板部分
   * */
  $template: string | undefined

  /**
   * 挂载的HTML元素
   * */
  $el: HTMLElement | undefined

  /**
   * 选项
   * */
  $options: cainVmOptions

  /**
   * 挂载的数据
   * */
  $data: object | undefined

  /**
   * 解析指令
   * */
  $compile: VmCompiler | undefined

  /**
   * 渲染函数
   * */
  // $render: Function | undefined

  /**
   * 渲染器
   * */
  // $renderer: Renderer | undefined

  /**
   * 创建 VNode
   * */
  _h: Function

  /**
   * 创建文本形式VNode
   * */
  _v: Function


  /**
   * 挂载应用
   * */
  mount(el?: string | HTMLElement)
}

export function createApp(options: cainVmOption): cainVm
