import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Story from '@/components/Story'
import Profile from '@/components/Profile'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/@:alias',
      name: 'Profile',
      component: Profile,
      props: true
    },
    {
      path: '/@:alias/:slug',
      name: 'Story',
      component: Story,
      props: true
    }
  ]
})
