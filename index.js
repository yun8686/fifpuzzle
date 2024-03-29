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
    console.log(params);
    switch(params.query){
      case "connect":
        connects[params.Player.uuid] = ws;
        userParams[params.Player.uuid] = {
          uuid: params.Player.uuid,
          name: params.Player.name,
          waiting: false,
        };
        break;
      case "waiting":
        userParams[params.id].waiting = true;
        var rivalUUID = findRivalUUID(params.id);
        if(rivalUUID){
          matchs[params.id] = rivalUUID;
          matchs[rivalUUID] = params.id;
          console.log("send", params.id);
          connects[params.id].send(JSON.stringify({query: "matching", rivalUUID: rivalUUID, rivalName: userParams[rivalUUID].name}));
          console.log("send", rivalUUID);
          connects[rivalUUID].send(JSON.stringify({query: "matching", rivalUUID: params.id, rivalName: userParams[params.id].name}));
          console.log ("send ", JSON.stringify({query: "matching", rivalUUID: rivalUUID}))
          console.log ("send ", JSON.stringify({query: "matching", rivalUUID: params.id}))
          userParams[params.id].waiting = false;
        }
        break;
      case "send_map":
        var rivalUUID = matchs[params.id];
        console.log("rivalUUID", rivalUUID);
        params.query = "rival_update";
        if(rivalUUID){
          connects[rivalUUID].send(JSON.stringify(params));
        }
        break;
      case "won":
        var playerUUID = params.id;
        var rivalUUID  = matchs[params.id];
        params.query = "game_finish";
        if(connects[playerUUID]){
          gameFinsh(playerUUID, true);
        }
        if(connects[rivalUUID]){
          gameFinsh(rivalUUID, false);
        }
    }
    console.log(userParams);
  });
  ws.on('close', () => {
    var playerUUID = Object.keys(connects).find(key=>connects[key]===ws);
    var rivalUUID = matchs[playerUUID];
    gameFinsh(rivalUUID, true);
    delete userParams[playerUUID];
    delete connects[playerUUID];
  });
});
app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'));
});

function gameFinsh(playerUUID, won){
  if(connects[playerUUID]){
    connects[playerUUID].send(JSON.stringify({
      query: "game_finish",
      won: won,
    }));
  }
}

function findRivalUUID(playerUUID){
  var rival = Object.keys(connects).find(key=>key!=playerUUID && userParams[key].waiting);
  if(rival){
    userParams[rival].waiting = false;
  }
  return rival;
}
