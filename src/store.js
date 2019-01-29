import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import bus from './bus.js'

export default new Vuex.Store({
  state: {
    account: null,
    profiles: {},
    aliases: {},
    alias_addresses: {},
    signTx: null,
    signReason: null,
    signShow: false,
    editProfileShow: false,
    last_broadcast: null
  },
  mutations: {
    set_account(state, account) {
      state.account = account
    },
    sign_tx(state, payload) {
      state.signTx = payload.tx
      state.signReason = payload.reason
      state.signShow = true
    },
    signed_tx(state) {
      state.signTx = null
      state.signReason = null
      state.signShow = false
      state.last_broadcast = new Date()
      bus.$emit('broadcasted');
    },
    store_profile(state, payload) {
      state.profiles[payload.address] = payload.profile
    },
    edit_profile(state) {
      state.editProfileShow = true
    },
    edited_profile(state) {
      state.editProfileShow = false
    }
  }
})
