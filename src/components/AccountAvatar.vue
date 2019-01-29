<template>
  <router-link v-bind:to="'/profile/' + address" :class="'avatar ' + linkclass">
      <img :src="'https://ipfs.io/ipfs/' + profiles[address].profile_picture" alt="..." :class="'avatar-img ' + imgclass"
           v-if="(profiles[address]) && (profiles[address].profile_picture)">
      <img :src="'https://robohash.org/' + address + '?set=set1&bgset=bg1'"
           alt="..."  :class="'avatar-img ' + imgclass" v-else>
    </router-link>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'account-avatar',
  props: ['address', 'linkclass', 'imgclass', 'profile'],
  computed: mapState({
    accounts: state => state.accounts,
    profiles: state => state.profiles
  })
}
</script>
