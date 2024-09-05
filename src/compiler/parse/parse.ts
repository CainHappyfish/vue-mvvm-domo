import { AstNode, parseCtx, token } from '../../../types/compiler'
import { TextModes } from './ast'
import { parseComment, parseElement, parseInterpolation, parseText } from './parseUtils'

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
  // 解析器上下文
  const context: parseCtx = {
    // 模板内容
    source: templateStr,
    // 解析器模式
    mode: TextModes.DATA,

    // 消费指定数量的字符
    advanceBy(num: number) {
      // 截取位置 num 后的模板内容，并替换当前模板内容
      context.source = context.source.slice(num)
    },

    // 清除空白字符
    advanceSpaces() {
      const match = /^[\t\r\n\f ]+/.exec(context.source)
      if (match) {
        // 调用 advanceBy 清除
        context.advanceBy(match[0].length)
      }

    }

  }

  const nodes: AstNode[] = parseChildren(context, [])

  return {
    type: 'Root',
    children: nodes,
  }

}

/**
 * 解析子节点
 * @param ctx - 解析器上下文
 * @param ancestors - 父节点构成节点栈
 * */
export function parseChildren(ctx: parseCtx, ancestors: AstNode[]) {
  // 定义数组存储子节点
  let nodes: Array<any> = []
  const { mode, source } = ctx

  let count = 0
  while(!isEnd(ctx, ancestors)) {
    let node: any
    if (count++ > 20) break
    // DATA RCDATA 模式才支持插值节点的解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有 DATA 模式才支持标签节点解析
      if (mode === TextModes.DATA && source[0] === '<') {
        // console.log("template: ", ctx.source)
        if (source[1] === '!') {
          if (source.startsWith('<!--')) {
            // 注释
            node = parseComment(ctx)
          } else if (source.startsWith('<![CDATA[')) {
            // CDATA
            // node = parseCDATA(ctx, ancestors)
          }
        } else if (/[a-z]/i.test(source[1])) {
          // 标签元素
          // console.log("isTag", /[a-z]/i.test(source[1]))
          node = parseElement(ctx, ancestors)
        } else {
          console.error(`Invalid template ${ctx.source} at ${ctx.source[1]}.`)
        }
      } else if (source[1] === '/') {
        // 结束标签，报错
        console.error(`invalid tag ${ctx.source}`)
        continue

      } else if (source.startsWith('{{')) {
        // 解析插值
        node = parseInterpolation(ctx)
      } else if (/[a-z]/i.test(ctx.source[0])) {
        // 解析文本节点
        console.log("current: ",ctx.source)
        node = parseText(ctx)
      } else {
        console.error(`Invalid template ${ctx.source}`)
      }
    }

    // node 不存在，作为文本处理
    if (!node) {
      // 解析文本节点
      console.log("current: ",ctx.source)

      node = parseText(ctx)
    }

    // 将节点添加到 nodes
    nodes.push(node)

  }

  console.log(nodes)
  return nodes
}

function isEnd(ctx: parseCtx, ancestors: AstNode[]) {
  // 模板内容解析完毕后停止
  if (!ctx.source) return true
  // 获取父级标签节点
  const parent = ancestors[ancestors.length - 1]
  // 如果遇到结束标签，并且该标签与父级标签节点同名，则停止
  if (parent && ctx.source.startsWith(`</${parent.tag}`)) {
    return true
  }

}
