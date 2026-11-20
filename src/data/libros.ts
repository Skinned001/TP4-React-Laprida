import type { Libro } from '../types';

export const LIBROS: Libro[] = [
  {
    isbn: '9780132350884', // ISBN real para probar el escáner (Clean Code)
    titulo: 'Clean Code',
    autor: 'Robert C. Martin',
    anio: 2008,
    ejemplares: 2,
  },
  {
    isbn: '9788497592208', // ISBN real para probar el escáner (Cien años de soledad)
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    anio: 1967,
    ejemplares: 1,
  },
  {
    isbn: '9789500738514',
    titulo: 'Ficciones',
    autor: 'Jorge Luis Borges',
    anio: 1944,
    ejemplares: 3,
  },
  {
    isbn: '9789875666474',
    titulo: 'El Aleph',
    autor: 'Jorge Luis Borges',
    anio: 1949,
    ejemplares: 0,
  },
  {
    isbn: '9788420471839',
    titulo: 'Rayuela',
    autor: 'Julio Cortázar',
    anio: 1963,
    ejemplares: 0,
  },
  {
    isbn: '9780201616224',
    titulo: 'The Pragmatic Programmer',
    autor: 'Andrew Hunt y David Thomas',
    anio: 1999,
    ejemplares: 2,
  },
  {
    isbn: '9780134757599',
    titulo: 'Refactoring',
    autor: 'Martin Fowler',
    anio: 2018,
    ejemplares: 0,
  },
  {
    isbn: '9780262033848',
    titulo: 'Introduction to Algorithms',
    autor: 'Thomas H. Cormen',
    anio: 2009,
    ejemplares: 1,
  },
  {
    isbn: '9789505156603',
    titulo: 'El túnel',
    autor: 'Ernesto Sabato',
    anio: 1948,
    ejemplares: 4,
  },
  {
    isbn: '9789871138142',
    titulo: 'Sobre héroes y tumbas',
    autor: 'Ernesto Sabato',
    anio: 1961,
    ejemplares: 1,
  },
  {
    isbn: '9789500426190',
    titulo: 'Los siete locos',
    autor: 'Roberto Arlt',
    anio: 1929,
    ejemplares: 2,
  },
  {
    isbn: '9789504920380',
    titulo: 'Operación Masacre',
    autor: 'Rodolfo Walsh',
    anio: 1957,
    ejemplares: 0,
  },
  {
    isbn: '9781491950296',
    titulo: 'Building Microservices',
    autor: 'Sam Newman',
    anio: 2021,
    ejemplares: 2,
  },
  {
    isbn: '9781449373320',
    titulo: 'Designing Data-Intensive Applications',
    autor: 'Martin Kleppmann',
    anio: 2017,
    ejemplares: 1,
  },
  {
    isbn: '9789877380255',
    titulo: 'Boquitas pintadas',
    autor: 'Manuel Puig',
    anio: 1969,
    ejemplares: 3,
  },
  {
    isbn: '9789500395120',
    titulo: 'Martín Fierro',
    autor: 'José Hernández',
    anio: 1872,
    ejemplares: 5,
  },
];

export const LISTAS_ESPERA_INICIALES: Record<string, string[]> = {
  '9789875666474': ['María Gómez', 'Lucas Pérez'],
  '9788420471839': ['Sofía Díaz'],
  '9780134757599': ['Valentín Torres', 'Camila Ruiz'],
};
