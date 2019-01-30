<template>
  <div>
    <header class="masthead" :style="post.content.banner ? `background-image: url('https://ipfs.io/ipfs/${post.content.banner}')` : ''" v-if="post">
      <div class="overlay"></div>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <div class="post-heading">
              <h1>{{post.content.title||"Untitled"}}</h1>
              <h2 class="subheading" v-if="post.content.subtitle">{{post.content.subtitle}}</h2>
              <span class="meta">Posted by
                <account-name :address="transaction['inputs'][0]['address']"></account-name>
                {{moment.unix(transaction.time/1000).fromNow()}}<span v-if="amends.length">,
                  updated
                  {{moment.unix(amends[amends.length-1].time/1000).fromNow()}}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <article>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <b-button class="float-right"
            :to="{name: 'StoryAmend', params: {txhash: transaction.hash}}"
            v-if="account.address === transaction['inputs'][0]['address']">
              Edit
            </b-button>
            <vue-markdown :source="post.content.body"
            :html="false" />
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script>
import axios from 'axios'
import Posts from './Posts.vue'
import moment from 'moment'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'
import {fetch_profile} from 'nulsworldjs/src/api/aggregates'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'

import bus from '../bus.js'

  export default {
    name: 'storyread',
    data() {
      return {
        profile: {},
        transaction: null,
        amends: [],
        moment: moment
      }
    },
    props: ['txhash'],
    computed: mapState({
      account: state => state.account,
      api_server: state => state.api_server,
      last_broadcast: state => state.last_broadcast,
      post(state) {
        let post = null
        if (this.transaction&&this.transaction.info&&this.transaction.info.post) {
          post = Object.assign({}, this.transaction.info.post)
        }
        if (this.amends.length) {
          let post_content = Object.assign({}, post.content)
          for (let amend of this.amends) {
            Object.assign(post_content, amend.content)
          }
          post.content = post_content
        }
        return post
      }
    }),
    components: {
      Posts,
      AccountAvatar,
      AccountName,
      VueMarkdown
    },
    methods: {
      async getTransaction() {
        let response = await axios.get(`${this.api_server}/transactions/${this.txhash}.json`)
        this.transaction = response.data.transaction
      },
      async getProfile() {
        let address = this.$route.params.address
        this.profile = await fetch_profile(address)
        if (this.profile === null)
          this.profile = {}
        else
          this.$store.commit('store_profile', {
            address: address,
            profile: this.profile
          })
      },
      async getAmends() {
        let response = await axios.get(`${this.api_server}/ipfs/posts.json`, {
          params: {
            'types': 'amend',
            'addresses': this.address,
            'refs': this.txhash,
            'pagination': 200
          }
        })
        this.amends = response.data.posts
        this.amends.reverse()
      },
      async getComments() {
        // posts fron others on this wall
        let response = await axios.get('/ipfs/posts.json', {
          params: {
            'types': 'comment',
            'refs': this.transaction.hash,
            'pagination': 1 // we only need the last modification
          }
        })
        let comments = response.data.posts
        posts.sort((a, b) => (b.time-a.time))

        this.displayed_posts = posts // display all for now
      },
      async refresh() {
        if (this.txhash) {
          await this.getTransaction()
          await this.getProfile()
          await this.getAmends()
        }
      }
    },
    watch: {
      async txhash() {
        await this.getTransaction()
        await this.getProfile()
        await this.getAmends()
      }
    },
    async created() {
      await this.refresh()
      bus.$on('broadcasted', () => {
        setTimeout(this.refresh, 5000);
        setTimeout(this.refresh, 10000);
      })
    }
  }
</script>
<style>
header.masthead .post-heading {
  padding: 100px 0;
}
</style>
