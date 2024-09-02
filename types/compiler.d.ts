/**
 * 状态机状态
 * */
export const State = {

  /**
   * 初始状态
   * */
  initial: 1,

  /**
   * 标签开始状态
   * */
  tagStart: 2,

  /**
   * 标签名称状态
   * */
  tagName: 3,

  /**
   * 文本状态
   * */
  text: 4,

  /**
   * 结束标签状态
   * */
  tagEnd: 5,

  /**
   * 结束标签名称状态
   * */
  tagEndName: 6
}

/**
 * token结构
 * */
export interface token {

  /**
   * 标签类型
   * */
  type: string

  /**
   * 标签名称，标签token使用
   * */
  name?: string

  /**
   * 文本内容，文本token使用
   * */
  content?: string

}