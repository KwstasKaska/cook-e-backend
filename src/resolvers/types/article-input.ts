import { InputType, Field } from 'type-graphql';

// Nutritionist/chef writes in Greek only — resolver auto-translates to _en columns

@InputType({ description: 'New Article Data' })
export class AddArticleInput {
  @Field()
  title!: string;

  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  image?: string;
}

@InputType({ description: 'Update Article Data' })
export class UpdateArticleInput {
  @Field()
  id!: number;

  // When provided, resolver re-translates to fill the _en column
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  text?: string;

  @Field(() => String, { nullable: true })
  image?: string;
}
