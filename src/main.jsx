import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IconSprite } from './common/Icons.jsx'
import SiteProvider from './common/SiteProvider.jsx'
import Toast from './common/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteProvider>
      <IconSprite />
      <App />
      <Toast />
    </SiteProvider>
  </StrictMode>,
)
