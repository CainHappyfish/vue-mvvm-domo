/**
 * token结构
 * */
export interface token {

  /**
   * 标签类型
   * */
  type: string

  /**
   * 标签名称，标签token使用
   * */
  name?: string

  /**
   * 文本内容，文本token使用
   * */
  content?: string

}

/**
 * AST节点
 * */
export interface AstNode {
  type: string
  tag?: string
  content?: string

  /**
   * 标签属性
   * */
  props?: Array<any>

  /**
   * 子节点
   * */
  children?: AstNode[]

  /**
   * 对应的 Js Ast 节点
   * */
  jsNode?: CallExp | ArrayExp | StringLiteral | Identifier | FunctionDecl

  /**
   * 是否自闭合
   * */
  isSelfClosing?: boolean
}

/**
 * ast遍历转换上下文
 * */
export interface transformCtx {
  /**
   * 转换函数组
   * */
  nodeTransforms: Array<Function>

  /**
   * 当前转换节点
   * */
  currentNode: AstNode | null

  /**
   * 当前节点在父节点的 children 中的位置索引。
   * */
  childIndex: number

  /**
   * 当前节点父节点
   * */
  parent: AstNode | null

  /**
   * 节点替换函数
   * */
  replaceNode: (node: AstNode) => void

  /**
   * 节点移除函数
   * */
  removeNode: () => void

}

/**
 * js AST 节点
 * */
export interface JsAstNode {

  type: string

  /**
   * 标识符
   * */
  id?: Identifier

  /**
   * 函数参数
   * */
  params?: Array<JsAstNode>

  /**
   * 函数体
   * */
  body?: Array<JsAstNode>

  /**
   * 返回值
   * */
  return?: any

}

export interface Identifier {

  type: 'Identifier'
  name: string

}

/**
 * 函数声明
 * */
export interface FunctionDecl extends JsAstNode{

  type: 'FunctionDecl'


}


/**
 * 函数调用结构
 * */
export interface CallExp {

  type: "CallExpression"

  /**
   * 用来描述被调用函数的名字称，它本身是一个标识符节点
   * */
  callee: Identifier

  /**
   * 被调用函数的形式参数
   * */
  arguments: Array<StringLiteral | CallExp | ArrayExp | Identifier | FunctionDecl>

}

/**
 * 字符串字面量
 * */
export interface StringLiteral {

  type: "StringLiteral"

  value: string

}

/**
 * 数组
 * */
export interface ArrayExp {

  type: "ArrayExpression"

  /**
   * 数组元素
   * */
  elements: Array<any>
}

/**
 * 代码生成上下文
 * */
export interface generateCtx {

  /**
   * 渲染函数代码
   * */
  code: string

  /**
   * 拼接函数
   * */
  push: (code) => any

  /**
   * 代码缩进
   * */
  currentIndent: number

  /**
   * 代码换行
   * */
  newline: () => any

  /**
   * 代码缩进，即让 currentIndent 自增后，调用换行函数
   * */
  indent: () => any

  /**
   * 取消缩进，即让 currentIndent 自减后，调用换行函数
   * */
  deIndent: () => any

}

/**
 * 解析器上下文
 * */
export interface parseCtx {
  /**
   * 模板内容
   * */
  source: string

  /**
   * 解析器模式
   * */
  mode: string

  /**
   * 取用指定数量字符函数
   * */
  advanceBy: (number) => any

  /**
   * 匹配空白字符串
   * */
  advanceSpaces: () => any

}




