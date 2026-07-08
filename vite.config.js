import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { optimizedRemoteImage } from './image-optimizer.mjs'

function imageApiDevMiddleware() {
  return {
    name: 'alwination-image-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/image', async (req, res) => {
        try {
          const requestUrl = new URL(req.url ?? '/', 'http://localhost/api/image')
          const image = await optimizedRemoteImage(requestUrl)

          res.statusCode = 200
          res.setHeader('Content-Type', image.contentType)
          res.setHeader('Content-Length', String(image.buffer.byteLength))
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(image.buffer)
        } catch (error) {
          res.statusCode = 400
          res.setHeader('Cache-Control', 'no-store')
          res.end(error.message)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [imageApiDevMiddleware(), react(), tailwindcss()],
})
