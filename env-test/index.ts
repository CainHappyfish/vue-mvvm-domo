import { reactive } from '../src/reactivity/reactive'
import { watchEffect } from '../src/core'

const obj = {}
const proto = {
    bar: 1
}
const parent = reactive(proto)
const child = reactive(obj)
Object.setPrototypeOf(child, parent)
