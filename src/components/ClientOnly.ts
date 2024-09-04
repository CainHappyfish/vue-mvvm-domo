import { ref } from '../reactivity/ref'
import { onMounted } from './component'

export const ClientOnly = {
  setup(props: Record<symbol | string, any>, { slots }) {
    // 标记变量，仅在客户端渲染时为 true
    const show = ref(false)
    // onMounted钩子只在客户端执行
    onMounted(() => {
      show.value = true
    })

    // 服务端什么都不做
    return () => (show.value && slots.default ? slots.default() : null)
  }
}