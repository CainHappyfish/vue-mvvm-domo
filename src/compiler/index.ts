import { parse } from './parse'
import { transform } from './transform/transform'
import { generate } from './generate/generate'

export { tokenize } from './parse'

export function compiler(template: any) {
  // template AST
  const ast = parse(template)
  // template AST to Js AST
  transform(ast)
  // generate

}