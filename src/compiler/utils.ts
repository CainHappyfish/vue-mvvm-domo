import { AstNode, transformCtx } from '../../types/compiler'

/**
 * 打印当前AST节点信息
 * */
export function dump(node: AstNode, indent = 0) {
  const type = node.type

  const desc = type === 'Root'
  ? ''
  : type === 'Element'
    ? node.tag
    : node.content

  // 打印节点信息
  console.log(`${'-'.repeat(indent)}${type}: ${desc}`)

  // 递归打印
  if (node.children) {
    node.children.forEach((child: AstNode) => {dump(child, indent + 2)})
  }
}

/**
 * 深度优先遍历AST
 * */
export function traverseNode(ast: AstNode, ctx: transformCtx) {
  ctx.currentNode = ast
  // 退出阶段的回调函数数组
  const exitFns: Array<Function> = []

  // 有子节点则递归调用
  const children = ast.children
  // 获取转换函数
  const transforms = ctx.nodeTransforms

  transforms.forEach(trans => {
    // 存储退出阶段的回调函数
    const onExit = trans(ctx.currentNode, ctx)
    if (onExit) {
      exitFns.push(onExit)
    }
    trans(ast, ctx)
    // 节点被删除则返回
    if (!ctx.currentNode) { return }
  })

  if (children) {
    children.forEach((child: AstNode) => {
      // 设置父节点
      ctx.parent = ast
      // 设置索引
      ctx.childIndex = children.indexOf(child)
      traverseNode(child, ctx)
    })
  }

  // 处理退出阶段回调函数，反序执行
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}


