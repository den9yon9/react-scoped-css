// @ts-check
const babelPluginJsxSyntax = require('@babel/plugin-syntax-jsx').default
const md5 = require('md5')
const {basename, relative} = require('path')

const forPlugin = (path, stats) => {
  let { include: includeRegExp } = stats.opts
  if (!includeRegExp) {
    includeRegExp = /\.scoped\.(sa|sc|c)ss$/
  }
  const filename = basename(path.node.source.value)
  return filename.match(new RegExp(includeRegExp))
}

const computedHash = {}

module.exports = function({ types: t }) {

  const computeHash = (hashSeed = '', filePath) => {
    if (computedHash[filePath]) return computedHash[filePath]
    const relativePath = relative(process.cwd(), filePath)
    const hash = md5(hashSeed + relativePath ).substr(0, 8)
    computedHash[filePath] = hash
    return hash
  }

  return {
    inherits: babelPluginJsxSyntax,
    pre() {
      this.hasScopedCss = false
    },
    visitor: {
      ImportDeclaration(path, stats) {
        if (!forPlugin(path, stats)) return;
        this.hasScopedCss = true
        const { hashSeed } = stats.opts
        const hash = computeHash(hashSeed, stats.file.opts.filename)
        path.node.source.value = `${path.node.source.value}?scopeId=${hash}`
      },
      JSXElement(path, stats) {
        if (!this.hasScopedCss || path.node.openingElement.name.type === 'JSXMemberExpression') return
        const { hashSeed } = stats.opts
        const hash = computeHash(hashSeed, stats.file.opts.filename)
        path.node.openingElement.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(`data-v-${hash}`),
            t.jsxExpressionContainer(t.stringLiteral('')),
          ),
        )
      },
    },
  }
}
