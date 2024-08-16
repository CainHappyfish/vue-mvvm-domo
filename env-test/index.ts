import { reactive } from '../src/reactivity/reactive'
import { watchEffect } from '../src/core'

const arr = reactive([])

watchEffect(() => {
    arr.push(1)
})

watchEffect(() => {
    arr.push(1)
})