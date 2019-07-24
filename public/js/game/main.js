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
  cursorPiece:null,
  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function() {
    // 親クラス初期化
    this.superInit();
    // グリッド
    var gx = this.gridX;
    var gy = this.gridY;
    console.log('gx.width', gx.width);
    console.log('gy.width', gy.width);
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


    var mainGroup = DisplayElement().addChildTo(this);
    var mainGridX = Grid({width: gx.width, columns: PIECE_NUM_XY, offset: PIECE_SIZE/2});
    var mainGridY = Grid({width: gx.width, columns: PIECE_NUM_XY, offset: gy.width - gx.width + (PIECE_SIZE/2)});
    (PIECE_NUM_XY).times((spanY)=>{
      this.pieceLists[spanY] = [];
      (PIECE_NUM_XY).times((spanX) => {
        var piece = Piece(PIECE_SIZE, spanX+spanY*PIECE_NUM_XY, spanX, spanY, mainGridX, mainGridY).addChildTo(mainGroup);
        piece.setPosition(mainGridX.span(spanX), mainGridY.span(spanY));
        this.pieceLists[spanY][spanX] = piece;
        piece.setInteractive(true);
        piece.onpointend = () => {
          console.log("tap", piece.x);
          this.movePiece(this.cursorPiece, piece);
          //this.movePiece(p);
        };
        if(PIECE_NUM_XY*PIECE_NUM_XY-1 == spanX+spanY*PIECE_NUM_XY) this.cursorPiece = piece;
      });
    });

    var rivalGroup = DisplayElement().addChildTo(this);
    var rivalGridX = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: gx.width - (RIVAL_PIECE_SIZE/2)*8 });
    var rivalGridY = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: RIVAL_PIECE_SIZE/2 + (RIVAL_PIECE_SIZE/2)});
    (PIECE_NUM_XY).times(function(spanY) {
      (PIECE_NUM_XY).times(function(spanX) {
        var piece = Piece(RIVAL_PIECE_SIZE, spanX+spanY*PIECE_NUM_XY, spanX, spanY, rivalGridX, rivalGridY).addChildTo(mainGroup);
        piece.setPos();
        piece.setInteractive(true);
        piece.onpointend = () => {
          console.log("tap", piece.number);
          //this.movePiece(p);
        };
      });
    });
    this.ws = this.websocket();
  },
  update: function(app){
//    if(this.ws.readyState == this.ws.OPEN)
//      this.ws.send(app);
//    console.log("update", new Date()-0);
  },
  ws: null,
  websocket: function(){
    var HOST = location.origin.replace(/^http/, 'ws');
    var ws = new WebSocket(HOST + "/ws");
    ws.onopen = (event)=>{
      ws.send('connected my');
    };
    return ws;
  },
  sendSocket: function(data){
    if(this.ws.readyState == this.ws.OPEN){
      this.ws.send(data);
    }
  },
  // ピースの位置を入れ替える(Pos情報,PieceList情報も入れ替える)
  swapPiece: function(pieceLists, piece, targetPiece){
    var piecex = piece.x, piecey = piece.y;
    var targetPiecex = targetPiece.x, targetPiecey = targetPiece.y;
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
          if(cursorSpan.y < targetSpan.y){
            while(cursorSpan.y < targetSpan.y){
              var nextSpan = {x:cursorSpan.x, y:cursorSpan.y+1};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }else{
            while(cursorSpan.y > targetSpan.y){
              var nextSpan = {x:cursorSpan.x, y:cursorSpan.y-1};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }
        }else{
          var cursorSpan = cursorPiece.getSpan();
          var targetSpan = targetPiece.getSpan();
          if(cursorSpan.x < targetSpan.x){
            while(cursorSpan.x < targetSpan.x){
              var nextSpan = {x:cursorSpan.x+1, y:cursorSpan.y};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }else{
            while(cursorSpan.x > targetSpan.x){
              var nextSpan = {x:cursorSpan.x-1, y:cursorSpan.y};
              var p1 = Piece.getPieceBySpan(this.pieceLists, cursorSpan);
              var p2 = Piece.getPieceBySpan(this.pieceLists, nextSpan);
              this.swapPiece(this.pieceLists, p1, p2);
              cursorSpan = nextSpan;
            }
          }
        }
        // ピースを動かすアニメーション
        this.pieceLists.map(v=>v.forEach(w=>w.movePos(100)));
        resolve();
      }).then(()=>{
        this.sendSocket(JSON.stringify(this.pieceLists.map(v=>v.map(w=>w.number))));
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
      return {x: this.spanX, y:this.spanY};
    },
    setSpan(pieceLists, span){
      this.spanX = span.x;
      this.spanY = span.y;
      pieceLists[this.spanY][this.spanX] = this;
    },
    setPos(){
      this.setPosition(this.gridX.span(this.spanX), this.gridY.span(this.spanY));
    },
    movePos(time){
      this.tweener.clear().to({x: this.gridX.span(this.spanX),y: this.gridY.span(this.spanY)}, time, 'easeOutCubic');
    }
});
Piece.getPieceBySpan = function(pieceLists, {x,y}){
  return pieceLists[y][x];
};

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
