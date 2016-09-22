import {memoize, assoc, dissoc, keys} from 'ramda'

export interface MetricData {
  timestamp:number
  tag:string
}

export interface Resolution {
  name:string
  t:number
  keep?:number
}

interface StoredResolution {
  buckets:number
  days:{[day:string]:number}
  keep?:number
}

const DAY = 86400000
const HOUR = 3600000

function sanitizeTag(tag:string):string {
  return 'tag:' + tag.trim().replace(/[^A-Za-z-_]/, '-')
}

function getVal(s:FirebaseDataSnapshot) { return s.val() }

function _numBuckets(resolution:number) {
  if (resolution > DAY) { return 1 }
  return Math.ceil(DAY / resolution)
}
const numBuckets = memoize(_numBuckets)

const defaultResolutions:Resolution[] = [
  {
    name: '1min',
    t: 60 * 1000,
    keep: DAY,
  },
  {
    name: '10min',
    t: 60 * 1000 * 10,
    keep: 7 * DAY,
  },
  {
    name: '1hour',
    t: 60 * 1000 * 60,
    keep: 30 * DAY,
  },
  {
    name: '1day',
    t: DAY,
  },
]

function getDay(timestamp:number):number {
  return ((timestamp / DAY) >> 0) * DAY
}

function resolutionRef(outRef:Firebase, resolution:Resolution):Firebase {
  return outRef.child('resolutions').child(resolution.name)
}

/**
 * Lock the metric record. To do this we transaction the aggregate field.
 * If we can write a date to the field then we've succeeded, otherwise we
 * return which aborts the transaction
 *
 * @param currentData
 * @returns {number | void}
 */
function transactAggregate(currentData) {
  if (currentData === null) {
    return Date.now()
  } else {
    return
  }
}

/**
 * Increment the value by 1
 * @param {number} value
 * @returns {number}
 */
function transactIncrement(value:number):number {
  return (value || 0) + 1
}

/**
 * @note Must be bound to an object with the keys {ref, dataSnapshot,
  * outRef, resolutions}
 *
 * @param error
 * @param committed
 */
function storeMetric(error, committed) {
  if (error) { return }
  if (!committed) { return } // Aborted

  const {ref, dataSnapshot, outRef, resolutions} = this

  const metric = dataSnapshot.val() as MetricData
  const tag = sanitizeTag(metric.tag)
  const timestamp = metric.timestamp
  const day = getDay(timestamp)
  const ms = timestamp % DAY

  const tagRef = outRef.child(tag)
  const dayRef = tagRef.child(String(day))

  for (let resolution of resolutions) {
    const resRef = dayRef.child(resolution.name)
    const buckets = numBuckets(resolution.t)
    const bucket = (ms / DAY * buckets) >> 0

    resRef.child(String(bucket)).transaction(transactIncrement)
  }

  outRef.child('tags').child(tag).set(day)
  ref.remove()
}

function processMetric(dataSnapshot) {
  const {outRef, resolutions} = this
  const ref = dataSnapshot.ref()
  const context = {ref, outRef, resolutions, dataSnapshot}
  const boundStoreMetric = storeMetric.bind(context)

  ref.child('aggregate').transaction(transactAggregate, boundStoreMetric, false)
}

function updateResolutionDays() {
  const day = getDay(Date.now())

  for (let resolution of this.resolutions) {
    const ref = resolutionRef(this.outRef, resolution)
    const buckets = numBuckets(resolution.t)

    ref.child('buckets').set(buckets)

    if (resolution.keep) {
      ref.child('keep').set(resolution.keep)
      ref.child('days').transaction(data =>
        assoc(String(day), day + resolution.keep, data || {})
      )
    }
  }
}

/**
 * Clean up stale aggregations. Once we've moved beyond the resolution keep
 * time we can safely delete the resolution tree under each tag.
 */
async function removeAggregations() {
  const {outRef} = this
  const now = Date.now()
  const today = getDay(now)
  const resolutions:StoredResolution[] = await outRef.child('resolutions')
    .once('value')
    .then(getVal) as StoredResolution[]
  const tags:string[] = await outRef.child('tags')
    .once('value')
    .then(getVal)
    .then(keys) as string[]

  const names:string[] = keys(resolutions)

  for (let name of names) {
    const resolution = resolutions[name]
    if (!resolution.days) { continue }

    const days = keys(resolution.days).map(Number)
      .filter(day => day < today)

    for (let day of days) {
      const dayK = resolution.days[day]
      if (dayK > now) { continue }

      for (let tag of tags) {
        outRef.child(tag).child(day).child(name).remove()
      }

      outRef.child('resolutions').child(name).child('days')
        .transaction(data => dissoc(String(day), data) )
    }
  }
}

/**
 * Push a metric to an inbox location
 *
 * @param inRef
 * @param tag
 * @returns {FirebaseWithPromise<void>}
 */
function pushMetric(inRef:Firebase, tag:string) {
  const timestamp = Date.now()
  const values = {timestamp, tag}
  return inRef.push(values)
}

/**
 * Start a process that looks at a metric inbox location in firebase and
 * aggregates the values there into the out location according to the given
 * resolutions
 *
 * @param inRef
 * @param outRef
 * @param resolutions
 */
function startMetrics(inRef:Firebase, outRef:Firebase, resolutions:Resolution[] = defaultResolutions) {
  const context = {inRef, outRef, resolutions}
  const boundProcessMetric = processMetric.bind(context)
  const boundUpdateResolutionDays = updateResolutionDays.bind(context)
  const boundRemoveAggregations = removeAggregations.bind(context)

  const updateTimer = setInterval(boundUpdateResolutionDays, HOUR)
  boundUpdateResolutionDays()

  const removeTimer = setInterval(boundRemoveAggregations, 12 * HOUR)
  boundRemoveAggregations()

  inRef.on('child_added', boundProcessMetric, error => {
    console.error('Metrics error', error)
    clearInterval(updateTimer)
    clearInterval(removeTimer)
  })
}

export {startMetrics, pushMetric}