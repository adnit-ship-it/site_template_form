export default defineNuxtPlugin((nuxtApp) => {
    // Register a no-op directive for SSR so Vue's server renderer
    // finds getSSRProps and does not error during render.
    nuxtApp.vueApp.directive('motion', {
        getSSRProps() {
            return {}
        },
    } as any)
})


