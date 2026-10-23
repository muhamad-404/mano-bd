import { createApp } from 'vue'
import Particles from '@tsparticles/vue3'
import { loadSlim } from '@tsparticles/slim'
import App from './App.vue'
import { installIcons } from './plugins/icons'
import './styles/tokens.css'
import './styles/base.css'
import './styles/animations.css'

const app = createApp(App)

installIcons(app)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[vue]', info, err)
  if (typeof window !== 'undefined' && window.__manoShowError) {
    window.__manoShowError(err)
  }
}

app.use(Particles, {
  init: async (engine) => {
    await loadSlim(engine)
  },
})

app.mount('#app')
