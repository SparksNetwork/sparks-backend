export interface Address {
  company?:string
  countryCodeAlpha2?:string
  countryCodeAlpha3?:string
  countryCodeNumeric?:string
  countryName?:string
  extendedAddress?:string
  firstName?:string
  lastName?:string
  locality?:string
  postalCode?:string
  region?:string
  streetAddress?:string
}

export interface Response {
  success:boolean
  message:string
}

export interface CustomerResponse extends Response {
  customer:Customer
}

export interface Customer {
  addresses:any[]
  androidPayCards?:any[]
  applePayCards?:any[]
  company:string
  createdAt:string
  creditCards:any[]
  customFields:any[]
  email:string
  fax:string
  firstName:string
  id:string
  lastName:string
  paymentMethods:any[]
  paypalAccounts?:any[]
  phone:string
  updatedAt:string
  website:string
}

export interface BasicCustomerOptions {
  company?:string
  email?:string
  fax?:string
  phone?:string
  firstName?:string
  lastName?:string
  id?:string
  website?:string
}

export interface CustomerOptions extends BasicCustomerOptions {
  creditCard?:any
  customFields?:any[]
  deviceData?:string
  paymentMethodNonce?:string
  riskData?:RiskData
}

export interface TransactionOptions {
  amount:string
  billing?:Address
  billingAddressId?:string
  creditCard?:any
  customFields?:any[]
  customer?:BasicCustomerOptions
  customerId?:string
  descriptor?:Descriptor
  deviceData?:string
  deviceSessionId?:string
  merchantAccountId?:string
  options?: {
    addBillingAddressToPaymentMethod?:boolean
    holdInEscrow?:boolean
    paypal?: {
      customField:string
      description:string
    }
    storeInVault?:boolean
    storeInVaultOnSuccess?:boolean
    storeShippingAddressInVault?:boolean
    submitForSettlement?:boolean
    threeDSecure?: {
      required:boolean
    }
  }
  orderId?:string
  paymentMethodNonce?:string
  paymentMethodToken?:string
  purchaseOrderNumber?:string
  recurring?:boolean
  riskData?:RiskData
  serviceFeeAmount?:string
  shipping?:Address
  shippingAddressId?:string
  taxAmount?:string
  taxExempt?:boolean
  threeDSecurePassThru?: {
    cavv:string
    eciFlag:string
    xid:string
  }
  transactionSource?:string
}

export interface Dispute {
  amount:string
  currencyIsoCode:string
  dateOpened:string
  dateWon:string
  id:string
  kind:string
  receivedDate:string
  replyByDate:string
  reason:string
  status:string
}

export interface TransactionResponse extends Response {
  transaction: Transaction
}

export interface Transaction {
  addOns:any[]
  additionalProcessorResponse:string
  amount:string
  avsErrorResponseCode:string
  avsPostalCodeResponseCode:string
  avsStreetAddressResponseCode:string
  billing:Address
  channel:string
  createdAt:string
  creditCard:any
  currencyIsoCode:string
  customFields:any[]
  customer:BasicCustomerOptions
  cvvResponseCode:string
  descriptor:Descriptor
  disbursementDetails:any
  discounts:any[]
  disputes:Dispute[]
  escrowStatus?:string
  gatewayRejectionReason?:string
  id:string
  merchantAccountId:string
  orderId:string
  paymentInstrumentType:string
  paypalAccount:any
  planId:string
  processorAuthorizationCode:string
  processorResponseCode:string
  processorResponseText:string
  processorSettlementResponseCode:string
  processorSettlementResponseText:string
  purchaseOrderNumber:string
  recurring:boolean
  refundIds?:string[]
  refundedTransactionId?:string
  riskData:RiskData
  serviceFeeAmount:string
  settlementBatchId:string
  shipping:Address
  status:string
  statusHistory:string
  subscription?: {
    billingPeriodEndDate: string
    billingPeriodStartDate:string
  }
  subscriptionId?:string
  taxAmount:string
  taxExempt:boolean
  threeDSecureInfo?: {
    enrolled:string
    liabilityShiftPossible:boolean
    liabilityShifted:boolean
    status:string
  }
  type:string
  updatedAt:string
  voiceReferralNumber:string
}

export interface RiskData {
  customerBrowser:string
  customerIp:string
}

interface SubscriptionAddOn {
  amount?:string
  inheritedFromId:string
  neverExpires?:boolean
  numberOfBillingCycles?:string
  quantity?:number
}

