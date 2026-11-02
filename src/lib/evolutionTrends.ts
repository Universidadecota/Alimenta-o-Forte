import type {EvolutionEntry,MoodScore} from "./evolutionModel";
import {validLocalDate} from "./evolutionModel";

export type EvolutionMetric="energy_level"|"wellbeing_level"|"sleep_quality";
export type EvolutionPeriod=7|30|90;
export type TrendPoint={day:string;value:Exclude<MoodScore,null>;offset:number};
export type TrendSeries={
 start:string;
 end:string;
 period:EvolutionPeriod;
 points:TrendPoint[];
 segments:TrendPoint[][];
 recordedDays:number;
};
export const evolutionMetricLabels:Record<EvolutionMetric,string>={
 energy_level:"Energia",wellbeing_level:"Bem-estar",sleep_quality:"Descanso"
};
export const evolutionPeriods=[7,30,90] as const;
const utcDay=(key:string):number=>{
 const [y,m,d]=key.split("-").map(Number);
 return Math.floor(Date.UTC(y,m-1,d)/86400000);
};
const fromUtcDay=(n:number):string=>new Date(n*86400000).toISOString().slice(0,10);

/** Janela de dias de calendário, inclusive, sem converter timestamps do servidor. */
export function getTrendWindow(today:string,period:EvolutionPeriod):{start:string;end:string}{
 if(!validLocalDate(today))throw new Error("Data de referência inválida.");
 if(!evolutionPeriods.includes(period))throw new Error("Período inválido.");
 return {start:fromUtcDay(utcDay(today)-period+1),end:today};
}
/** Só a série escolhida; nunca soma, estima nem preenche dias não registrados. */
export function buildEvolutionTrend(
 entries:readonly Pick<EvolutionEntry,"recorded_on"|"energy_level"|"wellbeing_level"|"sleep_quality">[],
 metric:EvolutionMetric,period:EvolutionPeriod,today:string
):TrendSeries{
 const {start,end}=getTrendWindow(today,period);
 const filtered=entries.filter(row=>validLocalDate(row.recorded_on)&&row.recorded_on>=start&&row.recorded_on<=end);
 const days=new Set(filtered.map(row=>row.recorded_on));
 const seen=new Set<string>();
 const points:TrendPoint[]=[];
 for(const row of [...filtered].sort((a,b)=>a.recorded_on.localeCompare(b.recorded_on))){
  const value=row[metric];
  if(seen.has(row.recorded_on)||!Number.isInteger(value)||value===null||value<1||value>5)continue;
  seen.add(row.recorded_on);
  points.push({day:row.recorded_on,value:value as Exclude<MoodScore,null>,offset:utcDay(row.recorded_on)-utcDay(start)});
 }
 const segments:TrendPoint[][]=[];
 for(const point of points){
  const last=segments[segments.length-1],previous=last?.[last.length-1];
  if(!last||!previous||point.offset-previous.offset>1)segments.push([point]);
  else last.push(point);
 }
 return {start,end,period,points,segments,recordedDays:days.size};
}
export const formatTrendDate=(date:string):string=>{
 const [year,month,day]=date.split("-");
 return day+"/"+month+"/"+year;
};
