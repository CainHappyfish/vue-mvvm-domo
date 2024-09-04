import { closeBlock, currentDynamicChildren } from './dynamic'
import { Block, ComponentInstance, componentOptions, FuncComponent, VNode } from '../../../types/renderer'
import { resolveProps } from '../props'
import { shallowReadonly } from '../../reactivity/reactive'
import { setCurrentInstance } from '../../components/component'

/**
 * 自闭合标签
 * */
const VOID_TAGS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

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

/**
 * 将虚拟节点 VNode 渲染为字符串
 * */
export function renderElementVNode(vnode: VNode) {
  // 取出标签名称和标签属性、子节点
  const { type: tag , props, children } = vnode
  // 判断是否是自闭合标签
  const isVoidElement = VOID_TAGS.includes(tag as string)
  // 开始标签的头部
  let ret = `<${tag}`
  // 处理标签属性
  if (props) {
    for (const key in props){
      // key = "value"形式拼接
      ret += `${key}=${props[key]}`
    }
  }
  // 闭合开始标签，如果是 void element，则自闭合
  ret += isVoidElement ? '/>' : '>'
  // void element没有子节点，直接返回
  if (isVoidElement) { return ret }

  // 处理子节点
  // 子节点类型是字符串则是文本内容，直接拼接
  if (typeof children === 'string') {
    ret += children
  } else if (Array.isArray(children)) {
    // 如果子节点类型是数组则递归
    children.forEach((child: VNode) => {
      ret += renderElementVNode(child)
    })
  }

  // 结束标签
  ret += `</${tag}>`

  return ret

}

/**
 * 将组件渲染为 HTML
 * */
export function renderComponentVNode(vnode: VNode) {
  // 检查是否是函数式组件
  const isFunctional = typeof vnode.type === 'function'

  // 获取组件
  let componentOptions = vnode.type as componentOptions
  // 如果是函数式组件，则将compVNode.type作为渲染函数
  // 将compVNode.type.props作为props选项
  if (isFunctional) {
    componentOptions.render = vnode.type as FuncComponent
    componentOptions.props = (vnode.type as FuncComponent).props as Record<string, any>
  }

  // 获取组件渲染函数与props定义
  let { render, data, setup, props: propsOption, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated } = componentOptions

  // 创建实例前钩子
  beforeCreate && beforeCreate()

  // 无须使用 reactive() 创建 data 的响应式版本
  const state = data ? data() : undefined
  const [props, attrs] = resolveProps(propsOption, vnode.props)

  const slots = vnode.children || {}

  // 创建实例
  const instance: ComponentInstance = {
    // 状态数据data
    state,
    // 这里 props 无须 shallowReactive
    props,
    // 是否挂载
    isMounted: false,
    // 渲染内容subTree
    subTree: null,
    // 插槽
    slots: slots,
    // 生命周期函数
    mounted: [],
    unmounted: [],

    // keepAlive
    keepAliveCtx: undefined
  }

  function emit(event: string, ...payload: any[]) {
    const eventName =`on${event[0].toUpperCase() + event.slice(1)}`
    // 根据处理后的事件名去寻找对用的事件处理函数
    const handler = instance.props[eventName]
    if (handler) {
      handler(...payload)
    } else {
      console.error(`[${eventName}] ${eventName} does not exist`)
    }
  }

  // setupContext
  const setupContext = { attrs, emit, slots }
  // setupState用于存储由setup返回的数据
  let setupState: any | null = null

  // 在调用setup函数前设置当前组件实例
  setCurrentInstance(instance)
  // 处理setup相关
  if (setup) {
    // 调用setup函数
    // 将只读版本的 props 作为第一个参数传递，避免用户意外地修改 props 的值
    // 将setupContext作为第二个参数
    const setupResult = setup(shallowReadonly(instance.props), setupContext)
    // setup返回函数，将其作为渲染函数
    if (typeof setupResult === 'function') {
      if (render) {
        // 如果存在渲染函数，则报告冲突错误
        console.error('render conflicts')
        // 将setupResult作为渲染函数
        render = setupResult
      } else {
        // 否则作为数据状态赋值给setupState
        setupState = setupResult
      }
    }
    // 执行完成后重置currentInstance
    setCurrentInstance(null)
  }

  // 将组件实例设置到vnode上，用于后续更新
  vnode.component = instance

  // 创建渲染上下文对象，本质是组件实例的代理
  const renderContext = new Proxy(instance, {
    get(target, key) {
      const { state, props, slots } = target

      // 如果key值为$slots，直接返回对应插槽
      if (key === "$slots") return slots

      // 先尝试读取自身状态数据
      if (state && key in state) {
        return state[key]
      } else if (key in props) {
        return props[key]
      } else {
        console.error('state does not exist')
      }
    },
    set (target, key, value) {
      const { state, props } = target
      if (state && key in state) {
        state[key] = value
        return true
      } else if (key in props) {
        console.warn(`Attempting to mutate prop "${String(key)}". Props are readonly.`)
        return false
      } else if (setupState && key in setupState) {
        // setupState处理
        setupState[key] = value
        return true
      } else {
        console.error('state does not exist')
        return false
      }
    }
  })

  // 完成创建钩子
  created && created.call(renderContext)

  const subTree = render?.call(renderContext, renderContext)

  return renderVNode(subTree)
}

/**
 * 通用渲染函数
 * */
export function renderVNode(vnode: VNode) {
  const type = typeof vnode.type
  if (type === 'string') {
    return renderElementVNode(vnode)
  } else if (type === 'object' || type === 'function') {
    return renderComponentVNode(vnode)
  } else if (vnode.type === Text) {
    // 处理文本
  } else if (vnode.type === 'Fragment') {
    // 处理片段
  } else {

  }
}