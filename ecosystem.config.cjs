module.exports = {
  apps: [
    {
      name: 'flowment',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=flowment-production --local --ip 0.0.0.0 --port 3000 --config wrangler.local.jsonc',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
