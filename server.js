var ghost = require('ghost');
var cluster = require('cluster');

var path = require('path');
var express = require('express');
var parentApp = express();
var utils = require('./node_modules/ghost/core/server/services/url/utils');


const PORT = process.env.PORT || 5000;

// Priority serve any static files.
parentApp.use(express.static(path.resolve(__dirname, 'react-ui/build')));

// Answer API requests.
parentApp.get('/api', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send('{"message":"Hello from the custom server!"}');
});

// All remaining requests return the React app, so it can handle routing.
parentApp.get('/', function(request, response) {
  //if (request.url === '/blog' || request.url === '/login') return next();
//  response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
    response.sendFile(path.resolve(__dirname, 'react-ui/build', 'index.html'));
});

// parentApp.listen(PORT, function () {
//   console.log(`Listening on port ${PORT}`);
// });

  


// Heroku sets `WEB_CONCURRENCY` to the number of available processor cores.
var WORKERS = process.env.WEB_CONCURRENCY || 1;

if (cluster.isMaster) {
  // Master starts all workers and restarts them when they exit.
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Starting a new worker because PID: ${worker.process.pid} exited code ${code} from ${signal} signal.`);
    cluster.fork();
  });
  for (var i = 0; i < WORKERS; i++) {
    cluster.fork();
  }
} else {
  // Run Ghost in each worker / processor core.
  ghost().then(function (ghostServer) {
    parentApp.use(utils.getSubdir(), ghostServer.rootApp);
    ghostServer.start(parentApp);
  });
}
