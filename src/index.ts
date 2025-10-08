import { Application } from 'probot'
import { createApiRoutes } from './routes'

export = (app: Application) => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    context.github.issues.createComment(issueComment)
  })

  // Mount API routes
  const router = app.route()
  router.use('/api', createApiRoutes(app.log))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
