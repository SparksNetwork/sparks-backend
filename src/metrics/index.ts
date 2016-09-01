import {memoize, assoc} from 'ramda'

export interface MetricData {
  timestamp:number
  tag:string
}

export interface Resolution {
  name:string
  t:number
  keep?:number
}

const DAY = 86400000
const HOUR = 3600000

function sanitizeTag(tag:string):string {
  return 'tag:' + tag.trim().replace(/[^A-Za-z-_]/, '-')
}

function _numBuckets(resolution:number) {
  if (resolution > DAY) { return 1 }
  return Math.ceil(DAY / resolution)
}
const numBuckets = memoize(_numBuckets)

const defaultResolutions:Resolution[] = [
  {
    name: '1min',
    t: 60 * 1000,
    keep: 1 * DAY,
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

function getDay(timestamp) {
  return ((timestamp / DAY) >> 0) * DAY
}

function startMetrics(inRef:Firebase, outRef:Firebase, resolutions:Resolution[] = defaultResolutions) {
  function resolutionRef(resolution) {
    return outRef.child('resolutions').child(resolution.name)
  }

  for (let resolution of resolutions) {
    const ref = resolutionRef(resolution)
    const buckets = numBuckets(resolution.t)
    ref.child('buckets').set(buckets)
    if (resolution.keep) { ref.child('keep').set(resolution.keep) }
  }

  function updateResolutionDays() {
    const day = getDay(Date.now())

    for (let resolution of resolutions) {
      if (!resolution.keep) { continue }

      const ref = resolutionRef(resolution)
      ref.child('days').transaction(data =>
        assoc(String(day), day + resolution.keep, data || {})
      )
    }
  }
  const updateTimer = setInterval(updateResolutionDays, HOUR)
  updateResolutionDays()

  inRef.on('child_added', function(dataSnapshot) {
    const ref = dataSnapshot.ref()

    ref.child('aggregate').transaction(currentData => {
      if (currentData === null) {
        return Date.now()
      } else {
        return
      }
    }, (error, committed) => {
      if (error) { return }
      if (!committed) { return }

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

        resRef.child(String(bucket)).transaction(value => (value || 0) + 1)
      }

      ref.remove()
    }, false)
  }, error => {
    console.error('Metrics error', error)
    clearInterval(updateTimer)
  })
}

export {startMetrics}