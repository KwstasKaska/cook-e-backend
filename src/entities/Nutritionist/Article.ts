import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';

@ObjectType()
@Entity()
export class Article extends BaseEntity {
  @Field() //Typegraphql decorator that helps us declare wich class properties should be mapped to the GraphQL fields
  @PrimaryGeneratedColumn() //TypeORM Entity column in order to create the table in my database
  id!: number;

  @Field(() => String)
  @Column()
  title!: string;

  @Field(() => String)
  @Column({ type: 'text' })
  text!: string;

  @Field(() => String)
  @Column()
  image: string;

  @Field()
  @Column()
  creatorId: number;

  @ManyToOne(() => User, (user) => user.articles)
  creator: User;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
