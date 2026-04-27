import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateChefProfileInput {
  @Field({ nullable: true })
  bio_el?: string;
}
