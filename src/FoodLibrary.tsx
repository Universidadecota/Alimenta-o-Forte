import { useEffect, useState, type FormEvent } from "react";
import { Apple, ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Info, Search } from "lucide-react";
import { fetchFoodItems, foodCategories, foodCategoryLabel, FOOD_PAGE_SIZE, type FoodCategory, type FoodItem } from "./lib/foodLibrary";
import { formatIngredientAmount } from "./lib/ingredientMeasures";

export default function FoodLibrary() {
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);setError("");
    void fetchFoodItems(category, search, page, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setItems(result.items);setTotal(result.total);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Não foi possível carregar a biblioteca.");
      })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [category, search, page, reload]);

  const totalPages = Math.max(1, Math.ceil(total / FOOD_PAGE_SIZE));
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchText.trim());setPage(1);setSelected(null);
  };
  const changeCategory = (value: FoodCategory | "all") => {
    setCategory(value);setPage(1);setSelected(null);
  };

  if (selected) return <section className="cc-food-library" aria-labelledby="cc-food-detail-title">
    <button type="button" className="cc-food-back" onClick={() => setSelected(null)}>
      <ArrowLeft size={17}/> Voltar aos alimentos
    </button>
    <div className="cc-food-detail">
      <div className="cc-food-detail-header">
        <div className="cc-food-detail-symbol" aria-hidden="true"><Apple size={33} strokeWidth={1.5}/></div>
        <div>
          <p className="cc-food-kicker">{selected.published?"BIBLIOTECA DE ALIMENTOS":"ACERVO PILOTO · CONSULTA ADMINISTRATIVA"}</p>
          <h2 id="cc-food-detail-title">{selected.name}</h2>
          <span className="cc-food-category-label">{foodCategoryLabel(selected.category)}</span>
        </div>
      </div>
      <div className="cc-food-detail-grid">
        <section><h3>Sobre este alimento</h3>
          <p>{selected.description || "Registro inicial de alimento para consulta por nome e categoria. A descrição detalhada ainda depende de revisão editorial."}</p>
          <p><strong>Porção de referência:</strong> {selected.reference_portion_quantity != null && selected.reference_portion_unit
            ? formatIngredientAmount(selected.reference_portion_quantity, selected.reference_portion_unit)
            : "Não definida"}</p>
        </section>
        <section><h3>Informações nutricionais</h3>
          <p>{selected.nutrition_reviewed_at && selected.nutrition_source && selected.editorial_status==="verified"
            ? "Dados nutricionais revisados; a apresentação detalhada será disponibilizada após homologação do formato."
            : "Ainda não há valores nutricionais verificados nesta ficha."}</p>
          {selected.nutrition_source && <p><strong>Fonte declarada:</strong> {selected.nutrition_source}</p>}
        </section>
      </div>
      <div className="cc-food-safety"><Info size={19} aria-hidden="true"/>
        <p>Informações de alergênicos e contato cruzado ainda não foram avaliadas nesta ficha. Não utilize esta biblioteca para determinar se um alimento é seguro em caso de alergia ou intolerância. {selected.published?"":"Este registro permanece preliminar e restrito à administração."}</p>
      </div>
      <p className="cc-food-footnote">Ficha {selected.editorial_status==="verified"?"com revisão editorial registrada":"de classificação preliminar"}. Nenhuma informação nutricional foi estimada pelo aplicativo.</p>
    </div>
  </section>;

  return <section className="cc-food-library" aria-labelledby="cc-food-title">
    <div className="cc-food-intro">
      <div className="cc-food-intro-icon" aria-hidden="true"><Apple size={28}/></div>
      <div><p className="cc-food-kicker">CONHEÇA SEUS ALIMENTOS</p>
        <h2 id="cc-food-title">Biblioteca de Alimentos Brasileiros</h2>
        <p>Explore ingredientes por nome e categoria. No acesso administrativo, também aparecem os novos cadastros preliminares para uso pessoal; eles não estão publicados para outros usuários.</p>
      </div>
    </div>
    <div className="cc-food-caution"><Info size={17} aria-hidden="true"/>
      <span>Catálogo inicial com classificações preliminares. Valores nutricionais, alergênicos e porções de referência aguardam revisão técnica.</span>
    </div>
    <form className="cc-food-search" onSubmit={submitSearch} role="search">
      <label htmlFor="cc-food-query">Pesquisar alimento</label>
      <div><Search size={18} aria-hidden="true"/>
        <input id="cc-food-query" type="search" maxLength={80}
          placeholder="Ex.: feijão, banana, mandioca..." value={searchText}
          onChange={event => setSearchText(event.target.value)}/>
        <button type="submit" className="primary">Pesquisar</button>
      </div>
    </form>
    <div className="cc-food-filters" role="group" aria-label="Filtrar por categoria">
      <button type="button" aria-pressed={category==="all"} className={category==="all"?"active":""}
        onClick={() => changeCategory("all")}>Todos</button>
      {foodCategories.map(item=><button type="button" key={item.id}
        aria-pressed={category===item.id} className={category===item.id?"active":""}
        onClick={() => changeCategory(item.id)}>{item.label}</button>)}
    </div>
    <div className="cc-food-results-heading">
      <p role="status">{busy?"Consultando alimentos...":error?"Não foi possível consultar a biblioteca.":total===0?"Nenhum alimento encontrado.":total+" "+(total===1?"alimento encontrado":"alimentos encontrados")}</p>
      {search && <button type="button" onClick={()=>{setSearch("");setSearchText("");setPage(1);}}>Limpar busca</button>}
    </div>
    {error && <div className="cc-food-error" role="alert">
      <p>{error}</p><button type="button" className="secondary" onClick={()=>setReload(value=>value+1)}>Tentar novamente</button>
    </div>}
    {!error && !busy && total===0 && <div className="cc-food-empty"><BookOpen size={28}/><p>Experimente pesquisar outro alimento ou escolher outra categoria.</p></div>}
    {!busy && !error && <div className="cc-food-grid">
      {items.map(item=><button type="button" className="cc-food-card" key={item.id}
        onClick={()=>setSelected(item)} aria-label={"Abrir ficha de "+item.name}>
        <div className="cc-food-card-art" aria-hidden="true"><Apple size={29} strokeWidth={1.4}/></div>
        <span className="cc-food-card-category">{foodCategoryLabel(item.category)}</span>
        <strong>{item.name}</strong>
        <span className="cc-food-card-meta">{!item.published?"Piloto pessoal · não publicado":item.editorial_status==="verified"?"Conteúdo em revisão":"Informações básicas"}</span>
        <span className="cc-food-card-link">Ver ficha <ArrowRight size={15}/></span>
      </button>)}
    </div>}
    {!busy && !error && totalPages>1 && <nav className="cc-food-pages" aria-label="Páginas da biblioteca">
      <button type="button" className="secondary" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>
        <ChevronLeft size={17}/> Anterior
      </button>
      <span>Página {page} de {totalPages}</span>
      <button type="button" className="secondary" disabled={page>=totalPages} onClick={()=>setPage(value=>value+1)}>
        Próxima <ChevronRight size={17}/>
      </button>
    </nav>}
  </section>;
}
