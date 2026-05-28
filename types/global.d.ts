export {};

declare global {
  interface Window {
    buildEfUrl: (extra?: Record<string, string | number | boolean>) => string;
    EF?: {
      conversion?: (params: {
        offer_id: number;
        event_id?: number;
        amount?: number;
        order_id?: string;
        transaction_id?: string;
        [key: string]: any;
      }) => Promise<{
        conversion_id?: string;
        transaction_id?: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    };
  }
}
