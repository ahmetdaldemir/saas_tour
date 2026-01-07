import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Customer } from '../entities/customer.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CustomerWallet } from '../entities/customer-wallet.entity';
import { Reservation } from '../entities/reservation.entity';
import * as bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { loadEnv } from '../../../config/env';

const env = loadEnv();

export interface CustomerLoginInput {
  tenantId: string;
  email?: string;
  idNumber?: string;
  password: string;
}

export interface CustomerLoginResult {
  token: string;
  customer: Customer;
  tenant: Tenant;
}

export interface CustomerProfileResult {
  customer: Customer;
  tenant: Tenant;
  wallet: CustomerWallet | null;
}

export class CustomerAuthService {
  private static customerRepository(): Repository<Customer> {
    return AppDataSource.getRepository(Customer);
  }

  private static tenantRepository(): Repository<Tenant> {
    return AppDataSource.getRepository(Tenant);
  }

  private static walletRepository(): Repository<CustomerWallet> {
    return AppDataSource.getRepository(CustomerWallet);
  }

  private static reservationRepository(): Repository<Reservation> {
    return AppDataSource.getRepository(Reservation);
  }

  /**
   * Customer Login
   * Login with email or idNumber + password
   */
  static async login(input: CustomerLoginInput): Promise<CustomerLoginResult> {
    const repo = this.customerRepository();

    // Build where clause (email OR idNumber)
    const whereClause: any = { tenantId: input.tenantId };
    
    if (input.email) {
      whereClause.email = input.email;
    } else if (input.idNumber) {
      whereClause.idNumber = input.idNumber;
    } else {
      throw new Error('Email or ID number is required');
    }

    // Find customer
    const customer = await repo.findOne({
      where: whereClause,
      relations: ['language'],
    });

    if (!customer) {
      throw new Error('Invalid credentials');
    }

    // Check if customer is active
    if (!customer.isActive) {
      throw new Error('Account is inactive. Please contact support.');
    }

    // Check if customer is blacklisted
    if (customer.isBlacklisted) {
      throw new Error('Account is restricted. Please contact support.');
    }

    // Verify password
    if (!customer.passwordHash) {
      throw new Error('Password not set for this account. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get tenant
    const tenant = await this.tenantRepository().findOneBy({ id: input.tenantId });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Generate JWT token
    const payload = {
      sub: customer.id,
      customerId: customer.id,
      tenantId: customer.tenantId,
      type: 'customer',
      email: customer.email,
      fullName: customer.fullName,
    };

    const options: SignOptions = {};
    options.expiresIn = env.auth.tokenExpiresIn as unknown as SignOptions['expiresIn'];

    const token = jwt.sign(payload, env.auth.jwtSecret as Secret, options);

    return {
      token,
      customer,
      tenant,
    };
  }

  /**
   * Get Customer Profile
   */
  static async getProfile(customerId: string, tenantId: string): Promise<CustomerProfileResult> {
    const customer = await this.customerRepository().findOne({
      where: { id: customerId, tenantId },
      relations: ['language'],
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const tenant = await this.tenantRepository().findOneBy({ id: tenantId });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get wallet (if exists)
    const wallet = await this.walletRepository().findOne({
      where: { customerId, tenantId },
    });

    return {
      customer,
      tenant,
      wallet,
    };
  }

  /**
   * Get Customer Reservations
   * Note: Reservations are linked by customerEmail, not customerId
   */
  static async getCustomerReservations(customerId: string, tenantId: string): Promise<Reservation[]> {
    // First get customer to retrieve email
    const customer = await this.customerRepository().findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer || !customer.email) {
      return [];
    }

    // Find reservations by customer email
    return this.reservationRepository().find({
      where: { 
        customerEmail: customer.email,
        tenantId,
      },
      relations: [
        'customerLanguage',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Change Customer Password
   */
  static async changePassword(
    customerId: string,
    tenantId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const repo = this.customerRepository();
    
    const customer = await repo.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify current password
    if (!customer.passwordHash) {
      throw new Error('Password not set for this account');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    customer.passwordHash = newPasswordHash;
    await repo.save(customer);
  }
}

