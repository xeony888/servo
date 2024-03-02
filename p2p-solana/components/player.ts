

export default class Player {
    width: number;
    height: number;
    maxY: number;
    maxX: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    deltaX: number;
    deltaY: number;
    psuedofriction: number;
    vMax: number;
    mass: number;
    health: number;
    angle!: number;
    diagonal: number;
    target!: { x: number, y: number; };
    grapplePressed!: boolean;
    grappleLocked!: boolean;
    grappleMaxStrength: number;
    grappleSpeed: number;
    grapplePosition!: number[];
    spacePressed!: boolean;
    canvas: HTMLCanvasElement;
    canvasID: string;
    ctx: CanvasRenderingContext2D;
    img: HTMLImageElement;
    dead: boolean;
    BulletList: PlayerBullet[];
    constructor(width: number, height: number, vMax: number, maxX: number, maxY: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, canvasID: string, me: boolean) {
        this.width = width;
        this.height = height;
        this.maxX = maxX;
        this.maxY = maxY;
        this.mass = 10000;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vy = 0;
        this.vx = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.psuedofriction = .1;
        this.grappleMaxStrength = 1.5 * vMax;
        this.grappleSpeed = vMax * 2;
        this.vMax = vMax;
        this.canvas = canvas;
        this.ctx = ctx;
        this.canvasID = canvasID;
        this.dead = false;
        this.diagonal = distance([0, 0], [canvas.width / 2, canvas.height / 2]);
        const img = document.createElement("img");
        img.src = "/spaceship.png";
        this.img = img;
        this.BulletList = [];
        this.health = 5;
        if (me) {
            document.addEventListener("keydown", this.keydown);
            document.addEventListener("keyup", this.keyup);
            document.addEventListener("mousemove", this.mouseWrapper);
            document.addEventListener("touchmove", this.touchWrapper, { passive: false });
            document.addEventListener("mousedown", this.startShoot);
            document.addEventListener("mouseup", this.endShoot);
            document.addEventListener("touchstart", this.startShoot);
            document.addEventListener("touchend", this.endShoot);
        }
    }
    takeDamage() {
        this.health--;
        if (this.health < 1) {
            this.dead = true;
        }
    }
    draw(relx: number, rely: number, collideables: { x: number, y: number, width: number, height: number; health: number; takeDamage: (a: { vy: number, vx: number, mass: number; }) => any; }[]) {
        this.move(collideables);
        this.updateAngle();
        let count = 0;
        for (let collideable of collideables) {
            CheckRadialCollision(this, collideable, () => {
                collideable.takeDamage(this);
                this.deltaX = 2 * this.vx * -1;
                this.deltaY = 2 * this.vy * -1;
            });
        }
        if (this.grapplePressed) {
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo((this.canvas.width / 2) + relx, (this.canvas.height / 2) + rely);
            let adjX = (this.canvas.width / 2) + this.grapplePosition[0] - this.x;
            let adjY = (this.canvas.height / 2) + this.grapplePosition[1] - this.y;
            this.ctx.lineTo(adjX, adjY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(adjX, adjY, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
        }
        //draw bullets
        this.BulletList.forEach(bullet => {
            if (distance([this.x, this.y], [bullet.x, bullet.y]) > 300 ||
                bullet.x < 0 || bullet.y < 0 || bullet.x > this.maxX || bullet.y > this.maxY) {
                this.BulletList.splice(count, 1);
            } else {
                for (let collideable of collideables) {
                    CheckRadialCollision(bullet, collideable, () => {
                        collideable.takeDamage(bullet);
                    });
                }
                let adjX = (this.canvas.width / 2) + (bullet.x - this.x);
                let adjY = (this.canvas.height / 2) + (bullet.y - this.y);
                bullet.draw(adjX, adjY);
            }
            count++;
        });

        //draw player at correct angle
        this.ctx.save();
        this.ctx.translate((this.canvas.width / 2) + relx, (this.canvas.height / 2) + rely);
        this.ctx.rotate(this.angle);
        this.ctx.drawImage(this.img, -1 * this.width / 2, -1 * this.height / 2, this.width, this.height);
        this.ctx.restore();

        //draw circle around player
        this.ctx.beginPath();
        this.ctx.strokeStyle = "green";
        this.ctx.lineWidth = .5;
        this.ctx.arc(this.canvas.width / 2 + relx, this.canvas.height / 2 + rely, this.width * 3, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    continueGrapple(blocks: { x: number; y: number; }[]) {
        if (this.grappleLocked) {
            let xDist = this.target.x - this.x;
            let yDist = this.target.y - this.y;
            let angle = Math.abs(Math.atan(yDist / xDist));
            if (yDist > 0) {
                this.deltaY = Math.sin(angle) * this.grappleMaxStrength;
            } else {
                this.deltaY = -1 * Math.sin(angle) * this.grappleMaxStrength;
            }
            if (xDist > 0) {
                this.deltaX = Math.cos(angle) * this.grappleMaxStrength;
            } else {
                this.deltaX = -1 * Math.cos(angle) * this.grappleMaxStrength;
            }
        } else {
            if (this.target) {
                let xDiff = this.grapplePosition[0] - this.target.x;
                let yDiff = this.grapplePosition[1] - this.target.y;
                if (xDiff === 0 && yDiff === 0) this.grappleLocked = true;
                if (Math.abs(xDiff) < this.grappleSpeed) {
                    this.grapplePosition[0] = this.target.x;
                } else {
                    if (xDiff < 0) {
                        this.grapplePosition[0] += this.grappleSpeed;
                    } else {
                        this.grapplePosition[0] -= this.grappleSpeed;
                    }
                }
                if (Math.abs(yDiff) < this.grappleSpeed) {
                    this.grapplePosition[1] = this.target.y;
                } else {
                    if (yDiff < 0) {
                        this.grapplePosition[1] += this.grappleSpeed;
                    } else {
                        this.grapplePosition[1] -= this.grappleSpeed;
                    }
                }
            } else {
                let maxD = Infinity;
                let finalBlock = null;
                for (let block of blocks) {
                    let d = distance([this.x, this.y], [block.x, block.y]);
                    if (d < maxD) {
                        maxD = d;
                        finalBlock = block;
                    }
                }
                this.target = finalBlock as any;
            }
        }
    }
    move(blocks: { x: number; y: number; }[]) {
        this.x += (this.vx + this.deltaX);
        this.y += (this.vy + this.deltaY);

        //new code
        if (Math.abs(this.deltaY) < this.psuedofriction) {
            this.deltaY = 0;
        } else {
            if (this.deltaY < 0) {
                this.deltaY += this.psuedofriction;
            } else {
                this.deltaY -= this.psuedofriction;
            }
        }
        if (Math.abs(this.deltaX) < this.psuedofriction) {
            this.deltaX = 0;
        } else {
            if (this.deltaX < 0) {
                this.deltaX += this.psuedofriction;
            } else {
                this.deltaX -= this.psuedofriction;
            }
        }
        //new code
        if (this.grapplePressed) {
            this.continueGrapple(blocks);
        } else {
            this.grapplePosition = [this.x, this.y];
            this.grappleLocked = false;
            this.target = null as any;
        }

        if (this.spacePressed) this.shoot();
        //max width and max height
        if (this.y < 0) this.y = 0;
        if (this.x < 0) this.x = 0;
        if (this.x > this.maxX) this.x = this.maxX;
        if (this.y > this.maxY) this.y = this.maxY;
    }
    updateAngle() {
        if (this.vy === 0 && this.vx === 0) return;
        const to_radians = Math.PI / 180;
        const to_degrees = 180 / Math.PI;

        let tempAngle = Math.abs(Math.atan(this.vy / this.vx));
        tempAngle = tempAngle * to_degrees;

        if (this.vx > 0 && this.vy > 0) {
            this.angle = (90 + tempAngle) * to_radians;
        } else if (this.vx < 0 && this.vy > 0) {
            this.angle = (270 - tempAngle) * to_radians;
        } else if (this.vx < 0 && this.vy < 0) {
            this.angle = (270 + tempAngle) * to_radians;
        } else if (this.vx > 0 && this.vy < 0) {
            this.angle = (90 - tempAngle) * to_radians;
        } else {
            if (this.vx === 0) {
                if (this.vy > 0) {
                    this.angle = Math.PI;
                } else {
                    this.angle = 0;
                }
            } else if (this.vy === 0) {
                if (this.vx > 0) {
                    this.angle = Math.PI / 2;
                } else {
                    this.angle = Math.PI * 3 / 2;
                }
            } else {
                console.error("oh poop");
            }
        }
    }
    shoot() {
        this.BulletList.push(new PlayerBullet(this.x, this.y, this.angle, this.ctx));
    }
    keydown = (event: KeyboardEvent) => {
        if (event.key === " ") {
            this.spacePressed = true;
        }
        if (event.key === "g") {
            this.grapplePressed = true;
        }
    };
    keyup = (event: KeyboardEvent) => {
        if (event.key === " ") {
            this.spacePressed = false;
        }
        if (event.key === "g") {
            this.grapplePressed = false;
        }
    };
    touchWrapper = (event: TouchEvent) => {
        event.preventDefault();
        this.updatePosition(event.touches[0].clientX, event.touches[0].clientY);
    };
    mouseWrapper = (event: MouseEvent) => {
        this.updatePosition(event.x, event.y);
    };
    updatePosition = (x: number, y: number) => {
        let canvas = document.getElementById(this.canvasID)!.getBoundingClientRect();
        let playerPos = [canvas.x + canvas.width / 2, canvas.y + canvas.height / 2];

        let xDiff = x - playerPos[0];
        let yDiff = y - playerPos[1];
        let maxDiff = this.width * 3;

        let rx = xDiff / maxDiff;
        let ry = yDiff / maxDiff;

        if (rx > 1) rx = 1;
        if (rx < -1) rx = -1;
        if (ry > 1) ry = 1;
        if (ry < -1) ry = -1;

        this.vx = this.vMax * rx;
        this.vy = this.vMax * ry;
    };
    startShoot = () => { this.spacePressed = true; };
    endShoot = () => { this.spacePressed = false; };
}
export class PlayerBullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    width: number;
    height: number;
    mass: number;
    ctx: CanvasRenderingContext2D;
    constructor(x: number, y: number, angle: number, ctx: CanvasRenderingContext2D) {
        this.x = x;
        this.y = y;
        let vMax = 20;
        this.vx = Math.sin(angle) * vMax;
        this.vy = -1 * Math.cos(angle) * vMax;
        this.health = 1;
        this.width = 3;
        this.mass = 1000;
        this.height = 3;
        this.ctx = ctx;
    }
    draw(x: number, y: number) {
        this.move();
        this.ctx.fillStyle = "red";
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.width / 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
}
export const distance = (a: number[], b: number[]) => { return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2); };
export type Collideable = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const CheckRadialCollision = (collider: Collideable, collidee: Collideable, onCollision: () => any) => {
    let d = distance([collider.x, collider.y], [collidee.x, collidee.y]);
    let colliderR = collider.width / 2;
    let collideeR = collidee.width / 2;
    if (d < colliderR || d < collideeR) {
        onCollision();
    }
};