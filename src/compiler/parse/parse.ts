import { AstNode, token } from '../../../types/compiler'

/**
 * 状态机状态
 * */
export const State = {

  /**
   * 初始状态
   * */
  initial: 1,

  /**
   * 标签开始状态
   * */
  tagStart: 2,

  /**
   * 标签名称状态
   * */
  tagName: 3,

  /**
   * 文本状态
   * */
  text: 4,

  /**
   * 结束标签状态
   * */
  tagEnd: 5,

  /**
   * 结束标签名称状态
   * */
  tagEndName: 6
}

/**
 * 判断是否是字母
 * */
export function isAlpha(char: string): boolean {
  return char >= 'a' && char <= 'z' || char >= "A" && char <= "Z"
}

/**
 * 接收模板字符串作为参数，并将模板切割为 Token 返回
 * */
export function tokenize(str: string) {

  // 状态机当前状态
  let currentState = State.initial
  // 缓存字符
  const chars: Array<string> = []
  // 存储生成 Token
  const tokens: Array<token> = []

  // 使用while循环开启自动机
  while (str) {
    // 查看第一个字符
    const char: string = str[0]
    // 状态匹配
    switch (currentState) {
      /* 初始状态 */
      case State.initial:
        // 进入标签开始状态
        if (char === '<') {
          currentState = State.tagStart
          // 指向下一个字符
          str = str.substring(1)

        } else if (isAlpha(char)) {
          // 进入文本状态

          currentState = State.text
          // 缓存当前字母
          chars.push(char)
          // 指向下一个字符
          str = str.substring(1)

        }
        break

      /* 标签开始状态 */
      case State.tagStart:
        if (isAlpha(char)) {
          // 进入标签名称状态

          currentState = State.tagName
          // 缓存当前字母
          chars.push(char)
          // 指向下一个字符
          str = str.substring(1)

        } else if (char === '/') {
          // 进入结束标签状态

          currentState = State.tagEnd
          // 指向下一个字符
          str = str.substring(1)
        }
        break

      /* 标签名称状态 */
      case State.tagName:
        if (isAlpha(char)) {
          // 缓存当前字母
          chars.push(char)
          // 指向下一个字符
          str = str.substring(1)

        } else if (char === '>') {
          // 切换初始状态

          currentState = State.initial
          // 创建标签token，存储到tokens中
          tokens.push({
            type: "tag",
            name: chars.join('')
          })
          // 重置缓存
          chars.length = 0
          // 指向下一个字符
          str = str.substring(1)
        }
        break

      /* 文本状态 */
      case State.text:
        if (isAlpha(char)) {
          
          chars.push(char)
          str = str.substring(1)
          
        } else if (char === '<') {
          // 进入标签开始状态
          currentState = State.tagStart
          // 创建文本token
          tokens.push({
            type: "text",
            content: chars.join('')
          })
          // 重置缓存
          chars.length = 0
          // 指向下一个字符
          str = str.substring(1)
        }
        break

      /* 标签结束状态 */
        case State.tagEnd:
          if (isAlpha(char)) {
            currentState = State.tagEndName
            // 缓存当前字母
            chars.push(char)
            // 指向下一个字符
            str = str.substring(1)

          }
          break

      /* 标签结束名称状态 */
        case State.tagEndName:
          if (isAlpha(char)) {

            chars.push(char)
            str = str.substring(1)

          } else if (char === '>') {
            // 切换初始状态
            currentState = State.initial
            // 保存结束标签token
            tokens.push({
              type: 'tagEnd',
              name: chars.join('')
            })
            // 重置缓存
            chars.length = 0
            // 指向下一个字符
            str = str.substring(1)

          }

        
    }
  }
  return tokens

}

/**
 * 构建AST
 * */
export function parse(templateStr: string): AstNode {
  // 获取模板对应token
  const tokens = tokenize(templateStr)
  // 创建Root节点
  const root: AstNode = {
    type: 'Root',
    children: []
  }

  // 创建 elementStack 栈
  const elementStack: AstNode[] = [root]

  // 循环扫描 tokens
  while (tokens.length) {
    // 获取当前栈顶节点作为父节点 parent
    const parent = elementStack[elementStack.length - 1] as AstNode
    // 获取当前 token
    const token = tokens[0]

    switch (token.type) {

      case 'tag':
        // 如果token是开始标签，则创建 Element 类型的AST节点
        const elementNode: AstNode = {
          type: 'Element',
          tag: token.name,
          children: []
        }
        // 添加到父节点的 children
        parent.children?.push(elementNode)
        // 压栈
        elementStack.push(elementNode)
        break

      case 'text':
        // 如果token是文本节点，则创建 Element 类型的AST节点
        const textNode: AstNode = {
          type: 'Text',
          content: token.content
        }
        // 添加到父节点的 children
        parent.children?.push(textNode)
        break

      case 'tagEnd':
        // 结束标签则弹出栈顶元素
        elementStack.pop()
        break
    }

    // 移除处理过的 token
    tokens.shift()

  }

  return root

}

