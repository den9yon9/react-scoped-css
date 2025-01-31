const { compileStyle } = require('@vue/component-compiler-utils')
const qs = require('qs');

module.exports = function rollupPluginScopedCss() {
  return {
    name: 'rollup-plugin-scoped-css',
    transform(source, id) {
      const { scopeId } = qs.parse(id.split('?')[1])
      if (scopeId) {
        const { code, map, errors } = compileStyle({
          source,
          filename: id,
          scoped: true,
          trim: true,
          id: `data-v-${scopeId}`
        })
        if (errors.length) console.log(errors)
        return { code, map }
      }
      return null
    }
  }
}
