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
        var piece = Piece(PIECE_SIZE, spanX+spanY*PIECE_NUM_XY, spanX, spanY).addChildTo(mainGroup);
        piece.setPosition(mainGridX.span(spanX), mainGridY.span(spanY));
        this.pieceLists[spanY][spanX] = piece;
        piece.setInteractive(true);
        piece.onpointend = () => {
          console.log("tap", piece.x);
          this.swapPiece(this.cursorPiece, piece);
          //this.movePiece(p);
        };
        if(PIECE_NUM_XY*PIECE_NUM_XY-1 == spanX+spanY*PIECE_NUM_XY) this.cursorPiece = piece;
      });
    });

    var rivalGroup = DisplayElement().addChildTo(this);
    var mainGridX = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: gx.width - (RIVAL_PIECE_SIZE/2)*8 });
    var mainGridY = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: RIVAL_PIECE_SIZE/2 + (RIVAL_PIECE_SIZE/2)});
    (PIECE_NUM_XY).times(function(spanX) {
      (PIECE_NUM_XY).times(function(spanY) {
        var piece = Piece(RIVAL_PIECE_SIZE, spanX*4+spanY, spanX, spanY).addChildTo(mainGroup);
        piece.setPosition(mainGridX.span(spanX), mainGridY.span(spanY));
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
  swapPiece: function(piece1, piece2){
    var xdif = piece1.x-piece2.x;
    var ydif = piece1.y-piece2.y;
    if( xdif == 0 || ydif == 0 ){  // 横か縦が同じとき
      var time = 100; // 入れ替えにかかる時間
      Flow((resolve)=>{
        var x1 = piece1.x, y1 = piece1.y;
        var x2 = piece2.x, y2 = piece2.y;
        piece1.tweener.clear().to({x: x1,y: y1-ydif}, time, 'easeOutCubic');
        piece2.tweener.clear().to({x: x2,y: y2+ydif}, time, 'easeOutCubic');
        resolve();
      }).then(()=>{
        this.sendSocket(JSON.stringify(this.pieceLists.map(v=>v.map(w=>w.number))));
      })
    }
  }
});

// ピースクラス
phina.define('Piece', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function(piece_size, number, spanX, spanY) {
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
      this.label = Label({
        text: number+1,
        fontSize: piece_size*0.5,
        fill: 'white',
      }).addChildTo(this);
      if(this.number+1 == PIECE_NUM_XY*PIECE_NUM_XY) this.hide();
    },
});

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
