/** A resposta de uma conta nunca autoriza ações iniciadas em outra. */
export function dataReadyForUser(loadedFor:string|null,userId:string|null):boolean{
 return Boolean(userId)&&loadedFor===userId;
}
/** Protege geração automática e reconciliação de compras durante o carregamento. */
export function sessionReadyForMealPlanning(
 userId:string|null,recipesFor:string|null,preferencesFor:string|null,
 weekLoading:boolean, saving:boolean
):boolean{
 return !weekLoading&&!saving&&dataReadyForUser(recipesFor,userId)&&dataReadyForUser(preferencesFor,userId);
}
