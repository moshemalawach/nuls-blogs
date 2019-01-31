<template>
  <div class="articlepage" ref="page">
    <header class="masthead" :style="post.content.banner ? `background-image: url('https://ipfs.io/ipfs/${post.content.banner}')` : ''" v-if="post&&transaction">
      <div class="overlay"></div>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <div class="post-heading">
              <h1>{{post.content.title||"Untitled"}}</h1>
              <h2 class="subheading" v-if="post.content.subtitle">{{post.content.subtitle}}</h2>
              <span class="meta">Posted by
                 <account-avatar :address="address"
                  linkclass="avatar-xs ml-2"
                  imgclass="rounded-circle" />
                <account-name :address="address"></account-name>
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
    <header class="masthead" v-else>
      <div class="overlay"></div>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <div class="post-heading">
              <h1>{{post.content.title||"Untitled"}}</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
    <article v-if="transaction">
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <b-button class="float-right"
            :to="{name: 'StoryAmend', params: {txhash: transaction.hash}}"
            v-if="account && (account.address === address)">
              Edit
            </b-button>
            <vue-markdown :source="post.content.body"
            :html="false" />
            <hr v-if="comments.length">
            <div v-if="comments.length">
              <h4 class="my-5">{{comments.length}} thoughts on "{{post.content.title}}"</h4>
              <div v-for="comment in comments"
                   :key="post.hash + Object.keys(profiles).length">
                 <div class="d-md-flex justify-content-between">
                   <div class="flex-shrink-1">
                     <account-avatar :address="comment.address"
                       linkclass="avatar-lg"
                       imgclass="rounded-circle" />
                   </div>
                   <div class="flex-grow-1 ml-4">
                     <p class="my-0 text-muted float-right">{{moment.unix(comment.time/1000).fromNow()}}</p>
                     <h5><account-name :address="comment.address"></account-name> says</h5>
                     <vue-markdown :source="comment.content.body"
                       :html="false" />
                   </div>
                 </div>
                <hr />
              </div>
            </div>

            <hr v-if="(account!==null) && (!comments.length)">
            <div class="d-md-flex justify-content-between" v-if="account!==null">
              <div class="flex-shrink-1">
                <!-- Avatar -->
                <account-avatar :address="account.address" imgclass="rounded-circle"></account-avatar>
              </div>
              <div class="flex-grow-1 ml-4">
                <p class="my-0 text-muted float-right">Just now</p>
                <h5><account-name :address="account.address"></account-name> says</h5>
                <b-form-textarea class="form-control" v-model="quick_post_body" placeholder="Leave a comment" rows="2"></b-form-textarea>
              </div>
            </div>
            <div class="row align-items-center justify-content-between mt-2" v-if="quick_post_body">
              <div class="col-auto">
                <!-- more controls here like upload picture and things like that -->
              </div>
              <div class="col-auto">
                <b-button variant="primary" size="sm" @click="quick_post" :disabled="posting">
                  <div class="spinner-border text-light mr-3" role="status" v-if="posting">
                    <span class="sr-only">Loading...</span>
                  </div>
                  Comment
                </b-button>
              </div>
            </div>
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
import {create_post, broadcast} from 'nulsworldjs/src/api/create'
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
        moment: moment,
        comments: [],
        quick_post_body: '',
        posting: false
      }
    },
    props: ['txhash'],
    computed: mapState({
      account: state => state.account,
      profiles: state => state.profiles,
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
      },
      address() {
        if (this.transaction)
          return this.transaction['inputs'][0]['address']
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
        let transaction = response.data.transaction
        if (transaction !== undefined)
          this.transaction = transaction
        else
          this.transaction = null
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
            'pagination': 1 // we only need the last modification
          }
        })
        this.amends = response.data.posts
        this.amends.reverse()
      },
      async getComments() {
        // posts fron others on this wall
        let response = await axios.get(`${this.api_server}/ipfs/posts.json`, {
          params: {
            'types': 'comment',
            'refs': this.transaction.hash,
            'pagination': 200
          }
        })
        let comments = response.data.posts

        for (let comment of comments)
          if (this.profiles[comment.address] === undefined)
            await this.$root.fetch_profile(comment.address)

        this.comments = comments // display all for now
      },
      async update() {
        if (this.txhash)
          await this.getTransaction()
        if (this.transaction) {
          await this.getProfile()
          await this.getAmends()
          await this.getComments()
        }
      },
      async quick_post() {
        this.posting = true
        let tx = await create_post(
          this.account.address, 'comment',
          this.quick_post_body, {
            ref: this.transaction.hash,
            api_server: this.api_server
          }
        )
        // this.$store.commit('sign_tx', {
        //   'tx': tx,
        //   'reason': 'New comment on tx ' + this.post.hash
        // })
        tx.sign(Buffer.from(this.account.private_key, 'hex'))
        let signed_tx = tx.serialize().toString('hex')
        let tx_hash = await broadcast(signed_tx, {api_server: this.api_server})
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(10000)
        await this.getComments()
        this.quick_post_body = ''
        this.posting = false
      }
    },
    watch: {
      async txhash() {
        await this.update()
      }
    },
    async mounted() {
      await this.update()
    }
  }
</script>
<style>
header.masthead .post-heading {
  padding: 100px 0;
}

.articlepage {
  min-height: 100%
}
</style>
