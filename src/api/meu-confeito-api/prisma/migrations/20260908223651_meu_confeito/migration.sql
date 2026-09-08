-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "role_type" AS ENUM ('ADMIN', 'MODERATOR', 'BAKER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "recipe_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "tag_type" AS ENUM ('USER', 'PRODUCT', 'VARIETY', 'ATTRIBUTE');

-- CreateEnum
CREATE TYPE "inventory_movement_type" AS ENUM ('PURCHASE', 'PRODUCTION_USAGE', 'PRODUCTION_REVERSAL', 'WASTE', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "unit_dimension" AS ENUM ('MASS', 'VOLUME', 'COUNT');

-- CreateEnum
CREATE TYPE "standard_units" AS ENUM ('G', 'KG', 'ML', 'L', 'UN');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "profile_picture_url" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "provider_id" TEXT,
    "role" "role_type" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset" (
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "password_reset_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "baker_profile" (
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "instagram" TEXT,
    "location" geometry(Point, 4326),
    "neighborhood" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baker_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ingredient" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "aliases" TEXT[],
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "base_dimension" "unit_dimension" NOT NULL DEFAULT 'MASS',
    "base_unit" "standard_units" NOT NULL DEFAULT 'G',
    "creator_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_conversion" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "from_unit" VARCHAR(30) NOT NULL,
    "factor_to_base" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "ingredient_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "parent_id" TEXT,
    "title" VARCHAR(100) NOT NULL,
    "cover_image_url" VARCHAR(255),
    "instructions" JSONB NOT NULL,
    "base_yield" DECIMAL(10,2) NOT NULL,
    "yield_unit" "standard_units" NOT NULL,
    "status" "recipe_status" NOT NULL DEFAULT 'DRAFT',
    "total_saves" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "profit_margin_percent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "overhead_percent" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "prep_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "hourly_labor_rate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "packaging_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "type" "tag_type" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creator_id" TEXT,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tag" (
    "user_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "user_tag_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "recipe_tag" (
    "recipe_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "recipe_tag_pkey" PRIMARY KEY ("recipe_id","tag_id")
);

-- CreateTable
CREATE TABLE "recipe_item" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" INTEGER,
    "sub_recipe_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" "standard_units" NOT NULL,
    "display_quantity" DECIMAL(10,2),
    "display_unit" VARCHAR(30),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(255),

    CONSTRAINT "recipe_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "user_id" TEXT NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "current_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    "min_quantity" DECIMAL(10,3),
    "cost_per_base_unit" DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
    "expiration_date" DATE,
    "last_updated" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("user_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "production" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "yield_produced" DECIMAL(10,2) NOT NULL,
    "production_date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration_date" DATE,
    "canceled_at" TIMESTAMPTZ(3),
    "ingredient_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "labor_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "overhead_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "packaging_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "unit_cost" DECIMAL(10,4) NOT NULL DEFAULT 0.00,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "production_id" TEXT,
    "transaction_type" "inventory_movement_type" NOT NULL,
    "quantity_changed" DECIMAL(10,3) NOT NULL,
    "measurement_unit" "standard_units" NOT NULL,
    "unit_cost" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "expiration_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_recipe" (
    "profile_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showcase_recipe_pkey" PRIMARY KEY ("profile_id","recipe_id")
);

-- CreateTable
CREATE TABLE "user_saved_recipe" (
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "saved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_recipe_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- CreateTable
CREATE TABLE "recipe_review" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipe_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_provider_id_key" ON "user"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_user_id_session_id_key" ON "refresh_token"("user_id", "session_id");

-- CreateIndex
CREATE INDEX "password_reset_userId_idx" ON "password_reset"("userId");

-- CreateIndex
CREATE INDEX "baker_profile_location_idx" ON "baker_profile" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_creator_id_slug_key" ON "ingredient"("creator_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_conversion_ingredient_id_from_unit_key" ON "ingredient_conversion"("ingredient_id", "from_unit");

-- CreateIndex
CREATE INDEX "recipe_user_id_idx" ON "recipe"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "recipe_item_recipe_id_idx" ON "recipe_item"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_item_ingredient_id_idx" ON "recipe_item"("ingredient_id");

-- CreateIndex
CREATE INDEX "recipe_item_sub_recipe_id_idx" ON "recipe_item"("sub_recipe_id");

-- CreateIndex
CREATE INDEX "production_user_id_production_date_idx" ON "production"("user_id", "production_date");

-- CreateIndex
CREATE INDEX "inventory_transaction_user_id_created_at_idx" ON "inventory_transaction"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_transaction_ingredient_id_idx" ON "inventory_transaction"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_review_user_id_recipe_id_key" ON "recipe_review"("user_id", "recipe_id");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baker_profile" ADD CONSTRAINT "baker_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_conversion" ADD CONSTRAINT "ingredient_conversion_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag" ADD CONSTRAINT "user_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag" ADD CONSTRAINT "user_tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "baker_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tag" ADD CONSTRAINT "recipe_tag_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tag" ADD CONSTRAINT "recipe_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_item" ADD CONSTRAINT "recipe_item_sub_recipe_id_fkey" FOREIGN KEY ("sub_recipe_id") REFERENCES "recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_recipe" ADD CONSTRAINT "showcase_recipe_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "baker_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_recipe" ADD CONSTRAINT "showcase_recipe_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_recipe" ADD CONSTRAINT "user_saved_recipe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_recipe" ADD CONSTRAINT "user_saved_recipe_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_review" ADD CONSTRAINT "recipe_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_review" ADD CONSTRAINT "recipe_review_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- XOR Validation
ALTER TABLE "recipe_item" 
ADD CONSTRAINT "check_recipe_item_target" 
CHECK (
  ("ingredient_id" IS NOT NULL AND "sub_recipe_id" IS NULL) OR 
  ("ingredient_id" IS NULL AND "sub_recipe_id" IS NOT NULL)
);

-- Review Scale Validation
ALTER TABLE "recipe_review" 
ADD CONSTRAINT "check_rating_range" 
CHECK ("rating" >= 1 AND "rating" <= 5);