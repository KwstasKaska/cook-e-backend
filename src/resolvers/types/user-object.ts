import { Field, ObjectType } from 'type-graphql';
import { User } from '../../entities/User/User';
import { FieldError } from '../types/field-error';

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}
