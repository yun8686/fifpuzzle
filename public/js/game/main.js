/*
 * runstant
 */

phina.globalize();

var SCREEN_WIDTH      = 640;
var BOARD_PADDING     = 40;
var BOARD_WIDTH       = SCREEN_WIDTH-BOARD_PADDING*2;
var PIECE_HORIZON_NUM = 4;
var PIECE_VERTICAL_NUM= 4;
var PIECE_NUM         = PIECE_HORIZON_NUM*PIECE_VERTICAL_NUM;
var PIECE_SIZE        = (BOARD_WIDTH/PIECE_HORIZON_NUM)*0.9;
var PIECE_COLOR       = 'hsl({0}, 80%, 60%)';
var PIECE_TEXT_GENERATOR = function(n) {
  return n+1;
};

phina.define('MainScene', {
  superClass: 'CanvasScene',

  init: function() {
    this.superInit();

    this.pieceTable = [];
    this.pieceGroup = CanvasElement().addChildTo(this);

    var grid = Grid(BOARD_WIDTH, PIECE_HORIZON_NUM);
    grid.offset = grid.span(1)/2 + BOARD_PADDING;

    (PIECE_NUM).times(function(i) {
      var xIndex = i%PIECE_HORIZON_NUM;
      var yIndex = (i/PIECE_HORIZON_NUM).floor();
      var p = Piece(i).addChildTo(this.pieceGroup);

      p.x = grid.span(xIndex);
      p.y = grid.span(yIndex)+220;
      p.label.text = PIECE_TEXT_GENERATOR(i);

      p.setInteractive(true);
      p.onpointend = function() {
        this.movePiece(p);
      }.bind(this);

      this.pieceTable.push(p);
    }, this);

    var cursorPiece = this.pieceGroup.children.last;
    cursorPiece.hide();
    cursorPiece.color = null;
    this.cursorPiece = cursorPiece;

    this.time = 0.0;
    this.fromJSON({
      children: {
        timerLabel: {
          className: 'Label',
          x: this.gridX.span(15),
          y: this.gridY.span(2.5),
          align: 'right',
          fontSize: 100,
          text: '15.01',
        },
      },
    });

    this.shufflePiece();
  },

  update: function(app) {
    this.time += app.deltaTime;
    this.timerLabel.text = (this.time/1000).toFixed(2);
  },

  getPieceByPosIndex: function(xIndex, yIndex) {
    if (xIndex < 0 || (PIECE_HORIZON_NUM) <= xIndex) return null;
    if (yIndex < 0 || (PIECE_VERTICAL_NUM) <= yIndex) return null;

    var index = xIndex + yIndex*PIECE_HORIZON_NUM;
    return this.pieceTable[index];
  },

  piece2Index: function(p) {
    return this.pieceTable.indexOf(p);
  },

  piece2PosIndex: function(p) {
    var index = this.piece2Index(p);
    return {
      xIndex: index%PIECE_HORIZON_NUM,
      yIndex: (index/PIECE_HORIZON_NUM).floor(),
    };
  },

  movePiece: async function(p) {
    var posIndexA = this.piece2PosIndex(p);
    var posIndexB = this.piece2PosIndex(this.cursorPiece);
    var dx = posIndexA.xIndex - posIndexB.xIndex;
    var dy = posIndexA.yIndex - posIndexB.yIndex;

    if(dx === 0 && dy !== 0){
      for(var i=1, e=Math.abs(dy);i<=e;i++){
        if(dy > 0){
          await this.swapPiece(this.getPieceByPosIndex(posIndexB.xIndex, posIndexB.yIndex + i), this.cursorPiece, 10);
        }else{
          await this.swapPiece(this.getPieceByPosIndex(posIndexB.xIndex, posIndexB.yIndex - i), this.cursorPiece, 10);
        }
      }
    }else if(dx !== 0 && dy === 0){
      for(var i=1, e=Math.abs(dx);i<=e;i++){
        if(dx > 0){
          await this.swapPiece(this.getPieceByPosIndex(posIndexB.xIndex + i, posIndexB.yIndex), this.cursorPiece, 10);
        }else{
          await this.swapPiece(this.getPieceByPosIndex(posIndexB.xIndex - i, posIndexB.yIndex), this.cursorPiece, 10);
        }
      }
    }
    if (this.isClear()) {
      this.gameClear();
    }
  },

  swapPiece: function(a, b, time) {
    var indexA = this.piece2Index(a);
    var indexB = this.piece2Index(b);
    this.pieceTable[indexA] = b;
    this.pieceTable[indexB] = a;

    if (time) {
      return Flow(function(resolve) {
        a.tweener.clear()
          .to({
            x: b.x,
            y: b.y,
          }, time, 'easeOutCubic')
          ;
        b.tweener.clear()
          .to({
            x: a.x,
            y: a.y,
          }, time, 'easeOutCubic')
          .call(function() {
            resolve();
          })
          ;
      });
    }
    else {
      var temp = a.x; a.x = b.x; b.x = temp;
      var temp = a.y; a.y = b.y; b.y = temp;

      return Flow.resolve();
    }
  },

  shufflePiece: function() {
    var c = this.cursorPiece;

    (128).times(function() {
      var cursorPosIndex = this.piece2PosIndex(c);
      var xIndex = cursorPosIndex.xIndex;
      var yIndex = cursorPosIndex.yIndex;
      var left  = this.getPieceByPosIndex(xIndex-1, yIndex);
      var right = this.getPieceByPosIndex(xIndex+1, yIndex);
      var up    = this.getPieceByPosIndex(xIndex, yIndex-1);
      var down  = this.getPieceByPosIndex(xIndex, yIndex+1);
      var target= [left,right,up,down].filter(function(p) {
        return p != null;
      }).pickup();

      this.swapPiece(c, target);
    }, this);
  },

  isClear: function() {
    return this.pieceTable.every(function(p, i) {
      return p.number === i;
    });
  },

  gameClear: function() {
    this.exit({
      score: this.time/1000 + ' s',
      url: 'http://phiary.me/phina-js-sliding-puzzle-game/',
    });
  },
});

phina.define('Piece', {
  superClass: 'RectangleShape',

  init: function(n) {
    var color = PIECE_COLOR.format(360/15*n);
    this.superInit({
      stroke: false,
      width: PIECE_SIZE,
      height: PIECE_SIZE,
      cornerRadius: 10,
      fill: color,
    });

    this.number = n;

    this.label = Label({
      text: n,
      fontSize: PIECE_SIZE*0.5,
      fill: 'white',
    }).addChildTo(this);
  },
});

phina.main(function() {
  var app = GameApp({
    title: 'Sliding puzzles',
    backgroundColor: 'white',
    fontColor: '#444',
    startLabel: 'main',
  });

  app.run();
});
