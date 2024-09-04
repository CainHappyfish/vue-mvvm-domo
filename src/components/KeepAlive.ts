import {
  componentOptions,
  Container,
  FuncComponent,
  KeepAliveCtx, KeepAliveInstance, KeepAliveVNode,
  VNode
} from '../../types/renderer'
import { currentInstance } from './component'
import { keepAlive, teleport } from '../../types/components'

export const KeepAlive: keepAlive = {
  // KeepAlive独有的属性，用作标识
  _isKeepAlive: true,

  // include, exclude
  props: {
      include: RegExp,
      exclude: RegExp
  },

  setup(props: Record<symbol | string, any>, { slots }) {
    /**
     * 缓存对象
     * key: vnode.type
     * value: vnode
     * */
    const cache = new Map<string | componentOptions | FuncComponent | teleport | keepAlive, VNode>()
    // 当前 KeepAlive 组件实例
    const instance = currentInstance as KeepAliveInstance
    (instance.keepAliveCtx as KeepAliveCtx).move = (vnode: VNode, container: Container, anchor?: Node | null) => {
      if (anchor) {
        container.insertBefore(vnode.el, anchor)
      }
      container.appendChild(vnode.el)
    }
    (instance.keepAliveCtx as KeepAliveCtx).createElement = (type: any) => { document.createElement(type) }
    // 实例上存在特殊的 keepAliveCtx 对象，由渲染器注入
    // 会暴露渲染器的一些内部方法，其中 move 函数用来将一段 DOM 移动到另一个容器中
    const { move, createElement } = instance.keepAliveCtx as KeepAliveCtx

    // 创建隐藏容器
    const storageContainer = createElement('div')

    // KeepAlive 组件的实例会添加两个内部函数 _deActivated 和 _activated，在渲染器中被调用
    (instance.keepAliveCtx as KeepAliveCtx)._deActivated = (vnode: VNode): void => {
      move(vnode, storageContainer)
    }
      (instance as unknown as KeepAliveInstance)._activated = (vnode: VNode, container: Container, anchor: Node): void => {
      move(vnode, container, anchor)
    }

    return () => {

      // KeepAlive 的默认插槽就是要被 KeepAlive 的组件
      let rawVNode: KeepAliveVNode = slots.default()

      // 不是组件直接渲染
      if (typeof rawVNode.type !== 'object') {
        return rawVNode
      }

      // 获取内部组件的名称
      const name = (rawVNode.type as componentOptions).name
      // 匹配name
      if (name &&
        (
          // 如果name无法被include匹配
          (props.include && !props.include.test(name)) ||
          // 或者无法被exclude匹配
          (props.exclude && props.exclude.test(name))
        )
      ) {
        // 直接渲染内部组件
        return rawVNode
      }

      // 挂载时先获取缓存组件 vnode
      const cachedVNode = cache.get(rawVNode.type)
      if (cachedVNode) {
        // 如果由缓存内容，说明不应该执行挂载，应该执行激活，继承组件实例
        rawVNode.component = cachedVNode.component

        // 在 vnode 上添加keptAlive 属性，标记为true，避免渲染器重新挂载
        rawVNode.keptAlive = true
      } else {
        // 如果没有缓存则添加
        cache.set(rawVNode.type, rawVNode)
      }

      // 添加shouldKeepAlive属性，并标记为 true ，避免渲染器真的将组件卸载
      rawVNode.shouldKeepAlive = true

      // 将KeepAlive组件实例也添加到vnode上，以便在渲染器中访问
      rawVNode.keepAliveInstance = instance

      // 渲染组件 vnode
      return rawVNode

    }


  }
}