phina.define('WaitingScene', {
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    this.superInit();
    // グループ
    var bgGroup = DisplayElement().addChildTo(this);
    // タイトル
    Label({
      text: 'マッチング中...',
      fontSize: 64,
    }).addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(4))
      .tweener.fadeOut(1000).fadeIn(500).setLoop(true).play();
    this.wsListener.onMatching = (data)=>{
      console.log('onm', data);
      this.exit({
        rivalName: data.rivalName,
      });
    };
    this.ws.send(JSON.stringify({
      query: "waiting",
      id: this.Player.uuid,
    }));
    // 参照用
    this.bgGroup = bgGroup;
  },
  // 毎フレーム更新処理
  update: function() {
  },
});
