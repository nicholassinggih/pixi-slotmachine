const INIT_WIDTH = 800;
const INIT_HEIGHT = 600;
const STAGE_RATIO = INIT_WIDTH / INIT_HEIGHT;
const SYMBOL_MARGIN = 4;
const HIDDEN_SYMBOLS = 7; 
const SYMBOL_PER_REEL = 12; //data.matrix ? data.matrix.length : 6;
const SYMBOL_SIZE = 70; //screen.height * 0.8 / (SYMBOL_PER_REEL - 1);
const CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = screen.height;
const REEL_COUNT = data.matrix ? data.matrix.length : 5;
const REEL_WIDTH = CONTAINER_WIDTH / REEL_COUNT;
const IMG_FILES = [
    'pi1.png', 'pi2.png', 'pi3.png', 'pi4.png', 'pi5.png'
]

const app = new PIXI.Application({ 
    backgroundColor: 0x1099bb,
    width: INIT_WIDTH, 
    height: INIT_HEIGHT 
}); 

let margin; 
const topBar = new PIXI.Graphics();
const bottomBar = new PIXI.Graphics();
// Add play text
const titleStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'],
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
});

const smallFont = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'],
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
});
const headerText = new PIXI.Text('POKEMON SLOTS', titleStyle);
const normalSpin = new PIXI.Text('Normal Spin', smallFont);
const win1x = new PIXI.Text('Win 1x', smallFont);
const win2x = new PIXI.Text('Win 1x', smallFont);
const win3x = new PIXI.Text('Win 1x', smallFont);
const win4x = new PIXI.Text('Win 1x', smallFont);

document.body.appendChild(app.view);
console.log(app.screen.height);

IMG_FILES.forEach(f => {
    app.loader.add(f, f);
});
app.loader
    .load(onAssetsLoaded);


// Listen for window resize events
window.addEventListener('resize', resize);
function getParentCanvas() {
    return document.getElementsByTagName("canvas")[0];
}
function getContainerDiv() {
    return document.getElementsByClassName("container-div")[0];
}
// Resize function window
function resize() {

    let canvas = getParentCanvas();
    const ratio = Math.min(parent.innerWidth/INIT_WIDTH, parent.innerHeight/INIT_HEIGHT);
    canvas.width = INIT_WIDTH * ratio;
    canvas.height = INIT_HEIGHT * ratio - 3;
	app.stage.scale.x = ratio;
    app.stage.scale.y = ratio;
    app.renderer.resize(canvas.width, canvas.height);
  
}


function getReelWidth() {
    return INIT_WIDTH / REEL_COUNT;
}

