declare module '#app' {
  interface NuxtApp {
    $efReady: Promise<void>;
    $efTrack: (eventId: number, extra?: Record<string, any>) => Promise<any>;
    $efConversion: (extra?: Record<string, any>) => Promise<any>;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $efReady: Promise<void>;
    $efTrack: (eventId: number, extra?: Record<string, any>) => Promise<any>;
    $efConversion: (extra?: Record<string, any>) => Promise<any>;
  }
}

export {}
