/** Move a stable widget ID to the target's position, preserving every other ID. */
export function moveWidget(order:string[],source:string,target:string):string[]{
 const from=order.indexOf(source),to=order.indexOf(target);if(from<0||to<0||from===to)return [...order];
 const next=[...order];next.splice(from,1);next.splice(to,0,source);return next;
}
export interface WidgetRect{id:string;left:number;right:number;top:number;bottom:number}
/** Nearest rectangle also accepts the gap between cards as a drop location. */
export function widgetDropTarget(rects:WidgetRect[],x:number,y:number):string|null{
 let found:string|null=null,distance=Infinity;for(const r of rects){const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=dx*dx+dy*dy;if(d<distance){found=r.id;distance=d;}}return found;
}
/** Expose the new chart without rewriting old layouts or bringing back hidden widgets. */
export function effectiveWidgets(p:{widgets:string[];widgetCatalogVersion?:number}):string[]{let widgets=p.widgets.filter(id=>id!=='debt');if(p.widgets.includes('debt')&&!widgets.includes('installments'))widgets.splice(Math.min(p.widgets.indexOf('debt'),widgets.length),0,'installments');if((p.widgetCatalogVersion??1)<2&&widgets.length&&!widgets.includes('annualExpenses')){const calendar=widgets.indexOf('calendar');widgets.splice(calendar<0?widgets.length:calendar,0,'annualExpenses');}if((p.widgetCatalogVersion??1)<3&&widgets.length&&!widgets.includes('accounts')){const cards=widgets.indexOf('cards');widgets.splice(cards<0?0:cards+1,0,'accounts');}return widgets;}
