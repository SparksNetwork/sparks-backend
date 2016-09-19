interface MinimalPattern {
}

type UnknownType = any;
type Pattern = string | MinimalPattern;
type GlobalErrorHandler = (error: Error) => void;
type AddCallback = (msg: any, respond: (error: Error, msg: any) => void) => void;
type ActCallback = (error: Error, result: any) => void;
type CloseCallback = (optional: any, done: (error: Error) => void) => void;

interface PluginOptions {
}
type PluginModule = (options: any) => void;

interface ClientOptions {
}

interface ListenOptions {
}


interface SenecaOptions {
    [plugin_name: string]: any;
    tag?: string;
    // Standard length of identifiers for actions.
    idlen?: number;
    // Standard timeout for actions.
    timeout?: number;   // milliseconds
    // Register (true) default plugins. Set false to not register when
    // using custom versions.
    default_plugins?: {
        basic?:       boolean;
        'mem-store'?: boolean;
        transport?:   boolean;
        web?:         boolean;
    };
    // Settings for network REPL.
    repl?: {
        port?: number;
        host?: string;
    };
    // Debug settings.
    debug?: {
        // Throw (some) errors from seneca.act.
        fragile?:    boolean;
        // Fatal errors ... aren't fatal. Not for production!
        undead?:     boolean;
        // Print debug info to console
        print?: {
            // Print options. Best used via --seneca.print.options.
            options?: boolean;
        };
        // Trace action caller and place in args.caller$.
        act_caller?: boolean;
        // Shorten all identifiers to 2 characters.
        short_logs?: boolean;
        // Record and log callpoints (calling code locations).
        callpoint?: boolean;
    };
    // Enforce strict behaviours. Relax when backwards compatibility needed.
    strict?: {
        // Action result must be a plain object.
        result?: boolean;
        // Delegate fixedargs override action args.
        fixedargs?: boolean;
        // Adding a pattern overrides existing pattern only if matches exactly.
        add?: boolean;
    };
    // Action cache. Makes inbound messages idempotent.
    actcache?: {
        active?: boolean;
        size?:   number;
    };
    // Action executor tracing. See gate-executor module.
    trace?: {
        act?: boolean;
        stack?: boolean;
        unknown?: string;
    },
    // Action statistics settings. See rolling-stats module.
    stats?: {
        size?: number;
        interval?: number;
        running?: boolean;
    };
    // Wait time for plugins to close gracefully.
    deathdelay?: number;
    // Default seneca-admin settings.
    // TODO: move to seneca-admin!
    admin?: {
        local?: boolean;
        prefix?: string;
    };
    // Plugin settings
    plugin?: any;
    // Internal settings.
    internal?: {
        // Close instance on these signals, if true.
        close_signals?: {
            SIGHUP?: boolean;
            SIGTERM?: boolean;
            SIGINT?: boolean;
            SIGBREAK?: boolean;
        };
        actrouter?: UnknownType;
        clientrouter?: UnknownType;
        subrouter?: UnknownType;
    };
    // Log status at periodic intervals.
    status?: {
        interval?: number;
        // By default, does not run.
        running?: boolean;
    },
    // zig module settings for seneca.start() chaining.
    zig?: any;
    log?: Object;
    errhandler?: GlobalErrorHandler;
}

declare interface Seneca {
    version: string;

    (options?: SenecaOptions): Seneca;
    options(options: SenecaOptions): void;

    error(handler: GlobalErrorHandler): void;
    on(eventName: string, callback: (error: Error) => void): any;
    close(callback: CloseCallback): void;
    use(module: PluginModule, options?: PluginOptions): this;
    use(name: string, options?: PluginOptions): this;
    client(options?: ClientOptions): this;
    listen(options?: ListenOptions): this;

    ready(callback: (error: Error) => void): void;
    ready(): Promise<void>;

    add(pattern: Pattern, action: AddCallback): this;
    add(pattern: Pattern, paramspec: any, action: AddCallback): this;
    act(pattern: Pattern, respond: ActCallback): void;
    act(pattern: Pattern, msg: any, respond: ActCallback): void;
    act(pattern: Pattern, msg: any): Promise<any>
    act(pattern: Pattern): Promise<any>

    // @param name reference to plugin provided object
    export(name: string): void;

    pin(pattern: Pattern): void;
}

declare module "seneca-await" {
    // what does seneca do about logging?
    function log(): void;

    interface Optioner {
        set: (input: string | SenecaOptions) => SenecaOptions;
        get: () => SenecaOptions;
    }

    type ExecutorWorker = (callback: any) => void;
    type ExecutorCallback = (err: Error, result: any) => void;
    interface Executor {
        id: string;
        desc: string;
        fn: ExecutorWorker;
        cb: ExecutorCallback;
        gate: boolean;
        ungate: boolean;
        execute: UnknownType;
    }

    var sen: Seneca
    export = sen;
}
