import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Vehicle } from './vehicle.entity';

@Entity({ name: 'vehicle_plates' })
@Unique(['plateNumber'])
export class VehiclePlate extends BaseEntity {
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.plates, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId!: string;

  @Column({ name: 'plate_number', length: 20 })
  plateNumber!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
