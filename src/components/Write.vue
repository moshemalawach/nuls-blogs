<template>
  <div>
    <header class="masthead" :style="banner_hash ? `background-image: url('https://ipfs.io/ipfs/${banner_hash}')` : ''">
      <div class="overlay"></div>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto">
            <div class="post-heading">
              <h1>
                <b-form-textarea v-model="title"
                  type="text"
                  placeholder="Enter a title"
                  :rows="1"></b-form-textarea>
              </h1>
              <h2 class="subheading">
                <b-form-textarea v-model="subtitle"
                  type="text"
                  placeholder="subtitle"
                  :rows="1"></b-form-textarea></h2>
              <span class="meta">Posted by
                <account-name :address="account.address"></account-name>
                now</span>

                <b-form-group
                  id="banner"
                  label="Banner Picture"
                  label-for="banner_file"
                  class="mt-4"
                  >
                  <b-input-group>
                    <b-form-file v-model="banner_file"
                    placeholder="Choose a file..." accept="image/jpeg, image/png, image/gif"
                    plain @input="banner_upload"></b-form-file>
                  </b-input-group>
                  <b-form-text v-if="banner_hash">
                     {{banner_hash}}
                  </b-form-text>
                </b-form-group>
            </div>
          </div>
        </div>
      </div>
    </header>
    <article>
      <div class="container">
        <div class="row">
          <div class="col-lg-8 col-md-10 mx-auto mb-5">
            <b-tabs>
              <b-tab title="Write" active>
                <b-form-textarea id="textarea1"
                         v-model="body"
                         placeholder="Your post content"
                         :rows="3"
                         :max-rows="20">
                </b-form-textarea>
              </b-tab>
              <b-tab title="Preview">
                <vue-markdown :source="body"
                :html="false" />
              </b-tab>
            </b-tabs>
            <hr />
            <div class="clearfix">
              <b-button variant="primary" class="float-right" @click="submit">Submit</b-button>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'
import {fetch_profile} from 'nulsworldjs/src/api/aggregates'
import {create_post, ipfs_push_file, broadcast} from 'nulsworldjs/src/api/create'
import { mapState } from 'vuex'
import VueMarkdown from 'vue-markdown'

import bus from '../bus.js'
import router from '../router'

  export default {
    name: 'storyread',
    data() {
      return {
        profile: {},
        transaction: null,
        amends: [],
        banner_hash: null,
        title: '',
        subtitle: '',
        body: '',
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
          post_content = Object.assign({}, post.content)
          for (let amend of this.amends) {
            Object.assign(post_content, amend.content)
          }
          post.content = post_content
        }
        return post
      }
    }),
    components: {
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
      async setState() {
        if (this.txhash) {
          this.banner_hash = this.post.content.banner
          this.title = this.post.content.title
          this.subtitle = this.post.content.subtitle
          this.body = this.post.content.body
        } else {
          this.banner_hash = null
          this.title = ''
          this.subtitle = ''
          this.body = ''
        }
      },
      async refresh() {
        if (this.txhash) {
          await this.getTransaction()
          await this.getProfile()
          await this.getAmends()
        }
        await this.setState()
      },
      applyTextEdit(operation) {
        this.text = operation.api.origElements.innerHTML
      },
      async banner_upload(){
        this.banner_hash = await ipfs_push_file(this.banner_file, {api_server: this.api_server})
      },
      async submit() {
        let tx = null
        if (this.txhash)
          tx = await create_post(
            this.account.address, 'amend', this.body,
            {title: this.title, ref:this.post.hash,
             misc_content: {
               subtitle: this.subtitle,
               banner: this.banner_hash
             }, api_server: this.api_server})
        else
          tx = await create_post(
            this.account.address, 'blog_pers', this.body,
            {title: this.title,
             misc_content: {
               subtitle: this.subtitle,
               banner: this.banner_hash
             }, api_server: this.api_server})

        tx.sign(Buffer.from(this.account.private_key, 'hex'))
        let signed_tx = tx.serialize().toString('hex')
        let tx_hash = await broadcast(signed_tx, {api_server: this.api_server})

        if (this.txhash)
          router.push({ name: "StoryRead", params: {txhash: this.txhash} })
        else
          router.push({ name: "StoryRead", params: {txhash: tx_hash} })


        // this.$store.commit('sign_tx', {
        //   'tx': tx,
        //   'reason': 'New comment on tx ' + this.post.hash
        // })
      }
    },
    watch: {
      async txhash() {
        await this.refresh()
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
