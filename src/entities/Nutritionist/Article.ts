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
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Translatable fields ────────────────────────────────────────────

  @Field(() => String)
  @Column()
  title_el!: string;

  @Field(() => String)
  @Column()
  title_en!: string;

  @Field(() => String)
  @Column({ type: 'text' })
  text_el!: string;

  @Field(() => String)
  @Column({ type: 'text' })
  text_en!: string;

  // ── Non-translatable fields

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
