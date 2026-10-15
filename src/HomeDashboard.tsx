import { CalendarDays, ChefHat, ChevronRight, ClipboardList, Leaf, ShoppingBasket } from "lucide-react";
import { dateKey, slots, daySlots, optionalSlots, type Meal, type Plan } from "./lib/planner";

type DashboardProps = {
  plan: Plan;
  recipes: Meal[];
  loading: boolean;
  goal: string | null;
  plannedInWeek: number;
  optionalInWeek: number;
  onOpenPlanner: () => void;
  onOpenShopping: () => void;
  onOpenRecipes: () => void;
  onViewRecipe: (recipeId: string) => void;
};

const goalLabels: Record<string, string> = {
  eat_better: "Comer melhor",
  plan_meals: "Organizar refeições",
  balanced_weight: "Cuidar do peso com equilíbrio",
  build_habits: "Cultivar hábitos",
  maintain_balance: "Manter equilíbrio",
};

const dateLabel = (date: Date) => new Intl.DateTimeFormat("pt-BR", {
  weekday: "long", day: "numeric", month: "long",
}).format(date);

export default function HomeDashboard({
  plan, recipes, loading, goal, plannedInWeek, optionalInWeek,
  onOpenPlanner, onOpenShopping, onOpenRecipes, onViewRecipe,
}: DashboardProps) {
  const today = new Date();
  const todayKey = dateKey(today);
  const meals = daySlots.filter(slot => slots.includes(slot) || Boolean(plan[todayKey]?.[slot])).map(slot => {
    const planned = plan[todayKey]?.[slot];
    const recipe = planned ? recipes.find(item => item.id === planned.id) : undefined;
    return { slot, planned, recipe };
  });
  const plannedToday = meals.filter(meal => slots.includes(meal.slot) && Boolean(meal.planned)).length;
  const optionalToday = optionalSlots.filter(slot => Boolean(plan[todayKey]?.[slot]?.id)).length;
  const nextToPlan = meals.find(meal => !meal.planned)?.slot;

  return <div className="dashboard-home">
    <section className="dashboard-welcome" aria-labelledby="dashboard-title">
      <div className="dashboard-welcome-content">
        <span className="eyebrow light">SUA ALIMENTAÇÃO, SEU RITMO</span>
        <h2 id="dashboard-title">Seu dia, mais organizado.</h2>
        <p className="dashboard-today">{dateLabel(today)}</p>
        <p>Seu cardápio, suas receitas e suas compras reunidos em um só lugar. Ajuste tudo ao seu ritmo.</p>
        {goal && <p className="dashboard-goal">Objetivo cadastrado: {goalLabels[goal] ?? goal}</p>}
        <div className="dashboard-actions">
          <button type="button" className="primary light-button" onClick={onOpenPlanner}>
            <CalendarDays size={18}/> Ver meu cardápio
          </button>
          <button type="button" className="dashboard-hero-outline" onClick={onOpenShopping}>
            <ShoppingBasket size={18}/> Lista de compras
          </button>
        </div>
      </div>
      <div className="dashboard-leaf-mark" aria-hidden="true"><Leaf size={92} strokeWidth={1.1}/></div>
    </section>
    <section aria-label="Resumo do seu planejamento" className="dashboard-stat-grid">
      <div className="dashboard-stat-card">
        <span>Refeições planejadas hoje</span>
        <strong>{loading ? "—" : plannedToday + " / " + slots.length}</strong>
        <small>{optionalToday ? optionalToday + " refeição(ões) opcionais também planejadas." : "Lanches e ceia são opcionais."}</small>
      </div>
      <div className="dashboard-stat-card">
        <span>Cardápio da semana</span>
        <strong>{loading ? "—" : plannedInWeek + " / " + (slots.length * 7)}</strong>
        <small>{optionalInWeek ? optionalInWeek + " refeições opcionais na semana." : "Até 3 refeições principais por dia; lanches opcionais."}</small>
      </div>
      <div className="dashboard-stat-card">
        <span>Seu próximo passo</span>
        <strong className="dashboard-next-step">{loading ? "Carregando" : nextToPlan ? "Planejar " + nextToPlan.toLowerCase() : "Dia planejado"}</strong>
        <button type="button" onClick={onOpenPlanner}>
          Abrir planejador <ChevronRight size={15}/>
        </button>
      </div>
    </section>
    <section className="dashboard-today-section" aria-labelledby="today-meals-title">
      <div className="dashboard-section-heading">
        <div><span className="eyebrow">CARDÁPIO DO DIA</span><h2 id="today-meals-title">Suas refeições de hoje</h2></div>
        <button type="button" className="secondary" onClick={onOpenPlanner}>Montar minha semana <ChevronRight size={16}/></button>
      </div>
      {loading
        ? <div className="dashboard-empty" role="status">Carregando suas refeições...</div>
        : <div className="dashboard-meal-grid">
          {meals.map(({ slot, planned, recipe }) => <article className="dashboard-meal-card" key={slot}>
            <div className="dashboard-meal-icon"><ChefHat size={22}/></div>
            <span className="dashboard-meal-slot">{slot}</span>
            <h3>{recipe?.title ?? (planned ? "Receita indisponível" : "Refeição não planejada")}</h3>
            <p>{recipe ? recipe.minutes + " min de preparo · " + planned!.servings + (planned!.servings === 1 ? " porção" : " porções") : planned ? "Verifique a receita cadastrada." : "Escolha uma receita para este momento do dia."}</p>
            {recipe
              ? <button type="button" onClick={() => onViewRecipe(recipe.id)}>Ver receita <ChevronRight size={15}/></button>
              : <button type="button" onClick={onOpenPlanner}>Escolher refeição <ChevronRight size={15}/></button>}
          </article>)}
        </div>}
    </section>
    <section className="dashboard-shortcuts" aria-label="Atalhos">
      <button type="button" onClick={onOpenShopping}><ShoppingBasket size={23}/><span><strong>Compras da semana</strong><small>Ingredientes calculados pelo cardápio</small></span><ChevronRight size={18}/></button>
      <button type="button" onClick={onOpenRecipes}><ClipboardList size={23}/><span><strong>Biblioteca de receitas</strong><small>Veja receitas e adicione suas próprias</small></span><ChevronRight size={18}/></button>
    </section>
  </div>;
}
