
export type AppView =
  | 'LANDING'
  | 'HOME'
  | 'SELECT_SERVICES'
  | 'SELECT_DATE_TIME'
  | 'REVIEW'
  | 'MY_APPOINTMENTS'
  | 'LOGIN'
  | 'ADMIN_DASHBOARD'
  | 'CHAT'
  | 'ADMIN_SERVICES'
  | 'ADMIN_CHAT_LIST'
  | 'ADMIN_BLOCK_SCHEDULE'
  | 'ADMIN_SETTINGS'
  | 'ADMIN_FINANCE'
  | 'ADMIN_TV'
  | 'ADMIN_QUOTES'
  | 'ADMIN_CLIENTS'
  | 'ADMIN_WEEKLY_SCHEDULE'
  | 'CUSTOMER_LOGIN'
  | 'CUSTOM_QUOTE';

export interface Quote {
  id: string;
  client_id: string;
  vehicle_color: string;
  vehicle_model_year: string;
  vehicle_photos: string[];
  polishing_type: 'COMERCIAL' | 'TECNICO' | 'MAQUIAGEM' | '';
  upholstery_options: string[];
  upholstery_photos: string[];
  status: 'PENDING' | 'REPLIED' | 'COMPLETED';
  is_read: boolean;
  created_at: string;
  client?: {
    name: string;
    phone: string;
  };
}

export interface BlockedSlot {
  id: string;
  date: string;
  time: string;
  reason: string;
}

export interface ServiceExtra {
  id: string;
  service_id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  popular?: boolean;
  extras?: ServiceExtra[];
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  services: Service[];
  selectedExtras?: { [serviceId: string]: ServiceExtra[] };
  date: string; // ISO string or simple YYYY-MM-DD
  time: string; // HH:mm
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface BookingState {
  customerName: string;
  customerPhone: string;
  selectedServices: Service[];
  selectedExtras: { [serviceId: string]: ServiceExtra[] };
  selectedDate: string;
  selectedTime: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'CUSTOMER' | 'BARBER';
  timestamp: Date;
}
