"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `CREATE TABLE "generic_tags" ("id" SERIAL NOT NULL, "tag" text NOT NULL, "author" character(64) NOT NULL, "kind" integer NOT NULL, "event_id" character(64) NOT NULL, "created_at" bigint NOT NULL, CONSTRAINT "PK_dd58c903cc9b525d70253989867" PRIMARY KEY ("id"))`.execute(db);
    await (0, kysely_1.sql) `CREATE UNIQUE INDEX "g_tag_event_id_idx" ON "generic_tags" ("tag", "event_id") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_kind_created_at_idx" ON "generic_tags" ("tag", "kind", "created_at") `.execute(db);
    await (0, kysely_1.sql) `CREATE INDEX "g_tag_created_at_idx" ON "generic_tags" ("tag", "created_at") `.execute(db);
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" ADD CONSTRAINT "FK_5c845879328f9e991bbb43ef96a" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `ALTER TABLE "generic_tags" DROP CONSTRAINT "FK_5c845879328f9e991bbb43ef96a"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_kind_created_at_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX "public"."g_tag_event_id_idx"`.execute(db);
    await (0, kysely_1.sql) `DROP TABLE "generic_tags"`.execute(db);
}
//# sourceMappingURL=1695096642043-create-generic-tags-table.js.map