
declare interface Commitment {
  code:string
  oppKey:string
  party:string
  count?:string
  amount?:string
  eventCode?:string
  ticketType?:string
}

declare interface Engagement {
  answer:string
  assignmentCount:number
  declined:boolean
  isAccepted:boolean
  isApplied:boolean
  isAssigned:boolean
  isConfirmed:boolean
  isPaid:boolean
  oppKey:string
  paymentClientToken:string
  paymentError:boolean
  priority:boolean
  profileKey:string
}