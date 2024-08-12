!(function () {
  'use strict'
  var e = {
      708: function (e, t) {
        Object.defineProperty(t, '__esModule', { value: !0 }),
          (t.dataProxy = function e(t) {
            Object.keys(t).forEach(o => {
              let r = t[o]
              r &&
                'object' == typeof r &&
                Object.defineProperty(t, o, {
                  get: () => r,
                  set(t) {
                    t !== r && ((r = t), e(t))
                  }
                })
            })
          })
      }
    },
    t = {}
  function o(r) {
    var n = t[r]
    if (void 0 !== n) return n.exports
    var c = (t[r] = { exports: {} })
    return e[r](c, c.exports, o), c.exports
  }
  !(function () {
    const e = o(708),
      t = document.querySelector('h1')
    t && (t.textContent = 'Success'), (0, e.dataProxy)({ name: 'C4in', age: 18 })
  })()
})()
