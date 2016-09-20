import {
  CustomerOptions, CustomerResponse, Response,
  TransactionOptions, ClientTokenOptions, SubscriptionOptions,
  SubscriptionResponse, ClientTokenResponse, TransactionResponse, GatewayOptions
} from "./braintree";

export interface Gateway {
  createCustomer(customer:CustomerOptions):Promise<CustomerResponse>
  createMultipleCustomers(customers:CustomerOptions[]):Promise<CustomerResponse[]>
  deleteCustomer(id:string):Promise<Response>
  deleteMultipleCustomers(customers:Array<{id:string}>):Promise<Response>
  findCustomer(id:string):Promise<CustomerResponse>
  findOneAndUpdate(id:string, update:CustomerOptions, upsert?:boolean):Promise<CustomerResponse>
  updateCustomer(id:string, update:CustomerOptions):Promise<Response>
  createTransaction(options:TransactionOptions):Promise<TransactionResponse>
  cloneTransaction(id:string, amount:string, submitForSettlement?:boolean):Promise<Response>
  generateClientToken(options?:ClientTokenOptions):Promise<ClientTokenResponse>
  createSubscription(options:SubscriptionOptions):Promise<SubscriptionResponse>
  findSubscription(id:string):Promise<SubscriptionResponse>
  cancelSubscription(id:string):Promise<Response>
}

declare module "braintree-node" {
  type braintree = (options:GatewayOptions) => Gateway
  let b: braintree
  export = b
}