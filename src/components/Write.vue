<template>
  <div>
    <div class="container">
    	<div class="jumbotron jumbotron-fluid mb-3 pl-0 pt-0 pb-0 bg-white position-relative">
    		<div class="h-100 tofront">
    			<div class="row justify-content-between">
    				<div class="col-md-6 pt-6 pb-6 pr-6 align-self-center">
    					<!--<p class="text-uppercase font-weight-bold">
    						<a class="text-danger" href="./category.html">Stories</a>
    					</p>-->
    					<h1 class="display-4 secondfont mb-3 font-weight-bold">
                <b-form-textarea v-model="title"
                type="text"
                placeholder="Enter a title"
                class="form-inherit"
                :rows="Math.ceil(title.length/15)"
                required></b-form-textarea>
              </h1>
    					<p class="mb-3">
                  <b-form-textarea v-model="subtitle"
                    type="text"
                    class="form-inherit"
                    placeholder="subtitle (optional)"
                    :rows="Math.ceil(subtitle.length/40)"></b-form-textarea>
    					</p>
    					<div class="d-flex align-items-center">
                <account-avatar :address="account.address"
                 linkclass="avatar-lg ml-2"
                 imgclass="rounded-circle" />
    						<small class="ml-2">
                  <account-name :address="account.address" linkclass="text-dark"></account-name>
                  <span class="text-muted d-block" v-if="transaction">
                    {{moment.unix(transaction.time/1000).fromNow()}},
                      updated now.
                  </span>
                  <span class="text-muted d-block" v-else>
                    Just now
                  </span>
    						</small>
    					</div>
    				</div>
    				<div class="col-md-6" :style="banner_hash ? `background-image: url('https://ipfs.io/ipfs/${banner_hash}'); background-size: cover; background-position: center center;   background-repeat: no-repeat;` : ''">
                 <b-form-group
                   id="banner"
                   label="Banner Picture"
                   label-for="banner_file"
                   class="bg-lightblue p-4 mt-4"
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
    </div>

    <div class="container pt-4 pb-4">
    	<div class="row justify-content-center">
    		<div class="col-lg-2 pr-4 mb-4 col-md-12">
    			<div class="sticky-top">
    				Your article can be edited using the markdown syntax and previewed using the right tab.
    			</div>
    		</div>
    		<div class="col-md-12 col-lg-8">
    			<article class="article-post">
            <b-tabs>
              <b-tab title="Write" active>
                <b-form-textarea id="textarea1"
                         v-model="body"
                         placeholder="Your post content"
                         class="form-inherit mt-4"
                         :rows="10"
                         :max-rows="20"
                         required>
                </b-form-textarea>
              </b-tab>
              <b-tab title="Preview">
                <vue-markdown :source="body"
                :html="false" class="mt-4" />
              </b-tab>
            </b-tabs>
    			</article>
          <div class="clearfix float-right">
            <b-form-text>
               Costs 0.001 <i class="nuls"></i>
            </b-form-text>
            <b-button :variant="(title&&body) ? 'success' : 'danger'" @click="submit" :disabled="(!(title&&body))||processing">
              {{processing ? 'Please wait...' : 'Submit'}}
            </b-button>
          </div>
    		</div>
    	</div>
    </div>
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
        banner_file: null,
        banner_hash: null,
        title: '',
        subtitle: '',
        body: '',
        moment: moment,
        processing: false
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
            {title: this.title, ref: this.transaction.hash,
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

        this.processing = true
        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(14000)
        this.processing = false

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
    }
  }
</script>
<style>
header.masthead .post-heading {
  padding: 100px 0;
}
</style>
