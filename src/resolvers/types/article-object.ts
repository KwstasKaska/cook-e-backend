import { Field, ObjectType } from 'type-graphql';
import { Article } from '../../entities/Nutritionist/Article';
import { FieldError } from '../types/field-error';

@ObjectType()
export class ArticleResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Article, { nullable: true })
  article?: Article;
}

@ObjectType()
export class PaginatedArticles {
  @Field(() => [Article])
  articles: Article[];
  @Field()
  hasMore: boolean;
}

@ObjectType()
export class UploadImage {
  @Field(() => String)
  url: string;
}
