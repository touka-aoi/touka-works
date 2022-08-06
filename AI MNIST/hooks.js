let Hooks = {} //
import * as tf from '@tensorflow/tfjs'

Hooks.MNIST = {
    mounted() {
        async function run() {
            const model = await tf.loadLayersModel('https://toukard.com/content/model/MNIST/model.json'); //モデルを読み込む
            const canvas = document.getElementById("js-paint")
            const ctx = canvas.getContext("2d")
            const canvas2 = document.getElementById('js-result')
            const canavsImage = ctx.getImageData(0, 0, canvas.height, canvas.width)
            const cli = tf.tidy(() => {
                const subSc = tf.scalar(1)
                const mulSc = tf.scalar(-1)
                let img = tf.browser.fromPixels(canavsImage, numChannels=1).toFloat().step(0).sub(subSc).mul(mulSc).resizeBilinear([28,28])
                tf.browser.toPixels(img, canvas2)
                img = img.expandDims(0)
                const cli = model.predict(img)
                return cli
            })
            //console.log(img.arraySync())  
            //console.log(cli.shape)
            console.log(cli.dataSync())
            const result = cli.argMax(1).dataSync()[0]
            for (let step = 0; step < 10; step++) {
                const pId = "predict-" + step
                const bgId = "predictBg-" + step
                const cliProb = document.getElementById(pId)    
                const bgDiv = document.getElementById(bgId)
                cliProb.innerText = cli.dataSync()[step].toFixed(6)
                console.log(step, result)
                if (step == Number(result)) {
                    bgDiv.classList.remove("bg-zinc-50")
                    bgDiv.classList.add("bg-green-400")
                }
                else {
                    bgDiv.classList.remove("bg-green-400")
                    bgDiv.classList.add("bg-zinc-50")
                }
            }
            const resultP = document.getElementById("js-predict")
            resultP.innerText = result
            
        }
        
        const canvas = document.getElementById('js-paint')
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#f5f5f5'
        ctx.rect(0, 0, canvas.width, canvas.height)
        ctx.fill()

        const lineWidth = 20; //文字の太さ
        
        const resetButton = document.querySelector( '.js-reset'); //リセットボタンを取得
        let result = document.querySelector('.js-predict'); //答えを入力
        
        ctx.lineCap = 'round'; //描画を丸く
        ctx.lineWidth = lineWidth; //文字の大きさを変更
        ctx.fillRect(20, 20, 150, 100);


        let x = 0,  y = 0; //マウス位置
        let isMouseDown = false; //入力フラグ

        const stopDrawing = () => { //マウスオフ
            if (isMouseDown) {    
                run()
            }
            isMouseDown = false;
        } 

        const startDrawing = event => { //マウスオン
            isMouseDown = true;
            [x, y] = [event.offsetX, event.offsetY];
        }

        const drawLine = event => { //線を書く
            if (isMouseDown) {
                const newX = event.offsetX;
                const newY = event.offsetY;
                ctx.beginPath();  //パスの開始
                ctx.moveTo(x, y); //パスの原点
                ctx.lineTo(newX, newY); //パスの終点
                ctx.stroke(); //パスを描画
                x = newX; 
                y = newY;
            }
        }

        const canvasReset = () => { //キャンバスをリセットする
            ctx.fillStyle = '#f5f5f5'
            ctx.rect(0, 0, canvas.width, canvas.height)
            ctx.fill()
        }

        canvas.addEventListener( "mousedown", startDrawing);
        canvas.addEventListener( "mouseup", stopDrawing);
        canvas.addEventListener( 'mousemove', drawLine );
        canvas.addEventListener( 'mouseout', stopDrawing );
        resetButton.addEventListener( 'click', canvasReset);

        this.handleEvent("predict" , () => (
            run()
        ))
    }
}

export default Hooks//値を外に出す