// onAssetsLoaded handler builds the example.
function onAssetsLoaded() {
    // Create different slot symbols.
    const slotTextures = IMG_FILES.map(f => {
        return PIXI.Texture.from(f);
    }); 
    
    // Build the reels
    const reels = [];
    const reelContainer = buildReels(reels);
    app.stage.addChild(reelContainer);

    // Build topBar & bottomBar covers and position reelContainer
    buildHUD();

    let running = false;
    
    getContainerDiv().appendChild(getParentCanvas());
    resize();

    function buildReels(reels) {
        let reelContainer = new PIXI.Container();
        for (let i = 0; i < REEL_COUNT; i++) {
            const rc = new PIXI.Container();
            rc.x = i * getReelWidth();
            reelContainer.addChild(rc);

            const reel = {
                container: rc,
                symbols: [],
                symbolImmutableFlag: Array(SYMBOL_PER_REEL).fill(false),
                position: 0,
                previousPosition: 0,
                startingPosition: 0,
                transition: 0,
                blur: new PIXI.filters.BlurFilter(),
            };
            reel.blur.blurX = 0;
            reel.blur.blurY = 0;
            rc.filters = [reel.blur];

            // Build the symbols
            for (let j = 0; j < SYMBOL_PER_REEL; j++) {
                let id = (SYMBOL_PER_REEL - 1 - j) % data.matrix[i].length;
                let symbolId = data.matrix[i][id] ?? Math.floor(Math.random() * slotTextures.length);
                const symbol = new PIXI.Sprite(slotTextures[symbolId]);
                // Scale the symbol to fit symbol area.
                symbol.y = (j - HIDDEN_SYMBOLS) * (SYMBOL_SIZE + SYMBOL_MARGIN);
                symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
                symbol.x = Math.round((getReelWidth() - symbol.width) / 2);
                reel.symbols.push(symbol);
                rc.addChild(symbol);
            }
            reels.push(reel);
        }
        return reelContainer;
    }

    function getEndResults(resultType) {
        resultType = resultType || {};
        if (resultType.win == undefined) {  // complete random result
            return null;
        }

        let n = SYMBOL_PER_REEL - HIDDEN_SYMBOLS;
        let results = Array.from({length:n}, () => {
            let arr =  Array.from({length: REEL_COUNT}, ()=> {
                return Math.floor(Math.random() * slotTextures.length);
            });
            while (arr.every((val, i, arr) => val == arr[0])) {
                let id = Math.random() * arr.length;
                arr[id] = (arr[id] + 1) % slotTextures.length;
            }
            return arr;
        });

        let winLines = Array.from({length: n}, (e, i) => i).sort(() => 0.5 - Math.random()).slice(0, resultType.win);
        winLines.forEach(l => {
            results[l] = results[l].map(e => results[l][0]);
        })

        return results;

    }

    // Function to start playing.
    function startPlay(resultType) {

        if (running) return;
        running = true;

        resultType = { win : 3};
        let results = getEndResults(resultType);

        let tweenMode = Math.floor(Math.random() * 3);
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const extra = Math.floor(Math.random() * 10);
            r.transition = 12 + i * 5 + extra;
            r.startingPosition = r.position;
            r.swapCount = 0;
            for (let j = 0; j < SYMBOL_PER_REEL; j++) r.symbolImmutableFlag[j] = false;
            const target = r.position + r.transition;
            const time = 1800 + extra * 300;
            const amp = Math.floor(Math.random() * 4) + 3;
            const period = Math.random() + 0.5;
            const easingFn = (tweenMode == 0? getElasticIn(amp, period) : 
                              tweenMode == 1? quintIn() : 
                              tweenMode == 2? sineIn : 
                              getElasticOut(amp, period));

            // tweenTo(r, 'position', target, time, easingFn, null,  i === reels.length - 1 ? reelsComplete : null);
            tweenTo(r, 'position', target, time, easingFn, null, 
                ()=>{ 
                    let displayedRows = SYMBOL_PER_REEL - HIDDEN_SYMBOLS;
                    if (results != null) {
                        setTimeout(() => {
                            r.position = target;
                            let offset = Math.floor(r.position) % SYMBOL_PER_REEL;
                            let startId = (SYMBOL_PER_REEL - offset) % SYMBOL_PER_REEL;
                            for (let k = 0; k < displayedRows; k++) {
                                let id = (startId + k) % SYMBOL_PER_REEL;
                                let s = r.symbols[id];
                                let textureId = results[k][i];
                                r.symbolImmutableFlag[id] = true;
                                s.texture = slotTextures[textureId];
                                s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                                s.x = Math.round((getReelWidth() - s.width) / 2);
                            } 
                                
                        }, 0);
                    }

                    tweenTo(r, 'position', target + HIDDEN_SYMBOLS, 2500, backout(0.5), null, i === reels.length - 1 ? reelsComplete : null);
                });
        }

    }

    // Reels done handler.
    function reelsComplete() {
        running = false;
    }


    function buildHUD() {
        margin = SYMBOL_SIZE * 1;// (app.screen.height - 20 - SYMBOL_SIZE * (SYMBOL_PER_REEL)) / 2;
        // margin = (app.screen.height - reelContainer.height ) / 2;
        reelContainer.y = (2 - HIDDEN_SYMBOLS) * (SYMBOL_SIZE + SYMBOL_MARGIN);
        // reelContainer.y = (SYMBOL_SIZE + SYMBOL_MARGIN);
        reelContainer.x = Math.round(app.screen.width - getReelWidth() * REEL_COUNT);

        topBar.beginFill(0, 1);
        topBar.drawRect(0, 0, app.screen.width, margin);

        // bottomBar.y = reelContainer.y + reelContainer.height + SYMBOL_MARGIN - SYMBOL_SIZE;
        bottomBar.y = reelContainer.y + reelContainer.height + SYMBOL_MARGIN - SYMBOL_SIZE;
        bottomBar.beginFill(0, 1);
        bottomBar.drawRect(0, 0, app.screen.width, app.screen.height - bottomBar.y );
        

        normalSpin.x = Math.round((bottomBar.width - normalSpin.width) / 2);
        normalSpin.y = ( bottomBar.height - normalSpin.height ) / 2; 
        bottomBar.addChild(normalSpin);

        // Add header text
        headerText.x = Math.round((topBar.width - headerText.width) / 2);
        headerText.y = Math.round((margin - headerText.height) / 2);
        topBar.addChild(headerText);

        app.stage.addChild(topBar);
        app.stage.addChild(bottomBar);

        // Set the interactivity.
        normalSpin.interactive = true;
        normalSpin.buttonMode = true;
        normalSpin.addListener('pointerdown', () => {
            startPlay();
        });
    }

    // Listen for animate update.
    app.ticker.add((delta) => {
    // Update the slots.
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            // Update blur filter y amount based on speed.
            // This would be better if calculated with time in mind also. Now blur depends on frame rate.
            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

            // Update symbol positions on reel.
            for (let j = 0; j < r.symbols.length; j++) {
                const s = r.symbols[j];
                const prevy = s.y;
                const symbolPosition = r.position + j;
                // let feedIndex = Math.floor(symbolPosition) - r.startingPosition - r.symbols.length;
                // feedIndex = feedIndex % r.symbolFeed.length;
                s.y = (((symbolPosition) % r.symbols.length) - 1) * (SYMBOL_SIZE + SYMBOL_MARGIN);
                if (s.y < 0 && prevy > SYMBOL_SIZE && r.symbolImmutableFlag[j] == false) {
                    // Detect going over and swap a texture.
                    // This should in proper product be determined from some logical reel.
                    let nextSymbol = Math.floor(Math.random() * slotTextures.length); // r.symbolFeed.shift();
                    s.texture = slotTextures[nextSymbol];
                    s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                    s.x = Math.round((getReelWidth() - s.width) / 2);
                }
            }
        }
    });
}

// Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
const tweening = [];
function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };

    tweening.push(tween);
    return tween;
}
// Listen for animate update.
app.ticker.add((delta) => {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];

        // phase is the percentage of the time elapsed against the tween's designated time period, if it reaches 1 it means it's complete 100%
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            // t.object['position'] %= SYMBOL_PER_REEL;
            // t.object['previousPosition'] = t.object['position'];
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }
});



// Basic lerp funtion.
function lerp(a1, a2, t) {
    return a1 + (a2 - a1) * t;
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
function backout(amount) {
    return (t) => (--t * t * ((amount + 1) * t + amount) + 1);
}


// Linear function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
function linear() {
    return (t) => { return t; };
}


// Elastic In function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
/**
	 * Configurable elastic ease.
	 * @method getElasticIn
	 * @param {Number} amplitude
	 * @param {Number} period
	 * @static
	 * @return {Function}
	 **/
function getElasticIn(amplitude,period) {
    var pi2 = Math.PI*2;
    return function(t) {
        if (t==0 || t==1) return t;
        var s = period/pi2*Math.asin(1/amplitude);
        return -(amplitude*Math.pow(2,10*(t-=1))*Math.sin((t-s)*pi2/period));
    };
}

// Elastic Out function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
/**
	 * Configurable elastic ease.
	 * @method getElasticOut
	 * @param {Number} amplitude
	 * @param {Number} period
	 * @static
	 * @return {Function}
	 **/
 function getElasticOut(amplitude,period) {
    var pi2 = Math.PI*2;
    return function(t) {
        if (t==0 || t==1) return t;
        var s = period/pi2 * Math.asin(1/amplitude);
        return (amplitude*Math.pow(2,-10*t)*Math.sin((t-s)*pi2/period )+1);
    };
};

// Sine In function from tweenjs
/**
	 * @method sineIn
	 * @param {Number} t
	 * @static
	 * @return {Number}
	 **/
 function sineIn(t) {
    return 1-Math.cos(t*Math.PI/2);
};


/**
	 * @method quintIn
	 * @param {Number} t
	 * @static
	 * @return {Number}
	 **/
let quintIn = () => { return getPowIn(5); }

 /**
	 * Configurable exponential ease.
	 * @method getPowIn
	 * @param {Number} pow The exponent to use (ex. 3 would return a cubic ease).
	 * @static
	 * @return {Function}
	 **/
 function getPowIn(pow) {
    return function(t) {
        return Math.pow(t,pow);
    };
};