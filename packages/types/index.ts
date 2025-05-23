// Tipos básicos para el proyecto
export interface Inspection {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  email?: string;
  fileUrl?: string;
  fileUrls?: {
    videoFileUrl?: string;
    crlvPhotoUrl?: string;
    frontalUrl?: string;
    traseraUrl?: string;
    lateral_izquierdoUrl?: string;
    lateral_derechoUrl?: string;
    interior_frontalUrl?: string;
    interior_traseroUrl?: string;
    safetyItemsPhotoUrl?: string;
    windshieldPhotoUrl?: string;
    lightsPhotoUrl?: string;
    tiresPhotoUrl?: string;
  };
  answers?: any;
}

export interface UploadResponse {
  id: string;
  uploadUrls: Record<string, string>;
}

export interface SubmitPayload {
  email: string;
  [key: string]: any;
}
