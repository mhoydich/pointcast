export const AI_VALUE_VERSION = '2026-10-05.1.0.1';
const fields = ['tasks_started','attempts_per_task','input_tokens','cache_read_tokens','cache_write_tokens','output_tokens','api_extra_cost','subscription_base','subscription_extra_cost','tax_and_fees','accepted_tasks','hands_on_hours','hourly_value','blocked_hours','blocked_cost_fraction','setup_cost_monthly'];
export function finiteInput(value, label, { min = 0, max = Infinity, nullable = false } = {}) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    if (nullable) return null;
    throw new Error(`${label}: enter a value; blank is not zero.`);
  }
  if (!['number','string'].includes(typeof value)) throw new Error(`${label}: enter a finite number.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${label}: enter a finite number between ${min} and ${max === Infinity ? 'a reasonable maximum' : max}.`);
  return number;
}
export function calculateAIValue(input, rates) {
  const values = Object.fromEntries(fields.map(field => [field, finiteInput(input[field], field.replaceAll('_',' '), {min:field === 'attempts_per_task' ? 1 : 0,max:field === 'blocked_cost_fraction' ? 1 : 1e12})]));
  if (values.accepted_tasks > values.tasks_started) throw new Error('Accepted tasks cannot exceed tasks started.');
  const rate = Object.fromEntries(['input','cache_read','cache_write','output'].map(key => [key,finiteInput(rates[key],key+' rate',{max:1e9})]));
  const coverage = input.quota_coverage;
  if (!['unknown','assume_all_included','observed_all_included','partly_included_with_overage_entered'].includes(coverage)) throw new Error('Select an explicit quota coverage state.');
  if (coverage === 'partly_included_with_overage_entered' && input.overage_complete !== true) throw new Error('Confirm all overage and missing-workload charges are entered, or leave coverage unknown.');
  const attempts = values.tasks_started * values.attempts_per_task;
  const breakdown = Object.fromEntries(['input','cache_read','cache_write','output'].map(key => [key,attempts * values[key+'_tokens'] * rate[key] / 1e6]));
  const marginal = Object.values(breakdown).reduce((n,x)=>n+x,0);
  const perAttempt = ['input','cache_read','cache_write','output'].reduce((n,key)=>n+values[key+'_tokens']*rate[key]/1e6,0);
  const apiEquivalent = marginal + values.api_extra_cost;
  const subscriptionCash = values.subscription_base + values.subscription_extra_cost + values.tax_and_fees;
  const humanCost = input.include_human_time === true ? values.hourly_value * (values.hands_on_hours + values.blocked_hours * values.blocked_cost_fraction) : 0;
  const fullCost = subscriptionCash + humanCost + values.setup_cost_monthly;
  const known = coverage !== 'unknown';
  const matched = input.matched_scope === true;
  const budget = finiteInput(input.budget_usd,'Budget',{nullable:true,max:1e12});
  const fixedAPI = finiteInput(input.api_fixed_monthly_cost,'API fixed monthly cost',{nullable:true,max:1e12});
  const marginalAPI = finiteInput(input.marginal_api_cost_per_attempt,'Marginal API cost per attempt',{nullable:true,max:1e12});
  let apiCostPerAccepted = null;
  if (input.api_outcome_enabled === true) {
    const accepted = finiteInput(input.api_accepted_tasks,'API accepted tasks',{max:values.tasks_started});
    const apiTax = finiteInput(input.api_tax_and_fees,'API taxes and fees',{max:1e12});
    const apiHuman = finiteInput(input.api_human_cost,'API human cost',{max:1e12});
    const apiSetup = finiteInput(input.api_setup_cost_monthly,'API setup cost',{max:1e12});
    if (accepted > 0 && matched) apiCostPerAccepted = (apiEquivalent+apiTax+apiHuman+apiSetup)/accepted;
  }
  const result = {
    version:AI_VALUE_VERSION,attempts,breakdown,tokenCostPerAttempt:perAttempt,apiEquivalent,subscriptionCash,humanCost,fullCost,
    coverage,coverageKnown:known,coverageLabel:coverage === 'assume_all_included' ? 'Assumed coverage' : coverage === 'unknown' ? 'Coverage unknown' : 'Reader-entered observed coverage',
    equivalenceMultiple:known && matched && subscriptionCash > 0 ? apiEquivalent / subscriptionCash : null,
    modeledPriceDifference:known && matched ? apiEquivalent - subscriptionCash : null,
    costPerAccepted:known && values.accepted_tasks > 0 ? fullCost / values.accepted_tasks : null,
    apiCostPerAccepted,
    acceptedTasks:values.accepted_tasks,
    breakEvenAttempts:known && matched && input.fixed_scope === true && coverage !== 'partly_included_with_overage_entered' && fixedAPI !== null && marginalAPI !== null && marginalAPI > 0 ? Math.max(0,(subscriptionCash-fixedAPI)/marginalAPI) : null,
    budget,overBudget:budget !== null && fullCost > budget,
    chargesExcluded:values.api_extra_cost === 0 || values.tax_and_fees === 0,
  };
  if (Object.values(result.breakdown).some(x=>!Number.isFinite(x)) || !Number.isFinite(fullCost) || !Number.isFinite(apiEquivalent)) throw new Error('The inputs exceed the calculator’s numeric range.');
  return result;
}
export function calculateCeiling(input) {
  const ceiling = finiteInput(input.ceiling,'Reported ceiling',{max:1e12});
  const utilization = finiteInput(input.utilization,'Assumed utilization',{max:1});
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || '')) throw new Error('Enter the source date.');
  let url;try { url = new URL(input.source); } catch { throw new Error('Enter a real HTTPS source URL.'); }
  if (url.protocol !== 'https:') throw new Error('Use an HTTPS source URL.');
  if (input.unchanged_mix !== true) throw new Error('Confirm the workload mix is unchanged; this scales a mix rather than measuring useful work.');
  return {utilizedEquivalent:ceiling*utilization,source:url.href,date:input.date,label:'Hypothetical utilized API-equivalent ceiling; not credit, cash benefit or achievable capacity.'};
}
