export type MoodScore=1|2|3|4|5|null;
export type OptionalHabit=boolean|null;
export type EvolutionDraft={
 energy_level:MoodScore;
 wellbeing_level:MoodScore;
 sleep_quality:MoodScore;
 planned_meals:OptionalHabit;
 took_pause:OptionalHabit;
 moved_comfortably:OptionalHabit;
 personal_note:string;
};
export type EvolutionEntry=EvolutionDraft & {
 id:string;
 user_id:string;
 recorded_on:string;
 created_at:string;
 updated_at:string;
};
export const emptyEvolutionDraft=():EvolutionDraft=>({
 energy_level:null,wellbeing_level:null,sleep_quality:null,
 planned_meals:null,took_pause:null,moved_comfortably:null,personal_note:""
});
export function validLocalDate(date:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const [y,m,d]=date.split("-").map(Number);
 const test=new Date(y,m-1,d);
 return test.getFullYear()===y&&test.getMonth()===m-1&&test.getDate()===d;
}
export function localDateKey(date:Date):string{
 const pad=(n:number)=>String(n).padStart(2,"0");
 return [date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join("-");
}
export function validateEvolutionDraft(d:EvolutionDraft,day:string,today:string):string|null{
 if(!validLocalDate(day)||day>today)return "Escolha uma data válida, sem dias futuros.";
 for(const score of [d.energy_level,d.wellbeing_level,d.sleep_quality]){
  if(score!==null&&(!Number.isInteger(score)||score<1||score>5))return "A avaliação deve estar entre 1 e 5.";
 }
 for(const habit of [d.planned_meals,d.took_pause,d.moved_comfortably]){
  if(habit!==null&&typeof habit!=="boolean")return "Confira os hábitos selecionados.";
 }
 if(d.personal_note.length>280)return "O comentário deve ter até 280 caracteres.";
 if([d.energy_level,d.wellbeing_level,d.sleep_quality,d.planned_meals,d.took_pause,d.moved_comfortably]
  .every(x=>x===null)&&!d.personal_note.trim())
   return "Escolha pelo menos uma percepção, um hábito ou um comentário.";
 return null;
}
export function entryToDraft(entry:Partial<EvolutionEntry>|undefined):EvolutionDraft{
 const empty=emptyEvolutionDraft();
 if(!entry)return empty;
 const score=(v:unknown):MoodScore=>Number.isInteger(v)&&Number(v)>=1&&Number(v)<=5?v as MoodScore:null;
 const habit=(v:unknown):OptionalHabit=>typeof v==="boolean"?v:null;
 return {
  energy_level:score(entry.energy_level),wellbeing_level:score(entry.wellbeing_level),
  sleep_quality:score(entry.sleep_quality),planned_meals:habit(entry.planned_meals),
  took_pause:habit(entry.took_pause),moved_comfortably:habit(entry.moved_comfortably),
  personal_note:typeof entry.personal_note==="string"?entry.personal_note:""
 };
}
export function evaluationLabel(n:MoodScore):string{
 if(n===null)return "Não informado";
 return String(n)+" de 5";
}
export const evolutionScoreOptions=[
 {value:1,label:"1 — Muito baixo"},
 {value:2,label:"2 — Baixo"},
 {value:3,label:"3 — Regular"},
 {value:4,label:"4 — Bom"},
 {value:5,label:"5 — Muito bom"}
] as const;
export const evolutionHabitLabels={
 planned_meals:"Organizei minhas refeições",
 took_pause:"Reservei uma pausa para mim",
 moved_comfortably:"Movimentei-me de um jeito confortável"
} as const;
