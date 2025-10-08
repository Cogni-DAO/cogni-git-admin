import { Application } from 'probot'
import { rawJson, verifyAlchemyHmac } from './utils/hmac'
import { fetchCogniFromTx } from './services/rpc'

export = (app: Application) => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    context.github.issues.createComment(issueComment)
  })

  // Alchemy webhook endpoint
  const router = app.route()
  router.use(rawJson())
  
  router.post('/alchemy/cogni', async (req: any, res: any) => {
    try {
      if (!verifyAlchemyHmac(req)) return res.status(401).send('bad signature')
      
      const logs = req.body?.event?.data?.block?.logs || []
      let txHash = null
      for (const log of logs) {
        if (log.transaction?.hash) {
          txHash = log.transaction.hash
          break
        }
      }
      if (!txHash) return res.status(400).send('missing txHash')
      
      const out = await fetchCogniFromTx(txHash, process.env.COGNI_SIGNAL_CONTRACT as `0x${string}`)
      if (!out) return res.status(204).end()
      
      const allowChain = BigInt(process.env.COGNI_CHAIN_ID!)
      const allowDao = (process.env.COGNI_ALLOWED_DAO || '').toLowerCase()
      
      if (out.parsed.chainId !== allowChain) return res.status(204).end()
      if (out.parsed.dao.toLowerCase() !== allowDao) return res.status(204).end()
      
      app.log.info({ kind: 'CogniAction', txHash: out.txHash, logIndex: out.logIndex, ...out.parsed, chainId: out.parsed.chainId.toString() })
      return res.status(200).send('ok')
      
    } catch (e) { 
      app.log.error(e) 
      return res.status(500).send('error') 
    }
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
