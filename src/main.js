import { createApp, createSSRApp } from 'vue'
import './style.css'
import App from './App.vue'

const root = document.querySelector('#app')
const app = root.firstElementChild ? createSSRApp(App) : createApp(App)
app.mount(root)
