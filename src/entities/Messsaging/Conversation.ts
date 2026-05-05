import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User/User';
import { Message } from './Message';

@ObjectType()
@Entity()
export class Conversation extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.conversationsAsParticipant1)
  @JoinColumn({ name: 'participant1Id' })
  participant1: User;

  @Field(() => Int)
  @Column()
  participant1Id: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.conversationsAsParticipant2)
  @JoinColumn({ name: 'participant2Id' })
  participant2: User;

  @Field(() => Int)
  @Column()
  participant2Id: number;

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
