declare interface Profile {
  $key:string
  email: string
  fullName: string
  intro: string
  isAdmin: boolean
  isConfirmed: boolean
  phone: string
  portraitUrl: string
  skills: string
  uid: string
  isEAP?: boolean
}

declare interface GatewayCustomer {
  $key:string
  profileKey:string
  gatewayId:string
}

declare interface Commitment {
  $key:string
  code:string
  oppKey:string
  party:string
  count?:string
  amount?:string
  eventCode?:string
  ticketType?:string
}

declare interface Engagement {
  $key:string
  answer:string
  assignmentCount:number
  declined:boolean
  isAccepted:boolean
  isApplied:boolean
  isAssigned:boolean
  isConfirmed:boolean
  isPaid:boolean
  oppKey:string
  payment: {
    clientToken:string
    gatewayId:string
    transactionId?:string
    subscriptionId?:string
    error?:boolean
  }
  paymentClientToken?:string // deprecated
  paymentError?:boolean // deprecated
  priority:boolean
  profileKey:string
}