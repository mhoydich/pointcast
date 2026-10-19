export function coffeeCost({price, weight, dose, waste = 0, shipping = 0, tax = 0, equipment = 0, lifetime = 1, filter = 0, milk = 0, waterEnergy = 0}) {
  if (![price, weight, dose, waste, shipping, tax, equipment, lifetime, filter, milk, waterEnergy].every(Number.isFinite) || [price,shipping,tax,equipment,filter,milk,waterEnergy].some(n=>n<0) || weight <= 0 || dose <= 0 || lifetime <= 0 || waste < 0 || waste >= 100) return null;
  const servings = weight * (1 - waste / 100) / dose;
  const perServing = (price + shipping + tax) / servings;
  const equipmentPerServing = equipment / lifetime;
  return {servings, wholeServings: Math.floor(servings), perServing, per100g: price / weight * 100, equipmentPerServing, totalPerServing: perServing + equipmentPerServing + filter + milk + waterEnergy};
}

export function breadCost({flourPrice, flourWeight, flourGrams, extras, energy, minutes, hourly, loaves, waste = 0}) {
  if (![flourPrice, flourWeight, flourGrams, extras, energy, minutes, hourly, loaves, waste].every(Number.isFinite) || [flourPrice, flourGrams, extras, energy, minutes, hourly].some(n => n < 0) || flourWeight <= 0 || loaves <= 0 || !Number.isInteger(loaves) || waste < 0 || waste >= 100) return null;
  const ingredients = flourPrice / flourWeight * flourGrams + extras;
  const cash = ingredients + energy;
  const labor = minutes / 60 * hourly;
  const usable = loaves * (1 - waste / 100);
  return {ingredients, cash, labor, cashPerLoaf: cash / usable, fullPerLoaf: (cash + labor) / usable};
}

export function groupCost({units, unitPrice, shipping, coordination, retail}) {
  if (![units, unitPrice, shipping, coordination, retail].every(Number.isFinite) || units < 1 || !Number.isInteger(units) || [unitPrice, shipping, coordination, retail].some(n => n < 0)) return null;
  const total = units * unitPrice + shipping + coordination;
  return {total, perUnit: total / units, savingPerUnit: retail - total / units};
}

export function matchesPantry(row, {query = '', area = '', kind = ''} = {}) {
  const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return (!area || row.area === area) && (!kind || row.kind === kind) && norm(JSON.stringify(row)).includes(norm(query.trim()));
}
