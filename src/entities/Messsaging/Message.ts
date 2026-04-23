import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Conversation } from './Conversation';

@ObjectType()
@Entity()
export class Message extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  conversation: Conversation;

  @Field(() => Int)
  @Column()
  conversationId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sentMessages)
  sender: User;

  @Field(() => Int)
  @Column()
  senderId: number;

  @Field(() => String)
  @Column({ type: 'text' })
  body: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
}
