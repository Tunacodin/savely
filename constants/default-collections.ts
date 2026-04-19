export interface DefaultCollection {
  slug: string;
  emoji: string;
  bgColor: string;
  keywords: string[];
  name: {
    tr: string;
    en: string;
    fr: string;
    es: string;
  };
}

export const DEFAULT_COLLECTIONS: DefaultCollection[] = [
  { slug: "recipes", emoji: "🍳", bgColor: "#FFF7ED", keywords: ["tarif", "yemek", "recipe", "cooking", "mutfak", "recette", "cuisine", "receta", "cocina"], name: { tr: "Tarifler", en: "Recipes", fr: "Recettes", es: "Recetas" } },
  { slug: "movies", emoji: "🎬", bgColor: "#EEF2FF", keywords: ["film", "dizi", "movie", "series", "netflix", "izle", "série", "película"], name: { tr: "Film & Dizi", en: "Movies & Series", fr: "Films & Séries", es: "Películas & Series" } },
  { slug: "design", emoji: "✨", bgColor: "#FAF5FF", keywords: ["tasarım", "design", "ui", "ux", "figma", "behance", "conception", "diseño"], name: { tr: "Tasarım", en: "Design", fr: "Design", es: "Diseño" } },
  { slug: "realestate", emoji: "🏠", bgColor: "#F0FDF4", keywords: ["emlak", "ev", "daire", "sahibinden", "airbnb", "immobilier", "maison", "inmueble", "casa"], name: { tr: "Emlak", en: "Real Estate", fr: "Immobilier", es: "Inmuebles" } },
  { slug: "cars", emoji: "🚗", bgColor: "#FEF2F2", keywords: ["araba", "car", "araç", "otomobil", "voiture", "coche", "auto"], name: { tr: "Araba", en: "Cars", fr: "Voitures", es: "Coches" } },
  { slug: "fashion", emoji: "👗", bgColor: "#FDF2F8", keywords: ["moda", "fashion", "kıyafet", "outfit", "stil", "mode", "tenue"], name: { tr: "Moda", en: "Fashion", fr: "Mode", es: "Moda" } },
  { slug: "fitness", emoji: "💪", bgColor: "#ECFDF5", keywords: ["fitness", "spor", "workout", "egzersiz", "gym", "exercice", "ejercicio"], name: { tr: "Fitness", en: "Fitness", fr: "Fitness", es: "Fitness" } },
  { slug: "travel", emoji: "✈️", bgColor: "#F0F9FF", keywords: ["seyahat", "travel", "tatil", "otel", "gezi", "voyage", "viaje", "vacaciones"], name: { tr: "Seyahat", en: "Travel", fr: "Voyage", es: "Viajes" } },
  { slug: "tech", emoji: "💻", bgColor: "#F5F3FF", keywords: ["teknoloji", "tech", "kod", "programlama", "ai", "code", "technologie", "tecnología"], name: { tr: "Teknoloji", en: "Technology", fr: "Technologie", es: "Tecnología" } },
  { slug: "music", emoji: "🎵", bgColor: "#FFF1F2", keywords: ["müzik", "music", "şarkı", "playlist", "spotify", "musique", "canción", "música"], name: { tr: "Müzik", en: "Music", fr: "Musique", es: "Música" } },
  { slug: "sports", emoji: "⚽", bgColor: "#F0FDF4", keywords: ["futbol", "basketbol", "maç", "takım", "nba", "football", "match", "fútbol", "partido"], name: { tr: "Spor", en: "Sports", fr: "Sports", es: "Deportes" } },
  { slug: "study", emoji: "📚", bgColor: "#EFF6FF", keywords: ["ders", "study", "sınav", "not", "okul", "étude", "examen", "estudio", "examen"], name: { tr: "Eğitim", en: "Education", fr: "Études", es: "Educación" } },
  { slug: "language", emoji: "🌍", bgColor: "#ECFDF5", keywords: ["ingilizce", "english", "kelime", "vocabulary", "langue", "idioma", "dil"], name: { tr: "Dil Öğrenme", en: "Languages", fr: "Langues", es: "Idiomas" } },
  { slug: "shopping", emoji: "🛍️", bgColor: "#FFFBEB", keywords: ["alışveriş", "shopping", "wishlist", "indirim", "achats", "compras", "descuento"], name: { tr: "Alışveriş", en: "Shopping", fr: "Shopping", es: "Compras" } },
  { slug: "homedecor", emoji: "🏡", bgColor: "#FEF3C7", keywords: ["dekorasyon", "decor", "mobilya", "iç mimari", "décoration", "meuble", "decoración", "mueble"], name: { tr: "Dekorasyon", en: "Home Decor", fr: "Décoration", es: "Decoración" } },
  { slug: "books", emoji: "📖", bgColor: "#FFF7ED", keywords: ["kitap", "book", "okuma", "roman", "yazar", "livre", "lecture", "libro", "lectura"], name: { tr: "Kitap", en: "Books", fr: "Livres", es: "Libros" } },
  { slug: "podcasts", emoji: "🎧", bgColor: "#F5F3FF", keywords: ["podcast", "bölüm", "episode", "dinle", "écouter", "escuchar"], name: { tr: "Podcast", en: "Podcasts", fr: "Podcasts", es: "Podcasts" } },
  { slug: "jobs", emoji: "💼", bgColor: "#F0F9FF", keywords: ["iş", "job", "kariyer", "career", "mülakat", "emploi", "carrière", "empleo", "carrera"], name: { tr: "İş & Kariyer", en: "Jobs & Career", fr: "Emploi & Carrière", es: "Empleo & Carrera" } },
  { slug: "finance", emoji: "📈", bgColor: "#ECFDF5", keywords: ["finans", "yatırım", "borsa", "kripto", "para", "finance", "investissement", "inversión", "dinero"], name: { tr: "Finans", en: "Finance", fr: "Finance", es: "Finanzas" } },
  { slug: "gaming", emoji: "🎮", bgColor: "#EEF2FF", keywords: ["oyun", "game", "gaming", "steam", "ps5", "jeu", "juego"], name: { tr: "Oyun", en: "Gaming", fr: "Jeux", es: "Juegos" } },
  { slug: "art", emoji: "🎨", bgColor: "#FAF5FF", keywords: ["sanat", "art", "illüstrasyon", "çizim", "resim", "illustration", "dessin", "arte", "dibujo"], name: { tr: "Sanat", en: "Art", fr: "Art", es: "Arte" } },
  { slug: "photography", emoji: "📸", bgColor: "#F5F3FF", keywords: ["fotoğraf", "photo", "kamera", "çekim", "photographie", "caméra", "fotografía", "cámara"], name: { tr: "Fotoğraf", en: "Photography", fr: "Photographie", es: "Fotografía" } },
  { slug: "diy", emoji: "🔨", bgColor: "#FFFBEB", keywords: ["diy", "kendin yap", "craft", "el işi", "bricolage", "manualidad"], name: { tr: "Kendin Yap", en: "DIY", fr: "Bricolage", es: "Bricolaje" } },
  { slug: "pets", emoji: "🐾", bgColor: "#FFF1F2", keywords: ["evcil", "pet", "kedi", "köpek", "hayvan", "animal", "chat", "chien", "mascota", "gato", "perro"], name: { tr: "Evcil Hayvan", en: "Pets", fr: "Animaux", es: "Mascotas" } },
  { slug: "garden", emoji: "🌱", bgColor: "#F0FDF4", keywords: ["bahçe", "garden", "bitki", "çiçek", "jardin", "plante", "jardín", "planta"], name: { tr: "Bahçe", en: "Garden", fr: "Jardin", es: "Jardín" } },
  { slug: "wedding", emoji: "💍", bgColor: "#FDF2F8", keywords: ["düğün", "wedding", "gelin", "nişan", "mariage", "boda", "novia"], name: { tr: "Düğün", en: "Wedding", fr: "Mariage", es: "Boda" } },
  { slug: "parenting", emoji: "👶", bgColor: "#FEF3C7", keywords: ["bebek", "baby", "anne", "çocuk", "hamile", "bébé", "enfant", "bebé", "niño"], name: { tr: "Anne & Bebek", en: "Parenting", fr: "Parentalité", es: "Maternidad" } },
];
