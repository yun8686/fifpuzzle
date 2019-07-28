// グローバルに展開
phina.globalize();

var DISPLAY_WITDH = 640;
var PIECE_NUM_XY = 4;              // 縦横のピース数
var PIECE_SIZE = (DISPLAY_WITDH/4);
var RIVAL_PIECE_SIZE = (DISPLAY_WITDH/12);
/*
 * メインシーン
 */
phina.define("MainScene", {
  pieceLists: [],
  rivalPieceLists: [],
  playerUuid: Common.generateUuid(),
  cursorPiece:null,
  infoPanel: {},
  mainGridX:null, mainGridY:null,
  status: {
    matched: false,
    won: false,
    lose: false,
    rivalUUID: "",
  },

  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // グリッド
    var gx = this.gridX;
    var gy = this.gridY;
    // 横線
    var axeX = RectangleShape({
      width: gx.width,
      height: 2,
      fill: '#aaa',
    }).addChildTo(this).setPosition(gx.center(), gy.center());
    axeX.alpha = 0.5;
    // 縦線
    var axeY = RectangleShape({
      width: 2,
      height: gy.width,
      fill: '#aaa',
    }).addChildTo(this).setPosition(gx.center(), gy.center());
    axeY.alpha = 0.5;
    // グリッド点
    var pointGroup = DisplayElement().addChildTo(this);
    (17).times(function(spanX) {
      (17).times(function(spanY) {
        var point = CircleShape({
          radius: 2,
          fill: '#aaa',
        }).addChildTo(pointGroup).setPosition(gx.span(spanX), gy.span(spanY));
      });
    });

    var infoGroup = DisplayElement().addChildTo(this);;
    var infoGridX = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: 0 });
    var infoGridY = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: 0 });
    this.infoPanel = Label({
      text: 'status',
      fontSize: 24,
    }).addChildTo(this).setPosition(infoGridX.center(), infoGridY.center());
    var mainGroup = DisplayElement().addChildTo(this);
    this.mainGridX = Grid({width: gx.width, columns: PIECE_NUM_XY, offset: PIECE_SIZE/2});
    this.mainGridY = Grid({width: gx.width, columns: PIECE_NUM_XY, offset: gy.width - gx.width + (PIECE_SIZE/2)});
    (PIECE_NUM_XY).times((spanY)=>{
      (PIECE_NUM_XY).times((spanX) => {
        var piece = Piece(PIECE_SIZE, spanX+spanY*PIECE_NUM_XY, spanX, spanY, this.mainGridX, this.mainGridY).addChildTo(mainGroup);
        piece.setPos();
        piece.setInteractive(true);
        piece.onpointend = () => {
          if(!this.status.won && !this.status.lose){
            this.movePiece(this.cursorPiece, piece);
            if(this.checkClear(this.pieceLists)){
              this.sendSocket({
                query: "won",
                id: this.playerUuid,
              });
              this.status.won = true;
            }
          }
          //this.movePiece(p);
        };
        this.pieceLists[spanX+spanY*PIECE_NUM_XY] = piece;
        if(PIECE_NUM_XY*PIECE_NUM_XY-1 == spanX+spanY*PIECE_NUM_XY) this.cursorPiece = piece;
      });
    });

    var rivalGroup = DisplayElement().addChildTo(this);
    var rivalGridX = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: gx.width - (RIVAL_PIECE_SIZE/2)*8 });
    var rivalGridY = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: RIVAL_PIECE_SIZE/2 + (RIVAL_PIECE_SIZE/2)});
    (PIECE_NUM_XY).times((spanY)=>{
      (PIECE_NUM_XY).times((spanX)=>{
        var piece = Piece(RIVAL_PIECE_SIZE, spanX+spanY*PIECE_NUM_XY, spanX, spanY, rivalGridX, rivalGridY).addChildTo(mainGroup);
        piece.setPos();
        piece.setInteractive(true);
        piece.onpointend = () => {
          //this.movePiece(p);
        };
        this.rivalPieceLists[spanX+spanY*PIECE_NUM_XY] = piece;
      });
    });
    this.wsListener.onRivalUpdate = (data)=>{
      var pieceList = data.table.map((v,i)=>{
        return Piece.getPieceByNumber(this.rivalPieceLists, v.number);
      });
      Flow((resolve)=>{
        data.table.map((v,i)=>{
          pieceList[i].setSpan(this.rivalPieceLists, v);
          this.rivalPieceLists[i].movePos(100);
        });
        resolve();
      });
    }
    this.websocket()

  },
  update: function(app){
    this.infoPanel.text = `matched: ${this.status.matched?"Yes":"No"}\n`;
    this.infoPanel.text += `rivalUUID: ${this.status.rivalUUID}`;


//    if(this.ws.readyState == this.ws.OPEN)
//      this.ws.send(app);
//    console.log("update", new Date()-0);
  },
  ws: null,
  wsListener: {
    onRivalUpdate: function(){
    },
    onMatching: function(){
    },
  },
  websocket: function(){
    var HOST = location.origin.replace(/^http/, 'ws');
    var ws = new WebSocket(HOST + "/ws");
    this.ws = ws;
    ws.onopen = (event)=>{
      ws.send(JSON.stringify({
        query: "connect",
        id: this.playerUuid,
      }));
      ws.send(JSON.stringify({
        query: "waiting",
        id: this.playerUuid,
      }));
      this.wsListener.onMatching = (data)=>{
        this.status.matched = true;
        this.status.rivalUUID = data.rivalUUID;
        for(var i=0;i<128;){
          var a = ~~(Math.random()*15);
          var b = ~~(Math.random()*15);
          if(a!=b){
            var p1 = this.pieceLists[a];
            var p2 = this.pieceLists[b];
            this.swapPiece(this.pieceLists, p1, p2);
            i++;
          }
        }
        this.pieceLists.map(v=>v.movePos(100));
      };
      this.wsListener.onGameFinish = (data)=>{
        const won = data.won;
        if(won){
          this.status.won = true;
          Label({
            text: 'You Win',
            fontSize: 24,
          }).addChildTo(this).setPosition(this.mainGridX.center(), this.mainGridY.center());
        }else{
          this.status.lose = true;
          Label({
            text: 'You Lose',
            fontSize: 24,
          }).addChildTo(this).setPosition(this.mainGridX.center(), this.mainGridY.center());
        }
      };
    };
    ws.onmessage = ({data})=>{
      data = JSON.parse(data);
      const query = data.query;
      switch(query){
        case "rival_update":
          this.wsListener.onRivalUpdate(data);
          break;
        case "matching":
          this.wsListener.onMatching(data);
          break;
        case "game_finish":
          this.wsListener.onGameFinish(data);
          break;
      }
    }
    return ws;
  },
  sendSocket: function(data){
    if(this.ws.readyState == this.ws.OPEN){
      this.ws.send(JSON.stringify(data));
    }
  },
  checkClear: function(pieceLists){
    for(var i=0;i<pieceLists.length;i++){
      if(i != pieceLists[i].number) return false;
    }
    return true;
  },

  // ピースの位置を入れ替える(Pos情報,PieceList情報も入れ替える)
  swapPiece: function(pieceLists, piece, targetPiece){
    var pieceSpan = piece.getSpan();
    var targetPieceSpan = targetPiece.getSpan();
    piece.setSpan(pieceLists, targetPieceSpan);
    targetPiece.setSpan(pieceLists, pieceSpan);
  },
  // ピースを動かす処理(cursorPieceをtargetPieceの位置まで入れ替えながら移動する 1-2-3-4 => 4-1-2-3)
  movePiece: function(cursorPiece, targetPiece){
    var xdif = cursorPiece.x-targetPiece.x;
    var ydif = cursorPiece.y-targetPiece.y;
    if( xdif == 0 || ydif == 0 ){  // 横か縦が同じとき
      if(xdif+ydif == 0) return;  // 両方同じ場合は何もしない
      Flow((resolve)=>{
        if(xdif == 0){
          var cursorSpan = cursorPiece.getSpan();
          var targetSpan = targetPiece.getSpan();
          if(cursorSpan.SpanY < targetSpan.SpanY){
            while(cursorSpan.SpanY < targetSpan.SpanY){
              var nextSpan = {SpanX:cursorSpan.SpanX, SpanY:cursorSpan.SpanY+1};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }else{
            while(cursorSpan.SpanY > targetSpan.SpanY){
              var nextSpan = {SpanX:cursorSpan.SpanX, SpanY:cursorSpan.SpanY-1};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }
        }else{
          var cursorSpan = cursorPiece.getSpan();
          var targetSpan = targetPiece.getSpan();
          if(cursorSpan.SpanX < targetSpan.SpanX){
            while(cursorSpan.SpanX < targetSpan.SpanX){
              var nextSpan = {SpanX:cursorSpan.SpanX+1, SpanY:cursorSpan.SpanY};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }else{
            while(cursorSpan.SpanX > targetSpan.SpanX){
              var nextSpan = {SpanX:cursorSpan.SpanX-1, SpanY:cursorSpan.SpanY};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }
        }
        // ピースを動かすアニメーション
        this.pieceLists.map(v=>v.movePos(100));
        resolve();
      }).then(()=>{
        const data = {
          query: "send_map",
          id: this.playerUuid,
          table: this.pieceLists.map(v=>v.getSpan()),
        };
        this.sendSocket(data);
      });
    }
  }
});

// ピースクラス
phina.define('Piece', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function(piece_size, number, spanX, spanY, gridX, gridY) {
      // 親クラス初期化
      this.superInit({
        width: piece_size*0.95,
        height: piece_size*0.95,
        cornerRadius: 10,
        fill: 'silver',
        stroke: 'white',
      });
      this.number = number;
      this.spanX = spanX;
      this.spanY = spanY;
      this.gridX = gridX;
      this.gridY = gridY;
      this.label = Label({
        text: number+1,
        fontSize: piece_size*0.5,
        fill: 'white',
      }).addChildTo(this);
      if(this.number+1 == PIECE_NUM_XY*PIECE_NUM_XY) this.hide();
    },
    getSpan(){
      return {number: this.number, SpanX: this.spanX, SpanY:this.spanY};
    },
    setSpan(pieceLists, span){
      this.spanX = span.SpanX;
      this.spanY = span.SpanY;
      pieceLists[this.spanX+this.spanY*PIECE_NUM_XY] = this;
    },
    setPos(){
      this.setPosition(this.gridX.span(this.spanX), this.gridY.span(this.spanY));
    },
    movePos(time){
      this.tweener.clear().to({
        x: this.gridX.span(this.spanX),
        y: this.gridY.span(this.spanY)
      }, time, 'easeOutCubic');
    }
});
Piece.getPieceBySpan = function(pieceLists, {SpanX,SpanY}){
  return pieceLists[SpanX+SpanY*PIECE_NUM_XY];
};
Piece.getPieceByNumber = function(pieceLists, number){
  console.log("getPieceByNumber", pieceLists.map(v=>v.number));
  return pieceLists.find(v=>v.number == number);
}

/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    startLabel: 'main',
  });
  // 実行
  app.run();
});
