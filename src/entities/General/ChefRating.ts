import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';
import { ChefProfile } from '../Chef/ChefProfile';

@ObjectType()
@Entity()
@Unique(['userId', 'chefId']) // one rating per user per chef
export class ChefRating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.chefRatings)
  user!: User;

  @Field(() => Int)
  @Column()
  chefId!: number;

  @ManyToOne(() => ChefProfile, (chef) => chef.ratings)
  chef!: ChefProfile;

  // 1–5 stars
  @Field(() => Int)
  @Column({ type: 'int' })
  score!: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}
