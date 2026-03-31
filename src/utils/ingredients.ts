export interface IngredientCategory {
  vegetables: Vegetables[]; // λαχανικά
  fruits: Fruits[]; // φρούτα
  grain: Grain[]; // ψωμί και δημητριακά
  dairy: Dairy[]; // γαλακτοκομικά
  meat: Meat[]; // κρεας, κοτοπουλο, ψαρικά, θαλασσινά
  lipid: Lipid[]; // λίπη και λιπαρά
  legumes: Legumes[]; // οσπρια
  pastry: Pastry[]; // γλυκίσματα, αναψυκτικά, σνακς
  spices: Spices[];
}

export enum Vegetables {
  Carrot = 'Καρότο',
  Broccoli = 'Μπρόκολο',
  Cauliflower = 'Κουνουπίδι',
  Spinach = 'Σπανάκι',
  Cabbage = 'Λάχανο',
  Onion = 'Κρεμμύδι',
  Garlic = 'Σκόρδο',
  Pepper = 'Πιπεριά',
  Tomato = 'Τομάτα',
  Cucumber = 'Αγγούρι',
  Eggplant = 'Μελιτζάνα',
  GreenBeans = 'Φασολάκια',
  Potato = 'Πατάτα',
  Zucchini = 'Κολοκυθάκια',
  SweetPotato = 'Γλυκοπατάτα',
  Radish = 'Ραπανάκι',
  Lettuce = 'Μαρούλι',
  Artichoke = 'Αγγινάρα',
  Mushrooms = 'Μανιτάρια',
  Leek = 'Πράσο',
  Celery = 'Σέλινο',
}

export enum Spices {
  Oregano = 'Ρίγανη',
  Thyme = 'Θυμάρι',
  Rosemary = 'Δεντρολίβανο',
  Dill = 'Άνηθο',
  Basil = 'Βασιλικός',
  Cinnamon = 'Κανέλα',
  Parsley = 'Μαϊντανός',
  Coriander = 'Κορίανδρος',
  RedPepperFlakes = 'Μπούκοβο',
  Paprika = 'Πάπρικα',
  Cumin = 'Κύμινο',
  BayLeaves = 'Φύλλα Δάφνης',
  Mint = 'Μέντα',
}

export enum Fruits {
  Lemon = 'Λεμόνι',
  Orange = 'Πορτοκάλι',
  Grapefruit = 'Πορτοκάλι γλυκό',
  Strawberry = 'Φράουλα',
  Raspberry = 'Βατόμουρο',
  Blueberry = 'Μύρτιλο',
  Peach = 'Ροδάκινο',
  Apricot = 'Βερίκοκο',
  Cherry = 'Κεράσι',
  Banana = 'Μπανάνα',
  Pineapple = 'Ανανάς',
  Mango = 'Μάνγκο',
  Watermelon = 'Καρπούζι',
  Apple = 'Μήλο',
  Pear = 'Άχλαδι',
  Pomegranate = 'Ρόδι',
  Fig = 'Σύκο',
  Cranberry = 'Κράνμπερι',
  Raisins = 'Σταφίδες',
}
export enum Grain {
  Barley = 'Κριθάρι',
  Rice = 'Ρύζι',
  Corn = 'Καλαμπόκι',
  Oats = 'Βρώμη',
  Quinoa = 'Κινόα',
  Couscous = 'Κούσκους',
  Amaranth = 'Αμάρανθος',
  Cereal = 'Δημητριακά',
  Flour = 'Αλεύρι',
  Bread = 'Ψωμί',
  Pasta = 'Ζυμαρικά',
}
export enum Dairy {
  FetaCheese = 'Φέτα',
  KefalotyriCheese = 'Κεφαλοτύρι',
  MizithraCheese = 'Μυζήθρα',
  GravieraCheese = 'Γραβιέρα',
  AnthotyroCheese = 'Ανθότυρο',
  KasseriCheese = 'Κασέρι',
  GreekYogurt = 'Ελληνικό Γιαούρτι',
  Tzatziki = 'Τζατζίκι',
  Milk = 'Γάλα',
  Butter = 'Βούτυρο',
  Cream = 'Κρέμα Γάλακτος',
}
export enum Meat {
  Lamb = 'Αρνί',
  Beef = 'Μοσχάρι',
  Pork = 'Χοιρινό',
  Chicken = 'Κοτόπουλο',
  Veal = 'Μοσχαρίσιο',
  Rabbit = 'Κουνέλι',
  Goat = 'Κατσίκι',
  Venison = 'Αγριογούρουνο',
  Duck = 'Πάπια',
  Quail = 'Πέρδικα',
  Turkey = 'Γαλοπούλα',
  Octopus = 'Χταπόδι',
  Calamari = 'Καλαμάρι',
  Sardines = 'Σαρδέλες',
  Anchovies = 'Γαύρος',
  Mackerel = 'Σκουμπρί',
  Cod = 'Μπακαλιάρος',
  SeaBass = 'Λαβράκι',
  Tuna = 'Τόνος',
  Shrimp = 'Γαρίδες',
  Mussels = 'Μύδια',
}
export enum Lipid {
  OliveOil = 'Λάδι Ελιάς',
  VegetableOil = 'Λάδι Φυτικό',
  SunflowerOil = 'Λάδι Ηλίου',
  SesameOil = 'Λάδι Σουσαμιού',
  Butter = 'Βούτυρο',
  ClarifiedButter = 'Καθαρισμένο Βούτυρο (Γκι)',
  Tahini = 'Ταχίνι',
}
export enum Legumes {
  Lentils = 'Φακές',
  Chickpeas = 'Ρεβύθια',
  FavaBeans = 'Κουκιά',
  BlackEyedPeas = 'Μαυρομάτικα',
  WhiteBeans = 'Φασόλια Τρεμοπούλι',
  GigantesBeans = 'Φασόλια Γίγαντες',
  GreenPeas = 'Αρακάς',
  YellowSplitPeas = 'Φακή Κίτρινη Χωριστή',
  Cowpeas = 'Κουρκουτιά',
}
export enum Pastry {
  Sugar = 'Ζάχαρη',
  Honey = 'Μέλι',
  Chocolate = 'Σοκολάτα',
  Truffles = 'Τρούφες',
}
