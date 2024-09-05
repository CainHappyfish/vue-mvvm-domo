本文档说明编译器`compiler`部分的数据结构。

![](https://pic.imgdb.cn/item/66d96ae0d9c307b7e98f1d14.jpg)

# 编译器类`Compiler`

```typescript
export class Compiler {
    
  $el: HTMLElement
  $app: cApp

  constructor(el: HTMLElement, app: cApp) {
    this.$el = el
    this.$app = app

    // 初始化绑定函数
    this.$app._h = h

    if (this.$el) {
      this.compiler(this.$el)
    }

  }

  private compiler(el: HTMLElement) {
    const template = this.$app.$template || el.innerHTML
    // template AST
    const ast = parse(template)
    // template AST to Js AST
    transform(ast)
    // generate
    const code = generate(ast)

    this.$app.$render = createRenderFunc(code, this.$app)
  }

}
```

`Compiler`类用于将模板编译成渲染函数。调用构造时初始化各个成员变量，并对传入编译器的模板进行编译。

成员变量：

- `$el`：需编译的元素
- `$app`：调用编译器的应用实例
- `compiler(el: HTMLElement)`：用于编译 HTML 生成渲染函数。如果应用实例中存在模板，则使用模板作为编译对象，否则使用传入编译器的模板`$el`。

# 解析器`parse`

## `AstNode`

```typescript
export interface AstNode {
  type: string
  tag?: string
  content?: string

  props?: Array<any>

  children?: AstNode[]

  jsNode?: CallExp | ArrayExp | StringLiteral | Identifier | FunctionDecl

  isSelfClosing?: boolean
}
```

`AstNode`是模板经过解析后生成的模板AST节点，也是后续转换器的输入数据结构。

成员变量：

- `type`：节点类型，可以是根节点`Root`，标签元素节点`Element`，文本`Text`，注释`Comment`以及指令节点`Directive`（`c-if, c-for`等）
- `tag`：标签名，如果是`Element`则有该属性
- `content`：文本内容，如果是文本或注释节点则有该成员
- `props`：标签属性，如果是`Element`且有属性值则有该成员
- `props`：子节点
- `jsNode`：模板 AST 对应的 JS AST
- `isSelfClosing`：自闭合标识

```
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
```

# 转换器`transform`

## `JsAstNode`

```typescript
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
```

`JsAstNode`是模板 AST 转为 JS AST 的节点，用来描述和构造渲染函数。

成员变量：

- `type`：节点类型，可以是函数声明`FunctionDecl`等
- `id`：函数名称，它是一个标识符 Identifier。
- `params`：函数的参数，它是一个数组。
- `body`：函数体，由于函数体可以包含多个语句，因此它也是一个数组。一个语句对应一个 DOM 元素
- `return`：渲染函数的返回值

### `Identifier`

```typescript
export interface Identifier {
  type: 'Identifier'
  name: string
}
```

`Identifier`标识符用于标识元素标签的函数调用，记录函数名称。

### `CallExp`

```typescript
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
```

`CallExp`用于描述函数调用语句。

成员变量：

- `callee`：用来描述被调用函数的名字称，它本身是一个标识符节点。
- `arguments`：被调用函数的形式参数，多个参数的话用数组来描述。

### `ArrayExp`

```typescript
export interface ArrayExp {
  type: "ArrayExpression"
  elements: Array<any>
}
```

`ArrayExp`用于描述数组。

成员变量

- `elements`：数组元素。

### `StringLiteral`

```typescript
export interface StringLiteral {
  type: "StringLiteral"
  value: string
}
```

`StringLiteral`用于描述字符串字面量。

成员变量：

- `value`：字符串的值。

# 生成器

```typescript
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
```

`generateCtx`是生成器函数上下文，用于提供代码生成时需要的函数以及存储由 JS AST 生成的代码。

成员变量：

- `code`： JS AST 生成的渲染函数代码
- `push`：拼接函数
- `currentIndent`：当前生成代码缩进
- `newline`：代码换行函数
- `indent`：缩进函数
- `deIndent`：取消缩进