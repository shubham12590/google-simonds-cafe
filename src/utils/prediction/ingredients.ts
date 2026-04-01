
import { RecipeItem, IngredientRequirement, ProcessedPrediction } from './types';

export function mapProductToRecipe(productName: string): RecipeItem[] {
  // Placeholder recipe map. In a real app, this would come from a database or config file.
  const recipeMap: Record<string, RecipeItem[]> = {
    'Idli': [{ ingredient: 'Idli Batter', qtyPerUnit: 0.1, unit: 'L' }, { ingredient: 'Coconut Chutney', qtyPerUnit: 0.05, unit: 'L' }, { ingredient: 'Sambar', qtyPerUnit: 0.1, unit: 'L' }],
    'Dosa': [{ ingredient: 'Dosa Batter', qtyPerUnit: 0.15, unit: 'L' }, { ingredient: 'Coconut Chutney', qtyPerUnit: 0.05, unit: 'L' }, { ingredient: 'Sambar', qtyPerUnit: 0.1, unit: 'L' }],
    'Vada': [{ ingredient: 'Vada Batter', qtyPerUnit: 0.08, unit: 'L' }, { ingredient: 'Coconut Chutney', qtyPerUnit: 0.05, unit: 'L' }, { ingredient: 'Sambar', qtyPerUnit: 0.1, unit: 'L' }],
    'Filter Coffee': [{ ingredient: 'Coffee Powder', qtyPerUnit: 0.02, unit: 'kg' }, { ingredient: 'Milk', qtyPerUnit: 0.1, unit: 'L' }, { ingredient: 'Sugar', qtyPerUnit: 0.01, unit: 'kg' }],
    'Pongal': [{ ingredient: 'Rice', qtyPerUnit: 0.1, unit: 'kg' }, { ingredient: 'Moong Dal', qtyPerUnit: 0.05, unit: 'kg' }, { ingredient: 'Ghee', qtyPerUnit: 0.02, unit: 'L' }],
    'Uttapam': [{ ingredient: 'Dosa Batter', qtyPerUnit: 0.15, unit: 'L' }, { ingredient: 'Onion', qtyPerUnit: 0.05, unit: 'kg' }, { ingredient: 'Tomato', qtyPerUnit: 0.05, unit: 'kg' }],
  };

  return recipeMap[productName] || [];
}

export function calculateIngredientsNeeded(
  predictions: ProcessedPrediction[],
  recipeMap: Record<string, RecipeItem[]> = {}, // Optional override
  currentStock: Record<string, number> = {},
  supplierInfo: Record<string, any> = {}
): IngredientRequirement[] {
  const ingredientNeeds: Record<string, { need: number; unit: string }> = {};

  for (const pred of predictions) {
    const recipe = recipeMap[pred.productName] || mapProductToRecipe(pred.productName);
    
    for (const item of recipe) {
      if (!ingredientNeeds[item.ingredient]) {
        ingredientNeeds[item.ingredient] = { need: 0, unit: item.unit };
      }
      ingredientNeeds[item.ingredient].need += item.qtyPerUnit * pred.suggestedPrep;
    }
  }

  return Object.entries(ingredientNeeds).map(([ingredient, { need, unit }]) => {
    const inStock = currentStock[ingredient] || 0;
    const toOrder = Math.max(0, need - inStock);
    
    // Round to supplier pack size if available
    // For now, just round to 2 decimals
    const roundedToOrder = Math.ceil(toOrder * 100) / 100;

    return {
      ingredient,
      need: Math.ceil(need * 100) / 100,
      unit,
      inStock,
      toOrder: roundedToOrder,
      supplier: supplierInfo[ingredient]?.name
    };
  });
}
