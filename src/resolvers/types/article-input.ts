import { InputType, Field } from 'type-graphql';
import { Article } from '../../entities/Nutritionist/Article';

@InputType({ description: 'New Article Data' })
export class AddArticleInput implements Partial<Article> {
  @Field()
  title: string;

  @Field()
  text: string;

  @Field(() => String, { nullable: true })
  image?: string;
}

@InputType({ description: 'Update Article Data' })
export class UpdateArticleInput implements Partial<Article> {
  @Field()
  id: number;

  @Field({ nullable: true })
  title: string;

  @Field()
  text: string;

  @Field(() => String, { nullable: true })
  image: string;
}
