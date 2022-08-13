let Hooks = {} //

Hooks.MNIST = {
    mounted() {
        console.log("MNSIT.run")
        //HTML要素取得
        const canvas = document.getElementById('js-paint')
        const ctx = canvas.getContext('2d')
        //キャンバス初期設定
        ctx.fillStyle = '#f5f5f5'  //白で塗りつぶす
        ctx.rect(0, 0, canvas.width, canvas.height)
        ctx.fill()
        const lineWidth = 20; //文字の太さ
        ctx.lineCap = 'round'; //描画を丸く
        ctx.lineWidth = lineWidth; //文字の大きさを変更
        //ボタン設定
        const resetButton = document.querySelector( '.js-reset'); //リセットボタンを取得

        import("./mnist").then(module => {
            const drawing = new module.drawing(canvas)
            canvas.addEventListener( "mousedown", drawing.startDrawing)
            canvas.addEventListener( "mouseup", drawing.stopDrawing)
            canvas.addEventListener( 'mousemove', drawing.drawLine )
            canvas.addEventListener( 'mouseout', drawing.stopDrawing )
            resetButton.addEventListener( 'click', drawing.canvasReset)
        })
    }
}

//クルミ用
Hooks.KURUMI = {
    mounted() {
        //console.log("kurumi hook")
        import("./kurumi").then(module => {
            //デフォルト読み込み先
            const videoPath = "../video/kurumi.mp4"
            let texPath = "../images/famima.jpg"
            //初期化
            let promise =  module.initalize(videoPath, texPath)
            //じぇねるボタン処理
            this.handleEvent("genelu", (params) => {
                //ユーザーの画像を取得
                texPath = params.path
                promise = module.initalize(videoPath, texPath)
                //リソース読み込み後開始
                promise.then(
                    (pro) => {
                        module.rendering(pro)
                    }
                )
            })         

            //終わるボタン処理
            this.handleEvent("init", () => {
                promise = module.initalize(videoPath, texPath)
            })

            //もう一回ボタン処理
            this.handleEvent("replay", () => {
                module.rendering(promise)
            })

            

        })
        //console.log("kurumi_end")
    }
}

export default Hooks//値を外に出す