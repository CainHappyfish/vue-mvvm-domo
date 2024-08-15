/**
 * 调度器选项
 * */
export interface EffectOptions {
  lazy?: boolean
  scheduler?: (fn: EffectFunction) => any
}

/**
 * 副作用函数结构
 * */
export interface EffectFunction<T = any> extends Function {
  (): T
  /**
   * 依赖集合
   * */
  deps?: Array<Set<EffectFunction>>
  options?: EffectOptions
}

/**
 * 用于响应式对象与其对应副作用函数依赖集合的映射
 * */
export interface DepsMap extends Map<string | symbol, Set<EffectFunction>> {}

