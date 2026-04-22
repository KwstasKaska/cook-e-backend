import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateNutritionistProfileInput {
  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  city?: string;
}
