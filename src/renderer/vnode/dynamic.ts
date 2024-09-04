import { Block } from '../../../types/renderer'

/**
 * 补丁标志
 * */
export const PatchFlags = {
  TEXT: 1,
  CLASS: 2,
  STYLE: 3
}

// 动态节点栈
const dynamicChildrenStack: Array<Block[]> = []
// 当前动态节点集合
export let currentDynamicChildren: Block[] | undefined = undefined

/**
 * 创建动态节点集合并压栈
 * */
export function openBlock() {
  dynamicChildrenStack.push((currentDynamicChildren = []))
}

/**
 * 通过 openBlock 创建的动态节点集合从栈中弹出
 * */
export function closeBlock() {
  currentDynamicChildren = dynamicChildrenStack.pop()
}