// Categorías principales con subcategorías
export const GIFT_CATEGORIES = {
  "Electrónica": [
    "Smartphone",
    "Tablet",
    "Laptop",
    "Auriculares",
    "Smartwatch",
    "Consola de Videojuegos",
    "Cámara",
    "Altavoz Inteligente",
    "E-reader",
    "Otros Electrónicos"
  ],
  "Ropa": [
    "Camisa",
    "Pantalón",
    "Vestido",
    "Chaqueta",
    "Suéter",
    "Zapatos",
    "Accesorios",
    "Ropa Deportiva",
    "Ropa Interior",
    "Otros Ropa"
  ],
  "Hogar": [
    "Decoración",
    "Cocina",
    "Baño",
    "Muebles",
    "Textiles",
    "Electrodomésticos",
    "Jardín",
    "Iluminación",
    "Almacenamiento",
    "Otros Hogar"
  ],
  "Deportes": [
    "Ropa Deportiva",
    "Calzado Deportivo",
    "Equipamiento",
    "Bicicleta",
    "Accesorios Fitness",
    "Equipos de Camping",
    "Deportes Acuáticos",
    "Otros Deportes"
  ],
  "Belleza": [
    "Maquillaje",
    "Skincare",
    "Perfume",
    "Cabello",
    "Uñas",
    "Spa & Masajes",
    "Otros Belleza"
  ],
  "Libros & Media": [
    "Libros",
    "Música",
    "Películas",
    "Videojuegos",
    "Revistas",
    "Audiolibros"
  ],
  "Juguetes": [
    "Juegos de Mesa",
    "Muñecos",
    "Construcción",
    "Educativos",
    "Exterior",
    "Otros Juguetes"
  ],
  "Experiencias": [
    "Viajes",
    "Restaurantes",
    "Conciertos",
    "Teatro",
    "Deportes",
    "Spa",
    "Clases",
    "Otros Experiencias"
  ],
  "Joyería": [
    "Anillos",
    "Collares",
    "Pulseras",
    "Aretes",
    "Relojes",
    "Otros Joyería"
  ],
  "Otros": []
};

// Colores comunes
export const COMMON_COLORS = [
  "Negro",
  "Blanco",
  "Gris",
  "Azul",
  "Azul Marino",
  "Rojo",
  "Rosa",
  "Verde",
  "Amarillo",
  "Naranja",
  "Morado",
  "Café",
  "Beige",
  "Dorado",
  "Plateado",
  "Multicolor",
  "Otro"
];

// Tallas de ropa
export const CLOTHING_SIZES = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "Talla Única"
];

// Tallas de calzado (unisex)
export const SHOE_SIZES = [
  "35", "36", "37", "38", "39", "40", "41", "42", 
  "43", "44", "45", "46", "47", "48"
];

// Marcas populares por categoría
export const POPULAR_BRANDS = {
  "Electrónica": [
    "Apple", "Samsung", "Sony", "LG", "Huawei", "Xiaomi",
    "Microsoft", "Dell", "HP", "Lenovo", "Bose", "JBL",
    "Nintendo", "PlayStation", "Xbox", "Canon", "Nikon"
  ],
  "Ropa": [
    "Nike", "Adidas", "Zara", "H&M", "Uniqlo", "Gap",
    "Levi's", "Tommy Hilfiger", "Calvin Klein", "Ralph Lauren",
    "Puma", "Under Armour", "The North Face", "Columbia"
  ],
  "Deportes": [
    "Nike", "Adidas", "Puma", "Reebok", "Under Armour",
    "New Balance", "Asics", "Decathlon", "Wilson", "Spalding"
  ],
  "Belleza": [
    "L'Oréal", "Maybelline", "MAC", "Clinique", "Estée Lauder",
    "Dior", "Chanel", "Lancôme", "Neutrogena", "Cetaphil",
    "The Ordinary", "CeraVe"
  ]
};

// Función para obtener opciones inteligentes basadas en categoría
export const getSmartOptions = (category: string) => {
  const categoryMain = Object.keys(GIFT_CATEGORIES).find(cat =>
    GIFT_CATEGORIES[cat as keyof typeof GIFT_CATEGORIES].includes(category)
  ) || category;

  return {
    needsSize: ["Ropa", "Deportes"].includes(categoryMain) || 
               ["Camisa", "Pantalón", "Vestido", "Zapatos", "Calzado Deportivo"].includes(category),
    needsColor: !["Experiencias", "Libros & Media"].includes(categoryMain),
    sizeType: category.toLowerCase().includes("zapato") || category.toLowerCase().includes("calzado") 
      ? "shoe" : "clothing",
    suggestedBrands: POPULAR_BRANDS[categoryMain as keyof typeof POPULAR_BRANDS] || []
  };
};