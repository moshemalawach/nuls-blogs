<template>
  <div class="post-list" ref="list">
    <div v-for="post in posts"
         v-if="post_amends[post.hash] ? post_amends[post.hash].content.title : post.content.title"
         v-bind:post="post"
         :key="post.hash + last_broadcast + Object.keys(profiles).length + Object.keys(post_amends).length">
      <div class="post-preview">
        <router-link :to="{ name: 'StoryRead', params: {txhash: post.hash} }">
          <h2 class="post-title">
            {{post_amends[post.hash] ? post_amends[post.hash].content.title : post.content.title}}
          </h2>
          <h3 class="post-subtitle" v-if="post_amends[post.hash] ? post_amends[post.hash].content.subtitle : post.content.subtitle">
            {{post_amends[post.hash] ? post_amends[post.hash].content.subtitle : post.content.subtitle}}
          </h3>
        </router-link>
        <p class="post-meta">Posted by
          <account-avatar :address="post.address"
            linkclass="avatar-xs"
            imgclass="rounded-circle" />
          <account-name :address="post.address"></account-name>
          {{moment.unix(post.time/1000).fromNow()}}</p>
      </div>
      <hr />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import moment from 'moment'
import VueMarkdown from 'vue-markdown'
import axios from 'axios'
import bus from '../bus.js'
import AccountAvatar from './AccountAvatar.vue'
import AccountName from './AccountName.vue'

export default {
  name: 'posts',
  props: ['posts'],
  computed: mapState({
    account: state => state.account,
    last_broadcast: state => state.last_broadcast,
    profiles: state => state.profiles,
    api_server: state => state.api_server
  }),
  watch: {
    last_broadcast: async function() {
    },
    async profiles() {
      this.$forceUpdate();
    },
    async posts() {
      await this.update();
    }
  },
  components: {
    VueMarkdown,
    AccountAvatar,
    AccountName
  },
  data() {
    return {
      quick_post_body: "",
      moment: moment,
      post_amends: {}
    }
  },
  methods: {
    async update() {
      let loader = this.$loading.show({
        // Optional parameters
        container: this.$refs.list,
        loader: 'dots',
        opacity: .9
      });
      await this.update_profiles()
      await this.update_amends()
      this.$forceUpdate()
      loader.hide()
    },
    async update_profiles() {
      for (let post of this.posts)
        if (this.profiles[post.address] === undefined)
          await this.$root.fetch_profile(post.address)
    },
    async update_amends() {
      let post_amends = {}
      const hashes = this.posts.map(x => x.hash);
      console.log(hashes)
      let response = await axios.get(`${this.api_server}/ipfs/posts.json`, {
        params: {
          'types': 'amend',
          'refs': hashes.join(','),
          'pagination': 200 // let's hope this is enough...
        }
      })
      let amends = response.data.posts;
      amends.reverse()
      for (let amend of amends) {
        // we only keep the last one. let's hope it has all the fields...
        post_amends[amend.ref] = amend;
      }

      this.post_amends = post_amends
    }
  },
  async mounted() {
    await this.update();
  }
}
</script>
