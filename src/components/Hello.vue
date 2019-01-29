<template>
  <div class="container">
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
import moment from 'moment'
import { mapState } from 'vuex'
import Posts from './Posts.vue'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'

import bus from '../bus.js'

export default {
  name: 'hello',
  data() {
    return {
      displayed_posts: [],
      account_profiles: {},
      moment: moment
    }
  },
  components: {
    Posts,
    AccountAvatar,
    AccountName
  },
  computed: mapState({
    account: 'account',
    api_server: 'api_server',
    last_broadcast: 'last_broadcast'
  }),
  watch: {
    last_broadcast: function() {
      setTimeout(this.update.bind(this), 10000)
      this.$nextTick(() => {
        this.quick_post_title = ''
        this.quick_post_body = ''
      })
    }
  },
  methods: {
    async update() {
      await this.update_posts()
    },
    async update_posts() {
      let response = await axios.get(`${this.api_server}/ipfs/posts.json?types=own_feed,other_feed&pagination=200`)
      let posts = response.data.posts // display all for now
      //await this.update_comments(posts);
      this.displayed_posts = response.data.posts // display all for now
    },
    async quick_post() {
      let tx = await create_post(
        this.selected_account.address, 'own_feed',
        this.quick_post_body, this.quick_post_title
      )
      this.$store.commit('sign_tx', {
        'tx': tx,
        'reason': 'New post on public timeline'
      })
    }
  },
  async created() {
    // We may not have a correct account list yet... So wait a bit.
    this.$nextTick(this.update.bind(this))
    //setTimeout(this.update.bind(this), 500)
    setInterval(this.update.bind(this), 30000)

    bus.$on('broadcasted', () => {
      setTimeout(this.update, 10000);
      this.$nextTick(() => {
        this.quick_post_title = ''
        this.quick_post_body = ''
      })
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
