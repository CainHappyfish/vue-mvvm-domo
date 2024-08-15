import { reactive } from '../src/reactivity/reactive'
import { watchEffect } from '../src/core'
import { computed } from '../src/reactivity/computed'

const obj = {
  text: "name",
  foo: 2,
  bar: 4,
}

const data = reactive(obj)

const sum = computed(() => data.foo + data.bar)

// console.log(data)

watchEffect(() => {
  // document.body.innerText = data.text
  const foo = document.querySelector('.foo') as HTMLElement
  const bar = document.querySelector('.bar') as HTMLElement
  const result = document.querySelector('.sum') as HTMLElement
  if (foo && bar && result) {
    foo.innerText = data.foo
    bar.innerText = data.bar
    result.innerText = sum.value
  }
})

setTimeout(() => {
  // data.text = "C4iN"
  data.foo = 3
  data.bar = 6
  // console.log(sum)
},1000)