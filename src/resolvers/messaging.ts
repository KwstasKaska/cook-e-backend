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

//  Response types

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

// ─── Resolver ─────────────────────────────────────────────────────────────────

@Resolver()
export class MessagingResolver {
  // ── myConversations ──────────────────────────────────────────────────────────
  // Returns all conversations the logged-in user is part of (as either participant).
  // Each conversation is loaded with participant user info so the inbox can render
  // the other person's name and avatar.

  @Query(() => [Conversation])
  @UseMiddleware(isAuth)
  async myConversations(@Ctx() { req }: MyContext): Promise<Conversation[]> {
    const userId = req.session.userId;

    return Conversation.find({
      where: [{ participant1Id: userId }, { participant2Id: userId }],
      relations: ['participant1', 'participant2'],
      order: { updatedAt: 'DESC' },
    });
  }

  // ── conversation(id) ─────────────────────────────────────────────────────────
  // Fetches a single conversation with all its messages, ordered oldest-first.
  // Only accessible if the logged-in user is one of the two participants.

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

    // Guard: only participants can read the conversation
    if (convo.participant1Id !== userId && convo.participant2Id !== userId) {
      return null;
    }

    return convo;
  }

  // ── startConversation(participantId) ─────────────────────────────────────────
  // Creates a new conversation between the logged-in user and participantId.
  // If a conversation between the two already exists (in either direction),
  // it returns the existing one instead of creating a duplicate.

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

    // Check both orderings — participant columns have no enforced ordering
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

    // Reload with relations so the response is fully populated
    const loaded = await Conversation.findOne({
      where: { id: convo.id },
      relations: ['participant1', 'participant2'],
    });

    return { conversation: loaded! };
  }

  // ── sendMessage(conversationId, body) ────────────────────────────────────────
  // Adds a message to an existing conversation.
  // Rejects the write if the logged-in user is not a participant.
  // Also bumps Conversation.updatedAt so inbox ordering stays correct.

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

    // Guard: only participants can send messages
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

    // Bump updatedAt on the conversation so inbox ordering stays correct
    await Conversation.update(conversationId, { updatedAt: new Date() });

    // Reload with sender relation for a fully populated response
    const loaded = await Message.findOne({
      where: { id: message.id },
      relations: ['sender'],
    });

    return { message: loaded! };
  }
}
