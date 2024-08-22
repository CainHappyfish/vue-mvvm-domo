import { normalizeClass } from '../src/renderer/props'

const className = [
  'class1',
  {class2 : true}
]


console.log(normalizeClass(className))