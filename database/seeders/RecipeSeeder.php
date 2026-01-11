<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\BasePreparation;
use App\Models\BasePreparationIngredient;
use App\Models\RecipeBasePreparation;
use App\Models\Product;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        // Create ingredients based on the spreadsheet
        $ingredients = [
            // Basic ingredients
            ['name' => 'Flour', 'category' => 'flour', 'unit' => 'kg', 'cost_per_unit' => 176.00, 'stock_quantity' => 50, 'minimum_stock' => 10],
            ['name' => 'Sugar', 'category' => 'sweetener', 'unit' => 'kg', 'cost_per_unit' => 208.00, 'stock_quantity' => 30, 'minimum_stock' => 5],
            ['name' => 'Salt', 'category' => 'seasoning', 'unit' => 'kg', 'cost_per_unit' => 130.00, 'stock_quantity' => 5, 'minimum_stock' => 1],
            ['name' => 'Eggs', 'category' => 'dairy', 'unit' => 'piece', 'cost_per_unit' => 31.00, 'stock_quantity' => 100, 'minimum_stock' => 30],
            
            // Yeast and leavening
            ['name' => 'Yeast', 'category' => 'yeast', 'unit' => 'kg', 'cost_per_unit' => 1900.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Bun Yeast', 'category' => 'yeast', 'unit' => 'kg', 'cost_per_unit' => 1900.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Baking Powder', 'category' => 'yeast', 'unit' => 'kg', 'cost_per_unit' => 850.00, 'stock_quantity' => 1, 'minimum_stock' => 0.2],
            ['name' => 'Baking Power (N)', 'category' => 'yeast', 'unit' => 'kg', 'cost_per_unit' => 850.00, 'stock_quantity' => 1, 'minimum_stock' => 0.2],
            
            // Fats and oils
            ['name' => 'Margarine', 'category' => 'fats', 'unit' => 'kg', 'cost_per_unit' => 550.00, 'stock_quantity' => 10, 'minimum_stock' => 2],
            ['name' => 'Cake Margarine', 'category' => 'fats', 'unit' => 'kg', 'cost_per_unit' => 560.00, 'stock_quantity' => 5, 'minimum_stock' => 1],
            ['name' => 'Vegetable Oil', 'category' => 'fats', 'unit' => 'kg', 'cost_per_unit' => 800.00, 'stock_quantity' => 10, 'minimum_stock' => 2],
            ['name' => 'Coconut Oil', 'category' => 'fats', 'unit' => 'L', 'cost_per_unit' => 900.00, 'stock_quantity' => 5, 'minimum_stock' => 1],
            ['name' => 'Marvo', 'category' => 'fats', 'unit' => 'kg', 'cost_per_unit' => 1200.00, 'stock_quantity' => 3, 'minimum_stock' => 0.5],
            
            // Compound and specialty
            ['name' => 'Bun Compound', 'category' => 'compound', 'unit' => 'kg', 'cost_per_unit' => 560.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Bread Improver (Hyco)', 'category' => 'compound', 'unit' => 'kg', 'cost_per_unit' => 501.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Cream', 'category' => 'dairy', 'unit' => 'kg', 'cost_per_unit' => 2302.50, 'stock_quantity' => 1, 'minimum_stock' => 0.2],
            ['name' => 'Icing Sugar', 'category' => 'sweetener', 'unit' => 'kg', 'cost_per_unit' => 450.00, 'stock_quantity' => 3, 'minimum_stock' => 0.5],
            
            // Flavoring
            ['name' => 'Vanilla Flavour', 'category' => 'flavoring', 'unit' => 'L', 'cost_per_unit' => 2840.00, 'stock_quantity' => 0.5, 'minimum_stock' => 0.1],
            ['name' => 'Food Coloring', 'category' => 'flavoring', 'unit' => 'L', 'cost_per_unit' => 5714.00, 'stock_quantity' => 0.2, 'minimum_stock' => 0.05],
            
            // Toppings and fillings
            ['name' => 'Jam', 'category' => 'filling', 'unit' => 'kg', 'cost_per_unit' => 420.00, 'stock_quantity' => 3, 'minimum_stock' => 0.5],
            ['name' => 'Icing', 'category' => 'topping', 'unit' => 'kg', 'cost_per_unit' => 450.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Wafer Pieces', 'category' => 'topping', 'unit' => 'piece', 'cost_per_unit' => 4.52, 'stock_quantity' => 100, 'minimum_stock' => 20],
            
            // Spices
            ['name' => 'Cumins', 'category' => 'spice', 'unit' => 'kg', 'cost_per_unit' => 545.00, 'stock_quantity' => 0.5, 'minimum_stock' => 0.1],
            ['name' => 'Pepper', 'category' => 'spice', 'unit' => 'kg', 'cost_per_unit' => 2650.00, 'stock_quantity' => 0.3, 'minimum_stock' => 0.05],
            ['name' => 'Chilli Flakes', 'category' => 'spice', 'unit' => 'kg', 'cost_per_unit' => 700.00, 'stock_quantity' => 0.3, 'minimum_stock' => 0.05],
            ['name' => 'Ajinomoto', 'category' => 'seasoning', 'unit' => 'kg', 'cost_per_unit' => 680.00, 'stock_quantity' => 0.2, 'minimum_stock' => 0.05],
            
            // Vegetables
            ['name' => 'Onion', 'category' => 'vegetable', 'unit' => 'kg', 'cost_per_unit' => 100.00, 'stock_quantity' => 5, 'minimum_stock' => 1],
            ['name' => 'Lettuce', 'category' => 'vegetable', 'unit' => 'kg', 'cost_per_unit' => 1000.00, 'stock_quantity' => 1, 'minimum_stock' => 0.2],
            
            // Protein
            ['name' => 'Fish', 'category' => 'protein', 'unit' => 'kg', 'cost_per_unit' => 1800.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            ['name' => 'Sausage', 'category' => 'protein', 'unit' => 'piece', 'cost_per_unit' => 45.00, 'stock_quantity' => 50, 'minimum_stock' => 10],
            ['name' => 'Chicken', 'category' => 'protein', 'unit' => 'kg', 'cost_per_unit' => 1200.00, 'stock_quantity' => 2, 'minimum_stock' => 0.5],
            
            // Specialty
            ['name' => 'Cup Cake Mixture', 'category' => 'premix', 'unit' => 'kg', 'cost_per_unit' => 760.00, 'stock_quantity' => 3, 'minimum_stock' => 0.5],
            ['name' => 'Cheese', 'category' => 'dairy', 'unit' => 'kg', 'cost_per_unit' => 2500.00, 'stock_quantity' => 1, 'minimum_stock' => 0.2],
            ['name' => 'Pizza Sauce', 'category' => 'sauce', 'unit' => 'kg', 'cost_per_unit' => 600.00, 'stock_quantity' => 2, 'minimum_stock' => 0.3],
            ['name' => 'Tomato Sauce', 'category' => 'sauce', 'unit' => 'L', 'cost_per_unit' => 625.00, 'stock_quantity' => 2, 'minimum_stock' => 0.3],
        ];

        $ingredientModels = [];
        foreach ($ingredients as $data) {
            $ingredientModels[$data['name']] = Ingredient::create($data);
        }

        // =====================================================
        // BASE PREPARATIONS
        // =====================================================

        // 1. Bun Dough Base (for T-Bun and Cream Bun)
        $bunDough = BasePreparation::create([
            'name' => 'Bun Dough Base',
            'description' => 'Basic dough for T-Bun and Cream Bun',
            'total_weight_kg' => 6.9,
            'is_active' => true,
        ]);

        $bunDoughIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 3],
            ['ingredient' => 'Bun Yeast', 'quantity' => 0.8],
            ['ingredient' => 'Sugar', 'quantity' => 1],
            ['ingredient' => 'Salt', 'quantity' => 0.05],
            ['ingredient' => 'Bun Compound', 'quantity' => 0.3],
            ['ingredient' => 'Eggs', 'quantity' => 2],
        ];

        foreach ($bunDoughIngredients as $item) {
            BasePreparationIngredient::create([
                'base_preparation_id' => $bunDough->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }
        $bunDough->calculateCost();

        // 2. Cream for Cream Bun
        $creamPrep = BasePreparation::create([
            'name' => 'Cream Bun Cream',
            'description' => 'Cream filling for cream buns',
            'total_weight_kg' => 3.45,
            'is_active' => true,
        ]);

        BasePreparationIngredient::create([
            'base_preparation_id' => $creamPrep->id,
            'ingredient_id' => $ingredientModels['Marvo']->id,
            'quantity' => 1,
        ]);
        BasePreparationIngredient::create([
            'base_preparation_id' => $creamPrep->id,
            'ingredient_id' => $ingredientModels['Icing Sugar']->id,
            'quantity' => 2.45,
        ]);
        $creamPrep->calculateCost();

        // 3. General Bun Dough (for Wiyan Roll, Jam Bun, Fish Bun, Pizza, Sausages Bun, Burger Bun)
        $generalBunDough = BasePreparation::create([
            'name' => 'General Bun Dough',
            'description' => 'Base dough for various buns (Wiyan Roll, Jam Bun, Fish Bun, etc.)',
            'total_weight_kg' => 11.9,
            'is_active' => true,
        ]);

        $generalBunIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 10],
            ['ingredient' => 'Yeast', 'quantity' => 0.1],
            ['ingredient' => 'Sugar', 'quantity' => 1],
            ['ingredient' => 'Salt', 'quantity' => 0.1],
            ['ingredient' => 'Bun Compound', 'quantity' => 0.5],
            ['ingredient' => 'Coconut Oil', 'quantity' => 0.2],
        ];

        foreach ($generalBunIngredients as $item) {
            BasePreparationIngredient::create([
                'base_preparation_id' => $generalBunDough->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }
        $generalBunDough->calculateCost();

        // =====================================================
        // GET OR CREATE PRODUCTS
        // =====================================================
        $products = [
            'Bread' => Product::where('name', 'Bread')->first(),
            'Sandwich Bread' => Product::where('name', 'Sandwich Bread')->first(),
            'T-Bun' => Product::where('name', 'T-Bun')->first(),
            'Cream Bun' => Product::where('name', 'Cream Bun')->first(),
            'Fish Bun' => Product::where('name', 'Fish Bun')->first(),
            'Wiyan Roll' => Product::where('name', 'Wiyan Roll')->first(),
            'Jam Bun' => Product::where('name', 'Jam Bun')->first(),
            'Wandu' => Product::where('name', 'Wandu')->first(),
            'Cup Cake' => Product::where('name', 'Cup Cake')->first(),
            'Wafers Cake' => Product::where('name', 'Wafers Cake')->first(),
            'Pizza' => Product::where('name', 'Pizza')->first(),
            'Roast Bread' => Product::where('name', 'Roast Bread')->first(),
            'Sausages Bun' => Product::where('name', 'Sausages Bun')->first(),
            'Burger Bun' => Product::where('name', 'Burger Bun')->first(),
        ];

        // =====================================================
        // RECIPES
        // =====================================================

        // 1. Bread Recipe (makes 70 loaves)
        $breadRecipe = Recipe::create([
            'product_id' => $products['Bread']->id,
            'name' => 'Bread Recipe',
            'description' => 'Standard bread loaf recipe',
            'output_quantity' => 70,
            'instructions' => '1. Mix flour, yeast, sugar, salt, bread improver, and coconut oil\n2. Knead until smooth\n3. Proof for 1 hour\n4. Shape into loaves\n5. Proof again\n6. Bake at 200°C for 25-30 minutes',
            'preparation_time_minutes' => 180,
        ]);

        $breadIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 24],
            ['ingredient' => 'Yeast', 'quantity' => 0.2],
            ['ingredient' => 'Sugar', 'quantity' => 0.6],
            ['ingredient' => 'Salt', 'quantity' => 0.2],
            ['ingredient' => 'Bread Improver (Hyco)', 'quantity' => 0.7],
            ['ingredient' => 'Coconut Oil', 'quantity' => 0.2],
        ];

        foreach ($breadIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $breadRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }

        // 2. Roast Bread Recipe (makes 178 pieces)
        $roastBreadRecipe = Recipe::create([
            'product_id' => $products['Roast Bread']->id,
            'name' => 'Roast Bread Recipe',
            'description' => 'Roast bread slices recipe',
            'output_quantity' => 178,
            'instructions' => '1. Mix flour, yeast, sugar, salt, bread improver, and coconut oil\n2. Knead and proof\n3. Shape into loaves, bake, then slice and roast',
            'preparation_time_minutes' => 150,
        ]);

        $roastBreadIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 8],
            ['ingredient' => 'Yeast', 'quantity' => 0.04],
            ['ingredient' => 'Sugar', 'quantity' => 0.7],
            ['ingredient' => 'Salt', 'quantity' => 0.15],
            ['ingredient' => 'Bread Improver (Hyco)', 'quantity' => 0.4],
            ['ingredient' => 'Coconut Oil', 'quantity' => 0.4],
        ];

        foreach ($roastBreadIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $roastBreadRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }

        // 3. T-Bun Recipe (uses bun dough base, makes 50)
        $tBunRecipe = Recipe::create([
            'product_id' => $products['T-Bun']->id,
            'name' => 'T-Bun Recipe',
            'description' => 'Plain bun using shared bun dough base',
            'output_quantity' => 50,
            'instructions' => '1. Prepare bun dough base\n2. Portion into 0.09kg pieces\n3. Shape into buns\n4. Proof until doubled\n5. Bake at 180°C for 15-20 minutes',
            'preparation_time_minutes' => 120,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $tBunRecipe->id,
            'base_preparation_id' => $bunDough->id,
            'weight_used_kg' => 4.5,
        ]);
        $tBunRecipe->calculateCost();

        // 4. Cream Bun Recipe (uses bun dough and cream, makes 48)
        $creamBunRecipe = Recipe::create([
            'product_id' => $products['Cream Bun']->id,
            'name' => 'Cream Bun Recipe',
            'description' => 'Bun filled with cream',
            'output_quantity' => 48,
            'instructions' => '1. Prepare bun dough base\n2. Portion into 0.05kg pieces\n3. Shape, proof and bake\n4. Fill with cream mixture',
            'preparation_time_minutes' => 150,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $creamBunRecipe->id,
            'base_preparation_id' => $bunDough->id,
            'weight_used_kg' => 2.4,
        ]);
        RecipeBasePreparation::create([
            'recipe_id' => $creamBunRecipe->id,
            'base_preparation_id' => $creamPrep->id,
            'weight_used_kg' => 0.48,
        ]);

        // Add direct cream ingredient
        RecipeIngredient::create([
            'recipe_id' => $creamBunRecipe->id,
            'ingredient_id' => $ingredientModels['Cream']->id,
            'quantity' => 0.01,
        ]);
        $creamBunRecipe->calculateCost();

        // 5. Wiyan Roll Recipe (uses general bun dough, makes 70 pieces)
        $wiyanRecipe = Recipe::create([
            'product_id' => $products['Wiyan Roll']->id,
            'name' => 'Wiyan Roll Recipe',
            'description' => 'Sweet roll with sugar coating',
            'output_quantity' => 70,
            'instructions' => '1. Use general bun dough\n2. Shape into rolls\n3. Coat with sugar after baking',
            'preparation_time_minutes' => 90,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $wiyanRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 1.0, // Approximate portion
        ]);

        // Add sugar for wrapping
        RecipeIngredient::create([
            'recipe_id' => $wiyanRecipe->id,
            'ingredient_id' => $ingredientModels['Sugar']->id,
            'quantity' => 0.5,
        ]);
        $wiyanRecipe->calculateCost();

        // 6. Jam Bun Recipe (uses general bun dough, makes 70 pieces)
        $jamBunRecipe = Recipe::create([
            'product_id' => $products['Jam Bun']->id,
            'name' => 'Jam Bun Recipe',
            'description' => 'Bun filled with jam and coated with sugar',
            'output_quantity' => 70,
            'instructions' => '1. Use general bun dough\n2. Fill with jam\n3. Shape and bake\n4. Coat with sugar',
            'preparation_time_minutes' => 100,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $jamBunRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 1.0,
        ]);

        RecipeIngredient::create([
            'recipe_id' => $jamBunRecipe->id,
            'ingredient_id' => $ingredientModels['Sugar']->id,
            'quantity' => 0.8,
        ]);
        RecipeIngredient::create([
            'recipe_id' => $jamBunRecipe->id,
            'ingredient_id' => $ingredientModels['Jam']->id,
            'quantity' => 0.3,
        ]);
        $jamBunRecipe->calculateCost();

        // 7. Fish Bun Recipe (uses general bun dough, makes 70 pieces)
        $fishBunRecipe = Recipe::create([
            'product_id' => $products['Fish Bun']->id,
            'name' => 'Fish Bun Recipe',
            'description' => 'Bun with spiced fish filling',
            'output_quantity' => 70,
            'instructions' => '1. Prepare fish filling with onion and spices\n2. Use general bun dough\n3. Fill and shape\n4. Bake until golden',
            'preparation_time_minutes' => 120,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $fishBunRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 1.5,
        ]);

        $fishBunIngredients = [
            ['ingredient' => 'Onion', 'quantity' => 2],
            ['ingredient' => 'Salt', 'quantity' => 0.01],
            ['ingredient' => 'Chilli Flakes', 'quantity' => 0.05],
            ['ingredient' => 'Pepper', 'quantity' => 0.02],
            ['ingredient' => 'Ajinomoto', 'quantity' => 0.02],
            ['ingredient' => 'Coconut Oil', 'quantity' => 0.25],
        ];

        foreach ($fishBunIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $fishBunRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }
        $fishBunRecipe->calculateCost();

        // 8. Pizza Recipe (uses general bun dough, makes 10 pieces)
        $pizzaRecipe = Recipe::create([
            'product_id' => $products['Pizza']->id,
            'name' => 'Pizza Recipe',
            'description' => 'Pizza with egg and sausage topping',
            'output_quantity' => 10,
            'instructions' => '1. Use general bun dough for base\n2. Shape into pizza bases\n3. Add toppings (eggs, sausages)\n4. Bake until golden',
            'preparation_time_minutes' => 60,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $pizzaRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 0.5,
        ]);

        RecipeIngredient::create([
            'recipe_id' => $pizzaRecipe->id,
            'ingredient_id' => $ingredientModels['Eggs']->id,
            'quantity' => 5,
        ]);
        RecipeIngredient::create([
            'recipe_id' => $pizzaRecipe->id,
            'ingredient_id' => $ingredientModels['Sausage']->id,
            'quantity' => 2,
        ]);
        $pizzaRecipe->calculateCost();

        // 9. Sausages Bun Recipe (uses general bun dough, makes 8 pieces)
        $sausageBunRecipe = Recipe::create([
            'product_id' => $products['Sausages Bun']->id,
            'name' => 'Sausages Bun Recipe',
            'description' => 'Bun with sausage inside',
            'output_quantity' => 8,
            'instructions' => '1. Use general bun dough\n2. Wrap around sausage\n3. Add tomato sauce\n4. Bake',
            'preparation_time_minutes' => 60,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $sausageBunRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 0.4,
        ]);

        RecipeIngredient::create([
            'recipe_id' => $sausageBunRecipe->id,
            'ingredient_id' => $ingredientModels['Tomato Sauce']->id,
            'quantity' => 0.02,
        ]);
        RecipeIngredient::create([
            'recipe_id' => $sausageBunRecipe->id,
            'ingredient_id' => $ingredientModels['Sausage']->id,
            'quantity' => 8,
        ]);
        $sausageBunRecipe->calculateCost();

        // 10. Burger Bun Recipe (uses general bun dough, makes 10 pieces)
        $burgerBunRecipe = Recipe::create([
            'product_id' => $products['Burger Bun']->id,
            'name' => 'Burger Bun Recipe',
            'description' => 'Burger bun with egg wash and lettuce',
            'output_quantity' => 10,
            'instructions' => '1. Use general bun dough\n2. Shape into burger buns\n3. Apply egg wash\n4. Bake until golden\n5. Add lettuce',
            'preparation_time_minutes' => 80,
        ]);

        RecipeBasePreparation::create([
            'recipe_id' => $burgerBunRecipe->id,
            'base_preparation_id' => $generalBunDough->id,
            'weight_used_kg' => 0.5,
        ]);

        RecipeIngredient::create([
            'recipe_id' => $burgerBunRecipe->id,
            'ingredient_id' => $ingredientModels['Eggs']->id,
            'quantity' => 2,
        ]);
        RecipeIngredient::create([
            'recipe_id' => $burgerBunRecipe->id,
            'ingredient_id' => $ingredientModels['Lettuce']->id,
            'quantity' => 0.05,
        ]);
        RecipeIngredient::create([
            'recipe_id' => $burgerBunRecipe->id,
            'ingredient_id' => $ingredientModels['Vegetable Oil']->id,
            'quantity' => 0.03,
        ]);
        $burgerBunRecipe->calculateCost();

        // 11. Wandu Recipe (makes 25)
        $wanduRecipe = Recipe::create([
            'product_id' => $products['Wandu']->id,
            'name' => 'Wandu Recipe',
            'description' => 'Traditional Sri Lankan sweet',
            'output_quantity' => 25,
            'instructions' => '1. Mix flour, baking powder, sugar, cumins, and salt\n2. Shape into wandu\n3. Deep fry until golden',
            'preparation_time_minutes' => 60,
        ]);

        $wanduIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 2],
            ['ingredient' => 'Baking Power (N)', 'quantity' => 0.05],
            ['ingredient' => 'Sugar', 'quantity' => 0.8],
            ['ingredient' => 'Cumins', 'quantity' => 0.05],
            ['ingredient' => 'Salt', 'quantity' => 0.05],
        ];

        foreach ($wanduIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $wanduRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }

        // 12. Cup Cake Recipe with Mixture (makes 35)
        $cupCakeRecipe = Recipe::create([
            'product_id' => $products['Cup Cake']->id,
            'name' => 'Cup Cake Recipe (with Mixture)',
            'description' => 'Cup cakes using premade mixture',
            'output_quantity' => 35,
            'instructions' => '1. Mix cup cake mixture with eggs and oil\n2. Pour into cupcake molds\n3. Bake at 170°C for 20 minutes',
            'preparation_time_minutes' => 45,
        ]);

        $cupCakeIngredients = [
            ['ingredient' => 'Cup Cake Mixture', 'quantity' => 1],
            ['ingredient' => 'Eggs', 'quantity' => 6],
            ['ingredient' => 'Vegetable Oil', 'quantity' => 0.3],
        ];

        foreach ($cupCakeIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $cupCakeRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }

        // 13. Wafers Cake Recipe (makes 65)
        $wafersCakeRecipe = Recipe::create([
            'product_id' => $products['Wafers Cake']->id,
            'name' => 'Wafers Cake Recipe',
            'description' => 'Cake with wafer toppings',
            'output_quantity' => 65,
            'instructions' => '1. Mix flour, margarine, sugar, and eggs\n2. Add vanilla and food coloring\n3. Bake for 25 minutes\n4. Top with icing and wafer pieces',
            'preparation_time_minutes' => 90,
        ]);

        $wafersCakeIngredients = [
            ['ingredient' => 'Flour', 'quantity' => 1],
            ['ingredient' => 'Cake Margarine', 'quantity' => 1],
            ['ingredient' => 'Sugar', 'quantity' => 1],
            ['ingredient' => 'Eggs', 'quantity' => 15],
            ['ingredient' => 'Vanilla Flavour', 'quantity' => 0.01],
            ['ingredient' => 'Food Coloring', 'quantity' => 0.01],
            ['ingredient' => 'Wafer Pieces', 'quantity' => 2],
            ['ingredient' => 'Icing', 'quantity' => 0.25],
            ['ingredient' => 'Marvo', 'quantity' => 0.1],
        ];

        foreach ($wafersCakeIngredients as $item) {
            RecipeIngredient::create([
                'recipe_id' => $wafersCakeRecipe->id,
                'ingredient_id' => $ingredientModels[$item['ingredient']]->id,
                'quantity' => $item['quantity'],
            ]);
        }

        $this->command->info('Recipe data seeded successfully! Added 13 recipes.');
    }
}

