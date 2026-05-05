// Ambient declaration for the optional everflow-client package.
// This lets TypeScript compile the project when the SDK isn't installed.
// If you install the real SDK and it includes types, you can remove this file.

declare module 'everflow-client' {
  const content: any;
  export default content;
  export const EverflowClient: any;
  export function createClient(...args: any[]): any;
}
