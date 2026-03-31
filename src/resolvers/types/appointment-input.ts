import { Field, InputType } from 'type-graphql';
import { Appointment } from '../../entities/Nutritionist/Appointment';

@InputType()
export class AddAppointmentInput implements Partial<Appointment> {
  @Field(() => String)
  date: string; // Format: DD-MM-YYYY

  @Field(() => String)
  time: string; // Format: MM:HH
}

@InputType()
export class UpdateSlotInput implements Partial<Appointment> {
  @Field()
  slotId: number;

  @Field({ nullable: true })
  date?: string; // ISO (π.χ. '2025-07-14')

  @Field({ nullable: true })
  time?: string; // π.χ. '14:30'

  @Field({ nullable: true })
  isAvailable?: boolean;
}
