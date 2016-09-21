type LogFn = (...msg:any[]) => void

let debug:LogFn

if (process.env.DEBUG) {
  debug = function(...msg:any[]):void {
    console.log('[DEBUG]', ...msg)
  }
} else {
  debug = function():void {}
}

function info(...msg:any[]):void {
  console.log('[INFO]', ...msg)
}

function error(...msg:any[]):void {
  console.error('[ERROR]', ...msg)
}

export {debug, info, error}