const glMatrix =  require("gl-matrix")

//VetexShader
const vertexShaderSource = `#version 300 es 
    #pragma vscode_glsllint_stage: vert 

    layout(location = 0) in vec4 aPosition;
    layout(location = 1) in vec2 aTexCoord;
    
    uniform mat4 uRotateMatrix;
    uniform mat4 uScaleMatrix;
    uniform mat4 uTranslateMatrix;

    out vec2 vTexCoord;

    void main () 
    { 
        gl_Position = uTranslateMatrix * uRotateMatrix * uScaleMatrix * aPosition ;  
        vTexCoord = aTexCoord;
    } 
`

//PixelShader
const fragmentShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage: frag

    precision mediump float;

    in vec2 vTexCoord;

    out vec4 fragColor;

    uniform sampler2D uKurumiSampler;
    uniform sampler2D uDisplaySampler;
    uniform int uTextureFlag;

    const vec3 chromaKeyColor = vec3(0.0, 1.0, 0.0);

    void main() {
        vec4 backColor = texture(uDisplaySampler, vTexCoord);
        vec4 baseColor = texture(uKurumiSampler, vTexCoord);
        float diff = length(chromaKeyColor - baseColor.rgb);
        if (uTextureFlag == 1){
            fragColor = backColor;
        }   
        else {
            if (diff < 0.5) {
                discard;
            }
            else {
                fragColor = baseColor;
            }
        }
}
`
const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl2")

const program = gl.createProgram()
//GLSL読み込み
{
    //頂点シェーダ
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)
    gl.attachShader(program, vertexShader)

    //フラグメントシェーダ
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)
    gl.attachShader(program, fragmentShader)

    //エラー時
    gl.linkProgram(program)

    //エラー表示
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader))
        console.log(gl.getShaderInfoLog(fragmentShader))
    }

}
gl.useProgram(program)


//頂点
const elementVetexData = new Float32Array(
    [
        -1.0, 1.0,
        1.0, 1.0, 
        -1.0 , -1.0,
        1.0, -1.0,
    ]
)



//頂点インデックス
const elementIndexData = new Uint8Array(
    [
        0, 1, 2,
        1, 2, 3,
    ]
)

//UV
const texCoordBufferData = new Float32Array (
    [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
    ]
)

//テスト用ランダムピクセル
const pixels = new Uint8Array (
    [
        255,255,255,		230,25,75,			60,180,75,			255,225,25,
	    67,99,216,			245,130,49,			145,30,180,			70,240,240,
	    240,50,230,			188,246,12,			250,190,190,		0,128,128,
	    230,190,255,		154,99,36,			255,250,200,		0,0,0,
    ]
)


//頂点座標
const elementVetexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, elementVetexBuffer)
gl.bufferData(gl.ARRAY_BUFFER, elementVetexData, gl.STATIC_DRAW)
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2*4, 0);
gl.enableVertexAttribArray(0)

//頂点インデックス
const elementIndexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elementIndexData, gl.STATIC_DRAW)

//UV
const texCoordBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
gl.bufferData(gl.ARRAY_BUFFER, texCoordBufferData, gl.STATIC_DRAW)
gl.vertexAttribPointer(1,2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(1)

//定数
const kurumiTextureUnit = 0
const displayTextureUnit = 1

//ロケーション設定
gl.uniform1i(gl.getUniformLocation(program, "uKurumiSampler"), kurumiTextureUnit)
gl.uniform1i(gl.getUniformLocation(program, "uDisplaySampler"), displayTextureUnit)

//初期化処理
const initalize = async (videoPath, texturePath) => {
    //ビデオロード
    const video = await loadVideo(videoPath)
    //テクスチャロード
    const image = await loadImage(texturePath)

    //unifromデフォルト値にセット
    const scaleMatrix = glMatrix.mat4.create()
    const translateMatrix = glMatrix.mat4.create()
    const rotationMatrix = glMatrix.mat4.create()
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uRotateMatrix"), false, rotationMatrix)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uScaleMatrix"), false, scaleMatrix)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uTranslateMatrix"), false, translateMatrix)
    gl.uniform1i(gl.getUniformLocation(program, "uTextureFlag"), 0)

    //Texture
    const kurumiTexture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + kurumiTextureUnit)
    gl.bindTexture(gl.TEXTURE_2D, kurumiTexture)
    //ターゲット, ミップマップレベル, 内部フォーマット, width, height, border, format, type, source
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1920, 1080, 0, gl.RGB, gl.UNSIGNED_BYTE, video)
    gl.generateMipmap(gl.TEXTURE_2D) //ミップマップを生成
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST) //ミップマップなし
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //頂点数、型、初期位置
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)

    const displayTexture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + displayTextureUnit)
    gl.bindTexture(gl.TEXTURE_2D, displayTexture)
    //ターゲット, ミップマップレベル, 内部フォーマット, width, height, border, format, type, source
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D) //ミップマップを生成
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //頂点数、型、初期位置
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)

    //console.log("intialize end")
    //配列にすると複数で返せる
    return new Promise(resolve => {resolve([kurumiTexture, displayTexture, image, video])})
}

const rendering = async (promise, flame=0) => {
    //promiseを受ける
    const [kurumiTexture, displayTexture, image, video] = await promise
    //動画再生
    video.play()
    //レンダリング
    const render = (now) => {
        const flame_rate = 1 / 30 
        now *= 0.001
        let deltaTime = now - then
        const rotationAngle =  Math.acos(-1) / 180 * 4
        //30fps
        if (deltaTime >= flame_rate) {
            console.log(flame)
            console.log(deltaTime)            
            //裏描画
            gl.uniform1i(gl.getUniformLocation(program, "uTextureFlag"), 1)
            let rotationMatrix = glMatrix.mat4.create()
            let translateMatrix = glMatrix.mat4.create()
            let scaleMatrix = glMatrix.mat4.create()
            glMatrix.mat4.scale(scaleMatrix, scaleMatrix, [0.8,0.8,1])
            glMatrix.mat4.translate(translateMatrix, translateMatrix, [-0.7, 0.0, 0.0])
            glMatrix.mat4.rotate(rotationMatrix, rotationMatrix, rotationAngle, [0,0,1])
            
            switch(flame) {
                case 139:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.05, 0.0, 0.0])
                    break
                case 140:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.12, 0.0, 0.0])
                    break
                case 141:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.12, 0.0, 0.0])
                    break
                case 142:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.22, 0.0, 0.0])
                    break
                case 143:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.45, 0.0, 0.0])
                    break
                case 144:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.5, 0.0, 0.0])
                    break
                case 145:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.53, 0.0, 0.0])
                    break
                case 146:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.55, 0.0, 0.0])
                    break
                case 147:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.56, 0.0, 0.0])
                    break
                case 148:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.56, 0.0, 0.0])
                    break
                case 149:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.56, 0.0, 0.0])
                    break
                case 150:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.56, 0.0, 0.0])
                    break
                case 151:
                    glMatrix.mat4.translate(translateMatrix, translateMatrix, [0.56, 0.0, 0.0])
                    break   
          
            }

            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uScaleMatrix"), false, scaleMatrix)
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uRotateMatrix"), false, rotationMatrix)
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uTranslateMatrix"), false, translateMatrix)

            gl.bindTexture(gl.TEXTURE_2D, displayTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)   
            
            //クルミ描画
            gl.uniform1i(gl.getUniformLocation(program, "uTextureFlag"), 0)
            //unifromデフォルト値にセット
            scaleMatrix = glMatrix.mat4.create()
            translateMatrix = glMatrix.mat4.create()
            rotationMatrix = glMatrix.mat4.create()
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uRotateMatrix"), false, rotationMatrix)
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uScaleMatrix"), false, scaleMatrix)
            gl.uniformMatrix4fv(gl.getUniformLocation(program, "uTranslateMatrix"), false, translateMatrix)

            gl.bindTexture(gl.TEXTURE_2D, kurumiTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1920, 1080, 0, gl.RGB, gl.UNSIGNED_BYTE, video)
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0)
            flame += 1
            then = now
            if (flame == 151) {
                return flame
            }
        }
        requestAnimationFrame(render)
    }
    let then = 0
    requestAnimationFrame(render)
}

//ビデオロード
const loadVideo = (src) => new Promise(resolve => {
    const video = document.createElement("video")
    //document.body.appendChild(video)
    video.addEventListener("canplaythrough", () => resolve(video))
    //video.addEventListener("ended", () => video.play())
    video.preload = "auto"
    video.muted = true
    video.autoplay = false
    video.src = src
})

//テクスチャロード
const loadImage = (src) => new Promise(resolve =>{
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.width = 1920 / 4; // 横サイズ（px）
    image.height = 1080 / 4; // 縦サイズ（px）
    image.src = src
    //document.body.appendChild(image)
})

const run = () => {
    console.log("kurumi run")
}


export {run,  initalize, rendering}




