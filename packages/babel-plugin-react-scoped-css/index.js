// @ts-check
const babelPluginJsxSyntax = require('@babel/plugin-syntax-jsx').default
const md5 = require('md5')
const path = require('path')

const getFilenameFromPath = filePath => {
  const parts = filePath.split('/')
  return parts[parts.length - 1].split('?')[0]
}

const forPlugin = (path, stats) => {
  let { include: includeRegExp } = stats.opts
  if (!includeRegExp) {
    includeRegExp = /\.scoped\.(sa|sc|c)ss$/
  }
  const filename = getFilenameFromPath(path.node.source.value)
  return filename.match(new RegExp(includeRegExp))
}

const computedHash = {}
module.exports = function({ types: t }) {

  const computeHash = (hashSeed = '', filePath) => {
    if (computedHash[filePath]) {
      return computedHash[filePath]
    }

    const relative = path.relative(process.cwd(), filePath)
    const hash = md5(hashSeed + relative ).substr(0, 8)
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
        if (!forPlugin(path, stats)) {
          return
        }
        this.hasScopedCss = true
        const { hashSeed } = stats.opts
        const hash = computeHash(hashSeed, stats.file.opts.filename)
        path.node.source.value = `${path.node.source.value}?scopeId=${hash}`
      },
      JSXElement(path, stats) {
        if (!this.hasScopedCss || path.node.openingElement.name.type === 'JSXMemberExpression') {
          return
        }
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
