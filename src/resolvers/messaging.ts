import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';
import { FieldError } from './types/field-error';
import { Message } from '../entities/Messsaging/Message';
import { Conversation } from '../entities/Messsaging/Conversation';

@ObjectType()
class ConversationResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Conversation, { nullable: true })
  conversation?: Conversation;
}

@ObjectType()
class MessageResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Message, { nullable: true })
  message?: Message;
}

@Resolver()
export class MessagingResolver {
  @Query(() => [Conversation])
  @UseMiddleware(isAuth)
  async myConversations(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 20 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Conversation[]> {
    const userId = req.session.userId;

    return Conversation.find({
      where: [{ participant1Id: userId }, { participant2Id: userId }],
      relations: ['participant1', 'participant2'],
      order: { updatedAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => Conversation, { nullable: true })
  @UseMiddleware(isAuth)
  async conversation(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<Conversation | null> {
    const userId = req.session.userId;

    const convo = await Conversation.findOne({
      where: { id },
      relations: [
        'participant1',
        'participant2',
        'messages',
        'messages.sender',
      ],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!convo) return null;

    if (convo.participant1Id !== userId && convo.participant2Id !== userId) {
      return null;
    }

    return convo;
  }

  @Mutation(() => ConversationResponse)
  @UseMiddleware(isAuth)
  async startConversation(
    @Arg('participantId', () => Int) participantId: number,
    @Ctx() { req }: MyContext,
  ): Promise<ConversationResponse> {
    const userId = req.session.userId;

    if (userId === participantId) {
      return {
        errors: [
          {
            field: 'participantId',
            message: 'Cannot start a conversation with yourself.',
          },
        ],
      };
    }

    const existing = await Conversation.findOne({
      where: [
        { participant1Id: userId, participant2Id: participantId },
        { participant1Id: participantId, participant2Id: userId },
      ],
      relations: ['participant1', 'participant2'],
    });

    if (existing) {
      return { conversation: existing };
    }

    const convo = Conversation.create({
      participant1Id: userId,
      participant2Id: participantId,
    });

    await convo.save();

    const loaded = await Conversation.findOne({
      where: { id: convo.id },
      relations: ['participant1', 'participant2'],
    });

    return { conversation: loaded! };
  }

  @Mutation(() => MessageResponse)
  @UseMiddleware(isAuth)
  async sendMessage(
    @Arg('conversationId', () => Int) conversationId: number,
    @Arg('body') body: string,
    @Ctx() { req }: MyContext,
  ): Promise<MessageResponse> {
    const userId = req.session.userId;

    if (!body.trim()) {
      return {
        errors: [{ field: 'body', message: 'Message body cannot be empty.' }],
      };
    }

    const convo = await Conversation.findOne({
      where: { id: conversationId },
    });

    if (!convo) {
      return {
        errors: [
          { field: 'conversationId', message: 'Conversation not found.' },
        ],
      };
    }

    if (convo.participant1Id !== userId && convo.participant2Id !== userId) {
      return {
        errors: [
          {
            field: 'conversationId',
            message: 'Not a participant in this conversation.',
          },
        ],
      };
    }

    const message = Message.create({
      conversationId,
      senderId: userId,
      body: body.trim(),
    });

    await message.save();

    await Conversation.update(conversationId, { updatedAt: new Date() });

    const loaded = await Message.findOne({
      where: { id: message.id },
      relations: ['sender'],
    });

    return { message: loaded! };
  }
}
