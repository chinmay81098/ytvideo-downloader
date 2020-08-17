import Vue from 'vue'
import axios from 'axios'
import CoreuiVue from '@coreui/vue';
import App from './App'
import router from './router'
import '@coreui/coreui/dist/css/coreui.min.css';

Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(CoreuiVue);

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
