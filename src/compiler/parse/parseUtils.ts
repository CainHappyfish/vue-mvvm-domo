import { AstNode, parseCtx } from '../../../types/compiler'
import { parseChildren } from './parse'
import { TextModes } from './ast'

/**
 * 命名字符引用表
 * */
export const namedCharacterReferences = {
  "gt": ">",
  "gt;": ">",
  "lt": "<",
  "lt;": "<",
  "ltcc;": "⪦"

}

/**
 * 替换码点表
 * */
const CCR_REPLACEMENTS = {
  0x80: 0x20ac,
  0x82: 0x201a,
  0x83: 0x0192,
  0x84: 0x201e,
  0x85: 0x2026,
  0x86: 0x2020,
  0x87: 0x2021,
  0x88: 0x02c6,
  0x89: 0x2030,
  0x8a: 0x0160,
  0x8b: 0x2039,
  0x8c: 0x0152,
  0x8e: 0x017d,
  0x91: 0x2018,
  0x92: 0x2019,
  0x93: 0x201c,
  0x94: 0x201d,
  0x95: 0x2022,
  0x96: 0x2013,
  0x97: 0x2014,
  0x98: 0x02dc,
  0x99: 0x2122,
  0x9a: 0x0161,
  0x9b: 0x203a,
  0x9c: 0x0153,
  0x9e: 0x017e,
  0x9f: 0x0178
}


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
  // 消费注释的开始部分
  context.advanceBy('<!--'.length)
  // 找到结束索引
  const closeIndex = context.source.indexOf("-->")
  if (closeIndex < 0) {
    console.error(`${context.source} is lack of '-->'`)
  }
  // 截取开始定界符于结束定界符之间的内容作为注释内容
  const content = context.source.slice(0, closeIndex)
  // 消费表达式的内容
  context.advanceBy(content.length)
  // 消费结束定界符
  context.advanceBy("-->".length)

  // 返回类型为 Interpolation 的节点，代表插值节点
  return {
    type: 'Comment',
    content
  }
}

/**
 * CDATA解析
 * */
// export function parseCDATA(context: parseCtx, ancestors: AstNode[]) {
//
// }

/**
 * 插值节点解析
 * */
