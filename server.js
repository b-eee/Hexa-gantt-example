const express = require('express');
const proxy = require('http-proxy-middleware');
const path = require("path");
const app = express();
const port = 4321;

console.log("Environment:", process.env.ENV);
let apiHost;
let sseHost;
switch (process.env.ENV) {
  case 'docker':
    apiHost = 'http://host.docker.internal:7575';
    sseHost = 'http://host.docker.internal:5002';
    break;
  case 'dev':
  case 'production':
    apiHost = 'http://linker-api:7575';
    sseHost = 'http://beee-eventgo:5002';
    break;
  default:
    apiHost = 'http://localhost:7575';
    sseHost = 'http://localhost:5002';
}

app.use('/', express.static(path.join(__dirname, 'dist')));

app.use('/event/publish', proxy({
  target: `${sseHost}`,
  pathRewrite: {'^/event': '/api'},
  changeOrigin: true,
}));

app.use('/api', proxy({
  target: `${apiHost}`,
  pathRewrite: {'^/api': '/api/v0'},
  changeOrigin: true,
}));

// for testing
// app.get('/sleep', (req, res) => {
//   let duration = 30 * 1000;
//   if (req.query.duration) {
//     duration = req.query.duration * 1000;
//   }
//   console.log(`Sleeping for ${duration} milliseconds`);
//   setTimeout(() => res.send(`Slept for ${duration} milliseconds`), duration);
// });

app.get('/health_check', (req, res) => {
  // console.log('Health ping');
  res.send('Health pong');
});

const server = app.listen(port, () => console.log(`Listening on port ${port}!`));

const handleShutdown = (signal) => {
  console.log(`[SERVER] shutdown initiated... (${signal} received)`);
  server.getConnections((err, count) => {
    console.log(`[SERVER] number of concurrent connections: ${count}`);
  });
  server.close(function(err) {
    if (err) {
      console.log('[SERVER] error in shutdown:', err);
      return process.exit(1);
    }
    console.log('[SERVER] server exiting');
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
