type PilotRecipeTimeInput={
 title:string;
 instructions:string|null;
 minutes:number;
 pilotSource?:{originalTime:string};
};
export declare function formatPilotRecipeTime(recipe:PilotRecipeTimeInput,compact?:boolean):string;
