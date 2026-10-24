import { defineConfig, loadEnv } from 'vite'
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

function leaderboardApiDevMiddleware() {
  return {
    name: 'alwination-leaderboard-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/leaderboard', async (req, res, next) => {
        try {
          const { default: handler } = await import('./api/leaderboard.js')
          await handler(req, res)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

function siteApiDevMiddleware() {
  return {
    name: 'alwination-site-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
        if (pathname !== '/api/site' && !/^\/api\/admin\/(site|login|logout|session)$/.test(pathname)) {
          next()
          return
        }
        try {
          // Import after loadEnv: shared auth and storage capture server env on load.
          if (pathname === '/api/site') {
            const { default: handler } = await import('./api/site.js')
            await handler(req, res)
          } else {
            req.query = { path: [pathname.split('/').at(-1)] }
            const { default: handler } = await import('./api/admin/[...path].js')
            await handler(req, res)
          }
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // These keys remain server-only; none is exposed through VITE_ or define.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['LEADERBOARD_DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET']) {
    if (env[key] && process.env[key] === undefined) process.env[key] = env[key]
  }

  return {
    plugins: [imageApiDevMiddleware(), leaderboardApiDevMiddleware(), siteApiDevMiddleware(), react(), tailwindcss()],
  }
})
