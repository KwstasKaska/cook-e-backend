import { ObjectType, Field } from 'type-graphql';
import { AppointmentRequest } from '../../entities/Nutritionist/AppointmentRequest';
import { FieldError } from '../types/field-error';

@ObjectType()
export class AppointmentRequestResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => AppointmentRequest, { nullable: true })
  appointmentRequest?: AppointmentRequest;
}
