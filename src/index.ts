import { Application } from 'probot'

import { createApiRoutes } from './routes'
import './utils/env' // Import triggers validation, exports not used yet

export default (app: Application) => {
  // Environment validation already ran during import - this will exit on missing required vars
  app.log('✅ Environment validation passed')
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    await context.github.issues.createComment(issueComment)
  })

  // Mount API routes
  const router = app.route()
  router.use('/api', createApiRoutes(app.log, app))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
