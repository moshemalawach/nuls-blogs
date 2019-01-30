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
    <div id="mainNav">
      <b-container>
        <b-navbar toggleable="md">
          <b-navbar-brand to="/">NULS Space</b-navbar-brand>
          <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
          <b-collapse is-nav id="nav_collapse">
            <b-navbar-nav  class="ml-auto align-items-center">
              <b-nav-item v-if="!account" :to="{name: 'Login'}" class="btn btn-secondary btn-sm ml-2">Log-In</b-nav-item>
              <b-nav-text v-if="account">
                <account-avatar :address="account.address"
                  linkclass="avatar-xs"
                  imgclass="rounded-circle" />
                  <account-name :address="account.address" /></b-nav-text>
              <b-nav-item v-if="account" :to="{name: 'Write'}" class="btn btn-primary btn-sm ml-2">Write</b-nav-item>
              <b-nav-item v-if="account" @click="logout" class="btn btn-secondary btn-sm ml-2">Log-Out</b-nav-item>
            </b-navbar-nav>
          </b-collapse>
        </b-navbar>
      </b-container>
    </div>
    <router-view></router-view>
    <hr />
    <footer>
      <b-container>
        <b-row>
          <b-col lg="8" md="10" class="mx-auto">
            <p class="copyright text-muted mt-0">
              NULS Space is a dApp based on the NULS blockchain and the <a href="https://nuls.world">NULS.World</a> API.
            </p>
            <p class="copyright text-muted mt-0">
              Currently on
              <span v-if="network_id===261">
                Test-Net.
                <b-link @click="set_network(8964, 'https://nuls.world')">Switch</b-link>
              </span>
              <span v-if="network_id===8964">
                Main-Net.
                <b-link @click="set_network(261, 'https://testnet.nuls.world')">Switch</b-link>
              </span>
            </p>
          </b-col>
        </b-row>
      </b-container>
    </footer>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import AccountAvatar from './components/AccountAvatar.vue'
import AccountName from './components/AccountName.vue'
import Sign from './components/Sign.vue'


import {call_view_method,
        prepare_contract_call_tx} from 'nulsworldjs/src/api/contracts'
import {private_key_to_public_key,
  address_from_hash,
  public_key_to_hash
} from 'nulsworldjs/src/model/data.js'
import {broadcast} from 'nulsworldjs/src/api/create'
import {Transaction} from 'nulsworldjs/src/model/transaction'
import {get_aliases} from 'nulsworldjs/src/api/aliases'


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
    signReason: state => state.signReason,
    api_server: state => state.api_server,
    network_id: state => state.network_id,

  }),
  watch: {
    async network_id() {
      this.update_aliases()
    }
  },
  components: {
    Sign,
    AccountName,
    AccountAvatar
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
    async logout() {
      this.$store.commit('set_account', null)
    },
    async update_aliases() {
      let aliases = await get_aliases({api_server: this.api_server})
      console.log(aliases)
      this.$store.commit('set_aliases', aliases)
    },
    async set_network(network_id, api_server) {
      this.$store.commit({
        'type': 'set_network',
        'network_id': network_id,
        'api_server': api_server
      })
      this.$router.push('/')
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.account)
        this.warningShow = true
      this.update_aliases()
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
