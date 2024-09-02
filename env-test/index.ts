import { parse } from '../src/compiler/parse'
import { dump } from '../src/compiler/utils'
import { transform, transformElement } from '../src/compiler/transform/transform'
import { generate } from '../src/compiler/generate/generate'
import { JsAstNode } from '../types/compiler'

const template = '<div><p>Test</p><p>MVVM</p></div>'
const ast = parse(template)

transform(ast)
const code = generate(ast.jsNode as JsAstNode)
console.log(code)