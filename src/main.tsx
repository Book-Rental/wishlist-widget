import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const userData = window.HOST_USER_INFO;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App userId={userData?._id|| ""} />
  </StrictMode>,
)
