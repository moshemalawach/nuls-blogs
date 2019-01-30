<template>
  <div class="post-list">
    <div v-for="post in posts"
         v-bind:post="post"
         :key="post.hash + last_broadcast + Object.keys(profiles).length">
      <div class="post-preview">
        <router-link :to="{ name: 'StoryRead', params: {txhash: post.hash} }">
          <h2 class="post-title">
            {{post.content.title}}
          </h2>
          <h3 class="post-subtitle" v-if="post.content.subtitle">
            {{post.content.subtitle}}
          </h3>
          <p v-if="!post.content.title">
            {{post.content.body}}
          </p>
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
      this.$forceUpdate()
    },
    async posts() {
      await this.update_profiles()
      this.$forceUpdate()
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
      post_comments: {}
    }
  },
  methods: {
    async update_profiles() {
      for (let post of this.posts)
        if (this.profiles[post.address] === undefined)
          await this.$root.fetch_profile(post.address)
    }
  },
  async mounted() {
  },
  async created() {
    bus.$on('broadcasted', () => {
      setTimeout(this.update_profiles, 10000)
    })
  }
}
</script>
