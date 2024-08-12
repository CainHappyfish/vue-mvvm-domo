
export interface EffectFunction<T = any> extends Function {
  (): T,
  deps?: Array<Set<EffectFunction>>

}

export interface DepsMap extends Map<string | symbol, Set<EffectFunction>> {}