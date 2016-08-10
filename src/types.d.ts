declare interface RejectResponse {
  reject: string
}

declare interface ErrorResponse {
  error: string
}

declare interface PayloadResponse {
  domain: string
  event: string
  payload: any
}

declare interface KeyResponse {
  key: string
}

declare interface AnyResponse {
  [propName:string]:any
}

declare type DispatchResponse = RejectResponse | ErrorResponse | PayloadResponse
declare type TaskResponse = KeyResponse | ErrorResponse
declare type AuthResponse = RejectResponse | ErrorResponse | AnyResponse

declare type SpecValue = string | number | boolean | Array<string>

declare interface ByChildSpec {
  [propName:string]: SpecValue
}

declare interface Spec {
  [propName:string]: SpecValue | ByChildSpec
}

declare interface FulfilledSpec {
  engagement:Engagement
  commitment:Commitment
  commitments:Commitment[]
  [propName:string]: null | any
}