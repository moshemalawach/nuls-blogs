<template>
  <div id="app">
    <notifications group="wallet" />
    <notifications group="blog" />
    <b-modal ref="warningModal" hide-footer title="Warning" v-model="warningShow">
      <div class="d-block text-center">
        <h3>Warning</h3>
        <p>The wallet part is beta software.</p>
        <p>I am not responsible if you lose any fund with it.</p>
      </div>
    </b-modal>
    <b-modal id="signModal" ref="signModal"
             hide-footer :title="signReason" :visible="signShow"
             @hidden="$store.commit('signed_tx')">
      <sign v-if="signShow" :account="selected_account" :tx="signTx" :reason="signReason" @message-broadcasted="$store.commit('signed_tx')"></sign>
    </b-modal>
    <b-navbar toggleable="md" id="mainNav" sticky="top">
      <b-navbar-brand to="/">BlofApp</b-navbar-brand>
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav  class="ml-auto">
          <b-nav-item v-if="!account" @click="login">Log-In</b-nav-item>
          <b-nav-text v-if="account">Welcome {{account.name}}!</b-nav-text>
          <b-nav-item v-if="account" @click="logout">Log-Out</b-nav-item>
        </b-navbar-nav>

      </b-collapse>
    </b-navbar>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Sign from './components/Sign.vue'


import {call_view_method,
        prepare_contract_call_tx} from 'nulsworldjs/src/api/contracts'
import {private_key_to_public_key,
  address_from_hash,
  public_key_to_hash
} from 'nulsworldjs/src/model/data.js'
import {broadcast} from 'nulsworldjs/src/api/create'
import {Transaction} from 'nulsworldjs/src/model/transaction'

var api_server = 'https://testnet.nuls.world'
var network_id = 261

var hexRegEx = /([0-9]|[a-f])/gim
function isHex (input) {
  return typeof input === 'string' &&
    (input.match(hexRegEx) || []).length === input.length
}

export default {
  name: 'app',
  data() {
    return {
      //msg: 'Welcome to Your Vue.js App'
      'warningShow': false,
      'private_key': null
    }
  },
  computed: mapState({
    account: state => state.account,
    signShow: state => state.signShow,
    signTx: state => state.signTx,
    signReason: state => state.signReason
  }),
  components: {
    Sign
  },
  methods: {
    check_pkey() {
      if (!isHex(this.private_key)) { return false }
      if (!this.private_key) { return false }
      if ((this.private_key.length === 66) && (this.private_key.substring(0, 2) === '00')) {
        this.private_key = this.private_key.substring(2, 66)
        return true
      }
      if (this.private_key.length !== 64) { return false }
      try {
        let prvbuffer = Buffer.from(this.private_key, 'hex')
        let pub = private_key_to_public_key(prvbuffer)
        return true
      } catch (e) {
        return false
      }
    },
    async login() {
      this.private_key = prompt("Please enter your private key:")
      if (!this.check_pkey()) {
        alert("Private key is invalid.")
        return
      }
      let prvbuffer = Buffer.from(this.private_key, 'hex')
      let pub = private_key_to_public_key(prvbuffer)
      let hash = public_key_to_hash(pub, {
        chain_id: this.chain_id
      })
      let address = address_from_hash(hash)
      // Vue.set(this, 'public_key', pub);
      let public_key = pub.toString('hex')
      let address_hash = hash.toString('hex')
      let account = {
        'name': address,
        'private_key': this.private_key,
        'public_key': public_key,
        'address': address
      }
      this.$store.commit('set_account', account)
    },
    async logout() {
      this.$store.commit('set_account', null)
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.account)
        this.warningShow = true
    })
  },

}
</script>

<style lang="scss">
@import 'assets/scss/_variables.scss';
@import '~bootstrap/scss/bootstrap.scss';
@import 'assets/scss/_variables.scss';
@import '~bootstrap-vue/dist/bootstrap-vue.css';
@import 'assets/scss/clean-blog.scss';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
