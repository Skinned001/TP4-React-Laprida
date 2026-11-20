/**
 * Pila genérica (LIFO) respaldada por un campo privado.
 */
export class Pila<T> {
  #items: T[];

  constructor(elementosIniciales: readonly T[] = []) {
    this.#items = [...elementosIniciales];
  }

  get tamanio(): number {
    return this.#items.length;
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  apilar(elemento: T): void {
    this.#items.push(elemento);
  }

  desapilar(): T | undefined {
    return this.#items.pop();
  }

  verTope(): T | undefined {
    if (this.#items.length === 0) {
      return undefined;
    }
    return this.#items[this.#items.length - 1];
  }

  /**
   * Devuelve una copia de los elementos del tope hacia la base.
   */
  aArray(): T[] {
    return [...this.#items].reverse();
  }

  clonar(): Pila<T> {
    return new Pila<T>(this.#items);
  }
}
