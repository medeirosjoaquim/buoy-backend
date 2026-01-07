import { Migration } from '@mikro-orm/migrations';

export class Migration20260107015539 extends Migration {

  async up(): Promise<void> {
    this.addSql('create index "booking_accommodation_id_start_date_end_date_index" on "booking" ("accommodation_id", "start_date", "end_date");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "booking_accommodation_id_start_date_end_date_index";');
  }

}
