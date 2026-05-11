export enum WorkoutType {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  Upper = 'Upper',
  Lower = 'Lower',
  Push = 'Push',
  Pull = 'Pull',
  Legs = 'Legs',
  FullBody = 'Full Body',
}

export enum SetType {
  A = 'A', // Aquecimento (Warm-up)
  P = 'P', // Principal (Working Set)
  V = 'V', // Falha / Volume extra (Failure/Extra)
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  height?: number;
  weight?: number;
  goal?: string;
  trainingTime?: string;
  createdAt: string;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  type: WorkoutType;
  lastPerformedAt?: string;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  suggestedWeight?: number;
  restSeconds: number;
  notes?: string;
  order: number;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt?: string;
  totalVolume: number;
  durationSeconds: number;
}

export interface SetLog {
  id: string;
  logId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  type: SetType;
  volume: number;
  setNumber: number;
  restTaken: number;
  createdAt: string;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxVolume: number;
  maxReps: number;
  updatedAt: string;
}