interface SubscriptionAddOnUpdate extends SubscriptionAddOn {
  existingId:string
}

export interface SubscriptionAddOnOptions {
  add?:SubscriptionAddOn[]
  remove?:string[]
  update?:SubscriptionAddOn[]
}

interface SubscriptionDiscount {

}

export interface SubscriptionDiscountsOptions {
  add?:SubscriptionDiscount[]
  remove?:String[]
  update?:SubscriptionDiscount[]
}

export interface SubscriptionOptions {
  addOns?:SubscriptionAddOnOptions
  billingDayOfMonth?:number
  discounts?:SubscriptionDiscountsOptions
  firstBillingDate?:Date
  id?:string
  merchantAccountId?:string
  neverExpires?:boolean
  numberOfBillingCycles?:number
  paymentMethodNonce?:string
  paymentMethodToken?:string
  price?:string
  trialDuration?:number
  trialDurationUnit?:string
  trialPeriod?:boolean
}

export interface SubscriptionCreateOptions extends SubscriptionOptions {
  planId:string
  options?: {
    doNotInheritAddOnsOrDiscounts?:boolean
    startImmediately?:boolean
  }
}

export interface SubscriptionUpdateOptions extends SubscriptionOptions {
  options?: {
    prorateCharges?:boolean
    replaceAllAddOnsAndDiscounts?:boolean
    revertSubscriptionOnProrationFailure?:boolean
  }
  planId?:string
}

export interface Descriptor {
  name:string
  phone:string
  url:string
}

export interface SubscriptionResponse extends Response {
  subscription:Subscription
}
export interface Subscription {
  addOns:any[]
  balance:string
  billingDayOfMonth:number
  billingPeriodEndDate:string
  billingPeriodStartDate:string
  createdAt:string
  currentBillingCycle:number
  daysPastDue:number
  descriptor:Descriptor
  discounts:any[]
  firstBillingDate:string
  id:string
  merchantAccountId:string
  neverExpires:boolean
  nextBillingDate:string
  nextBillingPeriodAmount:string
  numberOfBillingCycles:number
  paidThroughDate:string
  paymentMethodToken:string
  planId:string
  price:string
  status:string
  statusHistory:string[]
  transactions:Transaction[]
  trialDuration:number
  trialDurationUnit:string
  trialPeriod:boolean
  updatedAt:string
}

export interface ClientTokenOptions {
  customerId?:string
  merchantAccountId?:string
  options?: {
    failOnDuplicatePaymentMethod?:boolean
    makeDefault?:boolean
    verifyCard?:boolean
  }
  version?:string
}

export interface ClientTokenResponse extends Response {
  clientToken:string
}
export interface GatewayOptions {
  environment:string
  publicKey:string
  privateKey:string
  merchantId:string
}

export type ResponseCallback<T> = (err:any, response:T) => void

interface SubscriptionApi {
  cancel(id:string, callback:ResponseCallback<SubscriptionResponse>):void
  create(options:SubscriptionCreateOptions, callback:ResponseCallback<SubscriptionResponse>):void
  find(id:string, callback:ResponseCallback<SubscriptionResponse>)
  retryCharge(id:string, amount:string, callback:ResponseCallback<TransactionResponse>):void
  search(options:any, callback:ResponseCallback<Subscription[]>):void
  update(id:string, options:SubscriptionUpdateOptions, callback:ResponseCallback<SubscriptionResponse>):void
}

interface CustomerApi {
  create(options:CustomerOptions, callback:ResponseCallback<CustomerResponse>):void
  delete(id:string, callback:ResponseCallback<Response>):void
  find(id:string, callback:ResponseCallback<Customer>):void
  update(id:string, options:CustomerOptions, callback:ResponseCallback<CustomerResponse>):void
}

interface TransactionApi {
  sale(options:TransactionOptions, callback:ResponseCallback<TransactionResponse>):void
}

interface ClientTokenApi {
  generate(options:ClientTokenOptions, callback:ResponseCallback<ClientTokenResponse>):void
}

export interface Gateway {
  transaction:TransactionApi
  subscription:SubscriptionApi
  customer:CustomerApi
  clientToken:ClientTokenApi
}

export interface Braintree {
  connect(options:GatewayOptions):Gateway
}

declare module 'braintree' {
  let b:Braintree
  export = b
}