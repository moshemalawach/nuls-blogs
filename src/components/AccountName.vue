<template>
  <span>
    <router-link :to="target"
       v-if="(profiles[address]) && (profiles[address].name)"
       :class="linkclass ? linkclass : ''"
       >{{profiles[address].name}}</router-link>
    <router-link :to="target"
      :class="linkclass ? linkclass : ''"
       v-else-if="address_alias[address] !== undefined">@{{address_alias[address].alias}}</router-link>
    <router-link :to="target"
      :class="linkclass ? linkclass : ''"
       v-else>{{address}}</router-link>
  </span>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'account-name',
  props: ['address', 'linkclass'],
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
