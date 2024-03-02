import { Collideable, distance } from "./player";

export default class AsteroidController {
    AsteroidList: Asteroid[];
    ctx: CanvasRenderingContext2D;
    constructor(n: number, maxX: number, maxY: number, ctx: CanvasRenderingContext2D) {
        this.AsteroidList = [];
        for (let i = 0; i < n; i++) {
            let x = random(0, maxX);
            let y = random(0, maxY);
            // let width = random(30, 100);
            let width = 30;
            let health = 1;
            // let health = random(1, 5);
            let asteroid = new Asteroid(x, y, width, width, health, ctx);
            this.AsteroidList.push(asteroid);
        }
        this.ctx = ctx;
    }
    draw(player: Collideable, canvas: HTMLCanvasElement) {
        for (const object of this.AsteroidList) {
                if (object.health < 1) {
                    this.AsteroidList.splice(this.AsteroidList.indexOf(object), 1);
                } else {
                    let d = distance([player.x, player.y], [object.x, object.y]);
                    let diagonal = distance([canvas.width / 2, canvas.height / 2], [0, 0]);
                    if (d < diagonal) {
                        let adjX = (canvas.width / 2) + (object.x - player.x);
                        let adjY = (canvas.height / 2) + (object.y - player.y);
                        object.draw(adjX, adjY);
                    }
                }
        }
    }
    unpack(l: { x: number, y: number, draw: (x: number, y: number) => any; }[]) {
        for (let asteroid of this.AsteroidList) {
            l.push(asteroid);
        }
    }
}

export class Asteroid {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    mass: number;
    health: number;
    friction: number;
    canTakeDamage: boolean;
    img: HTMLImageElement;
    ctx: CanvasRenderingContext2D;
    constructor(x: number, y: number, width: number, height: number, health: number, ctx: CanvasRenderingContext2D) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.friction = .1;
        this.width = width;
        this.height = height;
        this.health = health;
        this.mass = health * width * width;
        this.canTakeDamage = true;
        this.ctx = ctx;
        const img = document.createElement("img");
        img.src = "/space-fight-blocks/space-rock.jpeg";
        this.img = img;
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
        if (Math.abs(this.vx) < this.friction) {
            this.vx = 0;
        } else {
            if (this.vx < 0) {
                this.vx += this.friction;
            } else {
                this.vx -= this.friction;
            }
        }
        if (Math.abs(this.vy) < this.friction) {
            this.vy = 0;
        } else {
            if (this.vy < 0) {
                this.vy += this.friction;
            } else {
                this.vy -= this.friction;
            }
        }
    }
    draw(x: number, y: number) {
        this.move();
        this.ctx.drawImage(this.img, x - this.width / 2, y - this.height / 2, this.width, this.height);
    }
    takeDamage(object: { mass: number; vx: number, vy: number; }) {
        if (!this.canTakeDamage) return;
        this.health--;
        let momentumX = object.mass * object.vx;
        let momentumY = object.mass * object.vy;
        this.vx = momentumX / this.mass;
        this.vy = momentumY / this.mass;
        this.img.src = "/space-fight-blocks/space-rock-red.png";
        this.canTakeDamage = false;

        setTimeout(() => {
            this.img.src = "/space-fight-blocks/space-rock.jpeg";
            this.canTakeDamage = true;
        }, 250);
    }
}
function random(low: number, high: number) {
    return low + ((high - low) * Math.random());
}