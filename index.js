class Main {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.minimumDistance = 400;
        this.windowWidth = this.wrapper.clientWidth;
        this.maxObstaclesOnMap = Math.ceil(this.windowWidth / this.minimumDistance);
        this.obstaclesArray = [];
        this.score = 0;
        this.scoreElement = null;
        this.ball = null;
        this.gameLoopInterval = null;
        window.addEventListener("keydown", this.keyDownListener.bind(this));
        window.addEventListener("resize", this.checkForResize.bind(this));
    }

    get doesCollide() { //returns true if any obstacle collides with the ball
        return this.obstaclesArray.some((obstacle) => {
            const obstacleRect = obstacle.boundingRectangle;
            const ballRect = this.ball.boundingRectangle;
            const isInHorizontalBounds =
                obstacleRect.x < ballRect.x + ballRect.width && obstacleRect.x + obstacleRect.width > ballRect.x;
            const isInVerticalBounds =
                obstacleRect.y < ballRect.y + ballRect.height && obstacleRect.y + obstacleRect.height > ballRect.y;
            return isInHorizontalBounds && isInVerticalBounds;
        })
    }
    
    gameLoop(){ //main game loop with 60fps
        this.gameLoopInterval = setInterval(() => {
            this.fullFillObstacles();
            this.moveObstacles();
            this.score += 5;
            this.scoreElement.innerText = this.score;
            if(this.doesCollide) this.gameEnd("Game Over.");
            if(this.score === 10000) this.gameEnd("You Won!");
        }, 16.67)
    }

    gameEnd(result){ //called on loss and win
        clearInterval(this.gameLoopInterval);
        this.ball.stopAnimation();
        this.gameLoopInterval = null;
        this.createEndScreen(result);
    }

    startGame(){
        this.resetToDefault();
        this.createScore();
        this.createBall();
        this.fullFillObstacles();
        this.gameLoop();
    }

    createEndScreen(text){
        const endScreen = document.createElement("div");
        endScreen.className = "end-screen";
        endScreen.innerHTML = `<p>${text}</p> <p>Press Space to play again</p>`;
        this.wrapper.append(endScreen);
    }
    
    createBall(){
        this.ball = new Ball(this.wrapper);
        this.ball.render();
    }

    createScore(){
        this.scoreElement = document.createElement("div");
        this.scoreElement.id = "score";
        this.scoreElement.innerText = 0;
        this.wrapper.append(this.scoreElement);
    }
    
    fullFillObstacles(){
        /*
        If amount of obstacles is less than in this.maxObstaclesOnMap
        it will create and render new obstacles until its length reaches this.maxObstaclesOnMap
        offsetLeft calculated this way:
        if there is no previous obstacle then offsetLeft = window width;
        else if there IS previous obstacle then offsetLeft = prevObstacle.offsetLeft + minimumDistance + randomDistance
        */
        while(this.obstaclesArray.length < this.maxObstaclesOnMap){
            let index = this.obstaclesArray.length;
            let offsetLeft;
            if(index - 1 < 0){
                offsetLeft = this.windowWidth;
            }else{
                offsetLeft = this.obstaclesArray[index - 1].boundingRectangle.x + this.minimumDistance + Math.random()*300;
            }
            this.obstaclesArray.push(new Obstacle(50 + Math.random()*100, offsetLeft, this.wrapper));
            this.obstaclesArray[index].render();
        }
    }

    checkForResize(){ //amount of obstacles will adjust to the window width
        if(this.wrapper.clientWidth !== this.windowWidth){
            this.windowWidth = this.wrapper.clientWidth;
            this.maxObstaclesOnMap = Math.ceil(this.windowWidth / this.minimumDistance);
        }
    }

    moveObstacles(){
        this.obstaclesArray.forEach(((obstacle, index) => {
            obstacle.move();
            if(obstacle.boundingRectangle.x + obstacle.boundingRectangle.width <= 0) this.removeObstacle(index);
            //It will be removed when it reaches the start of the screen
        }))
    }
    
    removeObstacle(index){
        this.obstaclesArray.splice(index, 1);
    }

    resetToDefault() {
        window.removeEventListener("keydown", this.keyDownListener.bind(this))
        this.wrapper.innerHTML = "";
        this.obstaclesArray = [];
        this.score = 0;
        this.scoreElement = null;
        this.ball = null;
        this.gameLoopInterval = null;
    }

    keyDownListener(ev) {
        if(this.gameLoopInterval && ev.key === " ") { //if the game loop is true, the spacebar will force ball to jump
            this.ball.jump();
        }else if(!this.gameLoopInterval && ev.key === " "){ //if the game loop is false, the spacebar will force a new game to start
            this.startGame();
        }
    }
}

class Ball {
    constructor(wrapper) {
        this.ballAsDOMElement = null;
        this.currentHeight = 0;
        this.animationInterval = null;
        this.wrapper = wrapper;
    }

    get boundingRectangle(){
        return this.ballAsDOMElement.getBoundingClientRect();
    }

    jump(){
        if(!this.ballAsDOMElement || this.currentHeight !== 0) return //if the ball is in the air it will not jump
        let gainingHeight = true;
        this.animationInterval = setInterval(() => {
            /*
            If gainingHeight is true height will rise, else decrease.
            More height = less speed
            */
            if(gainingHeight){
                this.currentHeight += (20 - this.currentHeight/22.5)
            } else {
                this.currentHeight -= (20 - this.currentHeight/22.5);
            }
            if(this.currentHeight >= 300) gainingHeight = false;
            if(this.currentHeight <= 0) {
                this.currentHeight = 0;
                clearInterval(this.animationInterval);
            }
            this.ballAsDOMElement.style.bottom = this.currentHeight + "px";
        }, 16.67)
    }

    stopAnimation() {
        clearInterval(this.animationInterval);
    }
    
    render(){
        this.ballAsDOMElement = document.createElement("div");
        this.ballAsDOMElement.id = "ball";
        this.ballAsDOMElement.style.bottom = "0px";
        this.wrapper.append(this.ballAsDOMElement);
    }
}

class Obstacle {
    constructor(height, offsetLeft, wrapper) {
        this.height = height;
        this.offsetLeft = offsetLeft || window.innerWidth;
        this.wrapper = wrapper;
        this.obstacleAsDOMElement = null;
    }
    
    get boundingRectangle(){
        return this.obstacleAsDOMElement.getBoundingClientRect();
    }
    
    move(){
        if(!this.obstacleAsDOMElement) return
        this.offsetLeft -= 7.5;
        this.obstacleAsDOMElement.style.left = this.offsetLeft + "px";
        if(this.boundingRectangle.x + this.boundingRectangle.width <= 0) {
            this.unMount()
        }
        //It will be unmounted from DOM when it reaches the start of the screen
    }
    
    render(){
        this.obstacleAsDOMElement = document.createElement("div");
        this.obstacleAsDOMElement.className = "obstacle";
        this.obstacleAsDOMElement.style.height = this.height + "px";
        this.obstacleAsDOMElement.style.left = this.offsetLeft + "px";
        this.wrapper.append(this.obstacleAsDOMElement);
    }
    
    unMount(){
        this.obstacleAsDOMElement.remove()
    }
}

const game = new Main(document.querySelector(".game-wrap"));
game.startGame();