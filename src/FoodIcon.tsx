import {Apple,Carrot,Leaf,Cherry,Wheat,Bean,Egg,Beef,Fish,Milk,TreeDeciduous,Droplets,Coffee,Utensils,Drumstick,Salad} from "lucide-react";
import type {FoodCategory} from "./lib/foodLibrary";

type Props={name:string;category:FoodCategory;size?:number};
export default function FoodIcon({name,category,size=29}:Props){
 const n=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const opts={size,strokeWidth:1.6,"aria-hidden":true as const};
 if(/abobrinha|cenoura|batata|beterraba|mandioca|pepino|abobora|pimentao/.test(n))return <Carrot {...opts}/>;
 if(/banana|maca|pera|manga|abacate|laranja|limao|mamao|melancia|melão/.test(n))return <Apple {...opts}/>;
 if(/uva|morango|amora|cereja|framboesa/.test(n))return <Cherry {...opts}/>;
 if(/alface|rucula|agriao|couve|espinafre|salsa|coentro|manjericao|repolho/.test(n))return <Leaf {...opts}/>;
 if(/arroz|aveia|trigo|milho|farinha|macarrao|quinoa/.test(n))return <Wheat {...opts}/>;
 if(/feijao|lentilha|ervilha|grao.de.bico/.test(n))return <Bean {...opts}/>;
 if(/ovo/.test(n))return <Egg {...opts}/>;
 if(/frango|peru|galinha/.test(n))return <Drumstick {...opts}/>;
 if(/carne|bife|boi|bovino|patinho|acém|porco|suino|lombo|costela/.test(n))return <Beef {...opts}/>;
 if(/atum|sardinha|salmao|peixe|tilapia|bacalhau|camarao|truta|badejo|anchova/.test(n))return <Fish {...opts}/>;
 if(/leite|queijo|iogurte|manteiga|requeijao/.test(n))return <Milk {...opts}/>;
 if(/castanha|amendoim|amendoa|noz/.test(n))return <TreeDeciduous {...opts}/>;
 if(/agua|azeite|oleo|banha/.test(n))return <Droplets {...opts}/>;
 if(/cafe|cha|suco/.test(n))return <Coffee {...opts}/>;
 switch(category){
  case "verduras":return <Leaf {...opts}/>;
  case "legumes":return <Carrot {...opts}/>;
  case "frutas":return <Apple {...opts}/>;
  case "cereais_tuberculos":return <Wheat {...opts}/>;
  case "leguminosas":return <Bean {...opts}/>;
  case "ovos":return <Egg {...opts}/>;
  case "carnes_aves":return <Beef {...opts}/>;
  case "peixes":return <Fish {...opts}/>;
  case "laticinios":return <Milk {...opts}/>;
  case "oleaginosas":return <TreeDeciduous {...opts}/>;
  case "oleos_gorduras":return <Droplets {...opts}/>;
  case "bebidas":return <Coffee {...opts}/>;
  default:return <Utensils {...opts}/>;
 }
}
