import { ComponentInstance, componentOptions, Container, VNode } from '../../types/renderer'
import { patch } from './patch'
import { reactive, shallowReactive, shallowReadonly } from '../reactivity/reactive'
import { watchEffect } from '../core'
import { EffectFunction } from '../../types/watchEffect'
import { resolveProps } from './props'

// 存储当前正在被初始化的组件实例
let currentInstance: ComponentInstance | null = null

/**
 * 组件挂载函数
 * */
export function mountComponent(compVNode: VNode, container: Container, anchor?: Node | null) {
  // 获取组件
  const componentOptions = compVNode.type as componentOptions
  // 获取组件渲染函数与props定义
  let { render, data, setup, props: propsOption, beforeCreate, created, beforeMount, mounted, beforeUpdate, updated } = componentOptions

  // 创建实例前钩子
  beforeCreate && beforeCreate()

  // 调用data函数获取原始数据，并包装为响应式
  const state = reactive(data())
  // 获取props, attrs
  const [props, attrs] = resolveProps(propsOption, compVNode.props)
  // 使用编译好的compVNode.children作为slot对象
  const slots = compVNode.children || {}

  // 组件实例
  const instance: ComponentInstance = {
    // 状态数据data
    state,
    // 将解析出的 props 数据包装为 shallowReactive 并定义到组件实例上
    props: shallowReactive(props),
    // 是否挂载
    isMounted: false,
    // 渲染内容subTree
    subTree: null,
    // 插槽
    slots: slots,
    // 生命周期函数
    mounted: []
  }

  /**
   * emit事件传递函数
   * @param {string} event - 事件名称
   * @param {any[]} payload - 传递给事件处理函数的参数
   * */
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
  compVNode.component = instance

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

  watchEffect(() => {
    // 执行渲染函数，获取组件要渲染的内容，即 render 函数返回的虚拟ODM
    // 调用时将this设置为state，从而render函数内部可以使用this访问组件自身状态数据
    const subTree = render.call(state, state)

    if (!instance.isMounted) {

      // 挂载前钩子
      beforeMount && beforeMount().call(state)

      // 初次挂载组件subTree
      patch(undefined, subTree, container, anchor)
      // 将组件实例的 isMounted 设置为 true，这样当更新发生时就不会再次进行挂载操作
      instance.isMounted = true

      // 完成挂载钩子
      mounted && mounted.call(state)

    } else {
      // 已被挂载，更新

      // 更新前钩子
      updated && updated.call(state)

      patch(instance.subTree as VNode, subTree, container, anchor)

      // 更新后钩子
      beforeUpdate && beforeUpdate.call(state)
    }
      instance.subTree = subTree

  }, {
    scheduler: queueJob
  })

}

// 任务缓存序列，使用Set自动去重
const queue = new Set<EffectFunction>()
// 是否正在刷新队列
let isFlushing = false
// 立即resolve的Promise
const p = Promise.resolve()

/**
 * 任务调度函数
 * */
function queueJob(job: EffectFunction) {
  // 将任务存入任务队列
  queue.add(job)
  // 如果还没开始刷新，则进行刷新
  if (!isFlushing) {
    // 设置标识为true避免重复刷新
    isFlushing = true
    // 在微任务中刷新缓冲队列
    p.then(() => {
      try {
        // 执行任务
        queue.forEach((job: EffectFunction) => job())
      } finally {
        // 重置状态
        isFlushing = false
        queue.clear()
      }
    })
  }
}

/**
 * 组件更新函数
 * */
export function patchComponent(oldVNode: VNode, newVNode: VNode) {
  // 获取组件实例，同时也然后给新组件虚拟节点指向组件实例
  const instance = ((newVNode as VNode).component = (oldVNode as VNode).component)
  // 获取当前props
  if (instance) {
    const { props } = instance
    if (hasPropsChanged(oldVNode, newVNode)) {
      // 调用resolveProps重新获取props数据
      const [ newProps ] = resolveProps((newVNode.type as componentOptions).props, newVNode.props)
      // 更新props
      for (const k in newProps) {
        props[k] = newProps[k]
      }
      // 删除不存在的props
      for (const k in props) {
        if (!(k in newProps)) {
          delete props[k]
        }
      }
    }
  } else {
    console.error("instance does not exist.", oldVNode, newVNode)
  }




}

/**
 * props变更处理函数
 * */
function hasPropsChanged(oldProps: any, newProps: any) {
  // 获取新旧props的键值
  const newKeys = Object.keys(newProps)
  const oldKeys = Object.keys(oldProps)
  // props数量变化
  if (newKeys.length !== oldKeys.length) {
    return true
  }
  // props数量未变，判断内容是否变化
  for (let i = 0 ; i < newKeys.length; i++) {
    const key = newKeys[i]
    // 存在不同的props
    if (newProps[key] !== oldProps[key]) {
      return true
    }
  }
  return false
}

/**
 * 接收组件实例作为参数，并将该实例设置为 currentInstance
 * */
function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance
}

/**
 * onMounted注册生命周期函数
 * */
export function onMounted(fn: EffectFunction) {
  if (currentInstance) {
    // 将生命周期函数添加到 instance.mounted 中
    currentInstance.mounted.push(fn)
  } else {
    console.log("onMounted can only be used in setup.")
  }
}
