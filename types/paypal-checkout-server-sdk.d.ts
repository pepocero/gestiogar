declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string)
    }
    
    export class LiveEnvironment {
      constructor(clientId: string, clientSecret: string)
    }
    
    export class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment)
      execute<T = any>(request: any): Promise<{ statusCode: number; result: T }>
    }
  }

  export namespace billing {
    export class SubscriptionsCreateRequest {
      requestBody(body: any): void
    }
    
    export class SubscriptionsCancelRequest {
      constructor(subscriptionId: string)
      requestBody(body: any): void
    }
    
    export class SubscriptionsGetRequest {
      constructor(subscriptionId: string)
    }
    
    export class PlansCreateRequest {
      requestBody(body: any): void
    }
    
    export class PlansListRequest {
      productId?: string
      pageSize?: number
    }
  }

  export namespace catalog {
    export class ProductsListRequest {
      pageSize?: number
    }
    
    export class ProductsCreateRequest {
      requestBody(body: any): void
    }
  }

  export namespace notifications {
    export class WebhooksVerifyRequest {
      requestBody(body: any): void
    }
  }

  const paypal: {
    core: typeof core
    billing: typeof billing
    catalog: typeof catalog
    notifications: typeof notifications
  }

  export default paypal
}

