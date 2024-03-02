

// super blockchain cousins
interface GameObject {
    id: number
    width: number;
    height: number;
    x: number;
    y: number;
    img: HTMLImageElement;
}
const randomNum = () => Math.random() * 1000000;
const checkCollision = ([x, y]: [number, number], object: GameObject) => {
    const half = object.width / 2;
    if (x > object.x - half && x < object.x + half && y > object.y - half && y < object.y + half) {
        return true;
    }
    return false;
}
class Platform implements GameObject {
    id: number
    width: number;
    height: number;
    x: number;
    y: number;
    img: HTMLImageElement;
    constructor(x: number, y: number, width: number, height: number, img: HTMLImageElement) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.img = img;
        this.id = randomNum();
    }
}
export class Player implements GameObject {
    id: number;
    width: number;
    height: number;
    x: number;
    y: number;
    img: HTMLImageElement;
    constructor(x: number, y: number) {
        this.width = 30;
        this.height = 90;
        this.x = x
        this.y = y;
        this.img = document.createElement("img");
        this.img.src = "/images/player.png";
        this.id = randomNum();
    }
}
const gravity = 0.5;
const speed = 10;
export class Game {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    platforms: Platform[];
    me: Player;
    other: Player;
    leftPressed: boolean;
    rightPressed: boolean;
    jumping: boolean;
    vy: number;
    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;
        this.platforms = [];
        const images: HTMLImageElement[] = ["/images/platform0.png", "/images/platform1.png", "/images/platform2.png"].map((imgSrc: string) => {
            const img = document.createElement("img");
            img.src = imgSrc;
            return img;
        });
        this.platforms.push(new Platform(canvas.width / 2, canvas.height - 40, 500, 100, images[0]));
        this.platforms.push(new Platform(canvas.width / 4, canvas.height - 200, 100, 40, images[1]));
        this.platforms.push(new Platform(canvas.width / 2, canvas.height - 300, 100, 40, images[2]));
        this.platforms.push(new Platform(canvas.width * 3 / 4, canvas.height - 200, 100, 40, images[1]));
        this.me = new Player(canvas.width / 4, canvas.height - 275);
        this.other = new Player(canvas.width * 3 / 4, canvas.height - 275);
        this.leftPressed = false;
        this.rightPressed = false;
        this.jumping = false;
        this.vy = 0;
    }
    draw({ x, y, width, height, img }: {x: number, y: number, width: number, height: number, img: HTMLImageElement}) {
        this.context.drawImage(img, x - width / 2, y - height / 2, width, height);
    }
    jump(amount: number) {
        this.vy = -1 * amount;
    }
    updatePlayer(player: Player, d?: [number, number]) {
        const me = player.id === this.me.id ? this.me : this.other;
        const other = player.id === this.me.id ? this.other : this.me;
        let delta: [number, number];
        if (me.id === this.me.id) {
            delta = [0, 0]
            if (this.leftPressed) delta[0] -= speed;
            if (this.rightPressed) delta[0] += speed;
            if (this.jumping) {
                delta[1] += this.vy
                if (this.vy + gravity > 0) {
                    this.jumping = false;
                    this.vy = 0;
                } else {
                    this.vy += gravity;
                }
            } else {
                delta[1] += gravity;
            }
        } else {
            delta = d!;
        }
        let failed = false;
        let o!: GameObject;
        for (const object of [other, ...this.platforms]) {
            if (checkCollision([me.x + delta[0], me.y], object)) {
                failed = true;
                o = object;
                break;
            }
        }
        if (failed) {
            if (me.x < o.x) {
                me.x = o.x - o.width / 2;
            } else if (me.x > o.x) {
                me.x = o.x + o.width / 2;
            }
        } else {
            me.x += delta[0];
        }
        if (me.x + delta[0] > this.canvas.width) me.x = this.canvas.width;
        if (me.x + delta[0] < 0) me.x = 0;
        failed = false;
        for (const object of [other, ...this.platforms]) {
            if (checkCollision([me.x, me.y + delta[1]], object)) {
                failed = true;
                o = object;
                break;
            }
        }
        if (failed) {
            if (me.y < o.y) {
                me.y = o.y - o.height;
            } else if (this.me.y > o.y) {
                me.y = o.y + o.height;
            }
        } else {
            me.y += delta[1];
        }
        if (me.y + delta[1] > this.canvas.height) me.y = this.canvas.height
        if (me.y + delta[1] < 0) me.y = 0;
    }
    update() {
        this.context.fillStyle = "white";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.platforms.map(this.draw.bind(this));
        this.updatePlayer(this.me);
        this.updatePlayer(this.other, [0, gravity]);
        this.draw(this.other);
        this.draw(this.me);
    }
    verify() {

    }
}