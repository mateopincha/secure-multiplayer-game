class Player {
  constructor({ x = 0, y = 0, score = 0, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;

    this.width = 20;   // Ancho del avatar del jugador
    this.height = 20;  // Alto del avatar del jugador
  }

  movePlayer(dir, speed) {
    switch (dir) {
      case "up":
        this.y -= speed;
        break;
      case "down":
        this.y += speed;
        break;
      case "left":
        this.x -= speed;
        break;
      case "right":
        this.x += speed;
        break;
    }
  }

  collision(item) {
    return !(
      this.x + this.width < item.x ||
      this.x > item.x + item.width ||
      this.y + this.height < item.y ||
      this.y > item.y + item.height
    );
  }

  calculateRank(players) {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${players.length}`;
  }
}

export default Player;
