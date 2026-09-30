export const commerceTypes=[
 {id:'general',name:'Autre commerce',symbol:'✳',passage:'un passage',examples:['10 % sur votre prochain achat','Un cadeau de fidélité','Un avantage exclusif'],welcome:'Chaque passage vous rapproche de votre prochain avantage.'},
 {id:'coiffure',name:'Coiffure & barbier',symbol:'✂',passage:'une prestation',examples:['Un soin offert','10 % sur une prestation','Un brushing offert'],welcome:'Votre prochaine attention se prépare à chaque rendez-vous.'},
 {id:'restaurant',name:'Restaurant & restauration rapide',symbol:'✳',passage:'un passage',examples:['Un dessert offert','Une boisson offerte','10 % sur votre prochain repas'],welcome:'Vos passages ont bon goût : cumulez des points et profitez de vos avantages.'},
 {id:'cafe',name:'Café & salon de thé',symbol:'✳',passage:'un passage',examples:['Une boisson chaude offerte','Une pâtisserie offerte','Un petit-déjeuner offert'],welcome:'Un café, un moment, et des points qui vous rapprochent de votre récompense.'},
 {id:'parfumerie',name:'Parfumerie & cosmétiques',symbol:'✧',passage:'un achat',examples:['10 % sur votre prochain parfum','Un format découverte offert','Un soin découverte offert'],welcome:'Vos achats vous ouvrent de nouvelles attentions.'},
 {id:'beaute',name:'Institut de beauté & bien-être',symbol:'✧',passage:'une prestation',examples:['Un soin découverte offert','10 % sur votre prochaine séance','Un produit découverte offert'],welcome:'Prenez soin de vous et profitez des avantages de votre fidélité.'},
 {id:'boulangerie',name:'Boulangerie & pâtisserie',symbol:'✳',passage:'un achat',examples:['Une viennoiserie offerte','Une pâtisserie offerte','10 % sur votre prochain achat'],welcome:'Les petits plaisirs du quotidien méritent aussi une récompense.'},
 {id:'boutique',name:'Mode, boutique & commerce de détail',symbol:'✧',passage:'un achat',examples:['10 % sur votre prochain achat','Un accessoire offert','Un cadeau exclusif'],welcome:'Vos achats comptent, vos avantages aussi.'},
] as const;
export function commerceFor(category:string|null|undefined){
 const value=(category||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const exact=commerceTypes.find(t=>t.id===value||t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')===value);if(exact)return exact;
 const aliases:Record<string,RegExp>={coiffure:/coiff|barbier/,restaurant:/restaur|snack|pizzeria|fast.food/,cafe:/cafe|salon de the/,parfumerie:/parfum|cosmet/,beaute:/beaute|institut|bien.etre|spa/,boulangerie:/boulanger|patis/,boutique:/mode|boutique|vetement|retail/};
 return commerceTypes.find(t=>aliases[t.id]?.test(value))||commerceTypes[0];
}
export function cardStatus(status:string){return ({unassigned:'À distribuer',active:'Active',lost:'Perdue · désactivée',replaced:'Remplacée'} as Record<string,string>)[status]||'Indisponible';}
export function displayDate(value:string){return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
