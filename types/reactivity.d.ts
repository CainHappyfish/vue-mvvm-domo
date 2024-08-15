export type Ref<T> = {
  value: T
  _is_Ref_ ?: Boolean
}

/**
 * watch的回调函数
 * */
export interface WatchCallbackFn<T> {
  (newVal: T, oldVal: T, onInvalidate: (fn: () => {}) => any): T
}

/**
 * watch函数的可选参数
 * */
export interface WatchOptions {
  immediate?: boolean
  flush?: 'pre' | 'post' | 'sync'
}

/**
 * 计算属性对象的value只读
 */
export class Computed<T = any> implements Ref<T>{
    readonly value: T
}

