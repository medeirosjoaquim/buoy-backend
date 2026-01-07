import { Migration } from '@mikro-orm/migrations';

export class Migration20260107000001 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "accommodation" add column "room_count" int null default 1;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "accommodation" drop column "room_count";');
  }

}
