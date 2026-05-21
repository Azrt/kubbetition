import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";

export abstract class Common {
  @PrimaryGeneratedColumn('uuid')
  @Index()
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}