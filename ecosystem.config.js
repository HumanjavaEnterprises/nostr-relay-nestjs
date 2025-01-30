module.exports = {
  apps: [{
    name: 'maiqr-nostr-relay',
    script: 'dist/src/main.js',
    instances: 1,  // Can be increased based on CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    // Error logs
    error_file: '/var/log/pm2/maiqr-nostr-relay.error.log',
    // Combined output and error logs
    out_file: '/var/log/pm2/maiqr-nostr-relay.log',
    // Log date format
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Merge out and error logs
    combine_logs: true,
    // Rotate logs
    max_size: '10M',
    // Keep at most 10 rotated logs
    retain: 10
  }]
}
