
import { ExamType, ExamRequirement } from './types';

export const CPM_RATE = 50; // $50 per 1000 downloads
export const REVENUE_PER_DOWNLOAD = CPM_RATE / 1000;

export const EXAM_REQUIREMENTS: Record<ExamType, ExamRequirement> = {
  [ExamType.UPSC]: {
    id: ExamType.UPSC,
    photo: { size: { minKB: 20, maxKB: 300 }, dimensions: { width: 350, height: 350, flexible: true } },
    signature: { size: { minKB: 20, maxKB: 300 }, dimensions: { width: 350, height: 350, flexible: true } }
  },
  [ExamType.SSC]: {
    id: ExamType.SSC,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 200, height: 230 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.DELHI_POLICE]: {
    id: ExamType.DELHI_POLICE,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 100, height: 120 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.STATE_POLICE]: {
    id: ExamType.STATE_POLICE,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 150, height: 200 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.IBPS]: {
    id: ExamType.IBPS,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 200, height: 230 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.SBI]: {
    id: ExamType.SBI,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 200, height: 230 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.RRB]: {
    id: ExamType.RRB,
    photo: { size: { minKB: 30, maxKB: 100 }, dimensions: { width: 240, height: 320 } },
    signature: { size: { minKB: 10, maxKB: 40 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.STATE_PCS]: {
    id: ExamType.STATE_PCS,
    photo: { size: { minKB: 20, maxKB: 100 }, dimensions: { width: 200, height: 230, flexible: true } },
    signature: { size: { minKB: 10, maxKB: 50 }, dimensions: { width: 140, height: 60, flexible: true } }
  },
  [ExamType.TEACHING]: {
    id: ExamType.TEACHING,
    photo: { size: { minKB: 20, maxKB: 100 }, dimensions: { width: 200, height: 230 } },
    signature: { size: { minKB: 10, maxKB: 50 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.DEFENCE]: {
    id: ExamType.DEFENCE,
    photo: { size: { minKB: 20, maxKB: 50 }, dimensions: { width: 100, height: 120 } },
    signature: { size: { minKB: 10, maxKB: 20 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.RAILWAY]: {
    id: ExamType.RAILWAY,
    photo: { size: { minKB: 30, maxKB: 100 }, dimensions: { width: 240, height: 320 } },
    signature: { size: { minKB: 10, maxKB: 40 }, dimensions: { width: 140, height: 60 } }
  },
  [ExamType.CUSTOM]: {
    id: ExamType.CUSTOM,
    photo: { size: { minKB: 10, maxKB: 500 }, dimensions: { width: 300, height: 400 } },
    signature: { size: { minKB: 10, maxKB: 500 }, dimensions: { width: 300, height: 100 } }
  }
};
