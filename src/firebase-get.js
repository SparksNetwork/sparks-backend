import Inflection from 'inflection'
import Promise from 'bluebird'
import {
  T, always, applySpec, complement, compose, cond, equals, filter,
  fromPairs, head, keys, lensPath, map, mapObjIndexed, objOf, prop, propEq,
  tail, type, values, view, omit, toPairs,
} from 'ramda'

export default function firebaseGet() {
  const seneca = this

  const byValue = {
    by: compose(head, keys, prop('value')),
    value: compose(head, values, prop('value')),
  }

  const pair = compose(head, toPairs)

  const cmdArgs = cond([
    [
      compose(equals('String'), type, prop('value')),
      always({cmd: always('get'), key: prop('value')}),
    ],
    [
      prop('isArray'),
      always({
        cmd: always('by'),
        ...byValue,
      }),
    ],
    [T,
      always({
        cmd: always('first'),
        ...byValue,
      }),
    ],
  ])

  function createPromise(spec) {
    const pattern = applySpec({
      role: always('Firebase'),
      model:prop('model'),
      ...cmdArgs(spec),
    })(spec)

    return seneca.act(pattern)
  }

  function resolveDependentValue(value, record) {
    if (type(value) === 'Object') {
      const bv = pair(value)
      return objOf(bv[0], resolveDependentValue(bv[1], record))
    }

    const lens = lensPath(tail(value))
    return view(lens, record)
  }

  function createDependentPromises(spec, specs) {
    const dependentSpecs = compose(filter(propEq('dependsOn', spec.key)), values)(specs)

    dependentSpecs.forEach(ds => {
      ds.promise = spec.promise.then(r => {
        const value = resolveDependentValue(ds.value, r)
        return createPromise({...ds, value})
      })

      createDependentPromises(ds, specs)
    })
  }

  /**
  * Take a spec and return a bunch of things from the database. The spec is an
  * object where the key is the name of a model, i.e. project, and the value
  * is either a string with the project key OR a key/value pair with the key
  * being the field.
  *
  * If the key is plural then it will resolve an array, otherwise will resolve a
  * single item.
  *
  * @example
  *
  *    const stuff = getStuff(models)({
  *      profile: {uid: '123'},
  *      project: 'abc',
  *      opps: {projectKey: ['project', '$key']}
  *    })
  *    stuff.then(({profile, project, opps}) =>
  *      console.log('profile:', profile, 'project:', project, 'opps:', opps))
  *
  * @param {Object<String,String|Object<String,String>>} specs
  * @return {Object<String,Promise>}
  *
  */

  function getDependsOn(value) {
    const t = type(value)

    if (t === 'Object') {
      return getDependsOn(head(values(value)))
    }

    if (t === 'Array') {
      return head(value)
    }

    return null
  }

  function getStuff(stuff) {
    const specs = mapObjIndexed((value, key) => {
      const model = compose(
        Inflection.pluralize,
        Inflection.camelize
      )(key)

      const isArray = type(value) !== 'String' &&
        key === Inflection.pluralize(key)

      const dependsOn = getDependsOn(value)
      const isDeferred = Boolean(dependsOn)

      return {
        key,
        model,
        isArray,
        isDeferred,
        dependsOn,
        value,
      }
    })(stuff)

    const specsWithNoDependencies = compose(
      filter(complement(prop('dependsOn'))),
      values
    )(specs)

    specsWithNoDependencies.forEach(spec => {
      spec.promise = createPromise(spec)
      createDependentPromises(spec, specs)
    })

    const promises = compose(
      fromPairs,
      map(applySpec([prop('key'), prop('promise')])),
      filter(prop('promise')),
      values,
    )(specs)

    return Promise.props(promises)
  }

  this.add({role:'Firebase',cmd:'get'}, async function(msg) {
    if (msg.model) { return await this.prior(msg) }

    const spec = omit(['role','cmd','default$','meta$','tx$'], msg)
    return await getStuff(spec)
  })

  this.add('init:firebaseGet', async function() {
  })

  return 'firebaseGet'
}
