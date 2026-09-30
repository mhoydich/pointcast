export function splitBill(amount,tax,tip,people){
 if(![amount,tax,tip,people].every(Number.isFinite)||amount<0||amount>10000||tax<0||tax>100||tip<0||tip>100||!Number.isInteger(people)||people<2||people>8)throw new Error('Use a bill from $0 to $10,000, tax/tip from 0 to 100%, and 2–8 people.');
 if(Math.abs(amount*100-Math.round(amount*100))>1e-7)throw new Error('Enter the bill with at most two decimal places.');
 const base=Math.round(amount*100),taxCents=Math.round(base*tax/100),tipCents=Math.round(base*tip/100),total=base+taxCents+tipCents;
 const each=Math.floor(total/people),remainder=total%people;
 return {base,taxCents,tipCents,total,shares:Array.from({length:people},(_,i)=>each+(i<remainder?1:0))};
}
