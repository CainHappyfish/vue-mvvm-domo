const data = {
  name: 'C4in',
  age: 18,
  props: {
    class: "text",
    __class__: "className",
    style: "color: red",
    onclick: () => alert('FUNCTION')
  }
}

const classMap = new Map<string, string>()
classMap.set("className", "test")

const h = document.querySelector('h1')
if (h) {
  h.textContent = data.name
  // h.style.cssText = style
  for (const key in data.props) {
    if (/^on/.test(key)) {
      document.addEventListener(key.substring(2).toLowerCase(), () => {
        // data.props[key]()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        data.props[key]()
      })
    } else if (key === "class") {
      h.classList.add(data.props[key])
    } else if (key === "style") {
      h.style.cssText = data.props[key]
    } else if (key === "__class__") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      h.classList.add(classMap.get(data.props[key]))
    }
  }
}

// for (let key in data.props) {
//   if (/^on/.test(key)) {
//     document.addEventListener(key.substring(2).toLowerCase(), () => {
//       alert("click")
//     })
//   }
// }


