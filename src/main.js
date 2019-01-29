// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import BootstrapVue from "bootstrap-vue"
import App from './App'
import router from './router'
import Notifications from 'vue-notification'
import vSelect from 'vue-select'
import store from './store'
import { mapState } from 'vuex'

Vue.use(BootstrapVue)
Vue.use(Notifications)
Vue.component('v-select', vSelect)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store: store,
  router,
  template: '<App/>',
  components: { App },
  computed: mapState({
    account: state => state.account
  }),
  methods: {
    async fetch_profile(address) {
      let profile = await fetch_profile(address)
      this.$store.commit('store_profile', {
        address: address,
        profile: profile
      })
    }
  },
  watch: {
    'account': {
        handler() {
          console.log('Account changed!');
          localStorage.setItem('account', JSON.stringify(this.account));
        },
        deep: true,
      },
  },
  mounted: function() {
    try{
      if (localStorage.getItem('account'))
      {
        this.$store.commit('set_account', JSON.parse(localStorage.getItem('account')))
      }
    } catch (e) {
      console.warn("Can't import data", e);
    }
  },
})
