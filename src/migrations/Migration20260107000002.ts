import { Migration } from '@mikro-orm/migrations';

export class Migration20260107000002 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "accommodation" alter column "room_count" drop not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "accommodation" alter column "room_count" set not null;');
  }

}
