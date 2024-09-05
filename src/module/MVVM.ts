/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { cainVm, cainVmOptions} from '../../types/mvvm'
import { VmCompiler } from '../../types/compiler'
import { Container, Renderer } from '../../types/renderer'

/**
 * 响应式挂载对象ViewModel
 * */

export class cApp implements cainVm {

  $compile: VmCompiler

  $data: object | undefined

  $el: HTMLElement | undefined

  $options: cainVmOptions

  $template: string | undefined

  $render: Function

  // $renderer: Renderer

  _h: Function
  _v: Function

  // functions: { [funName: string]: Function }

  constructor(options: cainVmOptions) {
    this.$options = options || {}
  }

  /**
   * 将app挂载到DOM上
   * @param {string | HTMLElement} el - 挂载元素，可选
   * */
  public mount(el?: string | HTMLElement) {

    let container: Container
    if (typeof el === 'string') {
      // @ts-ignore
      container = document.querySelector(el)
    } else {
      container = el ? el : document.body
    }

    this.$el = container
    this.$template = this.$options.template

    // 新建编译器
    // this.$compile =






  }



}