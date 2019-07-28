
const FONT_FAMILY = "'KaiTi','Yu Mincho','Monaco','HG行書体'";
phina.define('TitleScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    this.superInit();
    // グループ
    var bgGroup = DisplayElement().addChildTo(this);
    // タイトル
    Label({
      text: '対戦１５パズル',
      fontSize: 64,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));

    Label({
      text: "TOUCH START",
      fontSize: 32,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(12)).tweener.fadeOut(1000).fadeIn(500).setLoop(true).play();

    var nameInput = this.createInput(240, this.gridX.center()-120, this.gridY.center());
    nameInput.onkeyup = (text)=>{
      this.Player.name = nameInput.value;
    };

    // 画面タッチ時
    this.on('pointend', ()=>{
      if(this.Player.name == "") return;
      // 次のシーンへ
      this.ws.send(JSON.stringify({
        query: "connect",
        Player: this.Player,
      }));
      nameInput.hidden=true;
      this.exit("Waiting");
    });
    // 参照用
    this.bgGroup = bgGroup;
  },
  // 毎フレーム更新処理
  update: function() {
  },
  createInput: function (w, l, t) {
    // DOM操作
    let dom = this.baseDom;
    // 回答用input要素生成
    let input = document.createElement('input');
    // input要素にtext属性付与
    input.getAttribute('text');
    input.placeholder = "名前を入力";
    // スタイルを設定
    let s = input.style;
    s.width = `${w}px`;
    s.height = '60px';
    s.position = 'absolute';
    s.margin = '8px';
    s.left = `${l}px`;
    s.top = `${t}px`;
    s.fontSize = '42px';
    s.fontFamily = FONT_FAMILY;
    s.border = '2px solid';
    dom.appendChild(input);
    s.overflowY = 'hidden';

    // 参照のために返す
    return input;
  },
});
