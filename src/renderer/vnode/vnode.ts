import { closeBlock, currentDynamicChildren } from './dynamic'
import { Block } from '../../../types/renderer'

export function createVNode(
  tag: string,
  props: Record<symbol | string, any>,
  children: Array<any>,
  patchFlag?: number
) {
  const key = props && props.key
  props && delete props.key

  const vnode: Block = {
    tag,
    props,
    children,
    key,
    PatchFlag: patchFlag
  }

  if (typeof patchFlag !== 'undefined' && currentDynamicChildren) {
    currentDynamicChildren.push(vnode)
  }

  return vnode

}

/**
 * 创建动态节点Block
 */
export function createBlock(
  tag: string,
  props: Record<symbol | string, any>,
  children: Array<any>
) {
  const block = createVNode(tag, props, children)
  block.dynamicChildren = currentDynamicChildren

  // 关闭 Block
  closeBlock()
  return block
}