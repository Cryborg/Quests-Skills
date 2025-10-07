/*
  Warnings:

  - You are about to drop the column `rarity` on the `cards` table. All the data in the column will be lost.
  - Added the required column `base_rarity` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "base_rarity" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_cards" ("category", "created_at", "description", "id", "image", "name", "updated_at") SELECT "category", "created_at", "description", "id", "image", "name", "updated_at" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
CREATE UNIQUE INDEX "cards_name_key" ON "cards"("name");
CREATE TABLE "new_user_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "current_rarity" TEXT NOT NULL DEFAULT 'common',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_cards" ("card_id", "created_at", "id", "quantity", "updated_at", "user_id") SELECT "card_id", "created_at", "id", "quantity", "updated_at", "user_id" FROM "user_cards";
DROP TABLE "user_cards";
ALTER TABLE "new_user_cards" RENAME TO "user_cards";
CREATE UNIQUE INDEX "user_cards_user_id_card_id_key" ON "user_cards"("user_id", "card_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
