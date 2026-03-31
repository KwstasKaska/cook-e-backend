import { Field, Int, ObjectType } from 'type-graphql';
import { registerEnumType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  CHEF = 'chef',
  NUTRITIONIST = 'nutritionist',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

@ObjectType() /* To χρησιμοποιούμε προκειμένου να διακοσμήσουμε την κλάση μας. Ουσιαστικά χαρακτηρίζει την κλάση ώς τον τύπο ,type , που αναγνωρίζει το GraphQL SDL ή το GraphQLObjectType. Άρα λειτουργεί ώς αναγνωριστικό για το schema μας και να εμφανίζεται αυτή η οντότητα στο graphql server που έχουμε ορίσει, στην προκειμένη στο localhost:4000/graphql */
export abstract class Information extends BaseEntity {
  @Field(
    () => Int
  ) /* Tο χρησιμοποιούμε προκειμένου να ορίσουμε ποια πεδία θα εμφανίζονται στο σχήμα μας και ποια στην βάση μας. Σε περίπτωση που δεν χρησιμοποιούσω το Field decorator τότε το πεδίο αυτό θα υπάρχει και θα φαίνεται μόνο στην βάση δεδομένων μου. Χαρακτηριστικό παράδειγμα είναι το πεδίο password που δεν θέλω να φαίνεται, τότε δεν χρησιμοποιώ το Field decorator */
  @PrimaryGeneratedColumn() /* Αυτό ειναι το αναγνωριστικό που διοχετεύει πληροφορία στην βάση δεδομένων μου. Ουσιαστικά λειτουργεί σαν column όπου μετουσιώνεται σε σε column της βάσης. Άρα κάθε entity class που χαρακτηρίζεται ώς @Column θα χαρτογραφείται ώς στήλη Column του πίνακα που ανήκει στην βάση δεδομένων μου. */
  id!: number;

  @Field(() => String)
  @Column({ unique: true })
  username!: string;

  @Field(() => String)
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Field(() => String)
  @Column({ nullable: true })
  image: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
