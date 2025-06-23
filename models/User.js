import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.email = data.email;
    this.password = data.password; // In production, this should be hashed
    this.role = data.role; // 'admin', 'customer', 'content_creator'
    this.profile = data.profile || {};
    this.permissions = data.permissions || [];
    this.organizationId = data.organizationId || null; // For multi-tenant support
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Role-based permission checks
  isAdmin() {
    return this.role === 'admin';
  }

  isCustomer() {
    return this.role === 'customer';
  }

  isContentCreator() {
    return this.role === 'content_creator';
  }

  // Check if user has specific permission
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.isAdmin();
  }

  // Get user data without sensitive information
  toSafeObject() {
    const { password, ...safeData } = this;
    return safeData;
  }
}

export class Customer extends User {
  constructor(data) {
    super({ ...data, role: 'customer' });
    this.companyName = data.companyName;
    this.contactPerson = data.contactPerson;
    this.phone = data.phone;
    this.address = data.address;
    this.gstNumber = data.gstNumber;
    this.subscriptionPlan = data.subscriptionPlan || 'basic';
    this.subscriptionStatus = data.subscriptionStatus || 'active';
    this.socialAccounts = data.socialAccounts || {};
    
    // Default customer permissions
    this.permissions = [
      'view_own_content',
      'approve_content',
      'reject_content',
      'comment_on_content',
      'view_own_calendar',
      'manage_social_accounts'
    ];
  }
}

export class ContentCreator extends User {
  constructor(data) {
    super({ ...data, role: 'content_creator' });
    this.name = data.name;
    this.specialization = data.specialization;
    this.experience = data.experience;
    this.portfolio = data.portfolio || [];
    this.assignedCustomers = data.assignedCustomers || [];
    this.skills = data.skills || [];
    
    // Default content creator permissions
    this.permissions = [
      'view_assigned_content',
      'upload_content',
      'edit_own_content',
      'view_customer_feedback',
      'respond_to_feedback'
    ];
  }
}

export class Admin extends User {
  constructor(data) {
    super({ ...data, role: 'admin' });
    this.name = data.name;
    this.department = data.department;
    
    // Admins have all permissions
    this.permissions = [
      'view_all_content',
      'manage_customers',
      'manage_content_creators',
      'assign_content',
      'view_analytics',
      'manage_system_settings',
      'manage_users'
    ];
  }
}