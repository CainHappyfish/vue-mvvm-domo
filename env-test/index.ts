import { normalize } from '../src/renderer/props'

const className = [
  'class1',
  {class2 : true}
]


console.log(normalize(className))