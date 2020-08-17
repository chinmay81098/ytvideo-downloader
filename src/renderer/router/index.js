import Vue from 'vue'
import Router from 'vue-router'

import videoDownload from '../views/videoDownload'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Download Video',
      component: videoDownload
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
