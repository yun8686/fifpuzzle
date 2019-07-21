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
    (PIECE_NUM_XY).times(function(spanX) {
      (PIECE_NUM_XY).times(function(spanY) {
        var piece = Piece(PIECE_SIZE).addChildTo(mainGroup);
        piece.setPosition(mainGridX.span(spanX), mainGridY.span(spanY));
      });
    });

    var rivalGroup = DisplayElement().addChildTo(this);
    var mainGridX = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: gx.width - (RIVAL_PIECE_SIZE/2)*8 });
    var mainGridY = Grid({width: gx.width/3, columns: PIECE_NUM_XY, offset: RIVAL_PIECE_SIZE/2 + (RIVAL_PIECE_SIZE/2)});
    (PIECE_NUM_XY).times(function(spanX) {
      (PIECE_NUM_XY).times(function(spanY) {
        var piece = Piece(RIVAL_PIECE_SIZE).addChildTo(mainGroup);
        piece.setPosition(mainGridX.span(spanX), mainGridY.span(spanY));
      });
    });

  },
});


// ピースクラス
phina.define('Piece', {
  // RectangleShapeを継承
  superClass: 'RectangleShape',
    // コンストラクタ
    init: function(piece_size) {
      // 親クラス初期化
      this.superInit({
        width: piece_size*0.95,
        height: piece_size*0.95,
        cornerRadius: 10,
        fill: 'silver',
        stroke: 'white',
      });
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
