/**
 * Cola genérica (FIFO) respaldada por un campo privado e índice frontal,
 * evitando Array.prototype.shift().
 */
export class Cola<T> {
  #items: T[];
  #frente = 0;

  constructor(elementosIniciales: readonly T[] = []) {
    this.#items = [...elementosIniciales];
  }

  get tamanio(): number {
    return this.#items.length - this.#frente;
  }

  estaVacia(): boolean {
    return this.tamanio === 0;
  }

  encolar(elemento: T): void {
    this.#items.push(elemento);
  }

  desencolar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const elemento = this.#items[this.#frente];
    this.#frente += 1;

    // Compacta el arreglo cuando la mitad ya fue desencolada para liberar memoria.
    if (this.#frente > 0 && this.#frente * 2 >= this.#items.length) {
      this.#items = this.#items.slice(this.#frente);
      this.#frente = 0;
    }

    return elemento;
  }

  verFrente(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    return this.#items[this.#frente];
  }

  /**
   * Devuelve una copia de los elementos del frente hacia el final.
   */
  aArray(): T[] {
    return this.#items.slice(this.#frente);
  }

  clonar(): Cola<T> {
    return new Cola<T>(this.aArray());
  }
}
