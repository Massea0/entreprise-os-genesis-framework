/**
 * === ENTERPRISE OS GENESIS FRAMEWORK ===
 * Types TypeScript pour l'architecture modulaire enterprise
 * Qualité exceptionnelle avec validation stricte
 */

// === TYPES DE BASE === //

export interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly companyId: string;
  readonly avatarUrl?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';

export type ModuleType = 'dashboard' | 'hr' | 'business' | 'support' | 'admin' | 'analytics';

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly industry?: string;
  readonly size?: CompanySize;
  readonly address?: Address;
  readonly logoUrl?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface Address {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
}

// === TYPES MÉTIER === //

export interface Employee {
  readonly id: string;
  readonly userId: string;
  readonly employeeNumber: string;
  readonly departmentId: string;
  readonly positionId: string;
  readonly managerId?: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly salary?: number;
  readonly currency?: string;
  readonly status: EmployeeStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';

export interface Department {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly managerId?: string;
  readonly companyId: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Position {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly level: PositionLevel;
  readonly departmentId: string;
  readonly minSalary?: number;
  readonly maxSalary?: number;
  readonly currency?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type PositionLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';

// === TYPES BUSINESS === //

export interface Quote {
  readonly id: string;
  readonly number: string;
  readonly clientId: string;
  readonly title: string;
  readonly description?: string;
  readonly status: QuoteStatus;
  readonly items: readonly QuoteItem[];
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly currency: string;
  readonly validUntil: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
  readonly taxRate?: number;
}

export interface Invoice {
  readonly id: string;
  readonly number: string;
  readonly quoteId?: string;
  readonly clientId: string;
  readonly title: string;
  readonly description?: string;
  readonly status: InvoiceStatus;
  readonly items: readonly InvoiceItem[];
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly currency: string;
  readonly dueDate: string;
  readonly paidAt?: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
  readonly taxRate?: number;
}

// === TYPES SUPPORT === //

export interface Ticket {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly categoryId: string;
  readonly clientId: string;
  readonly assignedTo?: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  readonly id: string;
  readonly ticketId: string;
  readonly userId: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly attachments: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TicketCategory {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// === TYPES UI & NAVIGATION === //

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly path: string;
  readonly children?: readonly NavigationItem[];
  readonly roles: readonly UserRole[];
  readonly isActive: boolean;
  readonly badge?: string | number;
}

export interface MetricCard {
  readonly id: string;
  readonly title: string;
  readonly value: string | number;
  readonly trend?: {
    readonly value: number;
    readonly direction: 'up' | 'down' | 'stable';
    readonly period: string;
  };
  readonly format: 'number' | 'currency' | 'percentage';
  readonly color: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

export interface DashboardWidget {
  readonly id: string;
  readonly type: WidgetType;
  readonly title: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
  readonly config: Record<string, unknown>;
  readonly isVisible: boolean;
}

export type WidgetType = 'metrics' | 'chart' | 'table' | 'list' | 'calendar' | 'kanban';

// === TYPES API === //

export interface ApiResponse<T> {
  readonly data: T;
  readonly success: boolean;
  readonly message?: string;
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly pages: number;
  };
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
}

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly search?: string;
}

export interface FilterParams {
  readonly status?: string[];
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly tags?: string[];
}

// === TYPES FORMULAIRES === //

export interface FormField<T = unknown> {
  readonly name: keyof T;
  readonly label: string;
  readonly type: FieldType;
  readonly placeholder?: string;
  readonly required: boolean;
  readonly validation?: ValidationRule[];
  readonly options?: readonly FieldOption[];
  readonly dependencies?: readonly string[];
}

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'datetime' 
  | 'file' 
  | 'image';

export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface ValidationRule {
  readonly type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  readonly value?: string | number;
  readonly message: string;
}

// === TYPES PERMISSIONS === //

export interface Permission {
  readonly id: string;
  readonly resource: string;
  readonly action: PermissionAction;
  readonly scope: PermissionScope;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type PermissionScope = 'own' | 'department' | 'company' | 'all';

export interface RolePermissions {
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
}

// === TYPES ANALYTICS === //

export interface AnalyticsData {
  readonly metric: string;
  readonly value: number;
  readonly date: string;
  readonly dimensions?: Record<string, string>;
}

export interface ChartData {
  readonly labels: readonly string[];
  readonly datasets: readonly ChartDataset[];
}

export interface ChartDataset {
  readonly label: string;
  readonly data: readonly number[];
  readonly backgroundColor?: string | readonly string[];
  readonly borderColor?: string | readonly string[];
  readonly borderWidth?: number;
}

// === EXPORTS CENTRALISÉS === //
// Les types sont déjà exportés individuellement avec export interface
// Cette section sert de documentation pour les imports
