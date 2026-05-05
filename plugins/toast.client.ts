import { createApp } from "vue";
import Toast, { type PluginOptions, POSITION } from "vue-toastification";
import "vue-toastification/dist/index.css";

export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false,
    transition: "Vue-Toastification__bounce",
    maxToasts: 20,
    newestOnTop: true,
    filterBeforeCreate: (toast, toasts) => {
      if (toasts.filter((t) => t.type === toast.type).length !== 0) {
        return false;
      }
      return toast;
    },
  };

  nuxtApp.vueApp.use(Toast, options);
});
