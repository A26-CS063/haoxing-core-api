export type StudentStatusType = 'calon' | 'terdaftar' | 'aktif' | 'batal';

export interface StudentFilterQuery {
  search?: string;
  status?: StudentStatusType;
  hasPretest?: string;
}

export interface StudentResponse {
  studentId: string;
  fullName: string;
  phone: string;
  status: StudentStatusType;
  hasPretest: boolean;
  recommendedHsk: string | null;
  registeredAt: Date;
}
