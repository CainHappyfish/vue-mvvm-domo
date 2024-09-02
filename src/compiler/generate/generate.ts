import {
  ArrayExp,
  CallExp,
  FunctionDecl,
  generateCtx,
  Identifier,
  JsAstNode,
  StringLiteral
} from '../../../types/compiler'

export function generate(node: JsAstNode) {
  const context: generateCtx = {
    // 存储最终生成的渲染代码
    code: '',
    push(code: string) {
      context.code += code
    },

    currentIndent: 0,

    newline() {
      context.code += '\n' + `  `.repeat(context.currentIndent)
    },

    indent() {
      context.currentIndent++
      context.newline()
    },

    deIndent() {
      context.currentIndent--
      context.newline()
    }

  }

  // 代码生成
  genNode(node, context)

  // 返回渲染函数代码
  return context.code

}

function genNode(node: JsAstNode | ArrayExp | FunctionDecl | CallExp | StringLiteral, context: generateCtx) {
  switch (node.type) {

    case 'FunctionDecl':
      genFunctionDecl(node as FunctionDecl, context)
      break

    case 'ReturnStatement':
      genReturnStatement(node, context)
      break

    case 'CallExpression':
      genCallExpression(node as CallExp, context)
      break

    case 'StringLiteral':
      genStringLiteral(node as StringLiteral, context)
      break

    case 'ArrayExpression':
      genArrayExpression(node as ArrayExp, context)
      break

  }
}

/**
 * 函数声明生成
 * */
function genFunctionDecl(node: FunctionDecl, context: generateCtx) {
  const { push, indent, deIndent} = context

  push(`function ${(node.id as Identifier).name}`)
  push(`(`)
  // 调用 genNodeList
  genNodeList(node.params as any[], context)
  push(`) {`)
  // 缩进
  indent();
  // 递归为函数体生成代码
  (node.body as JsAstNode[]).forEach((n: JsAstNode) => genNode(n, context))
  // 取消缩进
  deIndent()
  push('}')
}

/**
 * 为函数的参数生成代码
 * */
function genNodeList(params: Array<JsAstNode>, context: generateCtx) {
  const { push } = context
  for (let i = 0 ; i < params.length ; i++) {
    const param = params[i]
    genNode(param, context)

    if (i < params.length - 1) {
      push(', ')
    }

  }
}

/**
 * 返回函数语句生成
 * */
function genReturnStatement(node: JsAstNode, context: generateCtx) {
  const { push } = context
  push('return ')
  genNode(node.return, context)
}

/**
 * 函数调用生成
 * */
function genCallExpression(node: CallExp, context: generateCtx) {
  const { push } = context
  // 获取被调用函数名称和参数
  const { callee, arguments: args } = node
  push(`${callee.name}(`)
  genNodeList(args, context)
  push(')')

}

/**
 * 字符串字面量生成
 * */
function genStringLiteral(node: StringLiteral, context: generateCtx) {
  const { push } = context
  push(`${node.value}`)
}

/**
 * 数组生成
 * */
function genArrayExpression(node: ArrayExp, context: generateCtx) {
  const { push } = context
  push('[')
  genNodeList(node.elements, context)
  push(']')
}

