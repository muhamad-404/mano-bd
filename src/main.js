import { createApp } from 'vue'
import App from './App.vue'
import { installIcons } from './plugins/icons'
import './styles/tokens.css'
import './styles/base.css'
import './styles/animations.css'

const app = createApp(App)
installIcons(app)
app.mount('#app')
