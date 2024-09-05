import { parse } from './parse'
import { transform } from './transform/transform'
import { generate } from './generate/generate'
import { cApp } from '../module/MVVM'
import { h } from '../renderer/h'

export { tokenize } from './parse'

/**
 * 编译器类
 * */
export class Compiler {

  /**
   * 编译后元素
   * */
  $el: HTMLElement

  /**
   * 应用实例
   * */
  $app: cApp

  constructor(el: HTMLElement, app: cApp) {
    this.$el = el
    this.$app = app

    // 初始化绑定函数
    this.$app._h = h

    if (this.$el) {
      this.compiler(this.$el)
    }

  }

  /**
   * 编译目标
   * */
  private compiler(el: HTMLElement) {
    const template = this.$app.$template || el.innerHTML
    // template AST
    const ast = parse(template)
    // template AST to Js AST
    transform(ast)
    // generate
    const code = generate(ast)

    this.$app.$render = createRenderFunc(code, this.$app)
  }

}

function createRenderFunc(code: string, app: cApp) {
  try {
    return new Function(code).bind(app)
  } catch (e) {
    console.error('create function error.', e)
  }
}

