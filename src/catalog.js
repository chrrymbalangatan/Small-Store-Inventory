// Built-in product catalog shown in the "Add item" picker and on the Categories page.
export const CATEGORIES = ["Pantry", "Snacks", "Beverages", "Household Supplies"];

export const UNITS = [
  "piece (piraso)",
  "pack (pakete)",
  "sachet",
  "can (lata)",
  "bottle (bote)",
  "kilogram (kilo)",
  "gram",
  "liter (litro)",
  "bundle (tali)",
  "box (kahon)",
];

const UNIT_CHOICES = {
  "pack (pakete)": ["pack (pakete)", "box (kahon)"],
  "can (lata)": ["can (lata)", "box (kahon)"],
  "bottle (bote)": ["bottle (bote)", "box (kahon)"],
  sachet: ["sachet", "bundle (tali)"],
};

const RAW = [
  ["Lucky Me! Pancit Canton", "Kalamansi", "Pantry", "pack (pakete)"],
  ["Lucky Me! Pancit Canton", "Extra Hot Chili", "Pantry", "pack (pakete)"],
  ["Lucky Me! Pancit Canton", "Original", "Pantry", "pack (pakete)"],
  ["Ho-Mi Instant Mami", "Chicken & Garlic", "Pantry", "pack (pakete)"],
  ["Ho-Mi Instant Mami", "Beef Brisket", "Pantry", "pack (pakete)"],
  ["555 Fried Sardines", "Hot & Spicy", "Pantry", "can (lata)"],
  ["555 Sardines", "Tomato Sauce", "Pantry", "can (lata)"],
  ["Argentina Corned Beef", "Original", "Pantry", "can (lata)"],
  ["Argentina Beef Loaf", "Original", "Pantry", "can (lata)"],
  ["Argentina Giniling", "Ground Pork Mix", "Pantry", "can (lata)"],
  ["Piattos", "Sour Cream & Onion", "Snacks", "pack (pakete)"],
  ["Piattos", "Cheese", "Snacks", "pack (pakete)"],
  ["Chippy", "Chili & Cheese", "Snacks", "pack (pakete)"],
  ["Chippy", "Barbecue", "Snacks", "pack (pakete)"],
  ["Chippy", "Garlic & Vinegar", "Snacks", "pack (pakete)"],
  ["Mang Juan Chicharron", "Sukang Paombong", "Snacks", "pack (pakete)"],
  ["Mang Juan Chicharron", "Espesyal Suka’t Sili", "Snacks", "pack (pakete)"],
  ["Nova", "Country Cheddar", "Snacks", "pack (pakete)"],
  ["Nova", "Barbecue", "Snacks", "pack (pakete)"],
  ["Coca-Cola", "Original Taste · Bottle", "Beverages", "bottle (bote)"],
  ["Coca-Cola", "Original Taste · Can", "Beverages", "can (lata)"],
  ["C2 Green Tea", "Apple", "Beverages", "bottle (bote)"],
  ["C2 Green Tea", "Classic", "Beverages", "bottle (bote)"],
  ["C2 Green Tea", "Lemon", "Beverages", "bottle (bote)"],
  ["Royal Tru-Orange", "Orange · Can", "Beverages", "can (lata)"],
  ["Royal Tru-Orange", "Orange · Bottle", "Beverages", "bottle (bote)"],
  ["Sprite", "Lemon-Lime · Bottle", "Beverages", "bottle (bote)"],
  ["Sprite", "Lemon-Lime · Can", "Beverages", "can (lata)"],
  ["Surf Active Clean", "Cherry Blossom", "Household Supplies", "sachet"],
  ["Surf Active Clean", "Rose Fresh", "Household Supplies", "sachet"],
  ["Surf Active Clean", "Kalamansi", "Household Supplies", "sachet"],
  ["Zonrox", "Original", "Household Supplies", "bottle (bote)"],
  ["Zonrox ColorSafe", "Blossom Fresh", "Household Supplies", "bottle (bote)"],
  ["Joy Dishwashing Liquid", "Lemon", "Household Supplies", "bottle (bote)"],
  ["Joy Dishwashing Liquid", "Kalamansi", "Household Supplies", "bottle (bote)"],
  ["Downy Fabric Conditioner", "Kontra Germs", "Household Supplies", "sachet"],
  ["Downy Fabric Conditioner", "Spring Blossom", "Household Supplies", "sachet"],
];

export const CATALOG = RAW.map(([name, flavor, category, unit], i) => ({
  catalogId: i + 1,
  name,
  flavor,
  category,
  unit,
  size: "",
  photo: `/img/products/product-${String(i + 1).padStart(2, "0")}.webp`,
  stock: 0,
  price: 0,
  lowStock: 5,
}));

export const unitChoices = (item) =>
  (item?.catalogId ? UNIT_CHOICES[CATALOG[item.catalogId - 1]?.unit] : null) || UNITS;

export const BLANK_ITEM = {
  name: "",
  flavor: "",
  category: "Pantry",
  unit: UNITS[0],
  size: "",
  stock: 0,
  price: 0,
  lowStock: 5,
  photo: "",
};

export const peso = (centavos) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);

export const formatDate = (value) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));

export const unitName = (unit) => unit?.split(" (")[0] || "piece";
