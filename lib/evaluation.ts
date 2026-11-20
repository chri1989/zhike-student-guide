import rules from '@/data/evaluation-rules.json';

export type EvaluationInputs = Record<string,string>;
export type EvaluationRule = {
  id:string; label:string; kind:string; factor?:number; cap?:string; note?:string;
  flag?:string; linkedIntellect?:number; options?:{label:string;score:number}[];
};
type EvaluationModule = {
  id:string; label:string; maximum:number; factor:number;
  groups:{id:string;label:string;note?:string;rules:EvaluationRule[]}[];
};
export const evaluationModules:EvaluationModule[] = rules.modules;
type Limit = { label:string; before:number; after:number };
const cents = (n:number) => Math.round((n + Number.EPSILON) * 100);
const round = (n:number) => cents(n) / 100;

function readNumber(value:string|undefined) {
  const text = value?.trim() ?? '';
  const n = Number(text);
  return /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text) && Number.isFinite(n) ? n : 0;
}

function valueOf(rule:EvaluationRule, inputs:EvaluationInputs) {
  const n = readNumber(inputs[rule.id]);
  if (rule.kind==='choice') return rule.options?.find(option=>option.score===n)?.score ?? 0;
  if (rule.kind==='hours') return Math.floor(n/2)*0.5 + (n%2>=1 ? 0.2 : 0);
  if (rule.kind==='toggle') return (n===1?1:0)*(rule.factor??0);
  return (rule.kind==='count'?Math.floor(n):n)*(rule.factor??0);
}

export function evaluateScores(inputs:EvaluationInputs, manual:boolean) {
  const discipline = evaluationModules[0].groups.flatMap(group=>group.rules).some(rule=>rule.flag==='discipline' && inputs[rule.id]==='1');
  const cadreDisqualified = evaluationModules[0].groups.flatMap(group=>group.rules).some(rule=>rule.flag==='cadre-disqualified' && inputs[rule.id]==='1');
  const linkedIntellect = evaluationModules[2].groups.flatMap(group=>group.rules).reduce((n,rule)=>
    n+(rule.linkedIntellect??0)*Math.floor(readNumber(inputs[rule.id])),0);
  const modules = evaluationModules.map(module => {
    let additions=0, deductions=module.id==='z2'?cents(linkedIntellect):0;
    const buckets=new Map<string,number>();
    for (const group of module.groups) for (const rule of group.rules) {
      if(rule.kind==='flag')continue;
      const value=cents(valueOf(rule,inputs));
      if(value<0)deductions-=value;
      else if(rule.cap)buckets.set(rule.cap,(buckets.get(rule.cap)??0)+value);
      else additions+=value;
    }
    const cappedSubItems:Limit[]=[];
    for(const [key,sum] of buckets){
      const cap=rules.caps[key as keyof typeof rules.caps];
      const clipped=Math.min(sum,cents(cap.maximum));
      additions+=clipped;
      if(clipped<sum)cappedSubItems.push({label:cap.label,before:sum/100,after:clipped/100});
    }
    if(module.id==='z1'&&discipline)additions=0;
    const net=(additions-deductions)/100;
    return {...module,net,score:Math.max(0,Math.min(module.maximum,net)),deductions:deductions/100,cappedSubItems};
  });
  const score=(key:string,fallback=100)=>inputs[key]?.trim()?Math.min(100,readNumber(inputs[key])):fallback;
  const s=manual?round(score('s1')*.1+score('s2')*.6+score('s3')*.3):100;
  const x=inputs.x?.trim()?score('x',0):null;
  const z=round(Math.min(100,modules.reduce((n,module)=>n+module.score*module.factor,0)));
  const total=x===null?null:round(s*.1+x*.6+z*.3);
  return {s,x,z,total,modules,discipline,cadreDisqualified};
}
