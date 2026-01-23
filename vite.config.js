import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { neon } from '@neondatabase/serverless'

// Custom plugin to handle API routes in development
function apiRoutesPlugin() {
  let sql = null

  return {
    name: 'api-routes',
    configureServer(server) {
      // Load environment variables
      const env = loadEnv('development', process.cwd(), '')

      server.middlewares.use(async (req, res, next) => {
        // Initialize sql connection lazily
        if (!sql && env.DATABASE_URL) {
          sql = neon(env.DATABASE_URL)
        }

        // Handle /api/get-student
        if (req.url?.startsWith('/api/get-student')) {
          const url = new URL(req.url, 'http://localhost')
          const cedula = url.searchParams.get('cedula')

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (!cedula) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Cédula requerida' }))
            return
          }

          if (!sql) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'DATABASE_URL no configurada en .env' }))
            return
          }

          try {
            const result = await sql`SELECT * FROM get_student_info(${cedula})`
            res.statusCode = 200
            res.end(JSON.stringify(result))
          } catch (error) {
            console.error('API Error:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
          return
        }

        // Handle /api/get-subjects
        if (req.url?.startsWith('/api/get-subjects')) {
          const url = new URL(req.url, 'http://localhost')
          const cedula = url.searchParams.get('cedula')

          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')

          if (!cedula) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Cédula requerida' }))
            return
          }

          if (!sql) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'DATABASE_URL no configurada en .env' }))
            return
          }

          try {
            const result = await sql`SELECT * FROM get_student_subjects_with_sections(${cedula})`
            res.statusCode = 200
            res.end(JSON.stringify(result))
          } catch (error) {
            console.error('API Error:', error)
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message }))
          }
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [apiRoutesPlugin(), svelte()],
})
