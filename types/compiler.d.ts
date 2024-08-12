/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { cainVm } from './mvvm'

export interface VmCompiler {
  /**
   * 要解析的HTML元素
   * */
  $el: HTMLElement

  /**
   * 解析后的vm
   * */
  $vm: cainVm
}
