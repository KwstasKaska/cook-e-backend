import { Field, ObjectType } from 'type-graphql';
import { ChefProfile } from '../../entities/Chef/ChefProfile';
import { FieldError } from './field-error';

@ObjectType()
export class ChefProfileResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => ChefProfile, { nullable: true })
  chefProfile?: ChefProfile;
}
