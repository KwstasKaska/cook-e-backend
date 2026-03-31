import { Field, InputType, Int } from 'type-graphql';
import { AppointmentRequest } from '../../entities/Nutritionist/AppointmentRequest';

@InputType()
export class AppointmentRequestInput implements Partial<AppointmentRequest> {
  @Field(() => Int)
  slotId!: number;

  @Field(() => String, { nullable: true })
  comment?: string;
}
