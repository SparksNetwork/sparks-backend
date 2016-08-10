
declare module "braintree-node" {
  interface Gateway {
  }

  interface Options {
  }

  type braintree = (options:Options) => Gateway

  let b: braintree
  export = b
}
