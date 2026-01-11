<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ingredients master table - raw materials used in recipes
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable(); // flour, yeast, sugar, oils, eggs, etc.
            $table->string('unit'); // kg, L, piece, packet
            $table->decimal('cost_per_unit', 10, 2); // cost per base unit
            $table->decimal('stock_quantity', 10, 3)->default(0); // current stock
            $table->decimal('minimum_stock', 10, 3)->default(0); // alert threshold
            $table->string('supplier')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Recipes master table - each product has a recipe
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('output_quantity')->default(1); // how many items this recipe produces
            $table->decimal('total_cost', 10, 2)->default(0); // calculated total cost
            $table->decimal('cost_per_item', 10, 2)->default(0); // cost per single item
            $table->text('instructions')->nullable();
            $table->integer('preparation_time_minutes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Recipe ingredients - ingredients used in each recipe
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 4); // amount of ingredient needed
            $table->decimal('cost_for_recipe', 10, 2)->default(0); // calculated cost
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Ingredient purchases/restocking
        Schema::create('ingredient_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 3);
            $table->decimal('cost_per_unit', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->string('supplier')->nullable();
            $table->string('invoice_number')->nullable();
            $table->date('purchase_date');
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Ingredient usage log - tracks when ingredients are used in production
        Schema::create('ingredient_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->foreignId('production_batch_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('recipe_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('quantity_used', 10, 4);
            $table->decimal('cost', 10, 2);
            $table->date('usage_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Base doughs/mixtures that can be shared across recipes
        Schema::create('base_preparations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Bun Dough Base", "Cake Mixture"
            $table->text('description')->nullable();
            $table->decimal('total_weight_kg', 10, 3)->nullable();
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->decimal('cost_per_kg', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Base preparation ingredients
        Schema::create('base_preparation_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('base_preparation_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 4);
            $table->decimal('cost_for_preparation', 10, 2)->default(0);
            $table->timestamps();
        });

        // Link recipes to base preparations (for buns that use shared dough)
        Schema::create('recipe_base_preparations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->onDelete('cascade');
            $table->foreignId('base_preparation_id')->constrained()->onDelete('cascade');
            $table->decimal('weight_used_kg', 10, 4); // how much of the base prep is used
            $table->decimal('cost_contribution', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_base_preparations');
        Schema::dropIfExists('base_preparation_ingredients');
        Schema::dropIfExists('base_preparations');
        Schema::dropIfExists('ingredient_usage');
        Schema::dropIfExists('ingredient_purchases');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('ingredients');
    }
};
