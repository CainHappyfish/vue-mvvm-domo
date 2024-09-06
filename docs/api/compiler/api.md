本文档编译器`compiler`部分的API文档。

![](https://pic.imgdb.cn/item/66da5f1ed9c307b7e9a9a913.png)

# 解析器

## `parse`

签名：`parse(templateStr: string): AstNode`

用于将传入的模板字符串转为模板 AST。

示例：

```typescript
const template = "<div><p>TEST<p></div>"

const ast = parse(template)
```

`parse`函数中指定了解释器上下文，并调用`parseChildren`递归遍历子节点以生成模板 AST。

## `parseChildren`

签名：`function parseChildren(ctx: parseCtx, ancestors: AstNode[])`

用于递归解析子节点。

`parseChildren`中调用`isEnd`判断解析是否结束，并根据不同文本模式对不同类型元素进行解析，最后返回解析后的模板节点。

## `parseElement`

签名：`function parseElement(context: parseCtx, ancestors: AstNode[]): AstNode`

用于解析元素。

`parseElement`调用`parseTag`解析标签，根据得到的标签切换到正确的文本模式，并对处理后的元素递归，返回处理后的元素。

## `parseInterpolation`

签名：`function parseInterpolation(context: parseCtx): AstNode`

用于解析诸如`{{ foo }}`的插值元素。

# 转换器

## `transform`

签名：`function transform(ast: AstNode)`

用于将传入的模板 AST 转为 JS AST 。

示例：

```typescript
const ast = parse(template)

transform(ast)
```

`transform`定义转换器上下文，并调用`traverseNode`函数深度优先遍历模板 AST ，将其转换为 JS AST 。

注意，目前不支持模板存在多个根节点的情况。

# 代码生成

## `generate`

签名：`function generate(node: JsAstNode): string`

`generate`函数根据传入的 JS AST 生成对应的渲染函数。

示例：

```typescript
const ast = parse(template)

transform(ast)

const code = generate(ast)
```

`generate`函数定义生成器上下文，调用`genNode`函数分别处理各种 JS AST 节点情况，最终根据 JS AST 生成对应的渲染函数

。