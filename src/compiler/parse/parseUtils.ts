import { AstNode, parseCtx } from '../../../types/compiler'
import { parse, parseChildren } from './parse'
import { TextModes } from './ast'

/**
 * 标签解析
 * */
export function parseElement(context: parseCtx, ancestors: AstNode[]) {
  const element = parseTag(context) as AstNode
  if (element.isSelfClosing) return element

  // 切换到正确的文本模式
  if (element.tag === 'textarea' || element.tag ==='title') {
    // 解析得到的标签是 <textarea> 或 <title> 切换RCDATA模式
    context.mode = TextModes.RCDATA
  } else if (/style | xmp | iframe | noembed | noframes | noscipt/.test(element.tag as string)) {
    // 上述情况切换 RAWTEXT
    context.mode = TextModes.RAWTEXT
  } else {
    // 其他情况切换到 DATA 模式
    context.mode = TextModes.DATA
  }

  ancestors.push(element)
  // 递归地调用 parseChildren 函数进行标签子节点的解析
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (context.source.startsWith(`</${element.tag}`)) {
    parseTag(context, 'end')
  } else {
    // 缺少闭合标签
    console.error(`${element.tag} is lack of end tag.`)
  }

  return element

}

/**
 * 注释解析
 * */
export function parseComment(context: parseCtx) {

}

/**
 * CDATA解析
 * */
export function parseCDATA(context: parseCtx, ancestors: AstNode[]) {

}

/**
 * 插值节点解析
 * */
export function parseInterpolation(context: parseCtx) {

}

/**
 * 文本解析
 * */
export function parseText(context: parseCtx) {
  // endIndex为文本内容结尾索引
  // 默认将整个莫欧版剩余内容都作为文本内容
  let endIndex = context.source.length
  // 寻找 <
  const ltIndex = context.source.indexOf('<')
  // 寻找 {{
  const delimiterIndex = context.source.indexOf('{{')

  // 取 ltIndex 和当前 endIndex 中较小的作为结尾索引
  if (ltIndex > -1 && ltIndex < endIndex) {
    endIndex = ltIndex
  }

  // delimiterIndex同理
  if (delimiterIndex > -1 && delimiterIndex < endIndex) {
    endIndex = delimiterIndex
  }

  const content = context.source.slice(0, endIndex)

  return {
    type: 'Text',
    content
  }

}

/**
 * 解析开始标签
 * */
export function parseTag(context: parseCtx, type = 'start'): AstNode | undefined {
  const { advanceBy, advanceSpaces } = context

  // 处理开始标签和结束标签
  const match = type === 'start'
    // 开始标签
    ? /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
    // 结束标签
    : /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source)

  // 匹配成功正则表达式第一个捕获组的值就是标签名称
  if (match) {
    const tag = match[1]
    // 清除正则表达式匹配的全部内容
    advanceBy(match[0])
    advanceSpaces()

    // 获取props
    const props = parseAttributes(context)

    // 如果消除后字符串以 /> 开头则是自闭合标签
    const isSelfClosing = context.source.startsWith("/>")
    // 如果是自闭合标签，则消费 '/>'， 否则消费 '>'
    advanceBy(isSelfClosing ? 2 : 1)

    // 返回标签节点
    return {
      type: 'Element',
      tag: tag,
      props: props,
      children: [],
      isSelfClosing: isSelfClosing
    }

  } else {
    console.error("tag does not match.")
    return
  }
}

/**
 * 解析标签属性
 * */
export function parseAttributes(context: parseCtx) {

  const { advanceBy, advanceSpaces } = context
  // 存储属性和指令节点
  const props: any[] = []

  while (!context.source.startsWith('>') &&
        !context.source.startsWith('/>')) {
    // 正则匹配名称
    const match = /^[\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)

    if (match) {
      // 获取属性名称
      const name = match[0]

      // 消费属性名
      advanceBy(name.length)
      // 消除空白字符
      advanceSpaces()
      // 消费 =
      advanceBy(1)
      // 消费空白字符
      advanceSpaces()

      // 属性值
      let value = ''

      // 获取当前模板内容的第一个字符
      const quote = context.source[0]
      // 判断属性值是否被引号引用
      const isQuoted = quote === '"' || quote === "'"

      if (isQuoted) {
        // 属性值被引号引用，消费引号
        advanceBy(1)
        // 获取下一个引号索引
        const endQuoteIndex = context.source.indexOf(quote)
        if (endQuoteIndex > -1) {
          // 获取属性值
          value = context.source.slice(0, endQuoteIndex)
          // 消费属性值
          advanceBy(value.length)
          // 消费引号
          advanceBy(1)
        } else {
          console.error(`${context.source}: Missing quote`)
        }
      } else {
        // 属性值没有被引号引用
        const match = /^[^\t\r\n\f >]+/.exec(context.source)
        if (match) {
          // 获取属性值
          value = match[0]
          // 消费属性值
          advanceBy(value.length)
        } else {
          console.error(`${context.source} can not match.`)
        }

      }

      // 消费空白字符
      advanceSpaces()

      // 创建属性节点，添加到props中
      props.push({
        type: 'Attribute',
        name,
        value
      })

    } else {
      console.error(`${context.source} can not match.`)
    }
  }

  return props
}



