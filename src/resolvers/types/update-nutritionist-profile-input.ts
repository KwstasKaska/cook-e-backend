import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateNutritionistProfileInput {
  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  bio_el?: string;

  @Field({ nullable: true })
  city_el?: string;
}
