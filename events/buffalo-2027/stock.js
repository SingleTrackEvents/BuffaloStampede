// Buffalo Stampede 2027: the stocktake lists (tools/events/buffalo/stock.py, from the BSF_2027 Aid Station Consumptions
// sheet's pack lists). items: every item in the unit it's packed in. stations: what each station is sent, the most on one
// day. triggers: the restock triggers (Aid Station Operation Plan v0.3, section 05); est is the race sheet's estimate.
// yard: the yard and coolroom locations the yard team stocktakes. everyMin: how often stations stocktake.
window.ST_STOCK = {
 "items": [
  {
   "id": "water",
   "name": "Water",
   "unit": "1L"
  },
  {
   "id": "ice",
   "name": "Ice",
   "unit": "5kg Bag"
  },
  {
   "id": "electrolyte",
   "name": "Electrolyte",
   "unit": "8.75L Pack"
  },
  {
   "id": "gels",
   "name": "Gels",
   "unit": "Gel"
  },
  {
   "id": "coke",
   "name": "Coke",
   "unit": "Cans (375ml)"
  },
  {
   "id": "ginger-beer",
   "name": "Ginger Beer",
   "unit": "Cans (200ml)"
  },
  {
   "id": "bananas",
   "name": "Bananas",
   "unit": "Box (90)"
  },
  {
   "id": "orange",
   "name": "Orange",
   "unit": "Box (80)"
  },
  {
   "id": "watermelon",
   "name": "Watermelon",
   "unit": "1"
  },
  {
   "id": "salt",
   "name": "Salt",
   "unit": "1 shaker"
  },
  {
   "id": "sugar",
   "name": "Sugar",
   "unit": "1kg"
  },
  {
   "id": "chips-sv-plain",
   "name": "Chips (SV + Plain)",
   "unit": "6 pack"
  },
  {
   "id": "mars-snickers",
   "name": "Mars + Snickers",
   "unit": "20 Pack"
  },
  {
   "id": "lollies",
   "name": "Lollies",
   "unit": "1kg"
  },
  {
   "id": "boiled-potatoes",
   "name": "Boiled Potatoes",
   "unit": "1"
  },
  {
   "id": "noodles",
   "name": "Noodles",
   "unit": "1 cup"
  },
  {
   "id": "noodles-gluten-free",
   "name": "Noodles Gluten Free",
   "unit": "1 cup"
  },
  {
   "id": "hot-soup-spring-veg",
   "name": "Hot Soup (Spring Veg)",
   "unit": "4 Pack"
  },
  {
   "id": "tea-english-breakfast",
   "name": "Tea (English Breakfast)",
   "unit": "1 Box (100 bag)"
  },
  {
   "id": "coffee-large-instant",
   "name": "Coffee (Large Instant)",
   "unit": "200g Jar"
  },
  {
   "id": "milo",
   "name": "Milo",
   "unit": "460g tin"
  },
  {
   "id": "cow-milk",
   "name": "Cow Milk",
   "unit": "1L carton"
  },
  {
   "id": "soy-milk",
   "name": "Soy Milk",
   "unit": "1L carton"
  },
  {
   "id": "toasties",
   "name": "Toasties",
   "unit": "1 jaffle"
  },
  {
   "id": "white-bread",
   "name": "White Bread",
   "unit": "1 Loaf"
  },
  {
   "id": "cheese-slices",
   "name": "Cheese Slices",
   "unit": "500g (30 pack)"
  },
  {
   "id": "vegan-cheese-slices",
   "name": "Vegan Cheese Slices",
   "unit": "200g (10 pack)"
  },
  {
   "id": "olive-oil-spray",
   "name": "Olive oil spray",
   "unit": "1 bottle"
  },
  {
   "id": "baked-beans",
   "name": "Baked Beans",
   "unit": "420g tin"
  },
  {
   "id": "gluten-free-bread",
   "name": "Gluten Free Bread",
   "unit": "1 Loaf"
  }
 ],
 "stations": {
  "Mystic": {
   "water": 665.0,
   "ice": 5.0,
   "electrolyte": 28.0,
   "gels": 760.0,
   "coke": 240.0,
   "ginger-beer": 145.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 24.0,
   "mars-snickers": 10.0,
   "lollies": 5.0
  },
  "Pioneer Park, Bright": {
   "water": 1530.0,
   "ice": 25.0,
   "electrolyte": 62.0,
   "coke": 387.0,
   "ginger-beer": 235.0,
   "bananas": 1.75,
   "orange": 1.25,
   "watermelon": 13.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 69.0,
   "mars-snickers": 21.0,
   "lollies": 12.0,
   "noodles": 116.0,
   "noodles-gluten-free": 6.0,
   "hot-soup-spring-veg": 8.0,
   "tea-english-breakfast": 1.0,
   "coffee-large-instant": 1.0,
   "milo": 1.0,
   "cow-milk": 2.0,
   "soy-milk": 2.0
  },
  "Clearspot": {
   "water": 2991.0,
   "ice": 21.0,
   "electrolyte": 69.0,
   "gels": 1688.0,
   "coke": 534.0,
   "ginger-beer": 325.0,
   "bananas": 2.5,
   "orange": 1.5,
   "watermelon": 18.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 94.0,
   "mars-snickers": 29.0,
   "lollies": 17.0,
   "boiled-potatoes": 332.0,
   "noodles": 232.0,
   "noodles-gluten-free": 12.0,
   "hot-soup-spring-veg": 8.0,
   "tea-english-breakfast": 1.0,
   "coffee-large-instant": 1.0,
   "milo": 1.0,
   "cow-milk": 2.0,
   "soy-milk": 2.0,
   "toasties": 82.0,
   "white-bread": 13.0,
   "cheese-slices": 6.0,
   "vegan-cheese-slices": 2.0,
   "olive-oil-spray": 2.0,
   "baked-beans": 9.0,
   "gluten-free-bread": 1.0
  },
  "Bakers Gully": {
   "water": 1425.0,
   "ice": 15.0,
   "electrolyte": 28.0,
   "gels": 760.0,
   "coke": 240.0,
   "ginger-beer": 145.0,
   "bananas": 1.25,
   "orange": 0.75,
   "watermelon": 8.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 40.0,
   "mars-snickers": 12.0,
   "lollies": 7.0,
   "boiled-potatoes": 143.0
  },
  "Buckland Valley": {
   "water": 1700.0,
   "ice": 17.0,
   "electrolyte": 41.0,
   "gels": 928.0,
   "coke": 294.0,
   "ginger-beer": 180.0,
   "bananas": 1.5,
   "orange": 1.0,
   "watermelon": 10.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 54.0,
   "mars-snickers": 17.0,
   "lollies": 10.0,
   "boiled-potatoes": 189.0,
   "noodles": 232.0,
   "noodles-gluten-free": 12.0,
   "hot-soup-spring-veg": 8.0,
   "tea-english-breakfast": 1.0,
   "coffee-large-instant": 1.0,
   "milo": 1.0,
   "cow-milk": 2.0,
   "soy-milk": 2.0,
   "toasties": 82.0,
   "white-bread": 13.0,
   "cheese-slices": 6.0,
   "vegan-cheese-slices": 2.0,
   "olive-oil-spray": 2.0,
   "baked-beans": 9.0,
   "gluten-free-bread": 1.0
  },
  "Eurobin Creek": {
   "water": 1740.0,
   "ice": 15.0,
   "electrolyte": 46.0,
   "gels": 928.0,
   "coke": 294.0,
   "ginger-beer": 180.0,
   "bananas": 1.5,
   "orange": 1.0,
   "watermelon": 10.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 54.0,
   "mars-snickers": 17.0,
   "lollies": 10.0,
   "boiled-potatoes": 232.0,
   "noodles": 261.0,
   "noodles-gluten-free": 14.0,
   "hot-soup-spring-veg": 10.0,
   "tea-english-breakfast": 1.0,
   "coffee-large-instant": 1.0,
   "milo": 1.0,
   "cow-milk": 2.0,
   "soy-milk": 2.0,
   "toasties": 111.0,
   "white-bread": 18.0,
   "cheese-slices": 8.0,
   "vegan-cheese-slices": 3.0,
   "olive-oil-spray": 3.0,
   "baked-beans": 12.0,
   "gluten-free-bread": 2.0
  },
  "The Chalet": {
   "water": 1856.0,
   "ice": 15.0,
   "electrolyte": 48.0,
   "gels": 928.0,
   "coke": 294.0,
   "ginger-beer": 180.0,
   "bananas": 1.5,
   "orange": 1.0,
   "watermelon": 10.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 58.0,
   "mars-snickers": 18.0,
   "lollies": 18.0,
   "boiled-potatoes": 232.0,
   "noodles": 348.0,
   "noodles-gluten-free": 18.0,
   "hot-soup-spring-veg": 16.0,
   "tea-english-breakfast": 2.0,
   "coffee-large-instant": 2.0,
   "milo": 2.0,
   "cow-milk": 4.0,
   "soy-milk": 4.0,
   "toasties": 164.0,
   "white-bread": 26.0,
   "cheese-slices": 12.0,
   "vegan-cheese-slices": 4.0,
   "olive-oil-spray": 4.0,
   "baked-beans": 18.0,
   "gluten-free-bread": 2.0
  },
  "Cresta Valley": {
   "water": 1856.0,
   "ice": 15.0,
   "electrolyte": 48.0,
   "gels": 928.0,
   "coke": 294.0,
   "ginger-beer": 180.0,
   "bananas": 1.5,
   "orange": 1.0,
   "watermelon": 10.0,
   "salt": 1.0,
   "sugar": 1.0,
   "chips-sv-plain": 58.0,
   "mars-snickers": 18.0,
   "lollies": 18.0,
   "boiled-potatoes": 232.0,
   "noodles": 348.0,
   "noodles-gluten-free": 18.0,
   "hot-soup-spring-veg": 16.0,
   "tea-english-breakfast": 2.0,
   "coffee-large-instant": 2.0,
   "milo": 2.0,
   "cow-milk": 4.0,
   "soy-milk": 4.0,
   "toasties": 164.0,
   "white-bread": 26.0,
   "cheese-slices": 12.0,
   "vegan-cheese-slices": 4.0,
   "olive-oil-spray": 4.0,
   "baked-beans": 18.0,
   "gluten-free-bread": 2.0
  }
 },
 "triggers": [
  {
   "id": "r100-1",
   "name": "100k restock 1",
   "when": "40% of the 100k field through Buckland Valley outbound",
   "est": "2027-03-20T09:30",
   "to": [
    "Buckland Valley",
    "Eurobin Creek"
   ],
   "note": "From the main village coolroom, before 12:00 Saturday."
  },
  {
   "id": "r100-night",
   "name": "100k overnight restock",
   "when": "First 100k runners inbound at Eurobin Creek",
   "est": "2027-03-20T12:57",
   "to": [
    "Eurobin Creek",
    "Buckland Valley",
    "Clearspot"
   ],
   "note": "Hot food and night stock for the second passes."
  },
  {
   "id": "r42",
   "name": "42k stock",
   "when": "Saturday after 17:00",
   "est": "2027-03-20T17:00",
   "to": [
    "Eurobin Creek",
    "Buckland Valley",
    "Clearspot",
    "Bakers Gully"
   ],
   "note": "Sunday's 42k stock in place before the overnight crews leave."
  }
 ],
 "yard": [
  "Yard",
  "Main coolroom (village)",
  "Ovens Valley coolroom (village concourse)",
  "Dawsons coolroom 1 (Pioneer Park)",
  "Dawsons coolroom 2 (Pioneer Park)"
 ],
 "everyMin": 120
};
