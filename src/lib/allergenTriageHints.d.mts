export type AllergenTextHint={code:string;label:string;terms:string[]};
export type AllergenTriageHints={
 sourceAvailable:boolean;
 hints:AllergenTextHint[];
 composedTerms:string[];
};
/** Apenas pistas para investigação, sem aprovação de segurança. */
export declare function collectAllergenTriageHints(originalIngredients:string|null|undefined):AllergenTriageHints;
