phina.define('WaitingScene', {
  infoLabel: null,
  status:{
    count: 5,
  },
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    this.superInit();
    // グループ
    var bgGroup = DisplayElement().addChildTo(this);
    // タイトル
    this.infoLabel = Label({
      text: 'マッチング中...',
      fontSize: 64,
    }).addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(4));
    this.infoLabel.tweener.fadeOut(1000).fadeIn(500).setLoop(true).play();

    Label({
      text: this.Player.name ,
      fontSize: 64,
    }).addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.span(6));


    this.wsListener.onMatching = (data)=>{
      console.log('onm', data);

      Label({
        text: data.rivalName,
        fontSize: 64,
      }).addChildTo(this)
        .setPosition(this.gridX.center(), this.gridY.span(8));

      setInterval(()=>{
        this.status.count--;
        if(this.status.count==0){
          this.exit({
            rivalName: data.rivalName,
          });
        }
      }, 1000);
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
    this.infoLabel.text = this.status.count;
  },
});