export function parseInterpolation(context: parseCtx) {
  // 消费开始界定符号
  context.advanceBy('{{'.length)
  // 找到结束定界符的位置索引
  const closeIndex = context.source.indexOf("}}")
  if (closeIndex < 0) {
    console.error(`${context.source} is lack of '}}'`)
  }
  // 截取开始定界符于结束定界符之间的内容作为插值表达式
  const content = context.source.slice(0, closeIndex)
  // 消费表达式的内容
  context.advanceBy(content.length)
  // 消费结束定界符
  context.advanceBy("}}".length)

  // 返回类型为 Interpolation 的节点，代表插值节点
  return {
    type: 'Interpolation',
    content: {
      type: "Expression",
      content: decodeHTML(content)
    }
  }


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

/**
 * 命名字符引用解码
 * */
export function decodeHTML(rawText: string, asAttr = false) {

  // 当前被消费长度
  let offset = 0
  const end = rawText.length
  // 解码后的文本
  let decodedText = ''
  // 引用表中实体名称的最大长度
  let maxCRNameLength = 0

  // advance 函数用于消费指定长度的文本
  function advance(length: number) {
    offset += length
    rawText = rawText.slice(length)
  }

  while (offset < end) {
    // 匹配字符串引用的开始部分
    // & 命名字符引用
    // &# 十进制数字字符引用
    // &#* 十六进制数字字符引用
    const head = /&(?:#x?)?/i.exec(rawText)
    // 没有匹配则说明不需要继续解码了
    if (!head) {
      // 计算剩余内容
      const remain = end - offset
      // 将剩余内容加到 decodedText 上
      decodedText += rawText.slice(0, remain)
      // 消费剩余内容
      advance(remain)
      break
    }

    // head.index 为匹配的字符 & 在 rawText 中的位置索引
    // 截取字符 & 之前的内容加到 decodedText 上
    decodedText += rawText.slice(0, head.index)
    // 消费字符 & 之前的内容
    advance(head.index)

    // 如果满足条件则是命名字符引用，否则为数字字符引用
    if (head[0] === '&') {
      let name = ''
      let value: string | undefined = undefined
      // 字符 & 的下一个字符必须是 ASCII 字母或数字
      if (/[0-9a-z]/i.test(rawText[1])) {
        // 根据引用表计算实体名称的最大长度
        if (!maxCRNameLength) {
          maxCRNameLength = Object.keys(namedCharacterReferences).reduce(
            (max, name) => Math.max(Number(max), name.length), 0
          )
        }

        // 从最大长度开始对文本进行截取，并尝试去引用表中找到对应的项
        for (let length = maxCRNameLength; !value && length > 0 ; length--) {
          name = rawText.substring(1, length)
          value = namedCharacterReferences[name]
        }

        if (value) {
          const semi = name.endsWith(";")

          // 如果解码的文本作为属性值，最后一个匹配的字符不是分号，
          // 并且最后一个匹配字符的下一个字符是等于号（=）、ASCII 字母或
          // 数字，
          // 由于历史原因，将字符 & 和实体名称 name 作为普通文本
          if (asAttr && !semi &&
              /[=a-z0-9]/i.test(rawText[name.length + 1] || '')
          ) {

            decodedText += '&' + name
            advance(1 + name.length)

          } else {
            // 其他情况正常使用解码后的内容拼接到 decodedText
            decodedText += value
            advance(1 + name.length)
          }

        } else {
          // 没找到对应值，解码失败
          decodedText += '&' + name
          advance(1 + name.length)
        }

      } else {
        // 如果字符 & 的下一个字符不是 ASCII 字母或数字，则将字符 & 作为普通文本
        decodedText += '&'
        advance(1)
      }
    } else {
      // 判断十进制还是十六进制
      const hex = head[0] === '&#x'
      const pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/i

      // body[1] 的值就是 Unicode 码点
      const body = pattern.exec(rawText)
      // 调用 String.fromCodePoint 解码
      if (body) {
        let cp = parseInt(body[1], hex ? 16 : 10)

        // 检查合法性
        if (cp === 0) {
            // 如果码点值为 0x00，替换为 0xfffd
            cp = 0xfffd
        } else if (cp > 0x10ffff) {
            // 如果码点值超过 Unicode 的最大值，替换为 0xfffd
            cp = 0xfffd
        } else if (cp >= 0xd800 && cp <= 0xdfff) {
            // 如果码点值处于代理对 surrogate pair 范围内，替换为 0xfffd
            cp = 0xfffd
        } else if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
            // 如果码点值处于 noncharacter 范围内，则什么都不做，交给平台处理
            // noncharacter 代表 Unicode 永久保留的码点，用于 Unicode 内部
        } else if (
          // 控制字符集的范围是：[0x01, 0x1f] 加上 [0x7f, 0x9f]
            // 去掉 ASICC 空白符：0x09(TAB)、0x0A(LF)、0x0C(FF)
            // 0x0D(CR) 虽然也是 ASICC 空白符，但需要包含
            (cp >= 0x01 && cp <= 0x08) || cp === 0x0b ||
            (cp >= 0x0d && cp <= 0x1f) || (cp >= 0x7f && cp <= 0x9f)
        ) {
            // 在 CCR_REPLACEMENTS 表中查找替换码点，如果找不到，则使用原码点
            cp = CCR_REPLACEMENTS[cp] || cp
        }
        // 最后进行解码，追加到 decodedText 上
        const char = String.fromCodePoint(cp)
        decodedText += char

        // 消费整个数字字符引用的内容
        advance(body[0].length)

      } else {
        // 如果没有匹配，则不进行解码操作，只是把 head[0] 追加到decodedText 上并消费
        decodedText += head[0]
        advance(head[0].length)
      }
    }


  }

  return decodedText

}



