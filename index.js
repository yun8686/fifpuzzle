const express     = require('express');
const app         = express();
const expressWs   = require('express-ws')(app);
const morgan      = require('morgan');
const compression = require('compression');
const serveStatic = require('serve-static');
const basicAuth   = require('basic-auth-connect');
const user = process.env.USER;
const pass = process.env.PASS;
const connects = {};
const userParams = {};
const waitingUUIDS = [];
const matchs = {};
app.set('port', process.env.PORT || 3000);
if (user && pass) {
  app.use(basicAuth(user, pass));
}
app.use(morgan('dev'));
app.use(compression());
app.use(serveStatic(`${__dirname}/public`));
app.ws('/ws', (ws, req) => {
  ws.on('message', message => {
    console.log('--------- onmessage ---------');
    var params = JSON.parse(message);
    switch(params.query){
      case "connect":
        connects[params.id] = ws;
        userParams[params.id] = {
          uuid: params.id,
          waiting: false
        };
        break;
      case "waiting":
        userParams[params.id].waiting = true;
        var rivalUUID = findRivalUUID(params.id);
        if(rivalUUID){
          matchs[params.id] = rivalUUID;
          matchs[rivalUUID] = params.id;
          userParams[params.id].waiting = false;
        }
        break;
      case "sendMap":
        var rivalUUID = matchs[params.id];
        console.log("rivalUUID", rivalUUID);
        if(rivalUUID){
          connects[rivalUUID].send(JSON.stringify(params));
        }
        break;
    }
    console.log(userParams);
  });

  ws.on('close', () => {
    var key = Object.keys(connects).find(key=>connects[key]===ws);
    delete connects[key];
  });
});
app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'));
});


function findRivalUUID(playerUUID){
  var rival = Object.keys(connects).find(key=>key!=playerUUID && userParams[key].waiting);
  if(rival){
    userParams[rival].waiting = false;
  }
  return rival;
}
