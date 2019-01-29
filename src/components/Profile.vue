<template>
  <div class="container">
    {{address}} {{alias}}
    haha
    <div class="row">
      <div class="col-lg-8 col-md-10 mx-auto">
        <posts :posts="displayed_posts"></posts>
        <hr>
        <!-- Pager -->
        <div class="clearfix">
          <a class="btn btn-primary float-right" href="#">Older Posts →</a>
        </div>
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
            'types': 'own_feed',
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
