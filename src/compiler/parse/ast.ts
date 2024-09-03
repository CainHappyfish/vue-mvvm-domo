import { ArrayExp, CallExp, Identifier, StringLiteral } from '../../../types/compiler'

/**
 * 状态表
 * */
export const TextModes = {
  DATA: 'DATA',
  RCDATA: 'RCDATA',
  RAWTEXT: 'RAWTEXT',
  CDATA: 'CDATA'
}

/**
 * 创建 StringLiteral 节点
 * */
export function createStringLiteral(value: string): StringLiteral {
  return {
    type: 'StringLiteral',
    value: value
  }
}

/**
 * 创建 Identifier 节点
 * */
export function createIdentifier(name: string): Identifier {
  return {
    type: 'Identifier',
    name: name
  }
}

/**
 * 创建 ArrayExpression 节点
 * */
export function createArrayExpression(elements: Array<any>): ArrayExp {
  return {
    type: 'ArrayExpression',
    elements: elements
  }
}

/**
 * 创建 CallExpression 节点
 * */
export function createCallExpression(callee: string, args: Array<StringLiteral | CallExp | ArrayExp | Identifier>): CallExp {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments: args
  }
}