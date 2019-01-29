<template>
  <form :class="loaded ? '': 'is-loading is-loading-lg'">

    <b-form-group
      id="name"
      label="Name"
      label-for="name"
      >
      <b-input-group>
        <b-form-input type="text" placeholder="Name" :maxlength="100"
                      v-model="name" />
      </b-input-group>
    </b-form-group>

    <b-form-group
      id="name"
      label="Profile Picture"
      label-for="ppic_file"
      >
      <b-input-group>
        <b-form-file v-model="ppic_file"
        placeholder="Choose a file..." accept="image/jpeg, image/png, image/gif"
        plain @input="ppic_upload"></b-form-file>
      </b-input-group>
      <b-form-text v-if="ppic_hash">
         {{ppic_hash}}
      </b-form-text>
    </b-form-group>

    <b-form-group
      id="bio"
      label="Bio"
      label-for="bio"
      >
      <b-input-group>
        <b-form-textarea placeholder="Bio"
                      v-model="bio" />
      </b-input-group>
    </b-form-group>

    <button class="btn btn-lg btn-block btn-primary mb-3" v-on:click="save">
      Save
    </button>
    <b-form-text>
       Costs 0.001 <i class="nuls"></i>
    </b-form-text>

  </form>
</template>
<script>
import axios from 'axios'
import {private_key_to_public_key,
        address_from_hash,
        hash_from_address,
        public_key_to_hash,
        get_outputs_for_sum
      } from 'nulsworldjs/src/model/data.js'
import {fetch_profile, submit_aggregate} from 'nulsworldjs/src/api/aggregates'
import {ipfs_push_file} from 'nulsworldjs/src/api/create'
import Transaction from 'nulsworldjs/src/model/transaction.js'
import Sign from './Sign.vue'

export default {
  name: 'transfer',
  data() {
    return {
      'tx': null,
      'loaded': false,
      'name': '',
      'bio': '',
      'ppic_file': '',
      'ppic_hash': ''
    }
  },
  computed: {
  },
  methods: {
    broadcasted(msg) {
      Object.assign(this.$data, this.$options.data())
      this.outputs = null
      this.$emit('message-broadcasted', msg)
    },
    async fetch_profile() {
      this.loaded = false
      let address = this.account.address
      let profile = await fetch_profile(address)
      if (profile !== null) {
        this.name = profile.name ? profile.name : ''
        this.bio = profile.bio ? profile.bio : ''
      } else {
        this.name = ''
        this.bio = ''
      }
      this.loaded = true
    },
    async ppic_upload(){
      this.ppic_hash = await ipfs_push_file(this.ppic_file)
    },
    async save() {
      let values = {
        'name': this.name,
        'bio': this.bio
      }

      if (this.ppic_hash) {
        values['profile_picture'] = this.ppic_hash
      }

      let tx = await submit_aggregate(
        this.account.address, 'profile', values
      )
      this.$store.commit('sign_tx', {
        'tx': tx,
        'reason': 'Profile modification for ' + this.account.address
      })
    }
  },
  props: ['account'],
  components: {
    Sign
  },
  async created() {
    await this.fetch_profile()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
