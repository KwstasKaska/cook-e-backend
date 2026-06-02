import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../User/User';
import { Article } from '../Nutritionist/Article';

@ObjectType()
@Entity()
@Unique(['userId', 'articleId'])
export class UserArticleFavorite extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.articleFavorites)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Int)
  @Column()
  articleId!: number;

  @Field(() => Article, { nullable: true })
  @ManyToOne(() => Article, { eager: false })
  @JoinColumn({ name: 'articleId' })
  article!: Article;

  @Field(() => String)
  @CreateDateColumn()
  savedAt!: Date;
}
