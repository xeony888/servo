import { Block } from "../App";
import AsteroidController, { Asteroid } from "./AsteroidController";
import Player, { PlayerBullet } from "./player";

export const maxX = 1000;
export const maxY = 1000;
export class Game {
    me: Player;
    other: Player;
    AsteroidController: AsteroidController;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.me = new Player(20, 20, 5, maxX, maxY, canvas, ctx, "gameField", true);
        this.other = new Player(20, 20, 5, maxX, maxY, canvas, ctx, "gameField", false);
        this.AsteroidController = new AsteroidController(10, maxX, maxY, ctx);
    }
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.AsteroidController.draw(this.me, canvas);
        if (!this.other.dead) this.other.draw(this.other.x - this.me.x, this.other.y - this.me.y, [this.me, ...this.AsteroidController.AsteroidList]);
        if (!this.me.dead) this.me.draw(0, 0, [this.other, ...this.AsteroidController.AsteroidList]);
    }
    verify(block: Block): boolean {
        const {asteroids, me, other, myBullets, otherBullets} = JSON.parse(block.data);
        this.AsteroidController.AsteroidList = [];
        for (const asteroid of asteroids) {
            const a = new Asteroid(asteroid[0], asteroid[1], 30, 30, 1, this.me.ctx)
            this.AsteroidController.AsteroidList.push(a);
        }
        this.other.x = me[0];
        this.other.y = me[1];
        this.other.angle = me[2];
        this.me.x = other[0];
        this.me.y = other[1];
        this.me.angle = other[2];
        // skip bullets for now
        this.other.BulletList = [];
        for (const b of myBullets) {
            const angle = updateAngle(b[2], b[3]);
            const bullet = new PlayerBullet(b[0], b[1], angle, this.other.ctx);
            this.other.BulletList.push(bullet)
        }
        this.me.BulletList = [];
        for (const b of otherBullets) {
            const angle = updateAngle(b[2], b[3]);
            const bullet = new PlayerBullet(b[0], b[1], angle, this.me.ctx);
            this.me.BulletList.push(bullet);
        }
        return true;
    }
    serialize() {
        return {
            asteroids: this.AsteroidController.AsteroidList.map((asteroid) => [asteroid.x, asteroid.y]),
            me: [this.me.x, this.me.y, this.me.angle, this.me.dead],
            other: [this.other.x, this.other.y, this.other.angle],
            myBullets: this.me.BulletList.map(bullet => [bullet.x, bullet.y, bullet.vx, bullet.vy]),
            otherBullets: this.other.BulletList.map(bullet => [bullet.x, bullet.y, bullet.vx, bullet.vy])
        }
    }
}

function updateAngle(vx: number, vy: number) {
    if (vy === 0 && vx === 0) return 0;
    const to_radians = Math.PI / 180;
    const to_degrees = 180 / Math.PI;

    let tempAngle = Math.abs(Math.atan(vy / vx));
    tempAngle = tempAngle * to_degrees;
    let angle: number = 0;
    if (vx > 0 && vy > 0) {
        angle = (90 + tempAngle) * to_radians;
    } else if (vx < 0 && vy > 0) {
        angle = (270 - tempAngle) * to_radians;
    } else if (vx < 0 && vy < 0) {
        angle = (270 + tempAngle) * to_radians;
    } else if (vx > 0 && vy < 0) {
        angle = (90 - tempAngle) * to_radians;
    } else {
        if (vx == 0) {
            if (vy > 0) {
                angle = Math.PI;
            } else {
                angle = 0;
            }
        } else if (vy == 0) {
            if (vx > 0) {
                angle = Math.PI / 2;
            } else {
                angle = Math.PI * 3 / 2;
            }
        } else {
            console.error("oh poop");
        }
    }
    return angle;
}