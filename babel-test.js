module.exports = function ({types: t}) {
  return {
    visitor: {
      CallExpression(path) {
        const node = path.node
        const callee = node.callee
        if (!callee) { return }

        if (t.isMemberExpression(callee)) {
          if (
            callee.property.name === 'test' &&
            callee.object.name.match(/tape|test/)
          ) {
            return path.remove()
          }
        } else if(callee.name === 'test') {
          if (node.arguments.length === 2 || node.arguments.length === 3) {
            return path.remove()
          }
        }
      },
      VariableDeclarator(path) {
        const node = path.node
        const init = node.init
        if (!init) { return }

        const callee = init.callee
        if (!callee) { return }

        const args = init.arguments
        if(!args) { return }

        if (callee.name === 'require'
            && args.length === 1
            && args[0].value.match(/tape|test/)
        ) {
          path.remove()
        }
      }
    }
  }
}