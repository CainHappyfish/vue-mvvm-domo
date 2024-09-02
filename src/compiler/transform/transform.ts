import { AstNode, CallExp, transformCtx } from '../../../types/compiler'
import { traverseNode } from '../utils'
import { createArrayExpression, createCallExpression, createStringLiteral } from '../parse/ast'

/**
 * 转换函数
 * */
export function transform(ast: AstNode) {
  const ctx: transformCtx = {
    nodeTransforms: [
      transformRoot,
      transformElement,
      transformText,
    ],

    currentNode: null,
    childIndex: 0,
    parent: null,

    replaceNode(node: AstNode) {
      // 找到当前节点在父节点的 children 中的位置 context.childIndex 并替换即可
      if (ctx.parent && ctx.parent.children) {
        ctx.parent.children[ctx.childIndex] = node
        // 更新 currentNode
        ctx.currentNode = node
      } else {
        console.error("children do not exist.")
      }
    },

    removeNode() {
      if (ctx.parent && ctx.parent.children) {
        // 根据当前节点的索引删除当前节点
        ctx.parent.children.splice(ctx.childIndex, 1)
        // 置空 currentNode
        ctx.currentNode = null
      } else {
        console.error("children do not exist.")
      }
    }

  }

  traverseNode(ast, ctx)
}

/**
 * 转换标签节点
 * */
export function transformElement(node: AstNode) {
  // 将转换代码编写在退出阶段的回调函数中，保证该标签节点的子节点全部被处理完毕
  return () => {
    // 不是元素节点则返回
    if (node.type !== "Element") {
      return
    }

    // 创建 h 函数调用语句
    const callExp: CallExp = createCallExpression('h', [
      createStringLiteral(node.tag as string)
    ])

    // 处理 h 函数调用的参数
    if (node.children && node.children[0].jsNode) {
      node.children.length === 1
      // 只有一个子节点则使用 jsNode 作为参数
      ? callExp.arguments.push(node.children[0].jsNode)
      // 有多个子节点则创建 ArrayExpression 作为参数
      : callExp.arguments.push(
          createArrayExpression(node.children.map(c => c.jsNode))
        )
    }

    // 添加到 jsNode
    node.jsNode = callExp

  }

}

/**
 * 转换文本节点
 * */
export function transformText(node: AstNode) {
  // 不是文本节点则不处理
  if (node.type !== 'Text') {
    return
  }

  // 使用 node.content 创建一个 StringLiteral 类型的节点，添加到 node.jsNode 属性下
  node.jsNode = createStringLiteral(node.content as string)
}

/**
 * 转换根节点
 * */
export function transformRoot(node: AstNode) {
  return () => {
    if (node.type !== "Root") {
      return
    }

    // 暂时不考虑模板存在多个根节点
    if (node.children) {
      const vnodeJSAST = (node.children[0] as AstNode).jsNode
      // 创建 render 函数的声明语句节点，将 vnodeJSAST 作为 render 函数体返回语句
      node.jsNode = {
        type: 'FunctionDecl',
        id: { type: "Identifier", name: 'render' },
        params: [],
        body: [
          {
            type: 'ReturnStatement',
            return: vnodeJSAST
          }
        ]

      }

    }




  }
}