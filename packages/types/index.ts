export interface Inspection {
  id: string;
  email: string;
  licensePlate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'error';
  createdAt: string;
  reviewedAt?: string;
  submissionDate?: string;
  answers?: Record<string, string> | string;
  fileUrl?: string;
  fileUrls?: Record<string, string>;
  thumbnailUrl?: string;
  uploadHistory: {
    status: string;
    date: string;
  }[];
  ownerName?: string;
  phone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  mileage?: string | number;
  modelYear?: string | number;
  hasOriginalInfotainment?: boolean | 'yes' | 'no' | 'unknown';
  hasOriginalSoundSystem?: boolean;
  hasDocumentIssues?: 'yes' | 'no';
  hasVisibleMechanicalIssues?: 'yes' | 'no';
  safetyItems?: string[];
  tiresCondition?: string;
  bodyworkCondition?: string;
  glassCondition?: string;
  interiorCondition?: string;
  engineCondition?: string;
  trunkCondition?: string;
  contactPhone?: string;
  currentKm?: string | number;
  rawFormData?: any;
  hasChassisNumber?: boolean;
  hasSecondKey?: boolean;
  hasAirConditioner?: boolean;
  hasWindshieldDamage?: boolean;
  hasLightsDamage?: boolean;
  hasTiresDamage?: boolean;
  conditions?: string[];
  crlvFileUrl?: string;
  safetyItemsFileUrl?: string;
  windshieldDamagePhotoUrl?: string;
  lightsDamagePhotoUrl?: string;
  tireDamagePhotoUrl?: string;
  videoFileUrl?: string;
  isNewFormat?: boolean;
  inspectionId?: string;
  mode?: string;
}

export interface UploadResponse {
  id: string;
  uploadUrls: Record<string, string>;
}

export interface SubmitPayload {
  email: string;
  licensePlate?: string;
  answers?: Record<string, string> | string;
  requiredFiles?: string[];
  ownerName?: string;
  phone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  hasOriginalInfotainment?: 'yes' | 'no' | 'unknown';
  hasDocumentIssues?: 'yes' | 'no';
  hasVisibleMechanicalIssues?: 'yes' | 'no';
  safetyItems?: string[];
  tiresCondition?: string;
  bodyworkCondition?: string;
  glassCondition?: string;
  interiorCondition?: string;
  engineCondition?: string;
  trunkCondition?: string;
  contactPhone?: string;
} 