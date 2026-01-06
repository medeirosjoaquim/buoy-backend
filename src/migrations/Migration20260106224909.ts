import { Migration } from '@mikro-orm/migrations';

export class Migration20260106224909 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "accommodation" add column "type" text check ("type" in (\'hotel\', \'apartment\')) not null, add column "star_rating" int null, add column "number_of_rooms" int null, add column "has_parking" boolean null;');
    this.addSql('create index "accommodation_type_index" on "accommodation" ("type");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "accommodation_type_index";');
    this.addSql('alter table "accommodation" drop column "type";');
    this.addSql('alter table "accommodation" drop column "star_rating";');
    this.addSql('alter table "accommodation" drop column "number_of_rooms";');
    this.addSql('alter table "accommodation" drop column "has_parking";');
  }

}
