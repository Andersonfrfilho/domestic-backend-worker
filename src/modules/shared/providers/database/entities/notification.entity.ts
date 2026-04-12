import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectId, ObjectIdColumn, UpdateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  message: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @DeleteDateColumn({ name: 'deletedAt', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
