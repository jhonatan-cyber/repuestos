module.exports = {
  apps: [
    {
      name: "renault-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5000",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "5000",
      },
      env_file: ".env",
      max_memory_restart: "500M",
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      watch: false,
      kill_timeout: 10000,
      restart_delay: 3000,
      max_restarts: 5,
    },
  ],
}
