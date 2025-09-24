class Collectible {
  constructor({ x = 0, y = 0, value = 1, id }) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;

    this.width = 15;   // ancho del objeto coleccionable
    this.height = 15;  // alto del objeto coleccionable
  }
}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
