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
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';
import { ChefProfile } from '../Chef/ChefProfile';

@ObjectType()
@Entity()
@Unique(['userId', 'chefId'])
export class ChefRating extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  userId!: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.chefRatings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Int)
  @Column()
  chefId!: number;

  @ManyToOne(() => ChefProfile, (chef) => chef.ratings)
  @JoinColumn({ name: 'chefId' })
  chef!: ChefProfile;

  @Field(() => Int)
  @Column({ type: 'int' })
  score!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}
