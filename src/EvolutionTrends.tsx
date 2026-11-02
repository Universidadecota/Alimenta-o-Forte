import {useMemo,useState} from "react";
import type {EvolutionEntry} from "./lib/evolutionModel";
import {
 buildEvolutionTrend,evolutionMetricLabels,evolutionPeriods,formatTrendDate,
 type EvolutionMetric,type EvolutionPeriod,type TrendPoint
} from "./lib/evolutionTrends";

type Props={
 entries:readonly EvolutionEntry[];
 today:string;
 selectedDay:string;
 onSelectDay:(day:string)=>void;
};

/** Somente apresentação de valores que o titular registrou; não há novas consultas. */
export default function EvolutionTrends({entries,today,selectedDay,onSelectDay}:Props){
 const [metric,setMetric]=useState<EvolutionMetric>("energy_level");
 const [period,setPeriod]=useState<EvolutionPeriod>(30);
 const trend=useMemo(()=>buildEvolutionTrend(entries,metric,period,today),[entries,metric,period,today]);
 const chartWidth=632,chartLeft=42,top=20,stepY=42;
 const x=(point:TrendPoint)=>chartLeft+point.offset*chartWidth/(period-1);
 const y=(point:TrendPoint)=>top+(5-point.value)*stepY;
 const label=evolutionMetricLabels[metric];
 const empty=trend.recordedDays===0;
 return <section className="cc-trends" aria-labelledby="cc-trends-heading">
  <div className="cc-trends-header">
   <div>
    <h3 id="cc-trends-heading">Seu histórico em perspectiva</h3>
    <p>Visualize somente seus próprios registros. Dias sem informação ficam em branco; os pontos não são metas, médias nem avaliações de saúde.</p>
   </div>
   <span className="cc-trends-privacy">Histórico privado</span>
  </div>
  <div className="cc-trends-controls">
   <fieldset className="cc-trends-filter">
    <legend>Percepção</legend>
    <div className="cc-trends-options">
     {(Object.entries(evolutionMetricLabels) as Array<[EvolutionMetric,string]>).map(([key,text])=>
      <button key={key} type="button" aria-pressed={metric===key} className={metric===key?"active":""}
       onClick={()=>setMetric(key)}>{text}</button>)}
    </div>
   </fieldset>
   <fieldset className="cc-trends-filter">
    <legend>Intervalo</legend>
    <div className="cc-trends-options">
     {evolutionPeriods.map(n=><button key={n} type="button" aria-pressed={period===n}
      className={period===n?"active":""} onClick={()=>setPeriod(n)}>{n} dias</button>)}
    </div>
   </fieldset>
  </div>
  {empty?
   <p className="cc-trends-empty" role="status">Nenhum registro nesse intervalo. O gráfico aparecerá quando você decidir registrar alguma percepção; não há dias a recuperar.</p>
   :<div className="cc-trends-body">
    <p className="cc-trends-count">
     {trend.recordedDays} {trend.recordedDays===1?"dia registrado":"dias registrados"} no intervalo · {trend.points.length} {trend.points.length===1?"dia com valor":"dias com valores"} de {label.toLowerCase()}
    </p>
    {trend.points.length===0?
     <p className="cc-trends-empty">Há registros nesse intervalo, mas nenhum valor informado para {label.toLowerCase()}. Escolha outra percepção ou período.</p>
     :<>
      <div className="cc-trends-chart">
       <svg viewBox="0 0 710 249" role="img"
        aria-label={"Gráfico privado de "+label.toLowerCase()+" nos últimos "+period+" dias. "+trend.points.length+" valores registrados. Dias sem informação não são conectados."}>
        <title>{label} — últimos {period} dias, apenas valores registrados</title>
        {([1,2,3,4,5] as const).map(score=>{
         const gy=top+(5-score)*stepY;
         return <g key={score}>
          <line x1={chartLeft} y1={gy} x2={chartLeft+chartWidth} y2={gy} stroke="#e1eae0" strokeWidth="1"/>
          <text x="23" y={gy+4} fill="#62776a" fontSize="12" textAnchor="end">{score}</text>
         </g>;
        })}
        {trend.segments.filter(segment=>segment.length>1).map((segment,i)=>
         <polyline key={i} fill="none" stroke="#25724e" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          points={segment.map(point=>x(point)+","+y(point)).join(" ")}/>
        )}
        {trend.points.map(point=><circle key={point.day} cx={x(point)} cy={y(point)}
         r="5" fill="#1b6240" stroke="#fff" strokeWidth="1.5">
         <title>{formatTrendDate(point.day)}: {point.value} de 5</title>
        </circle>)}
        <text x={chartLeft} y="231" textAnchor="start" fill="#546e5f" fontSize="12">{formatTrendDate(trend.start)}</text>
        <text x={chartLeft+chartWidth} y="231" textAnchor="end" fill="#546e5f" fontSize="12">{formatTrendDate(trend.end)}</text>
       </svg>
      </div>
      <details className="cc-trends-details">
       <summary>Conferir os valores registrados ({trend.points.length})</summary>
       <div className="cc-trends-table-wrapper">
        <table>
         <thead><tr><th scope="col">Dia</th><th scope="col">{label} (1–5)</th><th scope="col">Ação</th></tr></thead>
         <tbody>{trend.points.map(point=><tr key={point.day}>
          <td>{formatTrendDate(point.day)}</td><td>{point.value} de 5</td>
          <td><button type="button" disabled={selectedDay===point.day}
           onClick={()=>onSelectDay(point.day)}>{selectedDay===point.day?"Dia selecionado":"Abrir registro"}</button></td>
         </tr>)}</tbody>
        </table>
       </div>
      </details>
     </>}
   </div>}
  <p className="cc-trends-footer">Os valores são percepções pessoais, não diagnósticos. Ausência de registro não significa nota zero; valores de dias separados não são unidos por uma linha. A edição ou exclusão de um dia atualiza este gráfico sem guardar uma cópia dos seus dados.</p>
 </section>;
}
