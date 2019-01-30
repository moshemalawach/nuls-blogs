<template>
  <div class="container">
    <div class="row">
      <div class="col-lg-8 col-md-10 mx-auto">
        <b-button class="float-right mt-5"
        :to="{name: 'EditProfile', params: {address: address}}"
        v-if="account.address === address">
          Edit
        </b-button>
        <div class="my-5 d-md-flex justify-content-between">
          <div class="flex-shrink-1 order-1 col-md-4 col-lg-3 align-self-center">
            <account-avatar :address="address"
              linkclass="avatar-xxl"
              imgclass="rounded-circle" />
          </div>
          <div class="flex-grow-1 order-0 mt-4 align-self-center">
            <h1 v-if="profile.name">{{profile.name}}</h1>
            <h1 v-else-if="alias">@{{alias}}</h1>
            <h1 v-else>{{address}}</h1>
            <p v-if="profile.bio">{{profile.bio}}</p>
            <p v-else>Account with the address {{address}}</p>
          </div>
        </div>
        <b-tabs>
          <b-tab title="Posts" active v-if="displayed_posts.length">
            <posts :posts="displayed_posts"></posts>
          </b-tab>
          <!-- <b-tab title="Comments">
          </b-tab> -->
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Posts from './Posts.vue'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'
import {fetch_profile} from 'nulsworldjs/src/api/aggregates'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'

import bus from '../bus.js'

  export default {
    name: 'profile',
    data() {
      return {
        profile: {},
        displayed_posts: []
      }
    },
    computed: mapState({
      account: state => state.account,
      api_server: state => state.api_server,
      last_broadcast: state => state.last_broadcast,
      alias(state) {
        let alias = this.$route.params.alias
        let address = this.$route.params.address
        if (address !== undefined) {
          let aliasobj = state.address_alias[address]
          if (aliasobj !== undefined) {
            alias = aliasobj.alias
          }
        }
        return alias
      },
      address(state) {
        let address = this.$route.params.address
        let alias = this.$route.params.alias
        if (alias !== undefined) {
          address = state.alias_address[alias].address
        }
        return address
      }
    }),
    components: {
      Posts,
      AccountAvatar,
      AccountName,
      VueMarkdown
    },
    methods: {
      async getProfile() {
        this.profile = await fetch_profile(this.address, {api_server: this.api_server})
        if (this.profile === null)
          this.profile = {}
        else
          this.$store.commit('store_profile', {
            address: this.address,
            profile: this.profile
          })
      },
      async getPosts() {
        // own posts`
        let response = await axios.get(`${this.api_server}/ipfs/posts.json`, {
          params: {
            'types': 'blog_pers',
            'addresses': this.address,
            'pagination': 200
          }
        })
        let posts = response.data.posts
        posts.sort((a, b) => (b.time-a.time))

        this.displayed_posts = posts // display all for now
      },
      async refresh() {
        await this.getProfile()
        await this.getPosts()
      }
    },
    watch: {
      async $route(to, from) {
        await this.getProfile()
        await this.getPosts()
      }
    },
    async created() {
      await this.refresh()
      bus.$on('broadcasted', () => {
        setTimeout(this.refresh, 5000);
        setTimeout(this.refresh, 10000)
      })
    }
  }
</script>
<style>
.header-profile {
  margin-bottom: 0;
}

.header-profile .header-body {
  border: 0;
}

.header-profile .header-img-top {
  object-fit: cover;
  max-height: 200px;
}

</style>
