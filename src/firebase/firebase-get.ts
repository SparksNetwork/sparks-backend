import * as Inflection from 'inflection'
import * as BPromise from 'bluebird'
import {
  T, always, applySpec, complement, compose, cond, equals, filter, fromPairs,
  head, keys, lensPath, map, mapObjIndexed, objOf, prop, propEq, tail, type,
  values, view, omit, toPairs, not, merge, flip, pick, contains
} from 'ramda'
import {test} from "../test/test";
import {Test} from "tape-async";

function createSpecFromMsg(msg):Spec {
  return compose(
    flip<any, any, (any) => Spec>(pick)(msg),
    filter(complement(contains('$'))),
    keys,
    omit(['role', 'cmd'])
  )(msg)
}
test(__filename, 'createSpecFromMsg', function(t) {
  const spec = createSpecFromMsg({
    engagement: 1,
    assignments: ['engagement', '$key'],
    Plugin$s: 'abc',
    $default: 'moose'
  })

  t.deepEqual(spec, {
    engagement: 1,
    assignments: ['engagement', '$key']
  })

  t.end()
})

const byValue = {
  by: compose<Object, Object, any, Array<string>, string>(head, keys, prop('value')),
  value: compose<Object, Object, Array<any>, any>(head, values, prop('value')),
}

declare type PairObject<T> = {[name:string]:T}
declare type Pair<T> = [string, T]
/**
 * Given an object with a single property return a pair of property and value.
 * @type {(x0:PairObject<any>)=>Array<Array<any>>}
 */
const pair:<T>(object:PairObject<T>) => Pair<T> =
  compose<PairObject<any>, Array<Array<any>>, Pair<any>>(head, toPairs)

/**
 * Constructs seneca command
 *
 * @type {Function}
 */
const cmdArgs = cond([
  [
    compose(equals('String'), type, prop('value')),
    always({cmd: always('get'), key: prop('value')}),
  ],
  [
    prop('isArray'),
    always(merge({
      cmd: always('by')
    }, byValue)),
  ],
  [T,
    always(merge({
      cmd: always('first'),
    }, byValue))
  ],
])
test(__filename, 'cmdArgs', async function(t) {
  const valueIsString = {value: 'string'}
  const valueIsArray = {isArray: true}
  const objIsString = 'string'

  const cmdIsString = cmdArgs(valueIsString)
  t.equals(cmdIsString.cmd(), 'get', 'cmd is get')
  t.equals(cmdIsString.key({value: 'something'}), 'something', 'key from value prop')

  const cmdIsArray = cmdArgs(valueIsArray)
  t.equals(cmdIsArray.cmd(), 'by', 'cmd is by')
  t.equals(cmdIsArray.value({value: {value: 'something'}}), 'something', 'value from first property value')

  const cmdObjIsString = cmdArgs(objIsString)
  t.equals(cmdObjIsString.cmd(), 'first', 'cmd is first')
  t.equals(cmdObjIsString.value({value: {value: 'something'}}), 'something', 'value from first property value')
})

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
test(__filename, 'getDependsOn', async function(t:Test) {
  t.equal(getDependsOn('whatever'), null, 'strings return null')
  t.equal(getDependsOn([3,2,1]), 3, 'arrays return head')
  t.equal(getDependsOn({value: 'whatever'}), null, 'object returns value of first value')
  t.equal(getDependsOn({value: [4,5,6]}), 4, 'object array returns head')
  t.equal(getDependsOn({value: {value: {value: [6,7,8]}}}), 6, 'it goes deep')
})

function resolveDependentValue(value:any, record:Object) {
  if (type(value) === 'Object') {
    const bv = pair(value)
    return objOf(bv[0], resolveDependentValue(bv[1], record))
  }

  const lens = lensPath(tail<string>(value))
  return view(lens, record)
}

export default function firebaseGet() {
  const seneca = this

  function createPromise(spec) {
    if (not(spec.value)) { return Promise.resolve(null) }

    const pattern = applySpec(merge({
      role: always('Firebase'),
      model:prop('model'),
      }, cmdArgs(spec)
    ))(spec)

    return seneca.act(pattern)
  }

  function createDependentPromises(spec, specs) {
    const dependentSpecs = compose(filter(propEq('dependsOn', spec.key)), values)(specs)

    dependentSpecs.forEach(ds => {
      ds.promise = spec.promise.then(r => {
        const value = resolveDependentValue(ds.value, r)
        return createPromise(merge(ds, {value}))
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
   *     profile: {uid: '123'},
   *     project: 'abc',
   *     opps: {projectKey: ['project', '$key']}
   *   })
   *    stuff.then(({profile, project, opps}) =>
   *      console.log('profile:', profile, 'project:', project, 'opps:', opps))
   *
   * @param stuff
   * @returns {Promise<FulfilledSpec>}
   */
  function getStuff(stuff:Spec):Promise<FulfilledSpec> {
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

    return BPromise.props(promises) as Promise<FulfilledSpec>
  }

  this.add({role:'Firebase',cmd:'get'}, async function(msg):Promise<FulfilledSpec> {
    if (msg.model) { return await this.prior(msg) }
    const spec = createSpecFromMsg(msg)
    return await getStuff(spec)
  })

  this.add('init:firebaseGet', async function() {
  })

  return 'firebaseGet'
}
