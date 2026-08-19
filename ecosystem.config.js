module.exports = {
  apps: [
    {
      name: "foodback-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "foodback-tunnel",
      cwd: "./backend",
      script: "tunnel_monitor.js"
    }
  ]
};
