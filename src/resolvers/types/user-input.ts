import { Field, InputType } from 'type-graphql';
import { User } from '../../entities/User/User';
import { UserRole } from '../../entities/General/Information';

@InputType()
export class RegisterUserInput implements Partial<User> {
  @Field()
  username: string;

  @Field()
  password: string;

  @Field()
  email: string;

  @Field()
  role: UserRole;
}
