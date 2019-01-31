<template>
  <router-link v-bind:to="target" :class="'avatar ' + linkclass">
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
    account: state => state.account,
    profiles: state => state.profiles,
    address_alias: state => state.address_alias,
    target(state) {
      if (state.address_alias[this.address] !== undefined) {
        return { name: 'Profile', params: {'alias': state.address_alias[this.address].alias} }
      } else {
        return { name: 'ProfileAddress', params: {'address': this.address} }
      }
    }
  }),
  watch: {
    profiles() {
      this.$forceUpdate();
    },
    address_alias() {
      this.$forceUpdate();
    }
  }
}
</script>
