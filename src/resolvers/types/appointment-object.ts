import { Field, ObjectType } from 'type-graphql';
import { Appointment } from '../../entities/Nutritionist/Appointment';
import { FieldError } from '../types/field-error';

@ObjectType()
export class AppointmentResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Appointment, { nullable: true })
  slot?: Appointment;
}
