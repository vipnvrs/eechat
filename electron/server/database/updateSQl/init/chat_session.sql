/*
 Navicat Premium Dump SQL

 Source Server         : database
 Source Server Type    : SQLite
 Source Server Version : 3045000 (3.45.0)
 Source Schema         : main

 Target Server Type    : SQLite
 Target Server Version : 3045000 (3.45.0)
 File Encoding         : 65001

 Date: 14/03/2025 22:04:24
*/

PRAGMA foreign_keys = false;

-- ----------------------------
-- Table structure for chat_session
-- ----------------------------
DROP TABLE IF EXISTS "chat_session";
CREATE TABLE "chat_session" (
  "id" INTEGER,
  "title" VARCHAR(100) NOT NULL DEFAULT '新对话',
  "uid" VARCHAR(50) NOT NULL,
  "model" VARCHAR(50) NOT NULL DEFAULT 'deepseek-r1',
  "created_at" DATETIME NOT NULL,
  "updated_at" DATETIME NOT NULL,
  "deleted_at" DATETIME,
  "model_id" TEXT,
  "model_config" TEXT,
  PRIMARY KEY ("id")
);

-- ----------------------------
-- Records of chat_session
-- ----------------------------
INSERT INTO "chat_session" VALUES (1, 'Handled by me 👋', 'default-user', 'deepseek-r1', '2025-03-14 14:02:44.477 +00:00', '2025-03-14 14:03:46.400 +00:00', NULL, NULL, NULL);

PRAGMA foreign_keys = true;
