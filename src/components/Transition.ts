import { transition } from '../../types/components'
import { Container } from '../../types/renderer'

export const Transition = {
  name: 'Transition',
  setup(props: Record<any, any>, { slots }) {
    return () => {
      // 通过默认插槽获取需要过渡的元素
      const innerVNode = slots.default()

      // 在过渡元素的VNode上添加transition相应钩子函数
      innerVNode.transition = {
        beforeEnter(el: Container) {
          el.classList.add('c-enter-from')
          el.classList.add('c-enter-active')
        },
        enter(el: Container) {
          // 在下一帧切换到结束状态
          nextFrame(() => {
            el.classList.remove('c-enter-from')
            el.classList.add('c-enter-to')
            // 监听transition 事件完成收尾工作
            el.addEventListener('transitionend', () => {
              el.classList.remove('c-enter-to')
              el.classList.remove('c-enter-active')


            })
          })
        },
        leave(el: Container) {
          el.classList.add('c-leave-from')
          el.classList.add('c-leave-active')

          // 强制 reflow ，使初始状态生效
          document.body.offsetHeight
          // 下一帧修改状态
          nextFrame(() => {
            el.classList.remove('c-leave-from')
            el.classList.add('c-leave-to')
            // 监听transition 事件完成收尾工作
            el.addEventListener('transitionend', () => {
              el.classList.remove('c-leave-to')
              el.classList.remove('c-leave-active')

              // 卸载DOM元素
              el.parentNode?.removeChild(el)

            })
          })


        }
      }


      return innerVNode

    }
  }
}

function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}
